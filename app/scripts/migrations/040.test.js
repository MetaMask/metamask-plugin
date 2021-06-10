import migration40 from './040';

describe('migration #40', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 39,
      },
      data: {},
    };

    const newStorage = await migration40.migrate(oldStorage);
    expect(newStorage.meta?.version).toStrictEqual(40);
  });

  it('should delete ProviderApprovalController storage key', async () => {
    const oldStorage = {
      meta: {},
      data: {
        ProviderApprovalController: {},
        foo: 'bar',
      },
    };

    const newStorage = await migration40.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      foo: 'bar',
    });
  });

  it('should do nothing if no ProviderApprovalController storage key', async () => {
    const oldStorage = {
      meta: {},
      data: { foo: 'bar' },
    };

    const newStorage = await migration40.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      foo: 'bar',
    });
  });
});
