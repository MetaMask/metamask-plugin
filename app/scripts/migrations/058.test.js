import migration58 from './058';

describe('migration #58', function () {
  it('should update the version metadata', async function () {
    const oldStorage = {
      meta: {
        version: 57,
      },
      data: {},
    };

    const newStorage = await migration58.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 58,
    });
  });

  describe('deleting swapsWelcomeMessageHasBeenShown', function () {
    it('should delete the swapsWelcomeMessageHasBeenShown property', async function () {
      const oldStorage = {
        meta: {},
        data: {
          AppStateController: {
            swapsWelcomeMessageHasBeenShown: false,
            bar: 'baz',
          },
          foo: 'bar',
        },
      };
      const newStorage = await migration58.migrate(oldStorage);
      expect(newStorage.data.AppStateController).toStrictEqual({ bar: 'baz' });
    });

    it('should not modify state if the AppStateController does not exist', async function () {
      const oldStorage = {
        meta: {},
        data: {
          foo: 'bar',
        },
      };
      const newStorage = await migration58.migrate(oldStorage);
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });
  });
});
