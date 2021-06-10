import migration46 from './046';

describe('migration #46', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 45,
      },
      data: {},
    };

    const newStorage = await migration46.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 46,
    });
  });

  it('should delete ABTestController state', async () => {
    const oldStorage = {
      meta: {},
      data: {
        ABTestController: {
          abTests: {
            fullScreenVsPopup: 'control',
          },
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration46.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      foo: 'bar',
    });
  });

  it('should do nothing if ABTestController state does not exist', async () => {
    const oldStorage = {
      meta: {},
      data: {
        AppStateController: {
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration46.migrate(oldStorage);
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });
});
