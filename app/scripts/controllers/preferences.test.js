import sinon from 'sinon';
import {
  MAINNET_CHAIN_ID,
  RINKEBY_CHAIN_ID,
} from '../../../shared/constants/network';
import PreferencesController from './preferences';

describe('preferences controller', () => {
  let preferencesController;
  let network;
  let currentChainId;
  let triggerNetworkChange;
  let switchToMainnet;
  let switchToRinkeby;
  const migrateAddressBookState = sinon.stub();

  beforeEach(() => {
    currentChainId = MAINNET_CHAIN_ID;
    network = {
      getCurrentChainId: () => currentChainId,
      on: sinon.spy(),
    };
    preferencesController = new PreferencesController({
      migrateAddressBookState,
      network,
    });
    triggerNetworkChange = network.on.firstCall.args[1];
    switchToMainnet = () => {
      currentChainId = MAINNET_CHAIN_ID;
      triggerNetworkChange();
    };
    switchToRinkeby = () => {
      currentChainId = RINKEBY_CHAIN_ID;
      triggerNetworkChange();
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('setAddresses', () => {
    it('should keep a map of addresses to names and addresses in the store', () => {
      preferencesController.setAddresses(['0xda22le', '0x7e57e2']);

      const { identities } = preferencesController.store.getState();
      expect(identities).toStrictEqual({
        '0xda22le': {
          name: 'Account 1',
          address: '0xda22le',
        },
        '0x7e57e2': {
          name: 'Account 2',
          address: '0x7e57e2',
        },
      });
    });

    it('should create account tokens for each account in the store', () => {
      preferencesController.setAddresses(['0xda22le', '0x7e57e2']);

      const { accountTokens } = preferencesController.store.getState();

      expect(accountTokens).toStrictEqual({
        '0xda22le': {},
        '0x7e57e2': {},
      });
    });

    it('should replace its list of addresses', () => {
      preferencesController.setAddresses(['0xda22le', '0x7e57e2']);
      preferencesController.setAddresses(['0xda22le77', '0x7e57e277']);

      const { identities } = preferencesController.store.getState();
      expect(identities).toStrictEqual({
        '0xda22le77': {
          name: 'Account 1',
          address: '0xda22le77',
        },
        '0x7e57e277': {
          name: 'Account 2',
          address: '0x7e57e277',
        },
      });
    });
  });

  describe('removeAddress', () => {
    it('should remove an address from state', () => {
      preferencesController.setAddresses(['0xda22le', '0x7e57e2']);

      preferencesController.removeAddress('0xda22le');

      expect(
        preferencesController.store.getState().identities['0xda22le'],
      ).toBeUndefined();
    });

    it('should remove an address from state and respective tokens', () => {
      preferencesController.setAddresses(['0xda22le', '0x7e57e2']);

      preferencesController.removeAddress('0xda22le');

      expect(
        preferencesController.store.getState().accountTokens['0xda22le'],
      ).toBeUndefined();
    });

    it('should switch accounts if the selected address is removed', () => {
      preferencesController.setAddresses(['0xda22le', '0x7e57e2']);

      preferencesController.setSelectedAddress('0x7e57e2');
      preferencesController.removeAddress('0x7e57e2');

      expect(preferencesController.getSelectedAddress()).toStrictEqual(
        '0xda22le',
      );
    });
  });

  describe('setAccountLabel', () => {
    it('should update a label for the given account', () => {
      preferencesController.setAddresses(['0xda22le', '0x7e57e2']);

      expect(
        preferencesController.store.getState().identities['0xda22le'],
      ).toStrictEqual({
        name: 'Account 1',
        address: '0xda22le',
      });

      preferencesController.setAccountLabel('0xda22le', 'Dazzle');
      expect(
        preferencesController.store.getState().identities['0xda22le'],
      ).toStrictEqual({
        name: 'Dazzle',
        address: '0xda22le',
      });
    });
  });

  describe('getTokens', () => {
    it('should return an empty list initially', async () => {
      preferencesController.setAddresses(['0x7e57e2']);
      await preferencesController.setSelectedAddress('0x7e57e2');

      const tokens = preferencesController.getTokens();
      expect(tokens).toHaveLength(0);
    });
  });

  describe('addToken', () => {
    it('should add that token to its state', async () => {
      const address = '0xabcdef1234567';
      const symbol = 'ABBR';
      const decimals = 5;

      preferencesController.setAddresses(['0x7e57e2']);
      await preferencesController.setSelectedAddress('0x7e57e2');
      await preferencesController.addToken(address, symbol, decimals);

      const tokens = preferencesController.getTokens();
      expect(tokens).toHaveLength(1);

      const added = tokens[0];
      expect(added.address).toStrictEqual(address);
      expect(added.symbol).toStrictEqual(symbol);
      expect(added.decimals).toStrictEqual(decimals);
    });

    it('should allow updating a token value', async () => {
      const address = '0xabcdef1234567';
      const symbol = 'ABBR';
      const decimals = 5;

      preferencesController.setAddresses(['0x7e57e2']);
      await preferencesController.setSelectedAddress('0x7e57e2');
      await preferencesController.addToken(address, symbol, decimals);

      const newDecimals = 6;
      await preferencesController.addToken(address, symbol, newDecimals);

      const tokens = preferencesController.getTokens();
      expect(tokens).toHaveLength(1);

      const added = tokens[0];
      expect(added.address).toStrictEqual(address);
      expect(added.symbol).toStrictEqual(symbol);
      expect(added.decimals).toStrictEqual(newDecimals);
    });

    it('should allow adding tokens to two separate addresses', async () => {
      const address = '0xabcdef1234567';
      const symbol = 'ABBR';
      const decimals = 5;

      preferencesController.setAddresses(['0x7e57e2', '0xda22le']);

      await preferencesController.setSelectedAddress('0x7e57e2');
      await preferencesController.addToken(address, symbol, decimals);
      expect(preferencesController.getTokens()).toHaveLength(1);

      await preferencesController.setSelectedAddress('0xda22le');
      await preferencesController.addToken(address, symbol, decimals);
      expect(preferencesController.getTokens()).toHaveLength(1);
    });

    it('should add token per account', async () => {
      const addressFirst = '0xabcdef1234567';
      const addressSecond = '0xabcdef1234568';
      const symbolFirst = 'ABBR';
      const symbolSecond = 'ABBB';
      const decimals = 5;

      preferencesController.setAddresses(['0x7e57e2', '0xda22le']);

      await preferencesController.setSelectedAddress('0x7e57e2');
      await preferencesController.addToken(addressFirst, symbolFirst, decimals);
      const tokensFirstAddress = preferencesController.getTokens();

      await preferencesController.setSelectedAddress('0xda22le');
      await preferencesController.addToken(
        addressSecond,
        symbolSecond,
        decimals,
      );
      const tokensSeconAddress = preferencesController.getTokens();

      expect(tokensFirstAddress).not.toStrictEqual(tokensSeconAddress);
    });

    it('should add token per network', async () => {
      const addressFirst = '0xabcdef1234567';
      const addressSecond = '0xabcdef1234568';
      const symbolFirst = 'ABBR';
      const symbolSecond = 'ABBB';
      const decimals = 5;
      await preferencesController.addToken(addressFirst, symbolFirst, decimals);
      const tokensFirstAddress = preferencesController.getTokens();

      switchToRinkeby();
      await preferencesController.addToken(
        addressSecond,
        symbolSecond,
        decimals,
      );
      const tokensSeconAddress = preferencesController.getTokens();

      expect(tokensFirstAddress).not.toStrictEqual(tokensSeconAddress);
    });
  });

  describe('removeToken', () => {
    it('should remove the only token from its state', async () => {
      preferencesController.setAddresses(['0x7e57e2']);
      await preferencesController.setSelectedAddress('0x7e57e2');
      await preferencesController.addToken('0xa', 'A', 5);
      await preferencesController.removeToken('0xa');

      const tokens = preferencesController.getTokens();
      expect(tokens).toHaveLength(0);
    });

    it('should remove a token from its state', async () => {
      preferencesController.setAddresses(['0x7e57e2']);
      await preferencesController.setSelectedAddress('0x7e57e2');
      await preferencesController.addToken('0xa', 'A', 4);
      await preferencesController.addToken('0xb', 'B', 5);
      await preferencesController.removeToken('0xa');

      const tokens = preferencesController.getTokens();
      expect(tokens).toHaveLength(1);

      const [token1] = tokens;
      expect(token1).toStrictEqual({
        address: '0xb',
        symbol: 'B',
        decimals: 5,
      });
    });

    it('should remove a token from its state on corresponding address', async () => {
      preferencesController.setAddresses(['0x7e57e2', '0x7e57e3']);
      await preferencesController.setSelectedAddress('0x7e57e2');
      await preferencesController.addToken('0xa', 'A', 4);
      await preferencesController.addToken('0xb', 'B', 5);
      await preferencesController.setSelectedAddress('0x7e57e3');
      await preferencesController.addToken('0xa', 'A', 4);
      await preferencesController.addToken('0xb', 'B', 5);
      const initialTokensSecond = preferencesController.getTokens();
      await preferencesController.setSelectedAddress('0x7e57e2');
      await preferencesController.removeToken('0xa');

      const tokensFirst = preferencesController.getTokens();
      expect(tokensFirst).toHaveLength(1);

      const [token1] = tokensFirst;
      expect(token1).toStrictEqual({
        address: '0xb',
        symbol: 'B',
        decimals: 5,
      });

      await preferencesController.setSelectedAddress('0x7e57e3');
      const tokensSecond = preferencesController.getTokens();
      expect(tokensSecond).toStrictEqual(initialTokensSecond);
    });

    it('should remove a token from its state on corresponding network', async () => {
      await preferencesController.addToken('0xa', 'A', 4);
      await preferencesController.addToken('0xb', 'B', 5);
      switchToRinkeby();
      await preferencesController.addToken('0xa', 'A', 4);
      await preferencesController.addToken('0xb', 'B', 5);
      const initialTokensSecond = preferencesController.getTokens();
      switchToMainnet();
      await preferencesController.removeToken('0xa');

      const tokensFirst = preferencesController.getTokens();
      expect(tokensFirst).toHaveLength(1);

      const [token1] = tokensFirst;
      expect(token1).toStrictEqual({
        address: '0xb',
        symbol: 'B',
        decimals: 5,
      });

      switchToRinkeby();
      const tokensSecond = preferencesController.getTokens();
      expect(tokensSecond).toStrictEqual(
        initialTokensSecond,
        'token deleted for network',
      );
    });
  });

  describe('on setSelectedAddress', () => {
    it('should update tokens from its state on corresponding address', async () => {
      preferencesController.setAddresses(['0x7e57e2', '0x7e57e3']);
      await preferencesController.setSelectedAddress('0x7e57e2');
      await preferencesController.addToken('0xa', 'A', 4);
      await preferencesController.addToken('0xb', 'B', 5);
      await preferencesController.setSelectedAddress('0x7e57e3');
      await preferencesController.addToken('0xa', 'C', 4);
      await preferencesController.addToken('0xb', 'D', 5);

      await preferencesController.setSelectedAddress('0x7e57e2');
      const initialTokensFirst = preferencesController.getTokens();
      await preferencesController.setSelectedAddress('0x7e57e3');
      const initialTokensSecond = preferencesController.getTokens();

      expect(initialTokensFirst).not.toStrictEqual(initialTokensSecond);

      await preferencesController.setSelectedAddress('0x7e57e2');
      const tokensFirst = preferencesController.getTokens();
      await preferencesController.setSelectedAddress('0x7e57e3');
      const tokensSecond = preferencesController.getTokens();

      expect(tokensFirst).toStrictEqual(
        initialTokensFirst,
        'tokens equal for same account',
      );
      expect(tokensSecond).toStrictEqual(initialTokensSecond);
    });
  });

  describe('on updateStateNetworkType', () => {
    it('should remove a token from its state on corresponding network', async () => {
      await preferencesController.addToken('0xa', 'A', 4);
      await preferencesController.addToken('0xb', 'B', 5);
      const initialTokensFirst = preferencesController.getTokens();
      switchToRinkeby();
      await preferencesController.addToken('0xa', 'C', 4);
      await preferencesController.addToken('0xb', 'D', 5);
      const initialTokensSecond = preferencesController.getTokens();

      expect(initialTokensFirst).not.toStrictEqual(
        initialTokensSecond,
        'tokens not equal for different networks and tokens',
      );

      switchToMainnet();
      const tokensFirst = preferencesController.getTokens();
      switchToRinkeby();
      const tokensSecond = preferencesController.getTokens();
      expect(tokensFirst).toStrictEqual(initialTokensFirst);
      expect(tokensSecond).toStrictEqual(initialTokensSecond);
    });
  });

  describe('on watchAsset', () => {
    let req, stubHandleWatchAssetERC20;
    const sandbox = sinon.createSandbox();

    beforeEach(() => {
      req = { method: 'wallet_watchAsset', params: {} };
      stubHandleWatchAssetERC20 = sandbox.stub(
        preferencesController,
        '_handleWatchAssetERC20',
      );
    });

    afterAll(() => {
      sandbox.restore();
    });

    it('should error if passed no type', async () => {
      await expect(() =>
        preferencesController.requestWatchAsset(req),
      ).rejects.toThrow({
        message: 'Asset of type "undefined" not supported.',
      });
    });

    it('should error if method is not supported', async () => {
      req.params.type = 'someasset';
      await expect(() =>
        preferencesController.requestWatchAsset(req),
      ).rejects.toThrow({
        message: 'Asset of type "someasset" not supported.',
      });
    });

    it('should handle ERC20 type', async () => {
      req.params.type = 'ERC20';
      await preferencesController.requestWatchAsset(req);
      expect(stubHandleWatchAssetERC20.callCount).toStrictEqual(1);
    });
  });

  describe('on watchAsset of type ERC20', () => {
    let req;

    const sandbox = sinon.createSandbox();
    beforeEach(() => {
      req = { params: { type: 'ERC20' } };
    });
    afterAll(() => {
      sandbox.restore();
    });

    it('should add suggested token', async () => {
      const address = '0xabcdef1234567';
      const symbol = 'ABBR';
      const decimals = 5;
      const image = 'someimage';
      req.params.options = { address, symbol, decimals, image };

      sandbox
        .stub(preferencesController, '_validateERC20AssetParams')
        .returns(true);
      preferencesController.openPopup = async () => undefined;

      await preferencesController._handleWatchAssetERC20(req.params.options);
      const suggested = preferencesController.getSuggestedTokens();
      expect(Object.keys(suggested)).toHaveLength(1);

      expect(suggested[address].address).toStrictEqual(address);
      expect(suggested[address].symbol).toStrictEqual(symbol);
      expect(suggested[address].decimals).toStrictEqual(decimals);
      expect(suggested[address].image).toStrictEqual(image);
    });

    it('should add token correctly if user confirms', async () => {
      const address = '0xabcdef1234567';
      const symbol = 'ABBR';
      const decimals = 5;
      const image = 'someimage';
      req.params.options = { address, symbol, decimals, image };

      sandbox
        .stub(preferencesController, '_validateERC20AssetParams')
        .returns(true);
      preferencesController.openPopup = async () => {
        await preferencesController.addToken(address, symbol, decimals, image);
      };

      await preferencesController._handleWatchAssetERC20(req.params.options);
      const tokens = preferencesController.getTokens();
      expect(tokens).toHaveLength(1);
      const added = tokens[0];
      expect(added.address).toStrictEqual(address);
      expect(added.symbol).toStrictEqual(symbol);
      expect(added.decimals).toStrictEqual(decimals);

      const assetImages = preferencesController.getAssetImages();
      expect(assetImages[address]).toStrictEqual(image);
    });
    it('should validate ERC20 asset correctly', async () => {
      const validate = preferencesController._validateERC20AssetParams;

      await expect(() =>
        validate({
          address: '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07',
          symbol: 'ABC',
          decimals: 0,
        }),
      ).not.toThrow();
      await expect(() =>
        validate({
          address: '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07',
          symbol: 'ABCDEFGHIJK',
          decimals: 0,
        }),
      ).not.toThrow();

      await expect(() => validate({ symbol: 'ABC', decimals: 0 })).toThrow(
        'Must specify address, symbol, and decimals.',
      );
      await expect(() =>
        validate({
          address: '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07',
          decimals: 0,
        }),
      ).toThrow('Must specify address, symbol, and decimals.');
      await expect(() =>
        validate({
          address: '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07',
          symbol: 'ABC',
        }),
      ).toThrow('Must specify address, symbol, and decimals.');
      await expect(() =>
        validate({
          address: '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07',
          symbol: 'ABCDEFGHIJKLM',
          decimals: 0,
        }),
      ).toThrow('Invalid symbol "ABCDEFGHIJKLM": longer than 11 characters.');

      await expect(() =>
        validate({
          address: '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07',
          symbol: '',
          decimals: 0,
        }),
      ).toThrow('Must specify address, symbol, and decimals.');
      await expect(() =>
        validate({
          address: '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07',
          symbol: 'ABC',
          decimals: -1,
        }),
      ).toThrow('Invalid decimals "-1": must be 0 <= 36.');
      await expect(() =>
        validate({
          address: '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07',
          symbol: 'ABC',
          decimals: 38,
        }),
      ).toThrow('Invalid decimals "38": must be 0 <= 36.');
      await expect(() =>
        validate({ address: '0x123', symbol: 'ABC', decimals: 0 }),
      ).toThrow('Invalid address "0x123".');
    });
  });

  describe('setPasswordForgotten', () => {
    it('should default to false', () => {
      const state = preferencesController.store.getState();
      expect(state.forgottenPassword).toStrictEqual(false);
    });

    it('should set the forgottenPassword property in state', () => {
      expect(
        preferencesController.store.getState().forgottenPassword,
      ).toStrictEqual(false);

      preferencesController.setPasswordForgotten(true);

      expect(
        preferencesController.store.getState().forgottenPassword,
      ).toStrictEqual(true);
    });
  });

  describe('#updateRpc', () => {
    it('should update the rpcDetails properly', async () => {
      preferencesController.store.updateState({
        frequentRpcListDetail: [{}, { rpcUrl: 'test', chainId: '0x1' }, {}],
      });
      await preferencesController.updateRpc({ rpcUrl: 'test', chainId: '0x1' });
      await preferencesController.updateRpc({
        rpcUrl: 'test/1',
        chainId: '0x1',
      });
      await preferencesController.updateRpc({
        rpcUrl: 'test/2',
        chainId: '0x1',
      });
      await preferencesController.updateRpc({
        rpcUrl: 'test/3',
        chainId: '0x1',
      });
      const list = preferencesController.getFrequentRpcListDetail();
      expect(list[1]).toStrictEqual({ rpcUrl: 'test', chainId: '0x1' });
    });

    it('should migrate address book entries if chainId changes', async () => {
      preferencesController.store.updateState({
        frequentRpcListDetail: [{}, { rpcUrl: 'test', chainId: '1' }, {}],
      });
      await preferencesController.updateRpc({ rpcUrl: 'test', chainId: '0x1' });
      expect(migrateAddressBookState.calledWith('1', '0x1')).toStrictEqual(
        true,
      );
    });
  });

  describe('adding and removing from frequentRpcListDetail', () => {
    it('should add custom RPC url to state', () => {
      preferencesController.addToFrequentRpcList('rpc_url', '0x1');
      expect(
        preferencesController.store.getState().frequentRpcListDetail,
      ).toStrictEqual([
        {
          rpcUrl: 'rpc_url',
          chainId: '0x1',
          ticker: 'ETH',
          nickname: '',
          rpcPrefs: {},
        },
      ]);
      preferencesController.addToFrequentRpcList('rpc_url', '0x1');
      expect(
        preferencesController.store.getState().frequentRpcListDetail,
      ).toStrictEqual([
        {
          rpcUrl: 'rpc_url',
          chainId: '0x1',
          ticker: 'ETH',
          nickname: '',
          rpcPrefs: {},
        },
      ]);
    });

    it('should throw if chainId is invalid', async () => {
      await expect(() => {
        preferencesController.addToFrequentRpcList('rpc_url', '1');
      }).toThrow('Invalid chainId: "1"');
    });

    it('should remove custom RPC url from state', () => {
      preferencesController.addToFrequentRpcList('rpc_url', '0x1');
      expect(
        preferencesController.store.getState().frequentRpcListDetail,
      ).toStrictEqual([
        {
          rpcUrl: 'rpc_url',
          chainId: '0x1',
          ticker: 'ETH',
          nickname: '',
          rpcPrefs: {},
        },
      ]);
      preferencesController.removeFromFrequentRpcList('other_rpc_url');
      preferencesController.removeFromFrequentRpcList('http://localhost:8545');
      preferencesController.removeFromFrequentRpcList('rpc_url');
      expect(
        preferencesController.store.getState().frequentRpcListDetail,
      ).toStrictEqual([]);
    });
  });

  describe('setUsePhishDetect', () => {
    it('should default to true', () => {
      const state = preferencesController.store.getState();
      expect(state.usePhishDetect).toStrictEqual(true);
    });

    it('should set the usePhishDetect property in state', () => {
      expect(
        preferencesController.store.getState().usePhishDetect,
      ).toStrictEqual(true);
      preferencesController.setUsePhishDetect(false);
      expect(
        preferencesController.store.getState().usePhishDetect,
      ).toStrictEqual(false);
    });
  });
});
