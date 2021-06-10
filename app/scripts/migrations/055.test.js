import {
  GOERLI,
  GOERLI_CHAIN_ID,
  KOVAN,
  KOVAN_CHAIN_ID,
  MAINNET,
  MAINNET_CHAIN_ID,
  RINKEBY,
  RINKEBY_CHAIN_ID,
  ROPSTEN,
  ROPSTEN_CHAIN_ID,
} from '../../../shared/constants/network';
import migration55 from './055';

describe('migration #55', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 54,
      },
      data: {},
    };

    const newStorage = await migration55.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 55,
    });
  });

  it('should replace incomingTxLastFetchedBlocksByNetwork with incomingTxLastFetchedBlockByChainId, and carry over old values', async () => {
    const oldStorage = {
      meta: {},
      data: {
        IncomingTransactionsController: {
          incomingTransactions: {
            test: {
              transactionCategory: 'incoming',
              txParams: {
                foo: 'bar',
              },
            },
          },
          incomingTxLastFetchedBlocksByNetwork: {
            [MAINNET]: 1,
            [ROPSTEN]: 2,
            [RINKEBY]: 3,
            [GOERLI]: 4,
            [KOVAN]: 5,
          },
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration55.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      IncomingTransactionsController: {
        incomingTransactions:
          oldStorage.data.IncomingTransactionsController.incomingTransactions,
        incomingTxLastFetchedBlockByChainId: {
          [MAINNET_CHAIN_ID]: 1,
          [ROPSTEN_CHAIN_ID]: 2,
          [RINKEBY_CHAIN_ID]: 3,
          [GOERLI_CHAIN_ID]: 4,
          [KOVAN_CHAIN_ID]: 5,
        },
      },
      foo: 'bar',
    });
  });

  it('should do nothing if incomingTxLastFetchedBlocksByNetwork key is not populated', async () => {
    const oldStorage = {
      meta: {},
      data: {
        IncomingTransactionsController: {
          foo: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration55.migrate(oldStorage);
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });
  it('should do nothing if state is empty', async () => {
    const oldStorage = {
      meta: {},
      data: {},
    };

    const newStorage = await migration55.migrate(oldStorage);
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });
});
