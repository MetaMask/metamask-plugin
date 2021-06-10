import sinon from 'sinon';
import { ObservableStore } from '@metamask/obs-store';
import contracts from '@metamask/contract-metadata';
import BigNumber from 'bignumber.js';

import { MAINNET, ROPSTEN } from '../../../shared/constants/network';
import DetectTokensController from './detect-tokens';
import NetworkController from './network';
import PreferencesController from './preferences';

describe('DetectTokensController', () => {
  const sandbox = sinon.createSandbox();
  let keyringMemStore, network, preferences;

  const noop = () => undefined;

  const networkControllerProviderConfig = {
    getAccounts: noop,
  };

  beforeEach(async () => {
    keyringMemStore = new ObservableStore({ isUnlocked: false });
    network = new NetworkController();
    network.setInfuraProjectId('foo');
    preferences = new PreferencesController({ network });
    preferences.setAddresses([
      '0x7e57e2',
      '0xbc86727e770de68b1060c91f6bb6945c73e10388',
    ]);
    network.initializeProvider(networkControllerProviderConfig);
  });

  afterAll(() => {
    sandbox.restore();
  });

  it('should poll on correct interval', async () => {
    const stub = sinon.stub(global, 'setInterval');
    new DetectTokensController({ interval: 1337 }); // eslint-disable-line no-new
    expect(stub.getCall(0).args[1]).toStrictEqual(1337);
    stub.restore();
  });

  it('should be called on every polling period', async () => {
    const clock = sandbox.useFakeTimers();
    network.setProviderType(MAINNET);
    const controller = new DetectTokensController({
      preferences,
      network,
      keyringMemStore,
    });
    controller.isOpen = true;
    controller.isUnlocked = true;

    const stub = sandbox.stub(controller, 'detectNewTokens');

    clock.tick(1);
    expect(stub.notCalled).toStrictEqual(true);
    clock.tick(180000);
    expect(stub.calledOnce).toStrictEqual(true);
    clock.tick(180000);
    expect(stub.calledTwice).toStrictEqual(true);
    clock.tick(180000);
    expect(stub.calledThrice).toStrictEqual(true);
  });

  it('should not check tokens while on test network', async () => {
    sandbox.useFakeTimers();
    network.setProviderType(ROPSTEN);
    const controller = new DetectTokensController({
      preferences,
      network,
      keyringMemStore,
    });
    controller.isOpen = true;
    controller.isUnlocked = true;

    const stub = sandbox.stub(controller, '_getTokenBalances');

    await controller.detectNewTokens();
    expect(stub.notCalled).toStrictEqual(true);
  });

  it('should skip adding tokens listed in hiddenTokens array', async () => {
    sandbox.useFakeTimers();
    network.setProviderType(MAINNET);
    const controller = new DetectTokensController({
      preferences,
      network,
      keyringMemStore,
    });
    controller.isOpen = true;
    controller.isUnlocked = true;

    const contractAddresses = Object.keys(contracts);
    const erc20ContractAddresses = contractAddresses.filter(
      (contractAddress) => contracts[contractAddress].erc20 === true,
    );

    const existingTokenAddress = erc20ContractAddresses[0];
    const existingToken = contracts[existingTokenAddress];
    await preferences.addToken(
      existingTokenAddress,
      existingToken.symbol,
      existingToken.decimals,
    );

    const tokenAddressToSkip = erc20ContractAddresses[1];

    sandbox
      .stub(controller, '_getTokenBalances')
      .callsFake((tokensToDetect) =>
        tokensToDetect.map((token) =>
          token === tokenAddressToSkip ? new BigNumber(10) : 0,
        ),
      );

    await preferences.removeToken(tokenAddressToSkip);

    await controller.detectNewTokens();

    expect(preferences.store.getState().tokens).toStrictEqual([
      {
        address: existingTokenAddress.toLowerCase(),
        decimals: existingToken.decimals,
        symbol: existingToken.symbol,
      },
    ]);
  });

  it('should check and add tokens while on main network', async () => {
    sandbox.useFakeTimers();
    network.setProviderType(MAINNET);
    const controller = new DetectTokensController({
      preferences,
      network,
      keyringMemStore,
    });
    controller.isOpen = true;
    controller.isUnlocked = true;

    const contractAddresses = Object.keys(contracts);
    const erc20ContractAddresses = contractAddresses.filter(
      (contractAddress) => contracts[contractAddress].erc20 === true,
    );

    const existingTokenAddress = erc20ContractAddresses[0];
    const existingToken = contracts[existingTokenAddress];
    await preferences.addToken(
      existingTokenAddress,
      existingToken.symbol,
      existingToken.decimals,
    );

    const tokenAddressToAdd = erc20ContractAddresses[1];
    const tokenToAdd = contracts[tokenAddressToAdd];

    const contractAddresssesToDetect = contractAddresses.filter(
      (address) => address !== existingTokenAddress,
    );
    const indexOfTokenToAdd = contractAddresssesToDetect.indexOf(
      tokenAddressToAdd,
    );

    const balances = new Array(contractAddresssesToDetect.length);
    balances[indexOfTokenToAdd] = new BigNumber(10);

    sandbox
      .stub(controller, '_getTokenBalances')
      .returns(Promise.resolve(balances));

    await controller.detectNewTokens();

    expect(preferences.store.getState().tokens).toStrictEqual([
      {
        address: existingTokenAddress.toLowerCase(),
        decimals: existingToken.decimals,
        symbol: existingToken.symbol,
      },
      {
        address: tokenAddressToAdd.toLowerCase(),
        decimals: tokenToAdd.decimals,
        symbol: tokenToAdd.symbol,
      },
    ]);
  });

  it('should check and add tokens while on non-default Mainnet', async () => {
    sandbox.useFakeTimers();
    network.setRpcTarget('https://some-fake-RPC-endpoint.metamask.io', '0x1');
    const controller = new DetectTokensController({
      preferences,
      network,
      keyringMemStore,
    });
    controller.isOpen = true;
    controller.isUnlocked = true;

    const contractAddresses = Object.keys(contracts);
    const erc20ContractAddresses = contractAddresses.filter(
      (contractAddress) => contracts[contractAddress].erc20 === true,
    );

    const existingTokenAddress = erc20ContractAddresses[0];
    const existingToken = contracts[existingTokenAddress];
    await preferences.addToken(
      existingTokenAddress,
      existingToken.symbol,
      existingToken.decimals,
    );

    const tokenAddressToAdd = erc20ContractAddresses[1];
    const tokenToAdd = contracts[tokenAddressToAdd];

    const contractAddresssesToDetect = contractAddresses.filter(
      (address) => address !== existingTokenAddress,
    );
    const indexOfTokenToAdd = contractAddresssesToDetect.indexOf(
      tokenAddressToAdd,
    );

    const balances = new Array(contractAddresssesToDetect.length);
    balances[indexOfTokenToAdd] = new BigNumber(10);

    sandbox
      .stub(controller, '_getTokenBalances')
      .returns(Promise.resolve(balances));

    await controller.detectNewTokens();

    expect(preferences.store.getState().tokens).toStrictEqual([
      {
        address: existingTokenAddress.toLowerCase(),
        decimals: existingToken.decimals,
        symbol: existingToken.symbol,
      },
      {
        address: tokenAddressToAdd.toLowerCase(),
        decimals: tokenToAdd.decimals,
        symbol: tokenToAdd.symbol,
      },
    ]);
  });

  it('should trigger detect new tokens when change address', async () => {
    sandbox.useFakeTimers();
    const controller = new DetectTokensController({
      preferences,
      network,
      keyringMemStore,
    });
    controller.isOpen = true;
    controller.isUnlocked = true;
    const stub = sandbox.stub(controller, 'detectNewTokens');
    await preferences.setSelectedAddress(
      '0xbc86727e770de68b1060c91f6bb6945c73e10388',
    );
    expect(stub.callCount).toStrictEqual(1);
  });

  it('should trigger detect new tokens when submit password', async () => {
    sandbox.useFakeTimers();
    const controller = new DetectTokensController({
      preferences,
      network,
      keyringMemStore,
    });
    controller.isOpen = true;
    controller.selectedAddress = '0x0';
    const stub = sandbox.stub(controller, 'detectNewTokens');
    await controller._keyringMemStore.updateState({ isUnlocked: true });
    expect(stub.callCount).toStrictEqual(1);
  });

  it('should not trigger detect new tokens when not unlocked', async () => {
    const clock = sandbox.useFakeTimers();
    network.setProviderType(MAINNET);
    const controller = new DetectTokensController({
      preferences,
      network,
      keyringMemStore,
    });
    controller.isOpen = true;
    controller.isUnlocked = false;
    const stub = sandbox.stub(controller, '_getTokenBalances');
    clock.tick(180000);
    expect(stub.callCount).toStrictEqual(0);
  });

  it('should not trigger detect new tokens when not open', async () => {
    const clock = sandbox.useFakeTimers();
    network.setProviderType(MAINNET);
    const controller = new DetectTokensController({
      preferences,
      network,
      keyringMemStore,
    });
    // trigger state update from preferences controller
    await preferences.setSelectedAddress(
      '0xbc86727e770de68b1060c91f6bb6945c73e10388',
    );
    controller.isOpen = false;
    controller.isUnlocked = true;
    const stub = sandbox.stub(controller, '_getTokenBalances');
    clock.tick(180000);
    expect(stub.callCount).toStrictEqual(0);
  });
});
