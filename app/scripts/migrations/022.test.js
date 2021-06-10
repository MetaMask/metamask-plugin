import { TRANSACTION_STATUSES } from '../../../shared/constants/transaction';
import migration22 from './022';

const properTime = new Date().getTime();
const storage = {
  meta: {},
  data: {
    TransactionController: {
      transactions: [
        { status: TRANSACTION_STATUSES.SUBMITTED },
        { status: TRANSACTION_STATUSES.SUBMITTED, submittedTime: properTime },
        { status: TRANSACTION_STATUSES.CONFIRMED },
      ],
    },
  },
};

describe('storage is migrated successfully where transactions that are submitted have submittedTimes', () => {
  it('should add submittedTime key on the txMeta if appropriate', async () => {
    const migratedData = await migration22.migrate(storage);
    const [
      txMeta1,
      txMeta2,
      txMeta3,
    ] = migratedData.data.TransactionController.transactions;

    expect(migratedData.meta.version).toStrictEqual(22);
    // should have written a submitted time
    expect.anything(txMeta1.submittedTime);
    // should not have written a submitted time because it already has one
    expect(txMeta2.submittedTime).toStrictEqual(properTime);
    // should not have written a submitted time
    expect(!txMeta3.submittedTime).toStrictEqual(true);
  });
});
