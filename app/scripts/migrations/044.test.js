import migration44 from './044';

describe('migration #44', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 43,
      },
      data: {},
    };

    const newStorage = await migration44.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 44,
    });
  });

  it('should delete mkrMigrationReminderTimestamp state', async () => {
    const oldStorage = {
      meta: {},
      data: {
        AppStateController: {
          mkrMigrationReminderTimestamp: 'some timestamp',
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration44.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      AppStateController: {
        bar: 'baz',
      },
      foo: 'bar',
    });
  });

  it('should delete mkrMigrationReminderTimestamp state if it is null', async () => {
    const oldStorage = {
      meta: {},
      data: {
        AppStateController: {
          mkrMigrationReminderTimestamp: null,
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration44.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      AppStateController: {
        bar: 'baz',
      },
      foo: 'bar',
    });
  });

  it('should do nothing if mkrMigrationReminderTimestamp state does not exist', async () => {
    const oldStorage = {
      meta: {},
      data: {
        AppStateController: {
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration44.migrate(oldStorage);
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });
});
