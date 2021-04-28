import { ObservableStore } from '@metamask/obs-store';
import log from 'loglevel';
import BN from 'bn.js';
import createId from '../../../shared/modules/random-id';
import { bnToHex } from '../lib/util';
import getFetchWithTimeout from '../../../shared/modules/fetch-with-timeout';

import {
  TRANSACTION_TYPES,
  TRANSACTION_STATUSES,
} from '../../../shared/constants/transaction';
import {
  CHAIN_ID_TO_NETWORK_ID_MAP,
  CHAIN_ID_TO_TYPE_MAP,
  GOERLI_CHAIN_ID,
  KOVAN_CHAIN_ID,
  MAINNET_CHAIN_ID,
  RINKEBY_CHAIN_ID,
  ROPSTEN_CHAIN_ID,
} from '../../../shared/constants/network';

const fetchWithTimeout = getFetchWithTimeout(30000);

/**
 * @typedef {import('../../../shared/constants/transaction').TransactionMeta} TransactionMeta
 */

/**
 * A transaction object in the format returned by the Etherscan API.
 *
 * Note that this is not an exhaustive type definiton; only the properties we use are defined
 *
 * @typedef {Object} EtherscanTransaction
 * @property {string} blockNumber - The number of the block this transaction was found in, in decimal
 * @property {string} from - The hex-prefixed address of the sender
 * @property {string} gas - The gas limit, in decimal WEI
 * @property {string} gasPrice - The gas price, in decimal WEI
 * @property {string} hash - The hex-prefixed transaction hash
 * @property {string} isError - Whether the transaction was confirmed or failed (0 for confirmed, 1 for failed)
 * @property {string} nonce - The transaction nonce, in decimal
 * @property {string} timeStamp - The timestamp for the transaction, in seconds
 * @property {string} to - The hex-prefixed address of the recipient
 * @property {string} value - The amount of ETH sent in this transaction, in decimal WEI
 */

/**
 * This controller is responsible for retrieving external transactions. Etherscan is polled once every block to check
 * for new external transactions for the current selected account on the current network
 *
 * Note that only the built-in Infura networks are supported (i.e. anything in `INFURA_PROVIDER_TYPES`). We will not
 * attempt to retrieve external transactions on any custom RPC endpoints.
 */
const etherscanSupportedNetworks = [
  GOERLI_CHAIN_ID,
  KOVAN_CHAIN_ID,
  MAINNET_CHAIN_ID,
  RINKEBY_CHAIN_ID,
  ROPSTEN_CHAIN_ID,
];

export default class ExternalTransactionsController {
  constructor(opts = {}) {
    const {
      blockTracker,
      onNetworkDidChange,
      getCurrentChainId,
      preferencesController,
    } = opts;
    this.blockTracker = blockTracker;
    this.getCurrentChainId = getCurrentChainId;
    this.preferencesController = preferencesController;

    this._onLatestBlock = async (newBlockNumberHex) => {
      const selectedAddress = this.preferencesController.getSelectedAddress();
      const newBlockNumberDec = parseInt(newBlockNumberHex, 16);
      await this._update(selectedAddress, newBlockNumberDec);
    };

    const initState = {
      externalTransactions: {},
      externalTxLastFetchedBlockByChainId: {
        [GOERLI_CHAIN_ID]: null,
        [KOVAN_CHAIN_ID]: null,
        [MAINNET_CHAIN_ID]: null,
        [RINKEBY_CHAIN_ID]: null,
        [ROPSTEN_CHAIN_ID]: null,
      },
      ...opts.initState,
    };
    this.store = new ObservableStore(initState);

    this.preferencesController.store.subscribe(
      previousValueComparator((prevState, currState) => {
        const {
          featureFlags: {
            showExternalTransactions: prevShowExternalTransactions,
          } = {},
        } = prevState;
        const {
          featureFlags: {
            showExternalTransactions: currShowExternalTransactions,
          } = {},
        } = currState;

        if (currShowExternalTransactions === prevShowExternalTransactions) {
          return;
        }

        if (prevShowExternalTransactions && !currShowExternalTransactions) {
          this.stop();
          return;
        }

        this.start();
      }, this.preferencesController.store.getState()),
    );

    this.preferencesController.store.subscribe(
      previousValueComparator(async (prevState, currState) => {
        const { selectedAddress: prevSelectedAddress } = prevState;
        const { selectedAddress: currSelectedAddress } = currState;

        if (currSelectedAddress === prevSelectedAddress) {
          return;
        }
        await this._update(currSelectedAddress);
      }, this.preferencesController.store.getState()),
    );

    onNetworkDidChange(async () => {
      const address = this.preferencesController.getSelectedAddress();
      await this._update(address);
    });
  }

  start() {
    const { featureFlags = {} } = this.preferencesController.store.getState();
    const { showExternalTransactions } = featureFlags;

    if (!showExternalTransactions) {
      return;
    }

    this.blockTracker.removeListener('latest', this._onLatestBlock);
    this.blockTracker.addListener('latest', this._onLatestBlock);
  }

  stop() {
    this.blockTracker.removeListener('latest', this._onLatestBlock);
  }

  /**
   * Determines the correct block number to begin looking for new transactions
   * from, fetches the transactions and then saves them and the next block
   * number to begin fetching from in state. Block numbers and transactions are
   * stored per chainId.
   * @private
   * @param {string} address - address to lookup transactions for
   * @param {number} [newBlockNumberDec] - block number to begin fetching from
   * @returns {void}
   */
  async _update(address, newBlockNumberDec) {
    const chainId = this.getCurrentChainId();
    if (!etherscanSupportedNetworks.includes(chainId) || !address) {
      return;
    }
    try {
      const currentState = this.store.getState();
      const currentBlock = parseInt(this.blockTracker.getCurrentBlock(), 16);

      const mostRecentlyFetchedBlock =
        currentState.externalTxLastFetchedBlockByChainId[chainId];
      const blockToFetchFrom =
        mostRecentlyFetchedBlock ?? newBlockNumberDec ?? currentBlock;

      const newExternalTxs = await this._getNewExternalTransactions(
        address,
        blockToFetchFrom,
        chainId,
      );

      let newMostRecentlyFetchedBlock = blockToFetchFrom;

      newExternalTxs.forEach((tx) => {
        if (
          tx.blockNumber &&
          parseInt(newMostRecentlyFetchedBlock, 10) <
            parseInt(tx.blockNumber, 10)
        ) {
          newMostRecentlyFetchedBlock = parseInt(tx.blockNumber, 10);
        }
      });

      this.store.updateState({
        externalTxLastFetchedBlockByChainId: {
          ...currentState.externalTxLastFetchedBlockByChainId,
          [chainId]: newMostRecentlyFetchedBlock + 1,
        },
        externalTransactions: newExternalTxs.reduce(
          (transactions, tx) => {
            transactions[tx.hash] = tx;
            return transactions;
          },
          {
            ...currentState.externalTransactions,
          },
        ),
      });
    } catch (err) {
      log.error(err);
    }
  }

  /**
   * fetches transactions for the given address and chain, via etherscan, then
   * processes the data into the necessary shape for usage in this controller.
   *
   * @private
   * @param {string} [address] - Address to fetch transactions for
   * @param {number} [fromBlock] - Block to look for transactions at
   * @param {string} [chainId] - The chainId for the current network
   * @returns {TransactionMeta[]}
   */
  async _getNewExternalTransactions(address, fromBlock, chainId) {
    const etherscanSubdomain =
      chainId === MAINNET_CHAIN_ID
        ? 'api'
        : `api-${CHAIN_ID_TO_TYPE_MAP[chainId]}`;

    const apiUrl = `https://${etherscanSubdomain}.etherscan.io`;
    let url = `${apiUrl}/api?module=account&action=txlist&address=${address}&tag=latest&page=1`;

    if (fromBlock) {
      url += `&startBlock=${parseInt(fromBlock, 10)}`;
    }
    const response = await fetchWithTimeout(url);
    const { status, result } = await response.json();
    const newExternalTxs = [];
    if (status === '1' && Array.isArray(result) && result.length > 0) {
      const externalTxList = {};
      result.forEach((tx) => {
        if (!externalTxList[tx.hash]) {
          newExternalTxs.push(
            this._normalizeTxFromEtherscan(tx, chainId, address),
          );
          externalTxList[tx.hash] = 1;
        }
      });

      newExternalTxs.sort((a, b) => (a.time < b.time ? -1 : 1));
    }
    return newExternalTxs;
  }

  /**
   * Transmutes a EtherscanTransaction into a TransactionMeta
   * @param {EtherscanTransaction} etherscanTransaction - the transaction to normalize
   * @param {string} chainId - The chainId of the current network
   * @param {string} address - Selected address
   * @returns {TransactionMeta}
   */
  _normalizeTxFromEtherscan(etherscanTransaction, chainId, address) {
    const time = parseInt(etherscanTransaction.timeStamp, 10) * 1000;
    const status =
      etherscanTransaction.isError === '0'
        ? TRANSACTION_STATUSES.CONFIRMED
        : TRANSACTION_STATUSES.FAILED;
    return {
      blockNumber: etherscanTransaction.blockNumber,
      id: createId(),
      chainId,
      metamaskNetworkId: CHAIN_ID_TO_NETWORK_ID_MAP[chainId],
      status,
      time,
      txParams: {
        from: etherscanTransaction.from,
        gas: bnToHex(new BN(etherscanTransaction.gas)),
        gasPrice: bnToHex(new BN(etherscanTransaction.gasPrice)),
        nonce: bnToHex(new BN(etherscanTransaction.nonce)),
        to: etherscanTransaction.to,
        value: bnToHex(new BN(etherscanTransaction.value)),
      },
      hash: etherscanTransaction.hash,
      type:
        etherscanTransaction.from.toLowerCase() === address?.toLowerCase()
          ? TRANSACTION_TYPES.SENT
          : TRANSACTION_TYPES.INCOMING,
    };
  }
}

/**
 * Returns a function with arity 1 that caches the argument that the function
 * is called with and invokes the comparator with both the cached, previous,
 * value and the current value. If specified, the initialValue will be passed
 * in as the previous value on the first invocation of the returned method.
 * @template A
 * @params {A=} type of compared value
 * @param {(prevValue: A, nextValue: A) => void} comparator - method to compare
 *  previous and next values.
 * @param {A} [initialValue] - initial value to supply to prevValue
 *  on first call of the method.
 * @returns {void}
 */
function previousValueComparator(comparator, initialValue) {
  let first = true;
  let cache;
  return (value) => {
    try {
      if (first) {
        first = false;
        return comparator(initialValue ?? value, value);
      }
      return comparator(cache, value);
    } finally {
      cache = value;
    }
  };
}
