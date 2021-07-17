import EventEmitter from 'safe-event-emitter';
import { ObservableStore } from '@metamask/obs-store';
import { bufferToHex, keccak, toBuffer, isHexString } from 'ethereumjs-util';
import EthQuery from 'ethjs-query';
import { ethErrors } from 'eth-rpc-errors';
import abi from 'human-standard-token-abi';
import Common from '@ethereumjs/common';
import { TransactionFactory } from '@ethereumjs/tx';
import { ethers } from 'ethers';
import NonceTracker from 'nonce-tracker';
import log from 'loglevel';
import BigNumber from 'bignumber.js';
import cleanErrorStack from '../../lib/cleanErrorStack';
import {
  hexToBn,
  bnToHex,
  BnMultiplyByFraction,
  addHexPrefix,
  getChainType,
} from '../../lib/util';
import { TRANSACTION_NO_CONTRACT_ERROR_KEY } from '../../../../ui/helpers/constants/error-keys';
import { getSwapsTokensReceivedFromTxMeta } from '../../../../ui/pages/swaps/swaps.util';
import { hexWEIToDecGWEI } from '../../../../ui/helpers/utils/conversions.util';
import {
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
  TRANSACTION_ENVELOPE_TYPES,
} from '../../../../shared/constants/transaction';
import { METAMASK_CONTROLLER_EVENTS } from '../../metamask-controller';
import { GAS_LIMITS } from '../../../../shared/constants/gas';
import {
  HARDFORKS,
  MAINNET,
  NETWORK_TYPE_RPC,
  CHAIN_ID_TO_GAS_LIMIT_BUFFER_MAP,
} from '../../../../shared/constants/network';
import { isEIP1559Transaction } from '../../../../shared/modules/transaction.utils';
import TransactionStateManager from './tx-state-manager';
import TxGasUtil from './tx-gas-utils';
import PendingTransactionTracker from './pending-tx-tracker';
import * as txUtils from './lib/util';

const hstInterface = new ethers.utils.Interface(abi);

const MAX_MEMSTORE_TX_LIST_SIZE = 100; // Number of transactions (by unique nonces) to keep in memory

export const TRANSACTION_EVENTS = {
  ADDED: 'Transaction Added',
  APPROVED: 'Transaction Approved',
  FINALIZED: 'Transaction Finalized',
  REJECTED: 'Transaction Rejected',
  SUBMITTED: 'Transaction Submitted',
};

/**
 * @typedef {Object} CustomGasSettings
 * @property {string} [gas] - The gas limit to use for the transaction
 * @property {string} [gasPrice] - The gasPrice to use for a legacy transaction
 * @property {string} [maxFeePerGas] - The maximum amount to pay per gas on a
 *  EIP-1559 transaction
 * @property {string} [maxPriorityFeePerGas] - The maximum amount of paid fee
 *  to be distributed to miner in an EIP-1559 transaction
 */

/**
  Transaction Controller is an aggregate of sub-controllers and trackers
  composing them in a way to be exposed to the metamask controller
    <br>- txStateManager
      responsible for the state of a transaction and
      storing the transaction
    <br>- pendingTxTracker
      watching blocks for transactions to be include
      and emitting confirmed events
    <br>- txGasUtil
      gas calculations and safety buffering
    <br>- nonceTracker
      calculating nonces

  @class
  @param {Object} opts
  @param {Object} opts.initState - initial transaction list default is an empty array
  @param {Object} opts.networkStore - an observable store for network number
  @param {Object} opts.blockTracker - An instance of eth-blocktracker
  @param {Object} opts.provider - A network provider.
  @param {Function} opts.signTransaction - function the signs an @ethereumjs/tx
  @param {Object} opts.getPermittedAccounts - get accounts that an origin has permissions for
  @param {Function} opts.signTransaction - ethTx signer that returns a rawTx
  @param {number} [opts.txHistoryLimit] - number *optional* for limiting how many transactions are in state
  @param {Object} opts.preferencesStore
*/

export default class TransactionController extends EventEmitter {
  constructor(opts) {
    super();
    this.networkStore = opts.networkStore || new ObservableStore({});
    this._getCurrentChainId = opts.getCurrentChainId;
    this.getProviderConfig = opts.getProviderConfig;
    this.getEIP1559Compatibility = opts.getEIP1559Compatibility;
    this.preferencesStore = opts.preferencesStore || new ObservableStore({});
    this.provider = opts.provider;
    this.getPermittedAccounts = opts.getPermittedAccounts;
    this.blockTracker = opts.blockTracker;
    this.signEthTx = opts.signTransaction;
    this.inProcessOfSigning = new Set();
    this._trackMetaMetricsEvent = opts.trackMetaMetricsEvent;
    this._getParticipateInMetrics = opts.getParticipateInMetrics;

    this.memStore = new ObservableStore({});
    this.query = new EthQuery(this.provider);

    this.txGasUtil = new TxGasUtil(this.provider);
    this._mapMethods();
    this.txStateManager = new TransactionStateManager({
      initState: opts.initState,
      txHistoryLimit: opts.txHistoryLimit,
      getNetwork: this.getNetwork.bind(this),
      getCurrentChainId: opts.getCurrentChainId,
    });
    this._onBootCleanUp();

    this.store = this.txStateManager.store;
    this.nonceTracker = new NonceTracker({
      provider: this.provider,
      blockTracker: this.blockTracker,
      getPendingTransactions: this.txStateManager.getPendingTransactions.bind(
        this.txStateManager,
      ),
      getConfirmedTransactions: this.txStateManager.getConfirmedTransactions.bind(
        this.txStateManager,
      ),
    });

    this.pendingTxTracker = new PendingTransactionTracker({
      provider: this.provider,
      nonceTracker: this.nonceTracker,
      publishTransaction: (rawTx) => this.query.sendRawTransaction(rawTx),
      getPendingTransactions: () => {
        const pending = this.txStateManager.getPendingTransactions();
        const approved = this.txStateManager.getApprovedTransactions();
        return [...pending, ...approved];
      },
      approveTransaction: this.approveTransaction.bind(this),
      getCompletedTransactions: this.txStateManager.getConfirmedTransactions.bind(
        this.txStateManager,
      ),
    });

    this.txStateManager.store.subscribe(() =>
      this.emit(METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE),
    );
    this._setupListeners();
    // memstore is computed from a few different stores
    this._updateMemstore();
    this.txStateManager.store.subscribe(() => this._updateMemstore());
    this.networkStore.subscribe(() => {
      this._onBootCleanUp();
      this._updateMemstore();
    });

    // request state update to finalize initialization
    this._updatePendingTxsAfterFirstBlock();
  }

  /**
   * Gets the current chainId in the network store as a number, returning 0 if
   * the chainId parses to NaN.
   *
   * @returns {number} The numerical chainId.
   */
  getChainId() {
    const networkState = this.networkStore.getState();
    const chainId = this._getCurrentChainId();
    const integerChainId = parseInt(chainId, 16);
    if (networkState === 'loading' || Number.isNaN(integerChainId)) {
      return 0;
    }
    return integerChainId;
  }

  /**
   * @ethereumjs/tx uses @ethereumjs/common as a configuration tool for
   * specifying which chain, network, hardfork and EIPs to support for
   * a transaction. By referencing this configuration, and analyzing the fields
   * specified in txParams, @ethereumjs/tx is able to determine which EIP-2718
   * transaction type to use.
   * @returns {Common} common configuration object
   */
  async getCommonConfiguration() {
    const { type, nickname: name } = this.getProviderConfig();
    const supportsEIP1559 = await this.getEIP1559Compatibility();

    // This logic below will have to be updated each time a hardfork happens
    // that carries with it a new Transaction type. It is inconsequential for
    // hardforks that do not include new types.
    const hardfork = supportsEIP1559 ? HARDFORKS.LONDON : HARDFORKS.BERLIN;

    // type will be one of our default network names or 'rpc'. the default
    // network names are sufficient configuration, simply pass the name as the
    // chain argument in the constructor.
    if (type !== NETWORK_TYPE_RPC) {
      return new Common({
        chain: type,
        hardfork,
      });
    }

    // For 'rpc' we need to use the same basic configuration as mainnet,
    // since we only support EVM compatible chains, and then override the
    // name, chainId and networkId properties. This is done using the
    // `forCustomChain` static method on the Common class.
    const chainId = parseInt(this._getCurrentChainId(), 16);
    const networkId = this.networkStore.getState();

    const customChainParams = {
      name,
      chainId,
      // It is improbable for a transaction to be signed while the network
      // is loading for two reasons.
      // 1. Pending, unconfirmed transactions are wiped on network change
      // 2. The UI is unusable (loading indicator) when network is loading.
      // setting the networkId to 0 is for type safety and to explicity lead
      // the transaction to failing if a user is able to get to this branch
      // on a custom network that requires valid network id. I have not ran
      // into this limitation on any network I have attempted, even when
      // hardcoding networkId to 'loading'.
      networkId: networkId === 'loading' ? 0 : parseInt(networkId, 10),
    };

    return Common.forCustomChain(MAINNET, customChainParams, hardfork);
  }

  /**
  Adds a tx to the txlist
  @emits ${txMeta.id}:unapproved
  */
  addTransaction(txMeta) {
    this.txStateManager.addTransaction(txMeta);
    this.emit(`${txMeta.id}:unapproved`, txMeta);
    this._trackTransactionMetricsEvent(txMeta, TRANSACTION_EVENTS.ADDED);
  }

  /**
  Wipes the transactions for a given account
  @param {string} address - hex string of the from address for txs being removed
  */
  wipeTransactions(address) {
    this.txStateManager.wipeTransactions(address);
  }

  /**
   * Add a new unapproved transaction to the pipeline
   *
   * @returns {Promise<string>} the hash of the transaction after being submitted to the network
   * @param {Object} txParams - txParams for the transaction
   * @param {Object} opts - with the key origin to put the origin on the txMeta
   */
  async newUnapprovedTransaction(txParams, opts = {}) {
    log.debug(
      `MetaMaskController newUnapprovedTransaction ${JSON.stringify(txParams)}`,
    );

    const initialTxMeta = await this.addUnapprovedTransaction(
      txParams,
      opts.origin,
    );

    // listen for tx completion (success, fail)
    return new Promise((resolve, reject) => {
      this.txStateManager.once(
        `${initialTxMeta.id}:finished`,
        (finishedTxMeta) => {
          switch (finishedTxMeta.status) {
            case TRANSACTION_STATUSES.SUBMITTED:
              return resolve(finishedTxMeta.hash);
            case TRANSACTION_STATUSES.REJECTED:
              return reject(
                cleanErrorStack(
                  ethErrors.provider.userRejectedRequest(
                    'MetaMask Tx Signature: User denied transaction signature.',
                  ),
                ),
              );
            case TRANSACTION_STATUSES.FAILED:
              return reject(
                cleanErrorStack(
                  ethErrors.rpc.internal(finishedTxMeta.err.message),
                ),
              );
            default:
              return reject(
                cleanErrorStack(
                  ethErrors.rpc.internal(
                    `MetaMask Tx Signature: Unknown problem: ${JSON.stringify(
                      finishedTxMeta.txParams,
                    )}`,
                  ),
                ),
              );
          }
        },
      );
    });
  }

  /**
   * Validates and generates a txMeta with defaults and puts it in txStateManager
   * store.
   *
   * @returns {txMeta}
   */
  async addUnapprovedTransaction(txParams, origin) {
    console.log(txParams, origin);
    // validate
    const normalizedTxParams = txUtils.normalizeTxParams(txParams);

    txUtils.validateTxParams(normalizedTxParams);

    /**
    `generateTxMeta` adds the default txMeta properties to the passed object.
    These include the tx's `id`. As we use the id for determining order of
    txes in the tx-state-manager, it is necessary to call the asynchronous
    method `this._determineTransactionType` after `generateTxMeta`.
    */
    let txMeta = this.txStateManager.generateTxMeta({
      txParams: normalizedTxParams,
      origin,
    });

    if (origin === 'metamask') {
      // Assert the from address is the selected address
      if (normalizedTxParams.from !== this.getSelectedAddress()) {
        throw ethErrors.rpc.internal({
          message: `Internally initiated transaction is using invalid account.`,
          data: {
            origin,
            fromAddress: normalizedTxParams.from,
            selectedAddress: this.getSelectedAddress(),
          },
        });
      }
    } else {
      // Assert that the origin has permissions to initiate transactions from
      // the specified address
      const permittedAddresses = await this.getPermittedAccounts(origin);
      if (!permittedAddresses.includes(normalizedTxParams.from)) {
        throw ethErrors.provider.unauthorized({ data: { origin } });
      }
    }

    const { type, getCodeResponse } = await this._determineTransactionType(
      txParams,
    );
    txMeta.type = type;

    // ensure value
    txMeta.txParams.value = txMeta.txParams.value
      ? addHexPrefix(txMeta.txParams.value)
      : '0x0';

    this.addTransaction(txMeta);
    this.emit('newUnapprovedTx', txMeta);

    try {
      txMeta = await this.addTxGasDefaults(txMeta, getCodeResponse);
    } catch (error) {
      log.warn(error);
      txMeta = this.txStateManager.getTransaction(txMeta.id);
      txMeta.loadingDefaults = false;
      this.txStateManager.updateTransaction(
        txMeta,
        'Failed to calculate gas defaults.',
      );
      throw error;
    }

    txMeta.loadingDefaults = false;
    // save txMeta
    this.txStateManager.updateTransaction(
      txMeta,
      'Added new unapproved transaction.',
    );

    return txMeta;
  }

  /**
   * Adds the tx gas defaults: gas && gasPrice
   * @param {Object} txMeta - the txMeta object
   * @returns {Promise<object>} resolves with txMeta
   */
  async addTxGasDefaults(txMeta, getCodeResponse) {
    const defaultGasPrice = await this._getDefaultGasPrice(txMeta);
    const {
      gasLimit: defaultGasLimit,
      simulationFails,
    } = await this._getDefaultGasLimit(txMeta, getCodeResponse);

    // eslint-disable-next-line no-param-reassign
    txMeta = this.txStateManager.getTransaction(txMeta.id);
    if (simulationFails) {
      txMeta.simulationFails = simulationFails;
    }
    if (
      defaultGasPrice &&
      !txMeta.txParams.gasPrice &&
      !txMeta.txParams.maxPriorityFeePerGas &&
      !txMeta.txParams.maxFeePerGas
    ) {
      txMeta.txParams.gasPrice = defaultGasPrice;
    }
    if (defaultGasLimit && !txMeta.txParams.gas) {
      txMeta.txParams.gas = defaultGasLimit;
    }
    return txMeta;
  }

  /**
   * Gets default gas price, or returns `undefined` if gas price is already set
   * @param {Object} txMeta - The txMeta object
   * @returns {Promise<string|undefined>} The default gas price
   */
  async _getDefaultGasPrice(txMeta) {
    if (
      txMeta.txParams.gasPrice ||
      (txMeta.txParams.maxFeePerGas && txMeta.txParams.maxPriorityFeePerGas)
    ) {
      return undefined;
    }
    const gasPrice = await this.query.gasPrice();

    return addHexPrefix(gasPrice.toString(16));
  }

  /**
   * Gets default gas limit, or debug information about why gas estimate failed.
   * @param {Object} txMeta - The txMeta object
   * @param {string} getCodeResponse - The transaction category code response, used for debugging purposes
   * @returns {Promise<Object>} Object containing the default gas limit, or the simulation failure object
   */
  async _getDefaultGasLimit(txMeta, getCodeResponse) {
    const chainId = this._getCurrentChainId();
    const customNetworkGasBuffer = CHAIN_ID_TO_GAS_LIMIT_BUFFER_MAP[chainId];
    const chainType = getChainType(chainId);

    if (txMeta.txParams.gas) {
      return {};
    } else if (
      txMeta.txParams.to &&
      txMeta.type === TRANSACTION_TYPES.SENT_ETHER &&
      chainType !== 'custom'
    ) {
      // if there's data in the params, but there's no contract code, it's not a valid transaction
      if (txMeta.txParams.data) {
        const err = new Error(
          'TxGasUtil - Trying to call a function on a non-contract address',
        );
        // set error key so ui can display localized error message
        err.errorKey = TRANSACTION_NO_CONTRACT_ERROR_KEY;

        // set the response on the error so that we can see in logs what the actual response was
        err.getCodeResponse = getCodeResponse;
        throw err;
      }

      // This is a standard ether simple send, gas requirement is exactly 21k
      return { gasLimit: GAS_LIMITS.SIMPLE };
    }

    const {
      blockGasLimit,
      estimatedGasHex,
      simulationFails,
    } = await this.txGasUtil.analyzeGasUsage(txMeta);

    // add additional gas buffer to our estimation for safety
    const gasLimit = this.txGasUtil.addGasBuffer(
      addHexPrefix(estimatedGasHex),
      blockGasLimit,
      customNetworkGasBuffer,
    );
    return { gasLimit, simulationFails };
  }

  /**
   * Given a TransactionMeta object, generate new gas params such that if the
   * transaction was an EIP1559 transaction, it only has EIP1559 gas fields,
   * otherwise it only has gasPrice. Will use whatever custom values are
   * specified in customGasSettings, or falls back to incrementing by a percent
   * which is defined by specifying a numerator. 11 is a 10% bump, 12 would be
   * a 20% bump, and so on.
   * @param {import(
   *  '../../../../shared/constants/transaction'
   * ).TransactionMeta} originalTxMeta - Original transaction to use as base
   * @param {CustomGasSettings} [customGasSettings] - overrides for the gas
   *  fields to use instead of the multiplier
   * @param {number} [incrementNumerator] - Numerator from which to generate a
   *  percentage bump of gas price. E.g 11 would be a 10% bump over base.
   * @returns {{ newGasParams: CustomGasSettings, previousGasParams: CustomGasSettings }}
   */
  generateNewGasParams(
    originalTxMeta,
    customGasSettings = {},
    incrementNumerator = 11,
  ) {
    const { txParams } = originalTxMeta;
    const previousGasParams = {};
    const newGasParams = {};
    if (customGasSettings.gasLimit) {
      newGasParams.gas = customGasSettings?.gas ?? GAS_LIMITS.SIMPLE;
    }

    if (isEIP1559Transaction(originalTxMeta)) {
      previousGasParams.maxFeePerGas = txParams.maxFeePerGas;
      previousGasParams.maxPriorityFeePerGas = txParams.maxPriorityFeePerGas;
      newGasParams.maxFeePerGas =
        customGasSettings?.maxFeePerGas ||
        bnToHex(
          BnMultiplyByFraction(
            hexToBn(txParams.maxFeePerGas),
            incrementNumerator,
            10,
          ),
        );
      newGasParams.maxPriorityFeePerGas =
        customGasSettings?.maxPriorityFeePerGas ||
        bnToHex(
          BnMultiplyByFraction(
            hexToBn(txParams.maxPriorityFeePerGas),
            incrementNumerator,
            10,
          ),
        );
    } else {
      previousGasParams.gasPrice = txParams.gasPrice;
      newGasParams.gasPrice =
        customGasSettings?.gasPrice ||
        bnToHex(
          BnMultiplyByFraction(
            hexToBn(txParams.gasPrice),
            incrementNumerator,
            10,
          ),
        );
    }

    return { previousGasParams, newGasParams };
  }

  /**
   * Creates a new approved transaction to attempt to cancel a previously submitted transaction. The
   * new transaction contains the same nonce as the previous, is a basic ETH transfer of 0x value to
   * the sender's address, and has a higher gasPrice than that of the previous transaction.
   * @param {number} originalTxId - the id of the txMeta that you want to attempt to cancel
   * @param {CustomGasSettings} [customGasSettings] - overrides to use for gas
   *  params instead of allowing this method to generate them
   * @returns {txMeta}
   */
  async createCancelTransaction(originalTxId, customGasSettings) {
    const originalTxMeta = this.txStateManager.getTransaction(originalTxId);
    const { txParams } = originalTxMeta;
    const { from, nonce } = txParams;

    const { previousGasParams, newGasParams } = this.generateNewGasParams(
      originalTxMeta,
      {
        ...customGasSettings,
        // We want to override the previous transactions gasLimit because it
        // will now be a simple send instead of whatever it was before such
        // as a token transfer or contract call.
        gasLimit: customGasSettings.gasLimit || GAS_LIMITS.SIMPLE,
      },
    );

    const newTxMeta = this.txStateManager.generateTxMeta({
      txParams: {
        from,
        to: from,
        nonce,
        value: '0x0',
        ...newGasParams,
      },
      previousGasParams,
      loadingDefaults: false,
      status: TRANSACTION_STATUSES.APPROVED,
      type: TRANSACTION_TYPES.CANCEL,
    });

    this.addTransaction(newTxMeta);
    await this.approveTransaction(newTxMeta.id);
    return newTxMeta;
  }

  /**
   * Creates a new approved transaction to attempt to speed up a previously submitted transaction. The
   * new transaction contains the same nonce as the previous. By default, the new transaction will use
   * the same gas limit and a 10% higher gas price, though it is possible to set a custom value for
   * each instead.
   * @param {number} originalTxId - the id of the txMeta that you want to speed up
   * @param {CustomGasSettings} [customGasSettings] - overrides to use for gas
   *  params instead of allowing this method to generate them
   * @returns {txMeta}
   */
  async createSpeedUpTransaction(originalTxId, customGasSettings) {
    const originalTxMeta = this.txStateManager.getTransaction(originalTxId);
    const { txParams } = originalTxMeta;

    const { previousGasParams, newGasParams } = this.generateNewGasParams(
      originalTxMeta,
      customGasSettings,
    );

    const newTxMeta = this.txStateManager.generateTxMeta({
      txParams: {
        ...txParams,
        ...newGasParams,
      },
      previousGasParams,
      loadingDefaults: false,
      status: TRANSACTION_STATUSES.APPROVED,
      type: TRANSACTION_TYPES.RETRY,
    });

    this.addTransaction(newTxMeta);
    await this.approveTransaction(newTxMeta.id);
    return newTxMeta;
  }

  /**
  updates the txMeta in the txStateManager
  @param {Object} txMeta - the updated txMeta
  */
  async updateTransaction(txMeta) {
    this.txStateManager.updateTransaction(
      txMeta,
      'confTx: user updated transaction',
    );
  }

  /**
  updates and approves the transaction
  @param {Object} txMeta
  */
  async updateAndApproveTransaction(txMeta) {
    this.txStateManager.updateTransaction(
      txMeta,
      'confTx: user approved transaction',
    );
    await this.approveTransaction(txMeta.id);
  }

  /**
  sets the tx status to approved
  auto fills the nonce
  signs the transaction
  publishes the transaction
  if any of these steps fails the tx status will be set to failed
    @param {number} txId - the tx's Id
  */
  async approveTransaction(txId) {
    // TODO: Move this safety out of this function.
    // Since this transaction is async,
    // we need to keep track of what is currently being signed,
    // So that we do not increment nonce + resubmit something
    // that is already being incremented & signed.
    if (this.inProcessOfSigning.has(txId)) {
      return;
    }
    this.inProcessOfSigning.add(txId);
    let nonceLock;
    try {
      // approve
      this.txStateManager.setTxStatusApproved(txId);
      // get next nonce
      const txMeta = this.txStateManager.getTransaction(txId);
      console.log(txMeta);
      const fromAddress = txMeta.txParams.from;
      // wait for a nonce
      let { customNonceValue } = txMeta;
      customNonceValue = Number(customNonceValue);
      nonceLock = await this.nonceTracker.getNonceLock(fromAddress);
      // add nonce to txParams
      // if txMeta has previousGasParams then it is a retry at same nonce with
      // higher gas settings and therefor the nonce should not be recalculated
      const nonce = txMeta.previousGasParams
        ? txMeta.txParams.nonce
        : nonceLock.nextNonce;
      const customOrNonce =
        customNonceValue === 0 ? customNonceValue : customNonceValue || nonce;

      txMeta.txParams.nonce = addHexPrefix(customOrNonce.toString(16));
      // add nonce debugging information to txMeta
      txMeta.nonceDetails = nonceLock.nonceDetails;
      if (customNonceValue) {
        txMeta.nonceDetails.customNonceValue = customNonceValue;
      }
      this.txStateManager.updateTransaction(
        txMeta,
        'transactions#approveTransaction',
      );
      // sign transaction
      const rawTx = await this.signTransaction(txId);
      await this.publishTransaction(txId, rawTx);
      this._trackTransactionMetricsEvent(txMeta, TRANSACTION_EVENTS.APPROVED);
      // must set transaction to submitted/failed before releasing lock
      nonceLock.releaseLock();
    } catch (err) {
      // this is try-catch wrapped so that we can guarantee that the nonceLock is released
      try {
        this._failTransaction(txId, err);
      } catch (err2) {
        log.error(err2);
      }
      // must set transaction to submitted/failed before releasing lock
      if (nonceLock) {
        nonceLock.releaseLock();
      }
      // continue with error chain
      throw err;
    } finally {
      this.inProcessOfSigning.delete(txId);
    }
  }

  /**
    adds the chain id and signs the transaction and set the status to signed
    @param {number} txId - the tx's Id
    @returns {string} rawTx
  */
  async signTransaction(txId) {
    const txMeta = this.txStateManager.getTransaction(txId);
    // add network/chain id
    const chainId = this.getChainId();
    const type = isEIP1559Transaction(txMeta)
      ? TRANSACTION_ENVELOPE_TYPES.FEE_MARKET
      : TRANSACTION_ENVELOPE_TYPES.LEGACY;
    const txParams = {
      type,
      ...txMeta.txParams,
      chainId,
      gasLimit: txMeta.txParams.gas,
    };
    // sign tx
    const fromAddress = txParams.from;
    const common = await this.getCommonConfiguration();
    const unsignedEthTx = TransactionFactory.fromTxData(txParams, { common });
    const signedEthTx = await this.signEthTx(unsignedEthTx, fromAddress);

    // add r,s,v values for provider request purposes see createMetamaskMiddleware
    // and JSON rpc standard for further explanation
    txMeta.r = bufferToHex(signedEthTx.r);
    txMeta.s = bufferToHex(signedEthTx.s);
    txMeta.v = bufferToHex(signedEthTx.v);

    this.txStateManager.updateTransaction(
      txMeta,
      'transactions#signTransaction: add r, s, v values',
    );

    // set state to signed
    this.txStateManager.setTxStatusSigned(txMeta.id);
    const rawTx = bufferToHex(signedEthTx.serialize());
    return rawTx;
  }

  /**
    publishes the raw tx and sets the txMeta to submitted
    @param {number} txId - the tx's Id
    @param {string} rawTx - the hex string of the serialized signed transaction
    @returns {Promise<void>}
  */
  async publishTransaction(txId, rawTx) {
    const txMeta = this.txStateManager.getTransaction(txId);
    txMeta.rawTx = rawTx;
    if (txMeta.type === TRANSACTION_TYPES.SWAP) {
      const preTxBalance = await this.query.getBalance(txMeta.txParams.from);
      txMeta.preTxBalance = preTxBalance.toString(16);
    }
    this.txStateManager.updateTransaction(
      txMeta,
      'transactions#publishTransaction',
    );
    let txHash;
    try {
      txHash = await this.query.sendRawTransaction(rawTx);
    } catch (error) {
      if (error.message.toLowerCase().includes('known transaction')) {
        txHash = keccak(toBuffer(addHexPrefix(rawTx), 'hex')).toString('hex');
        txHash = addHexPrefix(txHash);
      } else {
        throw error;
      }
    }
    this.setTxHash(txId, txHash);

    this.txStateManager.setTxStatusSubmitted(txId);

    this._trackTransactionMetricsEvent(txMeta, TRANSACTION_EVENTS.SUBMITTED);
  }

  /**
   * Sets the status of the transaction to confirmed and sets the status of nonce duplicates as
   * dropped if the txParams have data it will fetch the txReceipt
   * @param {number} txId - The tx's ID
   * @returns {Promise<void>}
   */
  async confirmTransaction(txId, txReceipt) {
    // get the txReceipt before marking the transaction confirmed
    // to ensure the receipt is gotten before the ui revives the tx
    const txMeta = this.txStateManager.getTransaction(txId);

    if (!txMeta) {
      return;
    }

    try {
      // It seems that sometimes the numerical values being returned from
      // this.query.getTransactionReceipt are BN instances and not strings.
      const gasUsed =
        typeof txReceipt.gasUsed === 'string'
          ? txReceipt.gasUsed
          : txReceipt.gasUsed.toString(16);

      txMeta.txReceipt = {
        ...txReceipt,
        gasUsed,
      };
      this.txStateManager.setTxStatusConfirmed(txId);
      this._markNonceDuplicatesDropped(txId);

      const { submittedTime } = txMeta;
      const metricsParams = { gas_used: gasUsed };

      if (submittedTime) {
        metricsParams.completion_time = this._getTransactionCompletionTime(
          submittedTime,
        );
      }

      if (txReceipt.status === '0x0') {
        metricsParams.status = 'failed on-chain';
        // metricsParams.error = TODO: figure out a way to get the on-chain failure reason
      }

      this._trackTransactionMetricsEvent(
        txMeta,
        TRANSACTION_EVENTS.FINALIZED,
        metricsParams,
      );

      this.txStateManager.updateTransaction(
        txMeta,
        'transactions#confirmTransaction - add txReceipt',
      );

      if (txMeta.type === TRANSACTION_TYPES.SWAP) {
        const postTxBalance = await this.query.getBalance(txMeta.txParams.from);
        const latestTxMeta = this.txStateManager.getTransaction(txId);

        const approvalTxMeta = latestTxMeta.approvalTxId
          ? this.txStateManager.getTransaction(latestTxMeta.approvalTxId)
          : null;

        latestTxMeta.postTxBalance = postTxBalance.toString(16);

        this.txStateManager.updateTransaction(
          latestTxMeta,
          'transactions#confirmTransaction - add postTxBalance',
        );

        this._trackSwapsMetrics(latestTxMeta, approvalTxMeta);
      }
    } catch (err) {
      log.error(err);
    }
  }

  /**
    Convenience method for the ui thats sets the transaction to rejected
    @param {number} txId - the tx's Id
    @returns {Promise<void>}
  */
  async cancelTransaction(txId) {
    const txMeta = this.txStateManager.getTransaction(txId);
    this.txStateManager.setTxStatusRejected(txId);
    this._trackTransactionMetricsEvent(txMeta, TRANSACTION_EVENTS.REJECTED);
  }

  /**
    Sets the txHas on the txMeta
    @param {number} txId - the tx's Id
    @param {string} txHash - the hash for the txMeta
  */
  setTxHash(txId, txHash) {
    // Add the tx hash to the persisted meta-tx object
    const txMeta = this.txStateManager.getTransaction(txId);
    txMeta.hash = txHash;
    this.txStateManager.updateTransaction(txMeta, 'transactions#setTxHash');
  }

  //
  //           PRIVATE METHODS
  //
  /** maps methods for convenience*/
  _mapMethods() {
    /** @returns {Object} the state in transaction controller */
    this.getState = () => this.memStore.getState();

    /** @returns {string|number} the network number stored in networkStore */
    this.getNetwork = () => this.networkStore.getState();

    /** @returns {string} the user selected address */
    this.getSelectedAddress = () =>
      this.preferencesStore.getState().selectedAddress;

    /** @returns {Array} transactions whos status is unapproved */
    this.getUnapprovedTxCount = () =>
      Object.keys(this.txStateManager.getUnapprovedTxList()).length;

    /**
      @returns {number} number of transactions that have the status submitted
      @param {string} account - hex prefixed account
    */
    this.getPendingTxCount = (account) =>
      this.txStateManager.getPendingTransactions(account).length;

    /** see txStateManager */
    this.getTransactions = (opts) => this.txStateManager.getTransactions(opts);
  }

  // called once on startup
  async _updatePendingTxsAfterFirstBlock() {
    // wait for first block so we know we're ready
    await this.blockTracker.getLatestBlock();
    // get status update for all pending transactions (for the current network)
    await this.pendingTxTracker.updatePendingTxs();
  }

  /**
    If transaction controller was rebooted with transactions that are uncompleted
    in steps of the transaction signing or user confirmation process it will either
    transition txMetas to a failed state or try to redo those tasks.
  */

  _onBootCleanUp() {
    this.txStateManager
      .getTransactions({
        searchCriteria: {
          status: TRANSACTION_STATUSES.UNAPPROVED,
          loadingDefaults: true,
        },
      })
      .forEach((tx) => {
        this.addTxGasDefaults(tx)
          .then((txMeta) => {
            txMeta.loadingDefaults = false;
            this.txStateManager.updateTransaction(
              txMeta,
              'transactions: gas estimation for tx on boot',
            );
          })
          .catch((error) => {
            const txMeta = this.txStateManager.getTransaction(tx.id);
            txMeta.loadingDefaults = false;
            this.txStateManager.updateTransaction(
              txMeta,
              'failed to estimate gas during boot cleanup.',
            );
            this._failTransaction(txMeta.id, error);
          });
      });

    this.txStateManager
      .getTransactions({
        searchCriteria: {
          status: TRANSACTION_STATUSES.APPROVED,
        },
      })
      .forEach((txMeta) => {
        const txSignError = new Error(
          'Transaction found as "approved" during boot - possibly stuck during signing',
        );
        this._failTransaction(txMeta.id, txSignError);
      });
  }

  /**
    is called in constructor applies the listeners for pendingTxTracker txStateManager
    and blockTracker
  */
  _setupListeners() {
    this.txStateManager.on(
      'tx:status-update',
      this.emit.bind(this, 'tx:status-update'),
    );
    this._setupBlockTrackerListener();
    this.pendingTxTracker.on('tx:warning', (txMeta) => {
      this.txStateManager.updateTransaction(
        txMeta,
        'transactions/pending-tx-tracker#event: tx:warning',
      );
    });
    this.pendingTxTracker.on('tx:failed', (txId, error) => {
      this._failTransaction(txId, error);
    });
    this.pendingTxTracker.on('tx:confirmed', (txId, transactionReceipt) =>
      this.confirmTransaction(txId, transactionReceipt),
    );
    this.pendingTxTracker.on('tx:dropped', (txId) => {
      this._dropTransaction(txId);
    });
    this.pendingTxTracker.on('tx:block-update', (txMeta, latestBlockNumber) => {
      if (!txMeta.firstRetryBlockNumber) {
        txMeta.firstRetryBlockNumber = latestBlockNumber;
        this.txStateManager.updateTransaction(
          txMeta,
          'transactions/pending-tx-tracker#event: tx:block-update',
        );
      }
    });
    this.pendingTxTracker.on('tx:retry', (txMeta) => {
      if (!('retryCount' in txMeta)) {
        txMeta.retryCount = 0;
      }
      txMeta.retryCount += 1;
      this.txStateManager.updateTransaction(
        txMeta,
        'transactions/pending-tx-tracker#event: tx:retry',
      );
    });
  }

  /**
   * @typedef { 'transfer' | 'approve' | 'transferfrom' | 'contractInteraction'| 'sentEther' } InferrableTransactionTypes
   */

  /**
   * @typedef {Object} InferTransactionTypeResult
   * @property {InferrableTransactionTypes} type - The type of transaction
   * @property {string} getCodeResponse - The contract code, in hex format if
   *  it exists. '0x0' or '0x' are also indicators of non-existent contract
   *  code
   */

  /**
   * Determines the type of the transaction by analyzing the txParams.
   * This method will return one of the types defined in shared/constants/transactions
   * It will never return TRANSACTION_TYPE_CANCEL or TRANSACTION_TYPE_RETRY as these
   * represent specific events that we control from the extension and are added manually
   * at transaction creation.
   * @param {Object} txParams - Parameters for the transaction
   * @returns {InferTransactionTypeResult}
   */
  async _determineTransactionType(txParams) {
    const { data, to } = txParams;
    let name;
    try {
      name = data && hstInterface.parseTransaction({ data }).name;
    } catch (error) {
      log.debug('Failed to parse transaction data.', error, data);
    }

    const tokenMethodName = [
      TRANSACTION_TYPES.TOKEN_METHOD_APPROVE,
      TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER,
      TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER_FROM,
    ].find((methodName) => methodName === name && name.toLowerCase());

    let result;
    if (data && tokenMethodName) {
      result = tokenMethodName;
    } else if (data && !to) {
      result = TRANSACTION_TYPES.DEPLOY_CONTRACT;
    }

    let code;
    if (!result) {
      try {
        code = await this.query.getCode(to);
      } catch (e) {
        code = null;
        log.warn(e);
      }

      const codeIsEmpty = !code || code === '0x' || code === '0x0';

      result = codeIsEmpty
        ? TRANSACTION_TYPES.SENT_ETHER
        : TRANSACTION_TYPES.CONTRACT_INTERACTION;
    }

    return { type: result, getCodeResponse: code };
  }

  /**
    Sets other txMeta statuses to dropped if the txMeta that has been confirmed has other transactions
    in the list have the same nonce

    @param {number} txId - the txId of the transaction that has been confirmed in a block
  */
  _markNonceDuplicatesDropped(txId) {
    // get the confirmed transactions nonce and from address
    const txMeta = this.txStateManager.getTransaction(txId);
    const { nonce, from } = txMeta.txParams;
    const sameNonceTxs = this.txStateManager.getTransactions({
      searchCriteria: { nonce, from },
    });
    if (!sameNonceTxs.length) {
      return;
    }
    // mark all same nonce transactions as dropped and give i a replacedBy hash
    sameNonceTxs.forEach((otherTxMeta) => {
      if (otherTxMeta.id === txId) {
        return;
      }
      otherTxMeta.replacedBy = txMeta.hash;
      this.txStateManager.updateTransaction(
        txMeta,
        'transactions/pending-tx-tracker#event: tx:confirmed reference to confirmed txHash with same nonce',
      );
      this._dropTransaction(otherTxMeta.id);
    });
  }

  _setupBlockTrackerListener() {
    let listenersAreActive = false;
    const latestBlockHandler = this._onLatestBlock.bind(this);
    const { blockTracker, txStateManager } = this;

    txStateManager.on('tx:status-update', updateSubscription);
    updateSubscription();

    function updateSubscription() {
      const pendingTxs = txStateManager.getPendingTransactions();
      if (!listenersAreActive && pendingTxs.length > 0) {
        blockTracker.on('latest', latestBlockHandler);
        listenersAreActive = true;
      } else if (listenersAreActive && !pendingTxs.length) {
        blockTracker.removeListener('latest', latestBlockHandler);
        listenersAreActive = false;
      }
    }
  }

  async _onLatestBlock(blockNumber) {
    try {
      await this.pendingTxTracker.updatePendingTxs();
    } catch (err) {
      log.error(err);
    }
    try {
      await this.pendingTxTracker.resubmitPendingTxs(blockNumber);
    } catch (err) {
      log.error(err);
    }
  }

  /**
    Updates the memStore in transaction controller
  */
  _updateMemstore() {
    const unapprovedTxs = this.txStateManager.getUnapprovedTxList();
    const currentNetworkTxList = this.txStateManager.getTransactions({
      limit: MAX_MEMSTORE_TX_LIST_SIZE,
    });
    this.memStore.updateState({ unapprovedTxs, currentNetworkTxList });
  }

  _trackSwapsMetrics(txMeta, approvalTxMeta) {
    if (this._getParticipateInMetrics() && txMeta.swapMetaData) {
      if (txMeta.txReceipt.status === '0x0') {
        this._trackMetaMetricsEvent({
          event: 'Swap Failed',
          sensitiveProperties: { ...txMeta.swapMetaData },
          category: 'swaps',
        });
      } else {
        const tokensReceived = getSwapsTokensReceivedFromTxMeta(
          txMeta.destinationTokenSymbol,
          txMeta,
          txMeta.destinationTokenAddress,
          txMeta.txParams.from,
          txMeta.destinationTokenDecimals,
          approvalTxMeta,
          txMeta.chainId,
        );

        const quoteVsExecutionRatio = `${new BigNumber(tokensReceived, 10)
          .div(txMeta.swapMetaData.token_to_amount, 10)
          .times(100)
          .round(2)}%`;

        const estimatedVsUsedGasRatio = `${new BigNumber(
          txMeta.txReceipt.gasUsed,
          16,
        )
          .div(txMeta.swapMetaData.estimated_gas, 10)
          .times(100)
          .round(2)}%`;

        this._trackMetaMetricsEvent({
          event: 'Swap Completed',
          category: 'swaps',
          sensitiveProperties: {
            ...txMeta.swapMetaData,
            token_to_amount_received: tokensReceived,
            quote_vs_executionRatio: quoteVsExecutionRatio,
            estimated_vs_used_gasRatio: estimatedVsUsedGasRatio,
          },
        });
      }
    }
  }

  /**
   * Extracts relevant properties from a transaction meta
   * object and uses them to create and send metrics for various transaction
   * events.
   * @param {Object} txMeta - the txMeta object
   * @param {string} event - the name of the transaction event
   * @param {Object} extraParams - optional props and values to include in sensitiveProperties
   */
  _trackTransactionMetricsEvent(txMeta, event, extraParams = {}) {
    const {
      type,
      time,
      status,
      chainId,
      origin: referrer,
      txParams: { gasPrice, gas: gasLimit, maxFeePerGas, maxPriorityFeePerGas },
      metamaskNetworkId: network,
    } = txMeta;
    const source = referrer === 'metamask' ? 'user' : 'dapp';

    const gasParams = {};

    if (isEIP1559Transaction(txMeta)) {
      gasParams.max_fee_per_gas = maxFeePerGas;
      gasParams.max_priority_fee_per_gas = maxPriorityFeePerGas;
    } else {
      gasParams.gas_price = gasPrice;
    }

    const gasParamsInGwei = this._getGasValuesInGWEI(gasParams);

    this._trackMetaMetricsEvent({
      event,
      category: 'Transactions',
      properties: {
        chain_id: chainId,
        referrer,
        source,
        network,
        type,
      },
      sensitiveProperties: {
        status,
        transaction_envelope_type: isEIP1559Transaction(txMeta)
          ? 'fee-market'
          : 'legacy',
        first_seen: time,
        gas_limit: gasLimit,
        ...gasParamsInGwei,
        ...extraParams,
      },
    });
  }

  _getTransactionCompletionTime(submittedTime) {
    return Math.round((Date.now() - submittedTime) / 1000).toString();
  }

  _getGasValuesInGWEI(gasParams) {
    const gasValuesInGwei = {};
    for (const param in gasParams) {
      if (isHexString(gasParams[param])) {
        gasValuesInGwei[param] = hexWEIToDecGWEI(gasParams[param]);
      }
    }
    return gasValuesInGwei;
  }

  _failTransaction(txId, error) {
    this.txStateManager.setTxStatusFailed(txId, error);
    const txMeta = this.txStateManager.getTransaction(txId);
    this._trackTransactionMetricsEvent(txMeta, TRANSACTION_EVENTS.FINALIZED, {
      error: error.message,
    });
  }

  _dropTransaction(txId) {
    this.txStateManager.setTxStatusDropped(txId);
    const txMeta = this.txStateManager.getTransaction(txId);
    this._trackTransactionMetricsEvent(txMeta, TRANSACTION_EVENTS.FINALIZED);
  }
}
