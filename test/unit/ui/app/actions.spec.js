import assert from 'assert';
import fs from 'fs';
import sinon from 'sinon';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import EthQuery from 'eth-query';
import Eth from 'ethjs';
import { createTestProviderTools } from '../../../stub/provider';
import enLocale from '../../../../app/_locales/en/messages.json';
import * as actions from '../../../../ui/app/store/actions';
import MetaMaskController from '../../../../app/scripts/metamask-controller';
import { TRANSACTION_STATUSES } from '../../../../shared/constants/transaction';

const { provider } = createTestProviderTools({ scaffold: {} });
const middleware = [thunk];
const defaultState = {
  metamask: {
    currentLocale: 'test',
    selectedAddress: '0xFirstAddress',
    provider: { chainId: '0x1' },
  },
};
const mockStore = (state = defaultState) => configureStore(middleware)(state);

describe('Actions', function () {
  let background;

  const currentNetworkId = '42';

  beforeEach(async function () {
    background = sinon.createStubInstance(MetaMaskController, {
      getState: sinon.stub().callsFake((cb) =>
        cb(null, {
          currentLocale: 'test',
          selectedAddress: '0xFirstAddress',
        }),
      ),
    });

    global.ethQuery = new EthQuery(provider);
  });

  describe('#tryUnlockMetamask', function () {
    afterEach(function () {
      sinon.restore();
    });

    it('calls submitPassword and verifySeedPhrase', async function () {
      const store = mockStore();

      const submitPassword = background.submitPassword.callsFake((_, cb) =>
        cb(),
      );

      const verifySeedPhrase = background.verifySeedPhrase.callsFake((cb) =>
        cb(),
      );

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'UNLOCK_IN_PROGRESS' },
        { type: 'UNLOCK_SUCCEEDED', value: undefined },
        {
          type: 'UPDATE_METAMASK_STATE',
          value: {
            currentLocale: 'test',
            selectedAddress: '0xFirstAddress',
          },
        },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.tryUnlockMetamask());

      assert(submitPassword.calledOnce);
      assert(verifySeedPhrase.calledOnce);

      assert.deepStrictEqual(store.getActions(), expectedActions);
    });

    it('errors on submitPassword will fail', async function () {
      const store = mockStore();

      background.submitPassword.callsFake((_, cb) => cb(new Error('error')));

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'UNLOCK_IN_PROGRESS' },
        { type: 'UNLOCK_FAILED', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      try {
        await store.dispatch(actions.tryUnlockMetamask('test'));
        assert.fail('Should have thrown error');
      } catch (_) {
        assert.deepStrictEqual(store.getActions(), expectedActions);
      }
    });

    it('displays warning error and unlock failed when verifySeed fails', async function () {
      const store = mockStore();

      background.submitPassword.callsFake((_, cb) => cb());
      background.verifySeedPhrase.callsFake((cb) => {
        cb(new Error('error'));
      });

      actions._setBackgroundConnection(background);

      const displayWarningError = [{ type: 'DISPLAY_WARNING', value: 'error' }];
      const unlockFailedError = [{ type: 'UNLOCK_FAILED', value: 'error' }];

      try {
        await store.dispatch(actions.tryUnlockMetamask('test'));
        assert.fail('Should have thrown error');
      } catch (_) {
        const actions1 = store.getActions();
        const warning = actions1.filter(
          (action) => action.type === 'DISPLAY_WARNING',
        );
        const unlockFailed = actions1.filter(
          (action) => action.type === 'UNLOCK_FAILED',
        );
        assert.deepStrictEqual(warning, displayWarningError);
        assert.deepStrictEqual(unlockFailed, unlockFailedError);
      }
    });
  });

  describe('#createNewVaultAndRestore', function () {
    afterEach(function () {
      sinon.restore();
    });

    it('calls createNewVaultAndRestore', async function () {
      const store = mockStore();

      const createNewVaultAndRestore = background.createNewVaultAndRestore.callsFake(
        (_, __, cb) => cb(),
      );

      background.unMarkPasswordForgotten.callsFake((cb) => cb());

      actions._setBackgroundConnection(background);

      await store.dispatch(actions.createNewVaultAndRestore());
      assert(createNewVaultAndRestore.calledOnce);
    });

    it('calls the expected actions', async function () {
      const store = mockStore();

      background.createNewVaultAndRestore.callsFake((_, __, cb) => cb());
      background.unMarkPasswordForgotten.callsFake((cb) => cb());

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'FORGOT_PASSWORD', value: false },
        {
          type: 'UPDATE_METAMASK_STATE',
          value: {
            currentLocale: 'test',
            selectedAddress: '0xFirstAddress',
          },
        },
        { type: 'SHOW_ACCOUNTS_PAGE' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.createNewVaultAndRestore());

      assert.deepStrictEqual(store.getActions(), expectedActions);
    });

    it('errors when callback in createNewVaultAndRestore throws', async function () {
      const store = mockStore();

      background.createNewVaultAndRestore.callsFake((_, __, cb) =>
        cb(new Error('error')),
      );

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      try {
        await store.dispatch(actions.createNewVaultAndRestore());
        assert.fail('Should have thrown error');
      } catch (_) {
        assert.deepStrictEqual(store.getActions(), expectedActions);
      }
    });
  });

  describe('#requestRevealSeedWords', function () {
    afterEach(function () {
      sinon.restore();
    });

    it('calls verifyPassword in background', async function () {
      const store = mockStore();

      const verifyPassword = background.verifyPassword.callsFake((_, cb) =>
        cb(),
      );
      const verifySeedPhrase = background.verifySeedPhrase.callsFake((cb) =>
        cb(),
      );

      actions._setBackgroundConnection(background);

      await store.dispatch(actions.requestRevealSeedWords());
      assert(verifyPassword.calledOnce);
      assert(verifySeedPhrase.calledOnce);
    });

    it('displays warning error message then callback in background errors', async function () {
      const store = mockStore();

      background.verifyPassword.callsFake((_, cb) => cb());
      background.verifySeedPhrase.callsFake((cb) => {
        cb(new Error('error'));
      });

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      try {
        await store.dispatch(actions.requestRevealSeedWords());
        assert.fail('Should have thrown error');
      } catch (_) {
        assert.deepStrictEqual(store.getActions(), expectedActions);
      }
    });
  });

  describe('#removeAccount', function () {
    afterEach(function () {
      sinon.restore();
    });

    it('calls removeAccount in background and expect actions to show account', async function () {
      const store = mockStore();

      background.getState.callsFake((cb) =>
        cb(null, {
          currentLocale: 'test',
          selectedAddress: '0xAnotherAddress',
        }),
      );

      const removeAccount = background.removeAccount.callsFake((_, cb) => cb());

      actions._setBackgroundConnection(background);

      const expectedActions = [
        'SHOW_LOADING_INDICATION',
        'SELECTED_ADDRESS_CHANGED',
        'UPDATE_METAMASK_STATE',
        'HIDE_LOADING_INDICATION',
        'SHOW_ACCOUNTS_PAGE',
      ];

      await store.dispatch(
        actions.removeAccount('0xe18035bf8712672935fdb4e5e431b1a0183d2dfc'),
      );
      assert(removeAccount.calledOnce);
      const actionTypes = store.getActions().map((action) => action.type);
      assert.deepStrictEqual(actionTypes, expectedActions);
    });

    it('displays warning error message when removeAccount callback errors', async function () {
      const store = mockStore();

      background.removeAccount.callsFake((_, cb) => {
        cb(new Error('error'));
      });

      actions._setBackgroundConnection(background);

      const expectedActions = [
        'SHOW_LOADING_INDICATION',
        'DISPLAY_WARNING',
        'HIDE_LOADING_INDICATION',
      ];

      try {
        await store.dispatch(
          actions.removeAccount('0xe18035bf8712672935fdb4e5e431b1a0183d2dfc'),
        );
        assert.fail('Should have thrown error');
      } catch (_) {
        const actionTypes = store.getActions().map((action) => action.type);
        assert.deepStrictEqual(actionTypes, expectedActions);
      }
    });
  });

  describe('#resetAccount', function () {
    afterEach(function () {
      sinon.restore();
    });

    it('resets account', async function () {
      const store = mockStore();

      const resetAccount = background.resetAccount.callsFake((cb) => cb());

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'SHOW_ACCOUNTS_PAGE' },
      ];

      await store.dispatch(actions.resetAccount());
      assert(resetAccount.calledOnce);
      assert.deepStrictEqual(store.getActions(), expectedActions);
    });

    it('throws if resetAccount throws', async function () {
      const store = mockStore();

      background.resetAccount.callsFake((cb) => {
        cb(new Error('error'));
      });

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'error' },
      ];

      try {
        await store.dispatch(actions.resetAccount());
        assert.fail('Should have thrown error');
      } catch (_) {
        assert.deepStrictEqual(store.getActions(), expectedActions);
      }
    });
  });

  describe('#importNewAccount', function () {
    afterEach(function () {
      sinon.restore();
    });

    it('calls importAccountWithStrategies in background', async function () {
      const store = mockStore();

      const importAccountWithStrategy = background.importAccountWithStrategy.callsFake(
        (_, __, cb) => {
          cb();
        },
      );

      actions._setBackgroundConnection(background);

      await store.dispatch(
        actions.importNewAccount('Private Key', [
          'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
        ]),
      );
      assert(importAccountWithStrategy.calledOnce);
    });

    it('displays warning error message when importAccount in background callback errors', async function () {
      const store = mockStore();

      background.importAccountWithStrategy.callsFake((_, __, cb) =>
        cb(new Error('error')),
      );

      actions._setBackgroundConnection(background);

      const expectedActions = [
        {
          type: 'SHOW_LOADING_INDICATION',
          value: 'This may take a while, please be patient.',
        },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      try {
        await store.dispatch(actions.importNewAccount());
        assert.fail('Should have thrown error');
      } catch (_) {
        assert.deepStrictEqual(store.getActions(), expectedActions);
      }
    });
  });

  describe('#addNewAccount', function () {
    it('Adds a new account', async function () {
      const store = mockStore({ metamask: { identities: {} } });

      const addNewAccount = background.addNewAccount.callsFake((cb) =>
        cb(null, {
          identities: {},
        }),
      );

      actions._setBackgroundConnection(background);

      await store.dispatch(actions.addNewAccount());
      assert(addNewAccount.calledOnce);
    });

    it('displays warning error message when addNewAccount in background callback errors', async function () {
      const store = mockStore();

      background.addNewAccount.callsFake((cb) => {
        cb(new Error('error'));
      });

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      try {
        await store.dispatch(actions.addNewAccount());
        assert.fail('Should have thrown error');
      } catch (_) {
        assert.deepStrictEqual(store.getActions(), expectedActions);
      }
    });
  });

  describe('#checkHardwareStatus', function () {
    afterEach(function () {
      sinon.restore();
    });

    it('calls checkHardwareStatus in background', async function () {
      const store = mockStore();

      const checkHardwareStatus = background.checkHardwareStatus.callsFake(
        (_, __, cb) => {
          cb();
        },
      );

      actions._setBackgroundConnection(background);

      await store.dispatch(
        actions.checkHardwareStatus('ledger', `m/44'/60'/0'/0`),
      );
      assert.strictEqual(checkHardwareStatus.calledOnce, true);
    });

    it('shows loading indicator and displays error', async function () {
      const store = mockStore();

      background.checkHardwareStatus.callsFake((_, __, cb) =>
        cb(new Error('error')),
      );

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      try {
        await store.dispatch(actions.checkHardwareStatus());
        assert.fail('Should have thrown error');
      } catch (_) {
        assert.deepStrictEqual(store.getActions(), expectedActions);
      }
    });
  });

  describe('#forgetDevice', function () {
    afterEach(function () {
      sinon.restore();
    });

    it('calls forgetDevice in background', async function () {
      const store = mockStore();

      const forgetDevice = background.forgetDevice.callsFake((_, cb) => cb());

      actions._setBackgroundConnection(background);

      await store.dispatch(actions.forgetDevice('ledger'));
      assert(forgetDevice.calledOnce);
    });

    it('shows loading indicator and displays error', async function () {
      const store = mockStore();

      background.forgetDevice.callsFake((_, cb) => cb(new Error('error')));

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      try {
        await store.dispatch(actions.forgetDevice());
        assert.fail('Should have thrown error');
      } catch (_) {
        assert.deepStrictEqual(store.getActions(), expectedActions);
      }
    });
  });

  describe('#connectHardware', function () {
    afterEach(function () {
      sinon.restore();
    });

    it('calls connectHardware in background', async function () {
      const store = mockStore();

      const connectHardware = background.connectHardware.callsFake(
        (_, __, ___, cb) => cb(),
      );

      actions._setBackgroundConnection(background);

      await store.dispatch(
        actions.connectHardware('ledger', 0, `m/44'/60'/0'/0`),
      );
      assert(connectHardware.calledOnce);
    });

    it('shows loading indicator and displays error', async function () {
      const store = mockStore();

      background.connectHardware.callsFake((_, __, ___, cb) =>
        cb(new Error('error')),
      );

      actions._setBackgroundConnection(background);

      const expectedActions = [
        {
          type: 'SHOW_LOADING_INDICATION',
          value: 'Looking for your Ledger...',
        },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      try {
        await store.dispatch(actions.connectHardware('ledger'));
        assert.fail('Should have thrown error');
      } catch (_) {
        assert.deepStrictEqual(store.getActions(), expectedActions);
      }
    });
  });

  describe('#unlockHardwareWalletAccount', function () {
    afterEach(function () {
      sinon.restore();
    });

    it('calls unlockHardwareWalletAccount in background', async function () {
      const store = mockStore();
      const unlockHardwareWalletAccount = background.unlockHardwareWalletAccount.callsFake(
        (_, __, ___, cb) => cb(),
      );

      actions._setBackgroundConnection(background);

      await store.dispatch(
        actions.unlockHardwareWalletAccount('ledger', 0, `m/44'/60'/0'/0`),
      );
      assert(unlockHardwareWalletAccount.calledOnce);
    });

    it('shows loading indicator and displays error', async function () {
      const store = mockStore();

      background.unlockHardwareWalletAccount.callsFake((_, __, ___, cb) =>
        cb(new Error('error')),
      );

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'error' },
      ];

      try {
        await store.dispatch(actions.unlockHardwareWalletAccount());
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.deepStrictEqual(store.getActions(), expectedActions);
      }
    });
  });

  describe('#setCurrentCurrency', function () {
    afterEach(function () {
      sinon.restore();
    });

    it('calls setCurrentCurrency', async function () {
      const store = mockStore();
      const setCurrentCurrency = background.setCurrentCurrency.callsFake(
        (_, cb) =>
          cb(null, {
            currentCurrency: 'currency',
            conversionRate: 100,
            conversionDate: 1611839083653,
          }),
      );

      actions._setBackgroundConnection(background);

      await store.dispatch(actions.setCurrentCurrency('jpy'));
      assert(setCurrentCurrency.calledOnce);
    });

    it('throws if setCurrentCurrency throws', async function () {
      const store = mockStore();

      background.setCurrentCurrency.callsFake((_, cb) =>
        cb(new Error('error')),
      );

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.setCurrentCurrency());
      assert.deepStrictEqual(store.getActions(), expectedActions);
    });
  });

  describe('#signMsg', function () {
    const msgParams = {
      metamaskId: 123,
      from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      data:
        '0x879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0',
    };

    afterEach(function () {
      sinon.restore();
    });

    it('calls signMsg in background', async function () {
      const store = mockStore();

      const signMessage = background.signMessage.callsFake((_, cb) =>
        cb(null, defaultState),
      );

      actions._setBackgroundConnection(background);

      await store.dispatch(actions.signMsg(msgParams));
      assert(signMessage.calledOnce);
    });

    it('errors when signMessage in background throws', async function () {
      const store = mockStore();

      background.signMessage.callsFake((_, cb) => cb(new Error('error')));

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      try {
        await store.dispatch(actions.signMsg(msgParams));
        assert.fail('Should have thrown error');
      } catch (_) {
        assert.deepStrictEqual(store.getActions(), expectedActions);
      }
    });
  });

  describe('#signPersonalMsg', function () {
    const msgParams = {
      from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      data:
        '0x879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0',
    };

    afterEach(function () {
      sinon.restore();
    });

    it('calls signPersonalMessage', async function () {
      const store = mockStore();

      const signPersonalMessage = background.signPersonalMessage.callsFake(
        (_, cb) => cb(null, defaultState),
      );

      actions._setBackgroundConnection(background);

      await store.dispatch(actions.signPersonalMsg(msgParams));
      assert(signPersonalMessage.calledOnce);
    });

    it('throws if signPersonalMessage throws', async function () {
      const store = mockStore();

      background.signPersonalMessage.callsFake((_, cb) => {
        cb(new Error('error'));
      });

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      try {
        await store.dispatch(actions.signPersonalMsg(msgParams));
        assert.fail('Should have thrown error');
      } catch (_) {
        assert.deepEqual(store.getActions(), expectedActions);
      }
    });
  });

  describe('#signTypedMsg', function () {
    const msgParamsV3 = {
      from: '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc',
      data: JSON.stringify({
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' },
          ],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
            { name: 'contents', type: 'string' },
          ],
        },
        primaryType: 'Mail',
        domain: {
          name: 'Ether Mainl',
          version: '1',
          verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        },
        message: {
          from: {
            name: 'Cow',
            wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
          },
          to: {
            name: 'Bob',
            wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
          },
          contents: 'Hello, Bob!',
        },
      }),
    };

    afterEach(function () {
      sinon.restore();
    });

    it('calls signTypedMsg in background with no error', async function () {
      const store = mockStore();

      const signTypedMsg = background.signTypedMessage.callsFake((_, cb) =>
        cb(null, defaultState),
      );

      actions._setBackgroundConnection(background);

      await store.dispatch(actions.signTypedMsg(msgParamsV3));
      assert(signTypedMsg.calledOnce);
    });

    it('returns expected actions with error', async function () {
      const store = mockStore();

      background.signTypedMessage.callsFake((_, cb) => cb(new Error('error')));

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      try {
        await store.dispatch(actions.signTypedMsg());
        assert.fail('Should have thrown error');
      } catch (_) {
        assert.deepStrictEqual(store.getActions(), expectedActions);
      }
    });
  });

  describe('#signTx', function () {
    let sendTransaction;

    beforeEach(function () {
      sendTransaction = sinon.stub(global.ethQuery, 'sendTransaction');
    });

    afterEach(function () {
      sendTransaction.restore();
    });

    it('calls sendTransaction in global ethQuery', function () {
      const store = mockStore();

      store.dispatch(actions.signTx());
      assert(sendTransaction.calledOnce);
    });

    it('errors in when sendTransaction throws', function () {
      const store = mockStore();
      const expectedActions = [
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'SHOW_CONF_TX_PAGE', id: undefined },
      ];
      sendTransaction.callsFake((_, callback) => {
        callback(new Error('error'));
      });

      store.dispatch(actions.signTx());
      assert.deepStrictEqual(store.getActions(), expectedActions);
    });
  });

  describe('#updatedGasData', function () {
    it('errors when get code does not return', async function () {
      const store = mockStore();

      const expectedActions = [
        { type: 'GAS_LOADING_STARTED' },
        {
          type: 'UPDATE_SEND_ERRORS',
          value: { gasLoadingError: 'gasLoadingError' },
        },
        { type: 'GAS_LOADING_FINISHED' },
      ];

      const mockData = {
        gasPrice: '0x3b9aca00', //
        blockGasLimit: '0x6ad79a', // 7002010
        selectedAddress: '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc',
        to: '0xEC1Adf982415D2Ef5ec55899b9Bfb8BC0f29251B',
        value: '0xde0b6b3a7640000', // 1000000000000000000
      };

      try {
        await store.dispatch(actions.updateGasData(mockData));
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.deepStrictEqual(store.getActions(), expectedActions);
      }
    });

    it('returns default gas limit for basic eth transaction', async function () {
      const mockData = {
        gasPrice: '0x3b9aca00',
        blockGasLimit: '0x6ad79a', // 7002010
        selectedAddress: '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc',
        to: '0xEC1Adf982415D2Ef5ec55899b9Bfb8BC0f29251B',
        value: '0xde0b6b3a7640000', // 1000000000000000000
      };

      global.eth = {
        getCode: sinon.stub().returns('0x'),
      };
      const store = mockStore();

      const expectedActions = [
        { type: 'GAS_LOADING_STARTED' },
        { type: 'UPDATE_GAS_LIMIT', value: '0x5208' },
        { type: 'metamask/gas/SET_CUSTOM_GAS_LIMIT', value: '0x5208' },
        { type: 'UPDATE_SEND_ERRORS', value: { gasLoadingError: null } },
        { type: 'GAS_LOADING_FINISHED' },
      ];

      await store.dispatch(actions.updateGasData(mockData));
      assert.deepStrictEqual(store.getActions(), expectedActions);
      global.eth.getCode.reset();
    });
  });

  describe('#signTokenTx', function () {
    it('calls eth.contract', function () {
      global.eth = new Eth(provider);
      const tokenSpy = sinon.spy(global.eth, 'contract');
      const store = mockStore();
      store.dispatch(actions.signTokenTx());
      assert(tokenSpy.calledOnce);
      tokenSpy.restore();
    });
  });

  describe('#updateTransaction', function () {
    const txParams = {
      from: '0x1',
      gas: '0x5208',
      gasPrice: '0x3b9aca00',
      to: '0x2',
      value: '0x0',
    };

    const txData = {
      id: '1',
      status: TRANSACTION_STATUSES.UNAPPROVED,
      metamaskNetworkId: currentNetworkId,
      txParams,
    };

    afterEach(function () {
      sinon.restore();
    });

    it('updates transaction', async function () {
      const store = mockStore();

      const updateTransactionStub = sinon.stub().callsFake((_, cb) => cb());

      background.getApi.returns({
        updateTransaction: updateTransactionStub,
        getState: sinon.stub().callsFake((cb) =>
          cb(null, {
            currentLocale: 'test',
            selectedAddress: '0xFirstAddress',
          }),
        ),
      });

      actions._setBackgroundConnection(background.getApi());

      await store.dispatch(actions.updateTransaction(txData));

      const resultantActions = store.getActions();
      assert(updateTransactionStub.calledOnce);
      assert.deepStrictEqual(resultantActions[1], {
        type: 'UPDATE_TRANSACTION_PARAMS',
        id: txData.id,
        value: txParams,
      });
    });

    it('rejects with error message', async function () {
      const store = mockStore();

      background.getApi.returns({
        updateTransaction: (_, callback) => {
          callback(new Error('error'));
        },
        getState: sinon.stub().callsFake((cb) =>
          cb(null, {
            currentLocale: 'test',
            selectedAddress: '0xFirstAddress',
          }),
        ),
      });

      actions._setBackgroundConnection(background.getApi());

      try {
        await store.dispatch(actions.updateTransaction(txData));
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(error.message, 'error');
      }
    });
  });

  describe('#lockMetamask', function () {
    afterEach(function () {
      sinon.restore();
    });

    it('calls setLocked', async function () {
      const store = mockStore();

      const backgroundSetLocked = background.setLocked.callsFake((cb) => cb());

      actions._setBackgroundConnection(background);

      await store.dispatch(actions.lockMetamask());
      assert(backgroundSetLocked.calledOnce);
    });

    it('returns display warning error with value when setLocked in background callback errors', async function () {
      const store = mockStore();

      background.setLocked.callsFake((cb) => {
        cb(new Error('error'));
      });

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'LOCK_METAMASK' },
      ];

      try {
        await store.dispatch(actions.lockMetamask());
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.deepStrictEqual(store.getActions(), expectedActions);
      }
    });
  });

  describe('#setSelectedAddress', function () {
    afterEach(function () {
      sinon.restore();
    });

    it('calls setSelectedAddress in background', async function () {
      const store = mockStore();

      const setSelectedAddressSpy = sinon.stub().callsFake((_, cb) => cb());

      background.getApi.returns({
        setSelectedAddress: setSelectedAddressSpy,
      });

      actions._setBackgroundConnection(background.getApi());

      await store.dispatch(
        actions.setSelectedAddress(
          '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        ),
      );
      assert(setSelectedAddressSpy.calledOnce);
    });

    it('errors when setSelectedAddress throws', async function () {
      const store = mockStore();

      const setSelectedAddressSpy = sinon
        .stub()
        .callsFake((_, cb) => cb(new Error('error')));

      background.getApi.returns({
        setSelectedAddress: setSelectedAddressSpy,
      });

      actions._setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.setSelectedAddress());
      assert.deepStrictEqual(store.getActions(), expectedActions);
    });
  });

  describe('#showAccountDetail', function () {
    afterEach(function () {
      sinon.restore();
    });

    it('#showAccountDetail', async function () {
      const store = mockStore({
        activeTab: {},
        metamask: { alertEnabledness: {}, selectedAddress: '0x123' },
      });

      const setSelectedAddressSpy = sinon.stub().callsFake((_, cb) => cb());

      background.getApi.returns({
        setSelectedAddress: setSelectedAddressSpy,
      });

      actions._setBackgroundConnection(background.getApi());

      await store.dispatch(actions.showAccountDetail());
      assert(setSelectedAddressSpy.calledOnce);
    });

    it('displays warning if setSelectedAddress throws', async function () {
      const store = mockStore({
        activeTab: {},
        metamask: { alertEnabledness: {}, selectedAddress: '0x123' },
      });

      const setSelectedAddressSpy = sinon
        .stub()
        .callsFake((_, cb) => cb(new Error('error')));

      background.getApi.returns({
        setSelectedAddress: setSelectedAddressSpy,
      });

      actions._setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.showAccountDetail());
      assert.deepStrictEqual(store.getActions(), expectedActions);
    });
  });

  describe('#addToken', function () {
    afterEach(function () {
      sinon.restore();
    });

    it('calls addToken in background', async function () {
      const store = mockStore();

      const addTokenStub = sinon
        .stub()
        .callsFake((_, __, ___, ____, cb) => cb());

      background.getApi.returns({
        addToken: addTokenStub,
      });

      actions._setBackgroundConnection(background.getApi());

      await store.dispatch(actions.addToken());
      assert(addTokenStub.calledOnce);
    });

    it('expected actions', async function () {
      const store = mockStore();

      const tokenDetails = {
        address: 'tokenAddress',
        symbol: 'token',
        decimal: 18,
      };

      const addTokenStub = sinon
        .stub()
        .callsFake((_, __, ___, ____, cb) => cb(null, tokenDetails));

      background.getApi.returns({
        addToken: addTokenStub,
      });

      actions._setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        {
          type: 'UPDATE_TOKENS',
          newTokens: tokenDetails,
        },
      ];

      await store.dispatch(actions.addToken());

      assert.deepStrictEqual(store.getActions(), expectedActions);
    });

    it('errors when addToken in background throws', async function () {
      const store = mockStore();

      const addTokenStub = sinon
        .stub()
        .callsFake((_, __, ___, ____, cb) => cb(new Error('error')));

      background.getApi.returns({
        addToken: addTokenStub,
      });

      actions._setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'error' },
      ];

      try {
        await store.dispatch(actions.addToken());
        assert.fail('Should have thrown error');
      } catch (_) {
        assert.deepEqual(store.getActions(), expectedActions);
      }
    });
  });

  describe('#removeToken', function () {
    afterEach(function () {
      sinon.restore();
    });

    it('calls removeToken in background', async function () {
      const store = mockStore();

      const removeTokenStub = sinon.stub().callsFake((_, cb) => cb());

      background.getApi.returns({
        removeToken: removeTokenStub,
      });

      actions._setBackgroundConnection(background.getApi());

      await store.dispatch(actions.removeToken());
      assert(removeTokenStub.calledOnce);
    });

    it('errors when removeToken in background fails', async function () {
      const store = mockStore();

      background.getApi.returns({
        removeToken: sinon.stub().callsFake((_, cb) => cb(new Error('error'))),
      });

      actions._setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'error' },
      ];

      try {
        await store.dispatch(actions.removeToken());
        assert.fail('Should have thrown error');
      } catch (_) {
        assert.deepStrictEqual(store.getActions(), expectedActions);
      }
    });
  });

  describe('#setProviderType', function () {
    afterEach(function () {
      sinon.restore();
    });

    it('calls setProviderType', async function () {
      const store = mockStore();

      const setProviderTypeStub = sinon.stub().callsFake((_, cb) => cb());

      background.getApi.returns({
        setProviderType: setProviderTypeStub,
      });

      actions._setBackgroundConnection(background.getApi());

      await store.dispatch(actions.setProviderType());
      assert(setProviderTypeStub.calledOnce);
    });

    it('displays warning when setProviderType throws', async function () {
      const store = mockStore();

      background.getApi.returns({
        setProviderType: sinon
          .stub()
          .callsFake((_, cb) => cb(new Error('error'))),
      });

      actions._setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'DISPLAY_WARNING', value: 'Had a problem changing networks!' },
      ];

      await store.dispatch(actions.setProviderType());
      assert.deepStrictEqual(store.getActions(), expectedActions);
    });
  });

  describe('#setRpcTarget', function () {
    afterEach(function () {
      sinon.restore();
    });

    it('calls setRpcTarget', async function () {
      const store = mockStore();

      background.setCustomRpc.callsFake((_, __, ___, ____, cb) => cb());

      actions._setBackgroundConnection(background);

      await store.dispatch(actions.setRpcTarget('http://localhost:8545'));
      assert(background.setCustomRpc.calledOnce);
    });

    it('displays warning when setRpcTarget throws', async function () {
      const store = mockStore();

      background.setCustomRpc.callsFake((_, __, ___, ____, cb) =>
        cb(new Error('error')),
      );

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'DISPLAY_WARNING', value: 'Had a problem changing networks!' },
      ];

      await store.dispatch(actions.setRpcTarget());
      assert.deepStrictEqual(store.getActions(), expectedActions);
    });
  });

  describe('#addToAddressBook', function () {
    it('calls setAddressBook', async function () {
      const store = mockStore();

      const setAddressBookStub = sinon
        .stub()
        .callsFake((_, __, ___, ____, cb) => cb());

      background.getApi.returns({
        setAddressBook: setAddressBookStub,
      });

      actions._setBackgroundConnection(background.getApi());

      await store.dispatch(actions.addToAddressBook('test'));
      assert(setAddressBookStub.calledOnce);
      sinon.restore();
    });
  });

  describe('#exportAccount', function () {
    afterEach(function () {
      sinon.restore();
    });

    it('returns expected actions for successful action', async function () {
      const store = mockStore();

      const testPrivKey = 'a-test-priv-key';

      const verifyPasswordStub = sinon.stub().callsFake((_, cb) => cb());

      const exportAccountStub = sinon
        .stub()
        .callsFake((_, cb) => cb(null, testPrivKey));

      background.getApi.returns({
        verifyPassword: verifyPasswordStub,
        exportAccount: exportAccountStub,
      });

      actions._setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        {
          type: 'SHOW_PRIVATE_KEY',
          value: testPrivKey,
        },
      ];

      await store.dispatch(
        actions.exportAccount('a-test-password', '0xAddress'),
      );
      assert(verifyPasswordStub.calledOnce);
      assert(exportAccountStub.calledOnce);
      assert.deepStrictEqual(store.getActions(), expectedActions);
    });

    it('returns action errors when first func callback errors', async function () {
      const store = mockStore();

      const verifyPasswordStub = sinon
        .stub()
        .callsFake((_, cb) => cb(new Error('error')));

      background.getApi.returns({
        verifyPassword: verifyPasswordStub,
      });

      actions._setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'Incorrect Password.' },
      ];

      try {
        await store.dispatch(
          actions.exportAccount('a-test-password', '0xAddress'),
        );
        assert.fail('Should have thrown error');
      } catch (_) {
        assert.deepStrictEqual(store.getActions(), expectedActions);
      }
    });

    it('returns action errors when second func callback errors', async function () {
      const store = mockStore();

      const verifyPasswordStub = sinon.stub().callsFake((_, cb) => cb());

      const exportAccountStub = sinon
        .stub()
        .callsFake((_, cb) => cb(new Error('error')));

      background.getApi.returns({
        verifyPassword: verifyPasswordStub,
        exportAccount: exportAccountStub,
      });

      actions._setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        {
          type: 'DISPLAY_WARNING',
          value: 'Had a problem exporting the account.',
        },
      ];

      try {
        await store.dispatch(
          actions.exportAccount('a-test-password', '0xAddress'),
        );
        assert.fail('Should have thrown error');
      } catch (_) {
        assert.deepStrictEqual(store.getActions(), expectedActions);
      }
    });
  });

  describe('#setAccountLabel', function () {
    afterEach(function () {
      sinon.restore();
    });

    it('calls setAccountLabel', async function () {
      const store = mockStore();

      const setAccountLabelStub = sinon.stub().callsFake((_, __, cb) => cb());

      background.getApi.returns({
        setAccountLabel: setAccountLabelStub,
      });

      actions._setBackgroundConnection(background.getApi());

      await store.dispatch(
        actions.setAccountLabel(
          '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          'test',
        ),
      );
      assert(setAccountLabelStub.calledOnce);
    });

    it('returns action errors when func callback errors', async function () {
      const store = mockStore();

      background.getApi.returns({
        setAccountLabel: sinon
          .stub()
          .callsFake((_, __, cb) => cb(new Error('error'))),
      });

      actions._setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'error' },
      ];

      try {
        await store.dispatch(
          actions.setAccountLabel(
            '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            'test',
          ),
        );
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.deepStrictEqual(store.getActions(), expectedActions);
      }
    });
  });

  describe('#setFeatureFlag', function () {
    afterEach(function () {
      sinon.restore();
    });

    it('calls setFeatureFlag in the background', async function () {
      const store = mockStore();

      const setFeatureFlagStub = sinon.stub().callsFake((_, __, cb) => cb());

      background.getApi.returns({
        setFeatureFlag: setFeatureFlagStub,
      });

      actions._setBackgroundConnection(background.getApi());

      await store.dispatch(actions.setFeatureFlag());
      assert(setFeatureFlagStub.calledOnce);
    });

    it('errors when setFeatureFlag in background throws', async function () {
      const store = mockStore();

      background.getApi.returns({
        setFeatureFlag: sinon
          .stub()
          .callsFake((_, __, cb) => cb(new Error('error'))),
      });

      actions._setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'error' },
      ];

      try {
        await store.dispatch(actions.setFeatureFlag());
        assert.fail('Should have thrown error');
      } catch (_) {
        assert.deepStrictEqual(store.getActions(), expectedActions);
      }
    });
  });

  describe('#setCompletedOnboarding', function () {
    afterEach(function () {
      sinon.restore();
    });

    it('completes onboarding', async function () {
      const store = mockStore();
      const completeOnboardingStub = sinon.stub().callsFake((cb) => cb());

      background.getApi.returns({
        completeOnboarding: completeOnboardingStub,
      });

      actions._setBackgroundConnection(background.getApi());

      await store.dispatch(actions.setCompletedOnboarding());
      assert(completeOnboardingStub.calledOnce);
    });

    it('errors when setCompletedOnboarding in background throws', async function () {
      const store = mockStore();

      background.getApi.returns({
        completeOnboarding: sinon
          .stub()
          .callsFake((cb) => cb(new Error('error'))),
      });

      actions._setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      try {
        await store.dispatch(actions.setCompletedOnboarding());
        assert.fail('Should have thrown error');
      } catch (_) {
        assert.deepStrictEqual(store.getActions(), expectedActions);
      }
    });
  });

  describe('#setUseBlockie', function () {
    afterEach(function () {
      sinon.restore();
    });

    it('calls setUseBlockie in background', async function () {
      const store = mockStore();

      const setUseBlockStub = background.setUseBlockie.callsFake((_, cb) =>
        cb(),
      );

      actions._setBackgroundConnection(background);

      await store.dispatch(actions.setUseBlockie());
      assert(setUseBlockStub.calledOnce);
    });

    it('errors when setUseBlockie in background throws', async function () {
      const store = mockStore();

      background.setUseBlockie.callsFake((_, cb) => cb(new Error('error')));

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'SET_USE_BLOCKIE', value: undefined },
      ];

      await store.dispatch(actions.setUseBlockie());
      assert.deepStrictEqual(store.getActions(), expectedActions);
    });
  });

  describe('#updateCurrentLocale', function () {
    beforeEach(function () {
      const fetchStub = sinon.stub(window, 'fetch');
      fetchStub.withArgs(`./_locales/test/messages.json`).resolves({
        json: async () => enLocale,
      });
      fetchStub
        .withArgs(`./intl/test/relative-time-format-data.json`)
        .resolves({
          json: async () =>
            // eslint-disable-next-line node/global-require
            require('@formatjs/intl-relativetimeformat/dist/locale-data/en.json'),
        });
      fetchStub.withArgs(`./intl/test/number-format-data.js`).resolves({
        text: async () =>
          fs.readFileSync(
            './node_modules/@formatjs/intl-numberformat/locale-data/en.js',
            'utf-8',
          ),
      });
    });

    afterEach(function () {
      sinon.restore();
    });

    it('calls expected actions', async function () {
      const store = mockStore();

      background.setCurrentLocale.callsFake((_, cb) => cb());

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        {
          type: 'SET_CURRENT_LOCALE',
          value: { locale: 'test', messages: enLocale },
        },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.updateCurrentLocale('test'));
      assert(background.setCurrentLocale.calledOnce);
      assert.deepStrictEqual(store.getActions(), expectedActions);
    });

    it('errors when setCurrentLocale throws', async function () {
      const store = mockStore();

      background.setCurrentLocale.callsFake((_, cb) => cb(new Error('error')));

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      try {
        await store.dispatch(actions.updateCurrentLocale('test'));
        assert.fail('Should have thrown error');
      } catch (_) {
        assert.deepStrictEqual(store.getActions(), expectedActions);
      }
    });
  });

  describe('#markPasswordForgotten', function () {
    afterEach(function () {
      sinon.restore();
    });

    it('calls markPasswordForgotten', async function () {
      const store = mockStore();

      background.markPasswordForgotten.callsFake((cb) => cb());

      actions._setBackgroundConnection(background);

      await store.dispatch(actions.markPasswordForgotten());

      const resultantActions = store.getActions();
      assert.deepStrictEqual(resultantActions[1], {
        type: 'FORGOT_PASSWORD',
        value: true,
      });
      assert(background.markPasswordForgotten.calledOnce);
    });

    it('errors when markPasswordForgotten throws', async function () {
      const store = mockStore();

      background.markPasswordForgotten.callsFake((cb) =>
        cb(new Error('error')),
      );

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'FORGOT_PASSWORD', value: true },
        {
          type: 'UPDATE_METAMASK_STATE',
          value: {
            currentLocale: 'test',
            selectedAddress: '0xFirstAddress',
          },
        },
      ];

      try {
        await store.dispatch(actions.markPasswordForgotten('test'));
        assert.fail('Should have thrown error');
      } catch (_) {
        assert.deepStrictEqual(store.getActions(), expectedActions);
      }
    });
  });

  describe('#unMarkPasswordForgotten', function () {
    it('calls unMarkPasswordForgotten', async function () {
      const store = mockStore();

      background.unMarkPasswordForgotten.callsFake((cb) => cb());

      actions._setBackgroundConnection(background);

      await store.dispatch(actions.unMarkPasswordForgotten());

      const resultantActions = store.getActions();
      assert.deepStrictEqual(resultantActions[0], {
        type: 'FORGOT_PASSWORD',
        value: false,
      });
      assert(background.unMarkPasswordForgotten.calledOnce);
    });
  });
});
