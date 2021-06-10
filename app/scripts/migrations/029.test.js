import { TRANSACTION_STATUSES } from '../../../shared/constants/transaction';
import migration29 from './029';

const properTime = new Date().getTime();
const storage = {
  meta: {},
  data: {
    TransactionController: {
      transactions: [
        { status: TRANSACTION_STATUSES.APPROVED, id: 1, submittedTime: 0 },
        {
          status: TRANSACTION_STATUSES.APPROVED,
          id: 2,
          submittedTime: properTime,
        },
        {
          status: TRANSACTION_STATUSES.CONFIRMED,
          id: 3,
          submittedTime: properTime,
        },
        {
          status: TRANSACTION_STATUSES.SUBMITTED,
          id: 4,
          submittedTime: properTime,
        },
        { status: TRANSACTION_STATUSES.SUBMITTED, id: 5, submittedTime: 0 },
      ],
    },
  },
};

describe('storage is migrated successfully where transactions that are submitted have submittedTimes', () => {
  it('should auto fail transactions more than 12 hours old', async () => {
    const migratedData = await migration29.migrate(storage);
    const txs = migratedData.data.TransactionController.transactions;
    const [txMeta1] = txs;

    expect(migratedData.meta.version).toStrictEqual(29);
    expect(txMeta1.status).toStrictEqual(TRANSACTION_STATUSES.FAILED);

    txs.forEach((tx) => {
      if (tx.id === 1) {
        return;
      }
      expect(tx.status).not.toStrictEqual(TRANSACTION_STATUSES.FAILED);
    });
  });
});
