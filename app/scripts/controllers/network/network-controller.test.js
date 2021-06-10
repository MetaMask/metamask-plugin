import sinon from 'sinon';
import { getNetworkDisplayName } from './util';
import NetworkController from './network';

describe('NetworkController', () => {
  describe('controller', () => {
    let networkController;
    const noop = () => undefined;
    const networkControllerProviderConfig = {
      getAccounts: noop,
    };

    beforeEach(() => {
      networkController = new NetworkController();
      networkController.setInfuraProjectId('foo');
    });

    describe('#provider', () => {
      it('provider should be updatable without reassignment', () => {
        networkController.initializeProvider(networkControllerProviderConfig);
        const providerProxy = networkController.getProviderAndBlockTracker()
          .provider;
        expect(providerProxy.test).toBeUndefined();
        providerProxy.setTarget({ test: true });
        expect(providerProxy.test).toStrictEqual(true);
      });
    });

    describe('#getNetworkState', () => {
      it('should return "loading" when new', () => {
        const networkState = networkController.getNetworkState();
        expect(networkState).toStrictEqual('loading');
      });
    });

    describe('#setNetworkState', () => {
      it('should update the network', () => {
        networkController.setNetworkState('1');
        const networkState = networkController.getNetworkState();
        expect(networkState).toStrictEqual('1');
      });
    });

    describe('#setProviderType', () => {
      it('should update provider.type', () => {
        networkController.initializeProvider(networkControllerProviderConfig);
        networkController.setProviderType('mainnet');
        const { type } = networkController.getProviderConfig();
        expect(type).toStrictEqual('mainnet');
      });

      it('should set the network to loading', () => {
        networkController.initializeProvider(networkControllerProviderConfig);

        const spy = sinon.spy(networkController, 'setNetworkState');
        networkController.setProviderType('mainnet');

        expect(spy.callCount).toStrictEqual(1);
        expect(spy.calledOnceWithExactly('loading')).toStrictEqual(true);
      });
    });
  });

  describe('utils', () => {
    it('getNetworkDisplayName should return the correct network name', () => {
      const tests = [
        {
          input: '3',
          expected: 'Ropsten',
        },
        {
          input: '4',
          expected: 'Rinkeby',
        },
        {
          input: '42',
          expected: 'Kovan',
        },
        {
          input: '0x3',
          expected: 'Ropsten',
        },
        {
          input: '0x4',
          expected: 'Rinkeby',
        },
        {
          input: '0x2a',
          expected: 'Kovan',
        },
        {
          input: 'ropsten',
          expected: 'Ropsten',
        },
        {
          input: 'rinkeby',
          expected: 'Rinkeby',
        },
        {
          input: 'kovan',
          expected: 'Kovan',
        },
        {
          input: 'mainnet',
          expected: 'Ethereum Mainnet',
        },
        {
          input: 'goerli',
          expected: 'Goerli',
        },
      ];

      tests.forEach(({ input, expected }) =>
        expect(getNetworkDisplayName(input)).toStrictEqual(expected),
      );
    });
  });
});
