import migration41 from './041';

describe('migration #41', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 40,
      },
      data: {},
    };

    const newStorage = await migration41.migrate(oldStorage);
    expect(newStorage.meta.version).toStrictEqual(41);
  });

  it('should rename autoLogoutTimeLimit storage key', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          preferences: {
            autoLogoutTimeLimit: 42,
            fizz: 'buzz',
          },
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration41.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        preferences: {
          autoLockTimeLimit: 42,
          fizz: 'buzz',
        },
        bar: 'baz',
      },
      foo: 'bar',
    });
  });

  it('should do nothing if no PreferencesController key', async () => {
    const oldStorage = {
      meta: {},
      data: {
        foo: 'bar',
      },
    };

    const newStorage = await migration41.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      foo: 'bar',
    });
  });

  it('should do nothing if no preferences key', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration41.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        bar: 'baz',
      },
      foo: 'bar',
    });
  });
});
