import assert from 'assert';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
import nock from 'nock';
import { cloneDeep } from 'lodash';

import waitUntilCalled from '../../../test/lib/wait-until-called';
import {
  CHAIN_ID_TO_TYPE_MAP,
  GOERLI_CHAIN_ID,
  KOVAN_CHAIN_ID,
  MAINNET_CHAIN_ID,
  RINKEBY_CHAIN_ID,
  ROPSTEN_CHAIN_ID,
  ROPSTEN_NETWORK_ID,
  ROPSTEN,
} from '../../../shared/constants/network';
import {
  TRANSACTION_TYPES,
  TRANSACTION_STATUSES,
} from '../../../shared/constants/transaction';

const ExternalTransactionsController = proxyquire('./external-transactions', {
  '../../../shared/modules/random-id': { default: () => 54321 },
}).default;

const FAKE_CHAIN_ID = '0x1338';
const MOCK_SELECTED_ADDRESS = '0x0101';
const SET_STATE_TIMEOUT = 10;

const EXISTING_INCOMING_TX = { id: 777, hash: '0x123456' };
const PREPOPULATED_INCOMING_TXS_BY_HASH = {
  [EXISTING_INCOMING_TX.hash]: EXISTING_INCOMING_TX,
};
const PREPOPULATED_BLOCKS_BY_NETWORK = {
  [GOERLI_CHAIN_ID]: 1,
  [KOVAN_CHAIN_ID]: 2,
  [MAINNET_CHAIN_ID]: 3,
  [RINKEBY_CHAIN_ID]: 5,
  [ROPSTEN_CHAIN_ID]: 4,
};
const EMPTY_BLOCKS_BY_NETWORK = {
  [GOERLI_CHAIN_ID]: null,
  [KOVAN_CHAIN_ID]: null,
  [MAINNET_CHAIN_ID]: null,
  [RINKEBY_CHAIN_ID]: null,
  [ROPSTEN_CHAIN_ID]: null,
};

function getEmptyInitState() {
  return {
    externalTransactions: {},
    externalTxLastFetchedBlockByChainId: EMPTY_BLOCKS_BY_NETWORK,
  };
}

function getNonEmptyInitState() {
  return {
    externalTransactions: PREPOPULATED_INCOMING_TXS_BY_HASH,
    externalTxLastFetchedBlockByChainId: PREPOPULATED_BLOCKS_BY_NETWORK,
  };
}

function getMockNetworkControllerMethods(chainId = FAKE_CHAIN_ID) {
  return {
    getCurrentChainId: () => chainId,
    onNetworkDidChange: sinon.spy(),
  };
}

function getMockPreferencesController({
  showExternalTransactions = true,
} = {}) {
  return {
    getSelectedAddress: sinon.stub().returns(MOCK_SELECTED_ADDRESS),
    store: {
      getState: sinon.stub().returns({
        featureFlags: {
          showExternalTransactions,
        },
      }),
      subscribe: sinon.spy(),
    },
  };
}

function getMockBlockTracker() {
  return {
    addListener: sinon.stub().callsArgWithAsync(1, '0xa'),
    removeListener: sinon.spy(),
    testProperty: 'fakeBlockTracker',
    getCurrentBlock: () => '0xa',
  };
}

/**
 * @typedef {import(
 *  '../../../../app/scripts/controllers/external-transactions'
 * ).EtherscanTransaction} EtherscanTransaction
 */

/**
 * Returns a transaction object matching the expected format returned
 * by the Etherscan API
 *
 * @param {string} [toAddress] - The hex-prefixed address of the recipient
 * @param {number} [blockNumber] - The block number for the transaction
 *  @returns {EtherscanTransaction}
 */
const getFakeEtherscanTransaction = (
  toAddress = MOCK_SELECTED_ADDRESS,
  blockNumber = 10,
) => {
  return {
    blockNumber: blockNumber.toString(),
    from: '0xfake',
    gas: '0',
    gasPrice: '0',
    hash: '0xfake',
    isError: '0',
    nonce: '100',
    timeStamp: '16000000000000',
    to: toAddress,
    value: '0',
  };
};

/**
 * Returns a transaction object matching the expected format returned
 * by the Etherscan API
 *
 * @param {string} [fromAddress] - The hex-prefixed address of the sender
 * @param {number} [blockNumber] - The block number for the transaction
 *  @returns {EtherscanTransaction}
 */
const getFakeEtherscanSendTransaction = (
  fromAddress = MOCK_SELECTED_ADDRESS,
  blockNumber = 10,
) => {
  return {
    blockNumber: blockNumber.toString(),
    from: fromAddress,
    gas: '0',
    gasPrice: '0',
    hash: '0xfakeSend',
    isError: '0',
    nonce: '100',
    timeStamp: '16000000000000',
    to: '0xfake',
    value: '0',
  };
};

function nockEtherscanApiForAllChains(mockResponse) {
  for (const chainId of [
    GOERLI_CHAIN_ID,
    KOVAN_CHAIN_ID,
    MAINNET_CHAIN_ID,
    RINKEBY_CHAIN_ID,
    ROPSTEN_CHAIN_ID,
    'undefined',
  ]) {
    nock(
      `https://api${
        chainId === MAINNET_CHAIN_ID ? '' : `-${CHAIN_ID_TO_TYPE_MAP[chainId]}`
      }.etherscan.io`,
    )
      .get(/api.+/u)
      .reply(200, JSON.stringify(mockResponse));
  }
}

describe('ExternalTransactionsController', function () {
  afterEach(function () {
    sinon.restore();
    nock.cleanAll();
  });

  describe('constructor', function () {
    it('should set up correct store, listeners and properties in the constructor', function () {
      const mockedNetworkMethods = getMockNetworkControllerMethods();
      const externalTransactionsController = new ExternalTransactionsController(
        {
          blockTracker: getMockBlockTracker(),
          ...mockedNetworkMethods,
          preferencesController: getMockPreferencesController(),
          initState: {},
        },
      );
      sinon.spy(externalTransactionsController, '_update');

      assert.deepStrictEqual(
        externalTransactionsController.store.getState(),
        getEmptyInitState(),
      );

      assert(mockedNetworkMethods.onNetworkDidChange.calledOnce);
      const networkControllerListenerCallback = mockedNetworkMethods.onNetworkDidChange.getCall(
        0,
      ).args[0];
      assert.strictEqual(externalTransactionsController._update.callCount, 0);
      networkControllerListenerCallback('testNetworkType');
      assert.strictEqual(externalTransactionsController._update.callCount, 1);
      assert.deepStrictEqual(
        externalTransactionsController._update.getCall(0).args[0],
        '0x0101',
      );

      externalTransactionsController._update.resetHistory();
    });

    it('should set the store to a provided initial state', function () {
      const externalTransactionsController = new ExternalTransactionsController(
        {
          blockTracker: getMockBlockTracker(),
          ...getMockNetworkControllerMethods(),
          preferencesController: getMockPreferencesController(),
          initState: getNonEmptyInitState(),
        },
      );

      assert.deepStrictEqual(
        externalTransactionsController.store.getState(),
        getNonEmptyInitState(),
      );
    });
  });

  describe('update events', function () {
    it('should set up a listener for the latest block', async function () {
      const externalTransactionsController = new ExternalTransactionsController(
        {
          blockTracker: getMockBlockTracker(),
          ...getMockNetworkControllerMethods(),
          preferencesController: getMockPreferencesController(),
          initState: {},
        },
      );

      externalTransactionsController.start();

      assert(
        externalTransactionsController.blockTracker.addListener.calledOnce,
      );
      assert.strictEqual(
        externalTransactionsController.blockTracker.addListener.getCall(0)
          .args[0],
        'latest',
      );
    });

    it('should update upon latest block when started and on supported network', async function () {
      const externalTransactionsController = new ExternalTransactionsController(
        {
          blockTracker: getMockBlockTracker(),
          ...getMockNetworkControllerMethods(ROPSTEN_CHAIN_ID),
          preferencesController: getMockPreferencesController(),
          initState: getNonEmptyInitState(),
        },
      );
      const startBlock = getNonEmptyInitState()
        .externalTxLastFetchedBlockByChainId[ROPSTEN_CHAIN_ID];
      nock('https://api-ropsten.etherscan.io')
        .get(
          `/api?module=account&action=txlist&address=${MOCK_SELECTED_ADDRESS}&tag=latest&page=1&startBlock=${startBlock}`,
        )
        .reply(
          200,
          JSON.stringify({
            status: '1',
            result: [getFakeEtherscanTransaction()],
          }),
        );
      const updateStateStub = sinon.stub(
        externalTransactionsController.store,
        'updateState',
      );
      const updateStateCalled = waitUntilCalled(
        updateStateStub,
        externalTransactionsController.store,
      );

      externalTransactionsController.start();
      await updateStateCalled();

      const actualState = externalTransactionsController.store.getState();
      const generatedTxId = actualState?.externalTransactions?.['0xfake']?.id;

      const actualStateWithoutGenerated = cloneDeep(actualState);
      delete actualStateWithoutGenerated?.externalTransactions?.['0xfake']?.id;

      assert.ok(
        typeof generatedTxId === 'number' && generatedTxId > 0,
        'Generated transaction ID should be a positive number',
      );
      assert.deepStrictEqual(
        actualStateWithoutGenerated,
        {
          externalTransactions: {
            ...getNonEmptyInitState().externalTransactions,
            '0xfake': {
              blockNumber: '10',
              hash: '0xfake',
              metamaskNetworkId: ROPSTEN_NETWORK_ID,
              chainId: ROPSTEN_CHAIN_ID,
              status: TRANSACTION_STATUSES.CONFIRMED,
              time: 16000000000000000,
              type: TRANSACTION_TYPES.INCOMING,
              txParams: {
                from: '0xfake',
                gas: '0x0',
                gasPrice: '0x0',
                nonce: '0x64',
                to: '0x0101',
                value: '0x0',
              },
            },
          },
          externalTxLastFetchedBlockByChainId: {
            ...getNonEmptyInitState().externalTxLastFetchedBlockByChainId,
            [ROPSTEN_CHAIN_ID]: 11,
          },
        },
        'State should have been updated after first block was received',
      );
    });

    it('should not update upon latest block when started and not on supported network', async function () {
      const externalTransactionsController = new ExternalTransactionsController(
        {
          blockTracker: getMockBlockTracker(),
          ...getMockNetworkControllerMethods(),
          preferencesController: getMockPreferencesController(),
          initState: getNonEmptyInitState(),
        },
      );
      // reply with a valid request for any supported network, so that this test has every opportunity to fail
      nockEtherscanApiForAllChains({
        status: '1',
        result: [getFakeEtherscanTransaction()],
      });

      const updateStateStub = sinon.stub(
        externalTransactionsController.store,
        'updateState',
      );
      const updateStateCalled = waitUntilCalled(
        updateStateStub,
        externalTransactionsController.store,
      );
      const putStateStub = sinon.stub(
        externalTransactionsController.store,
        'putState',
      );
      const putStateCalled = waitUntilCalled(
        putStateStub,
        externalTransactionsController.store,
      );

      externalTransactionsController.start();

      try {
        await Promise.race([
          updateStateCalled(),
          putStateCalled(),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('TIMEOUT')), SET_STATE_TIMEOUT);
          }),
        ]);
        assert.fail('Update state should not have been called');
      } catch (error) {
        assert(error.message === 'TIMEOUT', 'TIMEOUT error should be thrown');
      }
    });

    it('should not update upon latest block when started and external transactions disabled', async function () {
      const externalTransactionsController = new ExternalTransactionsController(
        {
          blockTracker: getMockBlockTracker(),
          ...getMockNetworkControllerMethods(),
          preferencesController: getMockPreferencesController({
            showExternalTransactions: false,
          }),
          initState: getNonEmptyInitState(),
        },
      );
      // reply with a valid request for any supported network, so that this test has every opportunity to fail
      nockEtherscanApiForAllChains({
        status: '1',
        result: [getFakeEtherscanTransaction()],
      });
      const updateStateStub = sinon.stub(
        externalTransactionsController.store,
        'updateState',
      );
      const updateStateCalled = waitUntilCalled(
        updateStateStub,
        externalTransactionsController.store,
      );
      const putStateStub = sinon.stub(
        externalTransactionsController.store,
        'putState',
      );
      const putStateCalled = waitUntilCalled(
        putStateStub,
        externalTransactionsController.store,
      );

      externalTransactionsController.start();

      try {
        await Promise.race([
          updateStateCalled(),
          putStateCalled(),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('TIMEOUT')), SET_STATE_TIMEOUT);
          }),
        ]);
        assert.fail('Update state should not have been called');
      } catch (error) {
        assert(error.message === 'TIMEOUT', 'TIMEOUT error should be thrown');
      }
    });

    it('should not update upon latest block when not started', async function () {
      const externalTransactionsController = new ExternalTransactionsController(
        {
          blockTracker: getMockBlockTracker(),
          ...getMockNetworkControllerMethods(ROPSTEN_CHAIN_ID),
          preferencesController: getMockPreferencesController(),
          initState: getNonEmptyInitState(),
        },
      );
      // reply with a valid request for any supported network, so that this test has every opportunity to fail
      nockEtherscanApiForAllChains({
        status: '1',
        result: [getFakeEtherscanTransaction()],
      });
      const updateStateStub = sinon.stub(
        externalTransactionsController.store,
        'updateState',
      );
      const updateStateCalled = waitUntilCalled(
        updateStateStub,
        externalTransactionsController.store,
      );
      const putStateStub = sinon.stub(
        externalTransactionsController.store,
        'putState',
      );
      const putStateCalled = waitUntilCalled(
        putStateStub,
        externalTransactionsController.store,
      );

      try {
        await Promise.race([
          updateStateCalled(),
          putStateCalled(),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('TIMEOUT')), SET_STATE_TIMEOUT);
          }),
        ]);
        assert.fail('Update state should not have been called');
      } catch (error) {
        assert(error.message === 'TIMEOUT', 'TIMEOUT error should be thrown');
      }
    });

    it('should not update upon latest block when stopped', async function () {
      const externalTransactionsController = new ExternalTransactionsController(
        {
          blockTracker: getMockBlockTracker(),
          ...getMockNetworkControllerMethods(ROPSTEN_CHAIN_ID),
          preferencesController: getMockPreferencesController(),
          initState: getNonEmptyInitState(),
        },
      );
      // reply with a valid request for any supported network, so that this test has every opportunity to fail
      nockEtherscanApiForAllChains({
        status: '1',
        result: [getFakeEtherscanTransaction()],
      });
      const updateStateStub = sinon.stub(
        externalTransactionsController.store,
        'updateState',
      );
      const updateStateCalled = waitUntilCalled(
        updateStateStub,
        externalTransactionsController.store,
      );
      const putStateStub = sinon.stub(
        externalTransactionsController.store,
        'putState',
      );
      const putStateCalled = waitUntilCalled(
        putStateStub,
        externalTransactionsController.store,
      );

      externalTransactionsController.stop();

      try {
        await Promise.race([
          updateStateCalled(),
          putStateCalled(),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('TIMEOUT')), SET_STATE_TIMEOUT);
          }),
        ]);
        assert.fail('Update state should not have been called');
      } catch (error) {
        assert(error.message === 'TIMEOUT', 'TIMEOUT error should be thrown');
      }
    });

    it('should update when the selected address changes and on supported network', async function () {
      const externalTransactionsController = new ExternalTransactionsController(
        {
          blockTracker: getMockBlockTracker(),
          ...getMockNetworkControllerMethods(ROPSTEN_CHAIN_ID),
          preferencesController: getMockPreferencesController(),
          initState: getNonEmptyInitState(),
        },
      );
      const NEW_MOCK_SELECTED_ADDRESS = `${MOCK_SELECTED_ADDRESS}9`;
      const startBlock = getNonEmptyInitState()
        .externalTxLastFetchedBlockByChainId[ROPSTEN_CHAIN_ID];
      nock('https://api-ropsten.etherscan.io')
        .get(
          `/api?module=account&action=txlist&address=${NEW_MOCK_SELECTED_ADDRESS}&tag=latest&page=1&startBlock=${startBlock}`,
        )
        .reply(
          200,
          JSON.stringify({
            status: '1',
            result: [getFakeEtherscanTransaction(NEW_MOCK_SELECTED_ADDRESS)],
          }),
        );
      const updateStateStub = sinon.stub(
        externalTransactionsController.store,
        'updateState',
      );
      const updateStateCalled = waitUntilCalled(
        updateStateStub,
        externalTransactionsController.store,
      );

      const subscription = externalTransactionsController.preferencesController.store.subscribe.getCall(
        1,
      ).args[0];
      // The external transactions controller will always skip the first event
      // We need to call subscription twice to test the event handling
      // TODO: stop skipping the first event
      await subscription({ selectedAddress: MOCK_SELECTED_ADDRESS });
      await subscription({ selectedAddress: NEW_MOCK_SELECTED_ADDRESS });
      await updateStateCalled();

      const actualState = externalTransactionsController.store.getState();
      const generatedTxId = actualState?.externalTransactions?.['0xfake']?.id;

      const actualStateWithoutGenerated = cloneDeep(actualState);
      delete actualStateWithoutGenerated?.externalTransactions?.['0xfake']?.id;

      assert.ok(
        typeof generatedTxId === 'number' && generatedTxId > 0,
        'Generated transaction ID should be a positive number',
      );
      assert.deepStrictEqual(
        actualStateWithoutGenerated,
        {
          externalTransactions: {
            ...getNonEmptyInitState().externalTransactions,
            '0xfake': {
              blockNumber: '10',
              hash: '0xfake',
              metamaskNetworkId: ROPSTEN_NETWORK_ID,
              chainId: ROPSTEN_CHAIN_ID,
              status: TRANSACTION_STATUSES.CONFIRMED,
              time: 16000000000000000,
              type: TRANSACTION_TYPES.INCOMING,
              txParams: {
                from: '0xfake',
                gas: '0x0',
                gasPrice: '0x0',
                nonce: '0x64',
                to: '0x01019',
                value: '0x0',
              },
            },
          },
          externalTxLastFetchedBlockByChainId: {
            ...getNonEmptyInitState().externalTxLastFetchedBlockByChainId,
            [ROPSTEN_CHAIN_ID]: 11,
          },
        },
        'State should have been updated after first block was received',
      );
    });

    it('should not update when the selected address changes and not on supported network', async function () {
      const externalTransactionsController = new ExternalTransactionsController(
        {
          blockTracker: { ...getMockBlockTracker() },
          ...getMockNetworkControllerMethods(),
          preferencesController: getMockPreferencesController(),
          initState: getNonEmptyInitState(),
        },
      );
      const NEW_MOCK_SELECTED_ADDRESS = `${MOCK_SELECTED_ADDRESS}9`;
      // reply with a valid request for any supported network, so that this test has every opportunity to fail
      nockEtherscanApiForAllChains({
        status: '1',
        result: [getFakeEtherscanTransaction(NEW_MOCK_SELECTED_ADDRESS)],
      });
      const updateStateStub = sinon.stub(
        externalTransactionsController.store,
        'updateState',
      );
      const updateStateCalled = waitUntilCalled(
        updateStateStub,
        externalTransactionsController.store,
      );
      const putStateStub = sinon.stub(
        externalTransactionsController.store,
        'putState',
      );
      const putStateCalled = waitUntilCalled(
        putStateStub,
        externalTransactionsController.store,
      );

      const subscription = externalTransactionsController.preferencesController.store.subscribe.getCall(
        1,
      ).args[0];
      // The external transactions controller will always skip the first event
      // We need to call subscription twice to test the event handling
      // TODO: stop skipping the first event
      await subscription({ selectedAddress: MOCK_SELECTED_ADDRESS });
      await subscription({ selectedAddress: NEW_MOCK_SELECTED_ADDRESS });

      try {
        await Promise.race([
          updateStateCalled(),
          putStateCalled(),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('TIMEOUT')), SET_STATE_TIMEOUT);
          }),
        ]);
        assert.fail('Update state should not have been called');
      } catch (error) {
        assert(error.message === 'TIMEOUT', 'TIMEOUT error should be thrown');
      }
    });

    it('should update when switching to a supported network', async function () {
      const mockedNetworkMethods = getMockNetworkControllerMethods(
        ROPSTEN_CHAIN_ID,
      );
      const externalTransactionsController = new ExternalTransactionsController(
        {
          blockTracker: getMockBlockTracker(),
          ...mockedNetworkMethods,
          preferencesController: getMockPreferencesController(),
          initState: getNonEmptyInitState(),
        },
      );
      const startBlock = getNonEmptyInitState()
        .externalTxLastFetchedBlockByChainId[ROPSTEN_CHAIN_ID];
      nock('https://api-ropsten.etherscan.io')
        .get(
          `/api?module=account&action=txlist&address=${MOCK_SELECTED_ADDRESS}&tag=latest&page=1&startBlock=${startBlock}`,
        )
        .reply(
          200,
          JSON.stringify({
            status: '1',
            result: [getFakeEtherscanTransaction()],
          }),
        );
      const updateStateStub = sinon.stub(
        externalTransactionsController.store,
        'updateState',
      );
      const updateStateCalled = waitUntilCalled(
        updateStateStub,
        externalTransactionsController.store,
      );

      const subscription = mockedNetworkMethods.onNetworkDidChange.getCall(0)
        .args[0];
      await subscription(ROPSTEN_CHAIN_ID);
      await updateStateCalled();

      const actualState = externalTransactionsController.store.getState();
      const generatedTxId = actualState?.externalTransactions?.['0xfake']?.id;

      const actualStateWithoutGenerated = cloneDeep(actualState);
      delete actualStateWithoutGenerated?.externalTransactions?.['0xfake']?.id;

      assert.ok(
        typeof generatedTxId === 'number' && generatedTxId > 0,
        'Generated transaction ID should be a positive number',
      );
      assert.deepStrictEqual(
        actualStateWithoutGenerated,
        {
          externalTransactions: {
            ...getNonEmptyInitState().externalTransactions,
            '0xfake': {
              blockNumber: '10',
              hash: '0xfake',
              metamaskNetworkId: ROPSTEN_NETWORK_ID,
              chainId: ROPSTEN_CHAIN_ID,
              status: TRANSACTION_STATUSES.CONFIRMED,
              time: 16000000000000000,
              type: TRANSACTION_TYPES.INCOMING,
              txParams: {
                from: '0xfake',
                gas: '0x0',
                gasPrice: '0x0',
                nonce: '0x64',
                to: '0x0101',
                value: '0x0',
              },
            },
          },
          externalTxLastFetchedBlockByChainId: {
            ...getNonEmptyInitState().externalTxLastFetchedBlockByChainId,
            [ROPSTEN_CHAIN_ID]: 11,
          },
        },
        'State should have been updated after first block was received',
      );
    });

    it('should not update when switching to an unsupported network', async function () {
      const mockedNetworkMethods = getMockNetworkControllerMethods(
        ROPSTEN_CHAIN_ID,
      );
      const externalTransactionsController = new ExternalTransactionsController(
        {
          blockTracker: getMockBlockTracker(),
          ...mockedNetworkMethods,
          preferencesController: getMockPreferencesController(),
          initState: getNonEmptyInitState(),
        },
      );
      // reply with a valid request for any supported network, so that this test has every opportunity to fail
      nockEtherscanApiForAllChains({
        status: '1',
        result: [getFakeEtherscanTransaction()],
      });
      const updateStateStub = sinon.stub(
        externalTransactionsController.store,
        'updateState',
      );
      const updateStateCalled = waitUntilCalled(
        updateStateStub,
        externalTransactionsController.store,
      );
      const putStateStub = sinon.stub(
        externalTransactionsController.store,
        'putState',
      );
      const putStateCalled = waitUntilCalled(
        putStateStub,
        externalTransactionsController.store,
      );

      const subscription = mockedNetworkMethods.onNetworkDidChange.getCall(0)
        .args[0];

      externalTransactionsController.getCurrentChainId = () => FAKE_CHAIN_ID;
      await subscription();

      try {
        await Promise.race([
          updateStateCalled(),
          putStateCalled(),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('TIMEOUT')), SET_STATE_TIMEOUT);
          }),
        ]);
        assert.fail('Update state should not have been called');
      } catch (error) {
        assert(error.message === 'TIMEOUT', 'TIMEOUT error should be thrown');
      }
    });
  });

  describe('_update', function () {
    describe('when state is empty (initialized)', function () {
      it('should use provided block number and update the latest block seen', async function () {
        const externalTransactionsController = new ExternalTransactionsController(
          {
            blockTracker: getMockBlockTracker(),
            ...getMockNetworkControllerMethods(ROPSTEN_CHAIN_ID),
            preferencesController: getMockPreferencesController(),
            initState: getEmptyInitState(),
            getCurrentChainId: () => ROPSTEN_CHAIN_ID,
          },
        );
        sinon.spy(externalTransactionsController.store, 'updateState');

        externalTransactionsController._getNewExternalTransactions = sinon
          .stub()
          .returns([]);

        await externalTransactionsController._update('fakeAddress', 999);
        assert(
          externalTransactionsController._getNewExternalTransactions.calledOnce,
        );
        assert.deepStrictEqual(
          externalTransactionsController._getNewExternalTransactions.getCall(0)
            .args,
          ['fakeAddress', 999, ROPSTEN_CHAIN_ID],
        );
        assert.deepStrictEqual(
          externalTransactionsController.store.updateState.getCall(0).args[0],
          {
            externalTxLastFetchedBlockByChainId: {
              ...EMPTY_BLOCKS_BY_NETWORK,
              [ROPSTEN_CHAIN_ID]: 1000,
            },
            externalTransactions: {},
          },
        );
      });

      it('should update the last fetched block for network to highest block seen in external txs', async function () {
        const externalTransactionsController = new ExternalTransactionsController(
          {
            blockTracker: getMockBlockTracker(),
            ...getMockNetworkControllerMethods(ROPSTEN_CHAIN_ID),
            preferencesController: getMockPreferencesController(),
            initState: getEmptyInitState(),
            getCurrentChainId: () => ROPSTEN_CHAIN_ID,
          },
        );

        const NEW_TRANSACTION_ONE = {
          id: 555,
          hash: '0xfff',
          blockNumber: 444,
        };
        const NEW_TRANSACTION_TWO = {
          id: 556,
          hash: '0xffa',
          blockNumber: 443,
        };

        sinon.spy(externalTransactionsController.store, 'updateState');

        externalTransactionsController._getNewExternalTransactions = sinon
          .stub()
          .returns([NEW_TRANSACTION_ONE, NEW_TRANSACTION_TWO]);
        await externalTransactionsController._update('fakeAddress', 10);

        assert(externalTransactionsController.store.updateState.calledOnce);

        assert.deepStrictEqual(
          externalTransactionsController._getNewExternalTransactions.getCall(0)
            .args,
          ['fakeAddress', 10, ROPSTEN_CHAIN_ID],
        );

        assert.deepStrictEqual(
          externalTransactionsController.store.updateState.getCall(0).args[0],
          {
            externalTxLastFetchedBlockByChainId: {
              ...EMPTY_BLOCKS_BY_NETWORK,
              [ROPSTEN_CHAIN_ID]: 445,
            },
            externalTransactions: {
              [NEW_TRANSACTION_ONE.hash]: NEW_TRANSACTION_ONE,
              [NEW_TRANSACTION_TWO.hash]: NEW_TRANSACTION_TWO,
            },
          },
        );
      });
    });

    describe('when state is populated with prior data for network', function () {
      it('should use the last fetched block for the current network and increment by 1 in state', async function () {
        const externalTransactionsController = new ExternalTransactionsController(
          {
            blockTracker: getMockBlockTracker(),
            ...getMockNetworkControllerMethods(ROPSTEN_CHAIN_ID),
            preferencesController: getMockPreferencesController(),
            initState: getNonEmptyInitState(),
            getCurrentChainId: () => ROPSTEN_CHAIN_ID,
          },
        );
        sinon.spy(externalTransactionsController.store, 'updateState');
        externalTransactionsController._getNewExternalTransactions = sinon
          .stub()
          .returns([]);

        await externalTransactionsController._update('fakeAddress', 999);

        assert(
          externalTransactionsController._getNewExternalTransactions.calledOnce,
        );

        assert.deepStrictEqual(
          externalTransactionsController._getNewExternalTransactions.getCall(0)
            .args,
          ['fakeAddress', 4, ROPSTEN_CHAIN_ID],
        );

        assert.deepStrictEqual(
          externalTransactionsController.store.updateState.getCall(0).args[0],
          {
            externalTxLastFetchedBlockByChainId: {
              ...PREPOPULATED_BLOCKS_BY_NETWORK,
              [ROPSTEN_CHAIN_ID]:
                PREPOPULATED_BLOCKS_BY_NETWORK[ROPSTEN_CHAIN_ID] + 1,
            },
            externalTransactions: PREPOPULATED_INCOMING_TXS_BY_HASH,
          },
        );
      });
    });

    it('should update the last fetched block for network to highest block seen in external txs', async function () {
      const externalTransactionsController = new ExternalTransactionsController(
        {
          blockTracker: getMockBlockTracker(),
          ...getMockNetworkControllerMethods(ROPSTEN_CHAIN_ID),
          preferencesController: getMockPreferencesController(),
          initState: getNonEmptyInitState(),
          getCurrentChainId: () => ROPSTEN_CHAIN_ID,
        },
      );

      const NEW_TRANSACTION_ONE = {
        id: 555,
        hash: '0xfff',
        blockNumber: 444,
      };
      const NEW_TRANSACTION_TWO = {
        id: 556,
        hash: '0xffa',
        blockNumber: 443,
      };

      sinon.spy(externalTransactionsController.store, 'updateState');

      externalTransactionsController._getNewExternalTransactions = sinon
        .stub()
        .returns([NEW_TRANSACTION_ONE, NEW_TRANSACTION_TWO]);
      await externalTransactionsController._update('fakeAddress', 10);

      assert(externalTransactionsController.store.updateState.calledOnce);

      assert.deepStrictEqual(
        externalTransactionsController._getNewExternalTransactions.getCall(0)
          .args,
        ['fakeAddress', 4, ROPSTEN_CHAIN_ID],
      );

      assert.deepStrictEqual(
        externalTransactionsController.store.updateState.getCall(0).args[0],
        {
          externalTxLastFetchedBlockByChainId: {
            ...PREPOPULATED_BLOCKS_BY_NETWORK,
            [ROPSTEN_CHAIN_ID]: 445,
          },
          externalTransactions: {
            ...PREPOPULATED_INCOMING_TXS_BY_HASH,
            [NEW_TRANSACTION_ONE.hash]: NEW_TRANSACTION_ONE,
            [NEW_TRANSACTION_TWO.hash]: NEW_TRANSACTION_TWO,
          },
        },
      );
    });
  });

  describe('_getNewExternalTransactions', function () {
    const ADDRESS_TO_FETCH_FOR = '0xfakeaddress';
    const FETCHED_TX = getFakeEtherscanTransaction(ADDRESS_TO_FETCH_FOR);
    const FETCHED_SEND_TX = getFakeEtherscanSendTransaction(
      ADDRESS_TO_FETCH_FOR,
    );
    const mockFetch = sinon.stub().returns(
      Promise.resolve({
        json: () =>
          Promise.resolve({
            status: '1',
            result: [FETCHED_TX, FETCHED_SEND_TX],
          }),
      }),
    );
    let tempFetch;
    beforeEach(function () {
      tempFetch = window.fetch;
      window.fetch = mockFetch;
    });

    afterEach(function () {
      window.fetch = tempFetch;
      mockFetch.resetHistory();
    });

    it('should call fetch with the expected url when passed an address, block number and supported chainId', async function () {
      const externalTransactionsController = new ExternalTransactionsController(
        {
          blockTracker: getMockBlockTracker(),
          ...getMockNetworkControllerMethods(ROPSTEN_CHAIN_ID),
          preferencesController: getMockPreferencesController(),
          initState: getNonEmptyInitState(),
        },
      );

      await externalTransactionsController._getNewExternalTransactions(
        ADDRESS_TO_FETCH_FOR,
        '789',
        ROPSTEN_CHAIN_ID,
      );

      assert(mockFetch.calledOnce);
      assert.strictEqual(
        mockFetch.getCall(0).args[0],
        `https://api-${ROPSTEN}.etherscan.io/api?module=account&action=txlist&address=0xfakeaddress&tag=latest&page=1&startBlock=789`,
      );
    });

    it('should call fetch with the expected url when passed an address, block number and MAINNET chainId', async function () {
      const externalTransactionsController = new ExternalTransactionsController(
        {
          blockTracker: getMockBlockTracker(),
          ...getMockNetworkControllerMethods(MAINNET_CHAIN_ID),
          preferencesController: getMockPreferencesController(),
          initState: getNonEmptyInitState(),
        },
      );

      await externalTransactionsController._getNewExternalTransactions(
        ADDRESS_TO_FETCH_FOR,
        '789',
        MAINNET_CHAIN_ID,
      );

      assert(mockFetch.calledOnce);
      assert.strictEqual(
        mockFetch.getCall(0).args[0],
        `https://api.etherscan.io/api?module=account&action=txlist&address=0xfakeaddress&tag=latest&page=1&startBlock=789`,
      );
    });

    it('should call fetch with the expected url when passed an address and supported chainId, but a falsy block number', async function () {
      const externalTransactionsController = new ExternalTransactionsController(
        {
          blockTracker: getMockBlockTracker(),
          ...getMockNetworkControllerMethods(ROPSTEN_CHAIN_ID),
          preferencesController: getMockPreferencesController(),
          initState: getNonEmptyInitState(),
        },
      );

      await externalTransactionsController._getNewExternalTransactions(
        ADDRESS_TO_FETCH_FOR,
        null,
        ROPSTEN_CHAIN_ID,
      );

      assert(mockFetch.calledOnce);
      assert.strictEqual(
        mockFetch.getCall(0).args[0],
        `https://api-${ROPSTEN}.etherscan.io/api?module=account&action=txlist&address=0xfakeaddress&tag=latest&page=1`,
      );
    });

    it('should return an array of normalized transactions', async function () {
      const externalTransactionsController = new ExternalTransactionsController(
        {
          blockTracker: getMockBlockTracker(),
          ...getMockNetworkControllerMethods(ROPSTEN_CHAIN_ID),
          preferencesController: getMockPreferencesController(),
          initState: getNonEmptyInitState(),
        },
      );

      const result = await externalTransactionsController._getNewExternalTransactions(
        ADDRESS_TO_FETCH_FOR,
        '789',
        ROPSTEN_CHAIN_ID,
      );

      assert(mockFetch.calledOnce);
      assert.deepStrictEqual(result, [
        externalTransactionsController._normalizeTxFromEtherscan(
          FETCHED_TX,
          ROPSTEN_CHAIN_ID,
          ADDRESS_TO_FETCH_FOR,
        ),
        externalTransactionsController._normalizeTxFromEtherscan(
          FETCHED_SEND_TX,
          ROPSTEN_CHAIN_ID,
          ADDRESS_TO_FETCH_FOR,
        ),
      ]);
    });

    it('should return empty tx array if status is 0', async function () {
      const mockFetchStatusZero = sinon.stub().returns(
        Promise.resolve({
          json: () => Promise.resolve({ status: '0', result: [FETCHED_TX] }),
        }),
      );
      const tempFetchStatusZero = window.fetch;
      window.fetch = mockFetchStatusZero;
      const externalTransactionsController = new ExternalTransactionsController(
        {
          blockTracker: getMockBlockTracker(),
          ...getMockNetworkControllerMethods(ROPSTEN_CHAIN_ID),
          preferencesController: getMockPreferencesController(),
          initState: getNonEmptyInitState(),
        },
      );

      const result = await externalTransactionsController._getNewExternalTransactions(
        ADDRESS_TO_FETCH_FOR,
        '789',
        ROPSTEN_CHAIN_ID,
      );
      assert.deepStrictEqual(result, []);
      window.fetch = tempFetchStatusZero;
      mockFetchStatusZero.reset();
    });

    it('should return empty tx array if result array is empty', async function () {
      const mockFetchEmptyResult = sinon.stub().returns(
        Promise.resolve({
          json: () => Promise.resolve({ status: '1', result: [] }),
        }),
      );
      const tempFetchEmptyResult = window.fetch;
      window.fetch = mockFetchEmptyResult;
      const externalTransactionsController = new ExternalTransactionsController(
        {
          blockTracker: getMockBlockTracker(),
          ...getMockNetworkControllerMethods(ROPSTEN_CHAIN_ID),
          preferencesController: getMockPreferencesController(),
          initState: getNonEmptyInitState(),
        },
      );

      const result = await externalTransactionsController._getNewExternalTransactions(
        ADDRESS_TO_FETCH_FOR,
        '789',
        ROPSTEN_CHAIN_ID,
      );
      assert.deepStrictEqual(result, []);
      window.fetch = tempFetchEmptyResult;
      mockFetchEmptyResult.reset();
    });
  });

  describe('_normalizeTxFromEtherscan', function () {
    it('should return the expected data when the tx is in error', function () {
      const externalTransactionsController = new ExternalTransactionsController(
        {
          blockTracker: getMockBlockTracker(),
          ...getMockNetworkControllerMethods(ROPSTEN_CHAIN_ID),
          preferencesController: getMockPreferencesController(),
          initState: getNonEmptyInitState(),
        },
      );

      const result = externalTransactionsController._normalizeTxFromEtherscan(
        {
          timeStamp: '4444',
          isError: '1',
          blockNumber: 333,
          from: '0xa',
          gas: '11',
          gasPrice: '12',
          nonce: '13',
          to: '0xe',
          value: '15',
          hash: '0xg',
        },
        ROPSTEN_CHAIN_ID,
      );

      assert.deepStrictEqual(result, {
        blockNumber: 333,
        id: 54321,
        metamaskNetworkId: ROPSTEN_NETWORK_ID,
        chainId: ROPSTEN_CHAIN_ID,
        status: TRANSACTION_STATUSES.FAILED,
        time: 4444000,
        txParams: {
          from: '0xa',
          gas: '0xb',
          gasPrice: '0xc',
          nonce: '0xd',
          to: '0xe',
          value: '0xf',
        },
        hash: '0xg',
        type: TRANSACTION_TYPES.INCOMING,
      });
    });

    it('should return the expected data when the tx is not in error', function () {
      const externalTransactionsController = new ExternalTransactionsController(
        {
          blockTracker: getMockBlockTracker(),
          ...getMockNetworkControllerMethods(ROPSTEN_CHAIN_ID),
          preferencesController: getMockPreferencesController(),
          initState: getNonEmptyInitState(),
        },
      );

      const result = externalTransactionsController._normalizeTxFromEtherscan(
        {
          timeStamp: '4444',
          isError: '0',
          blockNumber: 333,
          from: '0xa',
          gas: '11',
          gasPrice: '12',
          nonce: '13',
          to: '0xe',
          value: '15',
          hash: '0xg',
        },
        ROPSTEN_CHAIN_ID,
      );

      assert.deepStrictEqual(result, {
        blockNumber: 333,
        id: 54321,
        metamaskNetworkId: ROPSTEN_NETWORK_ID,
        chainId: ROPSTEN_CHAIN_ID,
        status: TRANSACTION_STATUSES.CONFIRMED,
        time: 4444000,
        txParams: {
          from: '0xa',
          gas: '0xb',
          gasPrice: '0xc',
          nonce: '0xd',
          to: '0xe',
          value: '0xf',
        },
        hash: '0xg',
        type: TRANSACTION_TYPES.INCOMING,
      });
    });

    it('should return the expected data when the tx is outgoing transactions', function () {
      const externalTransactionsController = new ExternalTransactionsController(
        {
          blockTracker: getMockBlockTracker(),
          ...getMockNetworkControllerMethods(ROPSTEN_CHAIN_ID),
          preferencesController: getMockPreferencesController(),
          initState: getNonEmptyInitState(),
        },
      );

      const result = externalTransactionsController._normalizeTxFromEtherscan(
        {
          timeStamp: '4444',
          isError: '0',
          blockNumber: 333,
          from: '0xa',
          gas: '11',
          gasPrice: '12',
          nonce: '13',
          to: '0xe',
          value: '15',
          hash: '0xg',
        },
        ROPSTEN_CHAIN_ID,
        '0xa',
      );

      assert.deepStrictEqual(result, {
        blockNumber: 333,
        id: 54321,
        metamaskNetworkId: ROPSTEN_NETWORK_ID,
        chainId: ROPSTEN_CHAIN_ID,
        status: TRANSACTION_STATUSES.CONFIRMED,
        time: 4444000,
        txParams: {
          from: '0xa',
          gas: '0xb',
          gasPrice: '0xc',
          nonce: '0xd',
          to: '0xe',
          value: '0xf',
        },
        hash: '0xg',
        type: TRANSACTION_TYPES.SENT,
      });
    });
  });
});
