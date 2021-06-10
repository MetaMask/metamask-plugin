import migration60 from './060';

describe('migration #60', function () {
  it('should update the version metadata', async function () {
    const oldStorage = {
      meta: {
        version: 59,
      },
      data: {},
    };

    const newStorage = await migration60.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 60,
    });
  });

  it('prunes the support notification', async function () {
    const oldStorage = {
      meta: {},
      data: {
        NotificationController: {
          notifications: {
            1: {
              id: 1,
              date: '2021-03-17',
              image: {
                src: 'images/mobile-link-qr.svg',
                height: '230px',
                width: '230px',
                placeImageBelowDescription: true,
              },
            },
            2: {
              id: 2,
              date: '2020-08-31',
            },
            3: {
              id: 3,
              date: '2021-03-08',
            },
            4: {
              id: 4,
              date: '2021-05-11',
              image: {
                src: 'images/source-logos-bsc.svg',
                width: '100%',
              },
            },
          },
        },
      },
    };

    const newStorage = await migration60.migrate(oldStorage);
    const { notifications } = newStorage.data.NotificationController;
    const notificationKeys = Object.keys(notifications);
    // Expect support notification is removed
    expect(notificationKeys).toHaveLength(3);
    notificationKeys.forEach((key) => {
      expect(notifications[key].date).not.toStrictEqual('2020-08-31');
    });
  });

  it('does not modify state when the support notification does not exist', async function () {
    const oldStorage = {
      meta: {},
      data: {
        NotificationController: {
          notifications: {
            1: {
              id: 1,
              date: '2021-03-17',
              image: {
                src: 'images/mobile-link-qr.svg',
                height: '230px',
                width: '230px',
                placeImageBelowDescription: true,
              },
            },
            3: {
              id: 3,
              date: '2021-03-08',
            },
            4: {
              id: 4,
              date: '2021-05-11',
              image: {
                src: 'images/source-logos-bsc.svg',
                width: '100%',
              },
            },
          },
        },
      },
    };

    const newStorage = await migration60.migrate(oldStorage);
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });

  it('does not modify state when NotificationsController is undefined', async function () {
    const oldStorage = {
      meta: {},
      data: {
        arbitraryPropOne: 1,
        arbitraryPropTwo: 2,
      },
    };

    const newStorage = await migration60.migrate(oldStorage);
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });

  it('does not modify state when notifications are undefined', async function () {
    const oldStorage = {
      meta: {},
      data: {
        NotificationController: {
          arbitraryControllerProp: 'foo',
        },
      },
    };

    const newStorage = await migration60.migrate(oldStorage);
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });

  it('does not modify state when notifications are not an object', async function () {
    const oldStorage = {
      meta: {},
      data: {
        NotificationController: {
          notifications: [],
        },
      },
    };

    const newStorage = await migration60.migrate(oldStorage);
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });
});
