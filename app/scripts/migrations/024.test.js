/* eslint-disable jest/no-conditional-expect */
import data from '../first-time-state';
import { TRANSACTION_STATUSES } from '../../../shared/constants/transaction';
import migration24 from './024';

const firstTimeState = {
  meta: {},
  data,
};
const storage = {
  meta: {},
  data: {
    TransactionController: {
      transactions: [],
    },
  },
};

const transactions = [];

while (transactions.length <= 10) {
  transactions.push({
    txParams: { from: '0x8aCce2391c0d510a6c5E5d8f819a678f79b7e675' },
    status: TRANSACTION_STATUSES.UNAPPROVED,
  });
  transactions.push({
    txParams: { from: '0x8aCce2391c0d510a6c5E5d8f819a678f79b7e675' },
    status: TRANSACTION_STATUSES.CONFIRMED,
  });
}

storage.data.TransactionController.transactions = transactions;

describe('storage is migrated successfully and the txParams.from are lowercase', () => {
  it('should lowercase the from for unapproved txs', async () => {
    const migratedData = await migration24.migrate(storage);
    const migratedTransactions =
      migratedData.data.TransactionController.transactions;

    migratedTransactions.forEach((tx) => {
      if (tx.status === TRANSACTION_STATUSES.UNAPPROVED) {
        expect(tx.txParams.from).toStrictEqual(
          '0x8acce2391c0d510a6c5e5d8f819a678f79b7e675',
        );
      } else {
        expect(tx.txParams.from).toStrictEqual(
          '0x8aCce2391c0d510a6c5E5d8f819a678f79b7e675',
        );
      }
    });
  });

  it('should migrate first time state', async () => {
    const migratedData = await migration24.migrate(firstTimeState);
    expect(migratedData.meta.version).toStrictEqual(24);
  });
});
