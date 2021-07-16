import { strict as assert } from 'assert';
import EventEmitter from 'events';
import { ComposedStore, ObservableStore } from '@metamask/obs-store';
import { JsonRpcEngine } from 'json-rpc-engine';
import providerFromEngine from 'eth-json-rpc-middleware/providerFromEngine';
import log from 'loglevel';
import {
  createSwappableProxy,
  createEventEmitterProxy,
} from 'swappable-obj-proxy';
import EthQuery from 'eth-query';
import {
  RINKEBY,
  MAINNET,
  INFURA_PROVIDER_TYPES,
  NETWORK_TYPE_RPC,
  NETWORK_TYPE_TO_ID_MAP,
  MAINNET_CHAIN_ID,
  RINKEBY_CHAIN_ID,
  INFURA_BLOCKED_KEY,
} from '../../../../shared/constants/network';
import { SECOND } from '../../../../shared/constants/time';
import {
  isPrefixedFormattedHexString,
  isSafeChainId,
} from '../../../../shared/modules/network.utils';
import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';
import createMetamaskMiddleware from './createMetamaskMiddleware';
import createInfuraClient from './createInfuraClient';
import createJsonRpcClient from './createJsonRpcClient';

const env = process.env.METAMASK_ENV;
const fetchWithTimeout = getFetchWithTimeout(SECOND * 30);

let defaultProviderConfigOpts;
if (process.env.IN_TEST === 'true') {
  defaultProviderConfigOpts = {
    type: NETWORK_TYPE_RPC,
    rpcUrl: 'http://localhost:8545',
    chainId: '0x539',
    nickname: 'Localhost 8545',
  };
} else if (process.env.METAMASK_DEBUG || env === 'test') {
  defaultProviderConfigOpts = { type: RINKEBY, chainId: RINKEBY_CHAIN_ID };
} else {
  defaultProviderConfigOpts = { type: MAINNET, chainId: MAINNET_CHAIN_ID };
}

const defaultProviderConfig = {
  ticker: 'ETH',
  ...defaultProviderConfigOpts,
};

const defaultNetworkDetailsState = {
  EIPS: { 1559: undefined },
};

export const NETWORK_EVENTS = {
  // Fired after the actively selected network is changed
  NETWORK_DID_CHANGE: 'networkDidChange',
  // Fired when the actively selected network *will* change
  NETWORK_WILL_CHANGE: 'networkWillChange',
  // Fired when Infura returns an error indicating no support
  INFURA_IS_BLOCKED: 'infuraIsBlocked',
  // Fired when not using an Infura network or when Infura returns no error, indicating support
  INFURA_IS_UNBLOCKED: 'infuraIsUnblocked',
};

export default class NetworkController extends EventEmitter {
  constructor(opts = {}) {
    super();

    // create stores
    this.providerStore = new ObservableStore(
      opts.provider || { ...defaultProviderConfig },
    );
    this.previousProviderStore = new ObservableStore(
      this.providerStore.getState(),
    );
    this.networkStore = new ObservableStore('loading');
    // We need to keep track of a few details about the current network
    // Ideally we'd merge this.networkStore with this new store, but doing so
    // will require a decent sized refactor of how we're accessing network
    // state. Currently this is only used for detecting EIP 1559 support but
    // can be extended to track other network details.
    this.networkDetails = new ObservableStore(
      opts.networkDetails || {
        ...defaultNetworkDetailsState,
      },
    );
    this.store = new ComposedStore({
      provider: this.providerStore,
      previousProviderStore: this.previousProviderStore,
      network: this.networkStore,
      networkDetails: this.networkDetails,
    });

    // provider and block tracker
    this._provider = null;
    this._blockTracker = null;

    // provider and block tracker proxies - because the network changes
    this._providerProxy = null;
    this._blockTrackerProxy = null;

    this.on(NETWORK_EVENTS.NETWORK_DID_CHANGE, this.lookupNetwork);
  }

  /**
   * Sets the Infura project ID
   *
   * @param {string} projectId - The Infura project ID
   * @throws {Error} if the project ID is not a valid string
   * @return {void}
   */
  setInfuraProjectId(projectId) {
    if (!projectId || typeof projectId !== 'string') {
      throw new Error('Invalid Infura project ID');
    }

    this._infuraProjectId = projectId;
  }

  initializeProvider(providerParams) {
    this._baseProviderParams = providerParams;
    const { type, rpcUrl, chainId } = this.getProviderConfig();
    this._configureProvider({ type, rpcUrl, chainId });
    this.lookupNetwork();
  }

  // return the proxies so the references will always be good
  getProviderAndBlockTracker() {
    const provider = this._providerProxy;
    const blockTracker = this._blockTrackerProxy;
    return { provider, blockTracker };
  }

  /**
   * Method to return the latest block for the current network
   * @returns {Object} Block header
   */
  getLatestBlock() {
    return new Promise((resolve, reject) => {
      const { provider } = this.getProviderAndBlockTracker();
      const ethQuery = new EthQuery(provider);
      ethQuery.sendAsync(
        { method: 'eth_getBlockByNumber', params: ['latest', false] },
        (err, block) => {
          if (err) {
            return reject(err);
          }
          return resolve(block);
        },
      );
    });
  }

  /**
   * Method to check if the block header contains fields that indicate EIP 1559
   * support (baseFeePerGas).
   * @returns {Promise<boolean>} true if current network supports EIP 1559
   */
  async getEIP1559Compatibility() {
    const { EIPS } = this.networkDetails.getState();
    if (EIPS[1559] !== undefined) {
      return EIPS[1559];
    }
    const latestBlock = await this.getLatestBlock();
    const supportsEIP1559 =
      latestBlock && latestBlock.baseFeePerGas !== undefined;
    this.setNetworkEIPSupport(1559, supportsEIP1559);
    return supportsEIP1559;
  }

  verifyNetwork() {
    // Check network when restoring connectivity:
    if (this.isNetworkLoading()) {
      this.lookupNetwork();
    }
  }

  getNetworkState() {
    return this.networkStore.getState();
  }

  setNetworkState(network) {
    this.networkStore.putState(network);
  }

  /**
   * Set EIP support indication in the networkDetails store
   * @param {number} EIPNumber - The number of the EIP to mark support for
   * @param {boolean} isSupported - True if the EIP is supported
   */
  setNetworkEIPSupport(EIPNumber, isSupported) {
    this.networkDetails.updateState({
      EIPS: {
        [EIPNumber]: isSupported,
      },
    });
  }

  /**
   * Reset EIP support to default (no support)
   */
  clearNetworkDetails() {
    this.networkDetails.putState({ ...defaultNetworkDetailsState });
  }

  isNetworkLoading() {
    return this.getNetworkState() === 'loading';
  }

  lookupNetwork() {
    // Prevent firing when provider is not defined.
    if (!this._provider) {
      log.warn(
        'NetworkController - lookupNetwork aborted due to missing provider',
      );
      return;
    }

    const chainId = this.getCurrentChainId();
    if (!chainId) {
      log.warn(
        'NetworkController - lookupNetwork aborted due to missing chainId',
      );
      this.setNetworkState('loading');
      // keep network details in sync with network state
      this.clearNetworkDetails();
      return;
    }

    // Ping the RPC endpoint so we can confirm that it works
    const ethQuery = new EthQuery(this._provider);
    const initialNetwork = this.getNetworkState();
    const { type } = this.getProviderConfig();
    const isInfura = INFURA_PROVIDER_TYPES.includes(type);

    if (isInfura) {
      this._checkInfuraAvailability(type);
    } else {
      this.emit(NETWORK_EVENTS.INFURA_IS_UNBLOCKED);
    }

    ethQuery.sendAsync({ method: 'net_version' }, (err, networkVersion) => {
      const currentNetwork = this.getNetworkState();
      if (initialNetwork === currentNetwork) {
        if (err) {
          this.setNetworkState('loading');
          // keep network details in sync with network state
          this.clearNetworkDetails();
          return;
        }

        this.setNetworkState(networkVersion);
        // look up EIP-1559 support
        this.getEIP1559Compatibility();
      }
    });
  }

  getCurrentChainId() {
    const { type, chainId: configChainId } = this.getProviderConfig();
    return NETWORK_TYPE_TO_ID_MAP[type]?.chainId || configChainId;
  }

  setRpcTarget(rpcUrl, chainId, ticker = 'ETH', nickname = '', rpcPrefs) {
    assert.ok(
      isPrefixedFormattedHexString(chainId),
      `Invalid chain ID "${chainId}": invalid hex string.`,
    );
    assert.ok(
      isSafeChainId(parseInt(chainId, 16)),
      `Invalid chain ID "${chainId}": numerical value greater than max safe value.`,
    );
    this.setProviderConfig({
      type: NETWORK_TYPE_RPC,
      rpcUrl,
      chainId,
      ticker,
      nickname,
      rpcPrefs,
    });
  }

  async setProviderType(type) {
    assert.notStrictEqual(
      type,
      NETWORK_TYPE_RPC,
      `NetworkController - cannot call "setProviderType" with type "${NETWORK_TYPE_RPC}". Use "setRpcTarget"`,
    );
    assert.ok(
      INFURA_PROVIDER_TYPES.includes(type),
      `Unknown Infura provider type "${type}".`,
    );
    const { chainId } = NETWORK_TYPE_TO_ID_MAP[type];
    this.setProviderConfig({
      type,
      rpcUrl: '',
      chainId,
      ticker: 'ETH',
      nickname: '',
    });
  }

  resetConnection() {
    this.setProviderConfig(this.getProviderConfig());
  }

  /**
   * Sets the provider config and switches the network.
   */
  setProviderConfig(config) {
    this.previousProviderStore.updateState(this.getProviderConfig());
    this.providerStore.updateState(config);
    this._switchNetwork(config);
  }

  rollbackToPreviousProvider() {
    const config = this.previousProviderStore.getState();
    this.providerStore.updateState(config);
    this._switchNetwork(config);
  }

  getProviderConfig() {
    return this.providerStore.getState();
  }

  getNetworkIdentifier() {
    const provider = this.providerStore.getState();
    return provider.type === NETWORK_TYPE_RPC ? provider.rpcUrl : provider.type;
  }

  //
  // Private
  //

  async _checkInfuraAvailability(network) {
    const rpcUrl = `https://${network}.infura.io/v3/${this._infuraProjectId}`;

    let networkChanged = false;
    this.once(NETWORK_EVENTS.NETWORK_DID_CHANGE, () => {
      networkChanged = true;
    });

    try {
      const response = await fetchWithTimeout(rpcUrl, {
        method: 'POST',
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        }),
      });

      if (networkChanged) {
        return;
      }

      if (response.ok) {
        this.emit(NETWORK_EVENTS.INFURA_IS_UNBLOCKED);
      } else {
        const responseMessage = await response.json();
        if (networkChanged) {
          return;
        }
        if (responseMessage.error === INFURA_BLOCKED_KEY) {
          this.emit(NETWORK_EVENTS.INFURA_IS_BLOCKED);
        }
      }
    } catch (err) {
      log.warn(`MetaMask - Infura availability check failed`, err);
    }
  }

  _switchNetwork(opts) {
    // Indicate to subscribers that network is about to change
    this.emit(NETWORK_EVENTS.NETWORK_WILL_CHANGE);
    // Set loading state
    this.setNetworkState('loading');
    // Reset network details
    this.clearNetworkDetails();
    // Configure the provider appropriately
    this._configureProvider(opts);
    // Notify subscribers that network has changed
    this.emit(NETWORK_EVENTS.NETWORK_DID_CHANGE, opts.type);
  }

  _configureProvider({ type, rpcUrl, chainId }) {
    // infura type-based endpoints
    const isInfura = INFURA_PROVIDER_TYPES.includes(type);
    if (isInfura) {
      this._configureInfuraProvider(type, this._infuraProjectId);
      // url-based rpc endpoints
    } else if (type === NETWORK_TYPE_RPC) {
      this._configureStandardProvider(rpcUrl, chainId);
    } else {
      throw new Error(
        `NetworkController - _configureProvider - unknown type "${type}"`,
      );
    }
  }

  _configureInfuraProvider(type, projectId) {
    log.info('NetworkController - configureInfuraProvider', type);
    const networkClient = createInfuraClient({
      network: type,
      projectId,
    });
    this._setNetworkClient(networkClient);
  }

  _configureStandardProvider(rpcUrl, chainId) {
    log.info('NetworkController - configureStandardProvider', rpcUrl);
    const networkClient = createJsonRpcClient({ rpcUrl, chainId });
    this._setNetworkClient(networkClient);
  }

  _setNetworkClient({ networkMiddleware, blockTracker }) {
    const metamaskMiddleware = createMetamaskMiddleware(
      this._baseProviderParams,
    );
    const engine = new JsonRpcEngine();
    engine.push(metamaskMiddleware);
    engine.push(networkMiddleware);
    const provider = providerFromEngine(engine);
    this._setProviderAndBlockTracker({ provider, blockTracker });
  }

  _setProviderAndBlockTracker({ provider, blockTracker }) {
    // update or intialize proxies
    if (this._providerProxy) {
      this._providerProxy.setTarget(provider);
    } else {
      this._providerProxy = createSwappableProxy(provider);
    }
    if (this._blockTrackerProxy) {
      this._blockTrackerProxy.setTarget(blockTracker);
    } else {
      this._blockTrackerProxy = createEventEmitterProxy(blockTracker, {
        eventFilter: 'skipInternal',
      });
    }
    // set new provider and blockTracker
    this._provider = provider;
    this._blockTracker = blockTracker;
  }
}
