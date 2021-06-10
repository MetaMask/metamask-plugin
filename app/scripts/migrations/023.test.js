import { TRANSACTION_STATUSES } from '../../../shared/constants/transaction';
import migration23 from './023';

const storage = {
  meta: {},
  data: {
    TransactionController: {
      transactions: [],
    },
  },
};

const transactions = [];
const transactions40 = [];
const transactions20 = [];

const txStates = Object.values(TRANSACTION_STATUSES);

const deletableTxStates = [
  TRANSACTION_STATUSES.CONFIRMED,
  TRANSACTION_STATUSES.REJECTED,
  TRANSACTION_STATUSES.FAILED,
  TRANSACTION_STATUSES.DROPPED,
];

let nonDeletableCount = 0;

let status;
while (transactions.length <= 100) {
  status =
    txStates[Math.floor(Math.random() * Math.floor(txStates.length - 1))];
  // This is an old migration, let's allow it
  // eslint-disable-next-line no-loop-func
  if (!deletableTxStates.find((s) => s === status)) {
    nonDeletableCount += 1;
  }
  transactions.push({ status });
}

while (transactions40.length < 40) {
  status =
    txStates[Math.floor(Math.random() * Math.floor(txStates.length - 1))];
  transactions40.push({ status });
}

while (transactions20.length < 20) {
  status =
    txStates[Math.floor(Math.random() * Math.floor(txStates.length - 1))];
  transactions20.push({ status });
}

storage.data.TransactionController.transactions = transactions;

describe('storage is migrated successfully and the proper transactions are remove from state', () => {
  it('should remove transactions that are unneeded', async () => {
    const migratedData = await migration23.migrate(storage);

    let leftoverNonDeletableTxCount = 0;
    const migratedTransactions =
      migratedData.data.TransactionController.transactions;
    migratedTransactions.forEach((tx) => {
      if (!deletableTxStates.find((s) => s === tx.status)) {
        leftoverNonDeletableTxCount += 1;
      }
    });

    expect(leftoverNonDeletableTxCount).toStrictEqual(nonDeletableCount);

    expect(migratedTransactions.length >= 40).toStrictEqual(true);
  });

  it('should not remove any transactions because 40 is the expected limit', async () => {
    storage.meta.version = 22;
    storage.data.TransactionController.transactions = transactions40;

    const migratedData = await migration23.migrate(storage);
    const migratedTransactions =
      migratedData.data.TransactionController.transactions;

    expect(migratedTransactions).toHaveLength(40);
  });

  it('should not remove any transactions because 20 txs is under the expected limit', async () => {
    storage.meta.version = 22;
    storage.data.TransactionController.transactions = transactions20;

    const migratedData = await migration23.migrate(storage);
    const migratedTransactions =
      migratedData.data.TransactionController.transactions;

    expect(migratedTransactions).toHaveLength(20);
  });
});
