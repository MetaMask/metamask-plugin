import firstTimeState from '../first-time-state';
import { TRANSACTION_STATUSES } from '../../../shared/constants/transaction';
import migration27 from './027';

const oldStorage = {
  meta: {},
  data: {
    TransactionController: {
      transactions: [],
    },
  },
};

const transactions = [];

while (transactions.length < 9) {
  transactions.push({ status: TRANSACTION_STATUSES.REJECTED });
  transactions.push({ status: TRANSACTION_STATUSES.UNAPPROVED });
  transactions.push({ status: TRANSACTION_STATUSES.APPROVED });
}

oldStorage.data.TransactionController.transactions = transactions;

describe('migration #27', () => {
  it('should remove rejected transactions', async () => {
    const newStorage = await migration27.migrate(oldStorage);

    const newTransactions = newStorage.data.TransactionController.transactions;

    expect(newTransactions).toHaveLength(6);

    newTransactions.forEach((txMeta) => {
      if (txMeta.status === TRANSACTION_STATUSES.REJECTED) {
        throw new Error('transaction was found with a status of rejected');
      }
    });
  });

  it('should successfully migrate first time state', async () => {
    const migratedData = await migration27.migrate({
      meta: {},
      data: firstTimeState,
    });

    expect(migratedData.meta.version).toStrictEqual(migration27.version);
  });
});
