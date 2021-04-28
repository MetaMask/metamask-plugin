import { strict as assert } from 'assert';
import {
  GOERLI_CHAIN_ID,
  KOVAN_CHAIN_ID,
  MAINNET_CHAIN_ID,
  RINKEBY_CHAIN_ID,
  ROPSTEN_CHAIN_ID,
} from '../../../shared/constants/network';
import migration58 from './058';

describe('migration #58', function () {
  it('should update the version metadata', async function () {
    const oldStorage = {
      meta: {
        version: 57,
      },
      data: {},
    };

    const newStorage = await migration58.migrate(oldStorage);
    assert.deepEqual(newStorage.meta, {
      version: 58,
    });
  });

  it('should replace IncomingTransactionsController with ExternalTransactionsController, and carry over old values', async function () {
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
          incomingTxLastFetchedBlockByChainId: {
            [MAINNET_CHAIN_ID]: 1,
            [ROPSTEN_CHAIN_ID]: 2,
            [RINKEBY_CHAIN_ID]: 3,
            [GOERLI_CHAIN_ID]: 4,
            [KOVAN_CHAIN_ID]: 5,
          },
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration58.migrate(oldStorage);
    assert.deepEqual(newStorage.data, {
      ExternalTransactionsController: {
        externalTransactions:
          oldStorage.data.IncomingTransactionsController.incomingTransactions,
        externalTxLastFetchedBlockByChainId: {
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

  it('should do nothing if state is empty', async function () {
    const oldStorage = {
      meta: {},
      data: {},
    };

    const newStorage = await migration58.migrate(oldStorage);
    assert.deepEqual(oldStorage.data, newStorage.data);
  });

  it('should replace showIncomingTransactions with showExternalTransactions', async function () {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          featureFlags: {
            showIncomingTransactions: true,
          },
        },
      },
    };

    const newStorage = await migration58.migrate(oldStorage);
    assert.deepEqual(newStorage.data, {
      PreferencesController: {
        featureFlags: {
          showExternalTransactions: true,
        },
      },
    });
  });
});
