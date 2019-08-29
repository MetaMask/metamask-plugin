const EthQuery = require('ethjs-query')
const {
  hexToBn,
  BnMultiplyByFraction,
  bnToHex,
} = require('../../lib/util')
const log = require('loglevel')
const { addHexPrefix } = require('ethereumjs-util')
const { SEND_ETHER_ACTION_KEY } = require('../../../../ui/app/helpers/constants/transactions.js')
const SIMPLE_GAS_COST = '0x5208' // Hex for 21000, cost of a simple send.

import { TRANSACTION_NO_CONTRACT_ERROR_KEY } from '../../../../ui/app/helpers/constants/error-keys'

/**
tx-gas-utils are gas utility methods for Transaction manager
its passed ethquery
and used to do things like calculate gas of a tx.
@param {Object} provider - A network provider.
*/

class TxGasUtil {

  constructor (provider) {
    this.query = new EthQuery(provider)
  }

  /**
    @param txMeta {Object} - the txMeta object
    @returns {object} the txMeta object with the gas written to the txParams
  */
  async analyzeGasUsage (txMeta, getCodeResponse) {
    const block = await this.query.getBlockByNumber('latest', false)
    let estimatedGasHex
    try {
      estimatedGasHex = await this.estimateTxGas(txMeta, block.gasLimit, getCodeResponse)
    } catch (err) {
      log.warn(err)
      txMeta.simulationFails = {
        reason: err.message,
        errorKey: err.errorKey,
        debug: { blockNumber: block.number, blockGasLimit: block.gasLimit },
      }

      if (err.errorKey === TRANSACTION_NO_CONTRACT_ERROR_KEY) {
        txMeta.simulationFails.debug.getCodeResponse = err.getCodeResponse
      }

      return txMeta
    }
    this.setTxGas(txMeta, block.gasLimit, estimatedGasHex)
    return txMeta
  }

  /**
    Estimates the tx's gas usage
    @param txMeta {Object} - the txMeta object
    @param blockGasLimitHex {string} - hex string of the block's gas limit
    @returns {string} the estimated gas limit as a hex string
  */
  async estimateTxGas (txMeta, blockGasLimitHex, getCodeResponse) {
    const txParams = txMeta.txParams
    // check if gasLimit is already specified
    txMeta.gasLimitSpecified = Boolean(txParams.gas)

    console.log('txMeta.gasLimitSpecified', txMeta.gasLimitSpecified)
    // if it is, use that value, unless it's a modified tx
    if (txMeta.gasLimitSpecified && txMeta.type != "gnosis") {
      console.log('txMeta.type', txMeta.type)
      console.log('about to return the gas', txParams.gas)
      return txParams.gas
    }
    const recipient = txParams.to
    console.log('recipient', recipient)
    const hasRecipient = Boolean(recipient)

    // see if we can set the gas based on the recipient
    if (hasRecipient) {
      // For an address with no code, geth will return '0x', and ganache-core v2.2.1 will return '0x0'
      const categorizedAsSimple = txMeta.transactionCategory === SEND_ETHER_ACTION_KEY

      // what is the case where it isn't categorized as simple?
      if (categorizedAsSimple) {
        // if there's data in the params, but there's no contract code, it's not a valid transaction
        console.log('in categorized as simple')
        if (txParams.data) {
          const err = new Error('TxGasUtil - Trying to call a function on a non-contract address')
          // set error key so ui can display localized error message
          err.errorKey = TRANSACTION_NO_CONTRACT_ERROR_KEY

          // set the response on the error so that we can see in logs what the actual response was
          err.getCodeResponse = getCodeResponse
          throw err
        }
        // This is a standard ether simple send, gas requirement is exactly 21k
        txParams.gas = SIMPLE_GAS_COST
        // prevents buffer addition
        txMeta.simpleSend = true
        return SIMPLE_GAS_COST
      }
      else if (txMeta.type === "gnosis") {
        console.log('tx gas utils in gnosis txType')
        const blockGasLimitBN = hexToBn(blockGasLimitHex)
        const saferGasLimitBN = BnMultiplyByFraction(blockGasLimitBN, 19, 20)
        txParams.gas = bnToHex(saferGasLimitBN)
        console.log('txParams', txParams)

        const gas = await this.query.estimateGas(txParams)

        // to do: document this estimation for a transfer and for a simple send estimation
        console.log('[tx-gas-utils] estimated gas', gas)
        return gas
        // return await this.query.estimateGas(txParams)
      }
    }
    // no recipient
    console.log('no recipient - should we even get here?')
    // fallback to block gasLimit
    const blockGasLimitBN = hexToBn(blockGasLimitHex)
    const saferGasLimitBN = BnMultiplyByFraction(blockGasLimitBN, 19, 20)
    txParams.gas = bnToHex(saferGasLimitBN)

    // estimate tx gas requirements
    return await this.query.estimateGas(txParams)
  }

  /**
    Writes the gas on the txParams in the txMeta
    @param txMeta {Object} - the txMeta object to write to
    @param blockGasLimitHex {string} - the block gas limit hex
    @param estimatedGasHex {string} - the estimated gas hex
  */
  setTxGas (txMeta, blockGasLimitHex, estimatedGasHex) {
    txMeta.estimatedGas = addHexPrefix(estimatedGasHex)
    const txParams = txMeta.txParams

    // if gasLimit was specified and doesnt OOG,
    // use original specified amount
    if (txMeta.gasLimitSpecified || txMeta.simpleSend) {
      txMeta.estimatedGas = txParams.gas
      return
    }
    // if gasLimit not originally specified,
    // try adding an additional gas buffer to our estimation for safety
    const recommendedGasHex = this.addGasBuffer(txMeta.estimatedGas, blockGasLimitHex)
    txParams.gas = recommendedGasHex
    return
  }

  /**
    Adds a gas buffer with out exceeding the block gas limit

    @param initialGasLimitHex {string} - the initial gas limit to add the buffer too
    @param blockGasLimitHex {string} - the block gas limit
    @returns {string} the buffered gas limit as a hex string
  */
  addGasBuffer (initialGasLimitHex, blockGasLimitHex) {
    console.log('in add gas buffer')
    const initialGasLimitBn = hexToBn(initialGasLimitHex)
    const blockGasLimitBn = hexToBn(blockGasLimitHex)
    const upperGasLimitBn = blockGasLimitBn.muln(0.9)
    const bufferedGasLimitBn = initialGasLimitBn.muln(1.5)

    // if initialGasLimit is above blockGasLimit, dont modify it
    if (initialGasLimitBn.gt(upperGasLimitBn)) return bnToHex(initialGasLimitBn)
    // if bufferedGasLimit is below blockGasLimit, use bufferedGasLimit
    if (bufferedGasLimitBn.lt(upperGasLimitBn)) return bnToHex(bufferedGasLimitBn)
    // otherwise use blockGasLimit
    return bnToHex(upperGasLimitBn)
  }
}

module.exports = TxGasUtil
