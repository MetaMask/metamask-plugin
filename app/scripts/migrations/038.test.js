import migration38 from './038';

describe('migration #38', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 37,
      },
      data: {},
    };

    const newStorage = await migration38.migrate(oldStorage);
    expect(newStorage.meta.version).toStrictEqual(38);
  });

  it('should add a fullScreenVsPopup property set to either "control" or "fullScreen"', async () => {
    const oldStorage = {
      meta: {},
      data: {},
    };

    const newStorage = await migration38.migrate(oldStorage);
    expect(
      newStorage.data.ABTestController?.abTests?.fullScreenVsPopup,
    ).toStrictEqual('control');
  });

  it('should leave the fullScreenVsPopup property unchanged if it exists', async () => {
    const oldStorage = {
      meta: {},
      data: {
        ABTestController: {
          abTests: {
            fullScreenVsPopup: 'fullScreen',
          },
        },
      },
    };

    const newStorage = await migration38.migrate(oldStorage);
    expect(
      newStorage.data.ABTestController?.abTests?.fullScreenVsPopup,
    ).toStrictEqual('fullScreen');
  });
});
