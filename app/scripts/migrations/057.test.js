import migration57 from './057';

describe('migration #57', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 56,
      },
      data: {},
    };

    const newStorage = await migration57.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 57,
    });
  });

  it('should transactions array into an object keyed by id', async () => {
    const oldStorage = {
      meta: {},
      data: {
        TransactionController: {
          transactions: [
            {
              id: 0,
              txParams: { foo: 'bar' },
            },
            {
              id: 1,
              txParams: { foo: 'bar' },
            },
            {
              id: 2,
              txParams: { foo: 'bar' },
            },
            {
              id: 3,
              txParams: { foo: 'bar' },
            },
          ],
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration57.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      TransactionController: {
        transactions: {
          0: {
            id: 0,
            txParams: { foo: 'bar' },
          },
          1: {
            id: 1,
            txParams: { foo: 'bar' },
          },
          2: {
            id: 2,
            txParams: { foo: 'bar' },
          },
          3: { id: 3, txParams: { foo: 'bar' } },
        },
      },
      foo: 'bar',
    });
  });

  it('should handle transactions without an id, just in case', async () => {
    const oldStorage = {
      meta: {},
      data: {
        TransactionController: {
          transactions: [
            {
              id: 0,
              txParams: { foo: 'bar' },
            },
            {
              txParams: { foo: 'bar' },
            },
            {
              txParams: { foo: 'bar' },
            },
            {
              txParams: { foo: 'bar' },
            },
          ],
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration57.migrate(oldStorage);
    const expectedTransactions = {};
    for (const transaction of Object.values(
      newStorage.data.TransactionController.transactions,
    )) {
      // Make sure each transaction now has an id.
      expect(typeof transaction.id !== 'undefined').toStrictEqual(true);
      // Build expected transaction object
      expectedTransactions[transaction.id] = transaction;
    }
    // Ensure that we got the correct number of transactions
    expect(Object.keys(expectedTransactions)).toHaveLength(
      oldStorage.data.TransactionController.transactions.length,
    );
    // Ensure that the one transaction with id is preserved, even though it is
    // a falsy id.
    expect(
      newStorage.data.TransactionController.transactions[0].id,
    ).toStrictEqual(0);
  });

  it('should not blow up if transactions are not an array', async () => {
    const storageWithTransactionsAsString = {
      meta: {},
      data: {
        TransactionController: {
          transactions: 'someone might have weird state in the future',
        },
      },
    };
    const storageWithTransactionsAsArrayOfString = {
      meta: {},
      data: {
        TransactionController: {
          transactions: 'someone might have weird state in the future'.split(
            '',
          ),
        },
      },
    };
    const result1 = await migration57.migrate(storageWithTransactionsAsString);

    const result2 = await migration57.migrate(
      storageWithTransactionsAsArrayOfString,
    );

    expect(storageWithTransactionsAsString.data).toStrictEqual(result1.data);
    expect(storageWithTransactionsAsArrayOfString.data).toStrictEqual(
      result2.data,
    );
  });

  it('should do nothing if transactions state does not exist', async () => {
    const oldStorage = {
      meta: {},
      data: {
        TransactionController: {
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration57.migrate(oldStorage);
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });

  it('should convert empty array into empty object', async () => {
    const oldStorage = {
      meta: {},
      data: {
        TransactionController: {
          transactions: [],
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration57.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      TransactionController: {
        transactions: {},
        bar: 'baz',
      },
      foo: 'bar',
    });
  });

  it('should do nothing if state is empty', async () => {
    const oldStorage = {
      meta: {},
      data: {},
    };

    const newStorage = await migration57.migrate(oldStorage);
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });
});
