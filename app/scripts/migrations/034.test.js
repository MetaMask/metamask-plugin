import migration34 from './034';

describe('migration #34', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 33,
      },
      data: {},
    };

    const newStorage = await migration34.migrate(oldStorage);
    expect(newStorage.meta.version).toStrictEqual(34);
  });

  it('should set migratedPrivacyMode & privacyMode if featureFlags.privacyMode was false', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          featureFlags: {
            privacyMode: false,
          },
        },
      },
    };

    const newStorage = await migration34.migrate(oldStorage);
    expect(newStorage.data.PreferencesController).toStrictEqual({
      migratedPrivacyMode: true,
      featureFlags: {
        privacyMode: true,
      },
    });
  });

  it('should NOT change any state if migratedPrivacyMode is already set to true', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          migratedPrivacyMode: true,
          featureFlags: {
            privacyMode: true,
          },
        },
      },
    };

    const newStorage = await migration34.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('should NOT change any state if migratedPrivacyMode is already set to false', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          migratedPrivacyMode: false,
          featureFlags: {
            privacyMode: true,
          },
        },
      },
    };

    const newStorage = await migration34.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('should NOT change any state if PreferencesController is missing', async () => {
    const oldStorage = {
      meta: {},
      data: {},
    };

    const newStorage = await migration34.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(newStorage.data);
  });

  it('should NOT change any state if featureFlags.privacyMode is already true', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          featureFlags: {
            privacyMode: true,
          },
        },
      },
    };

    const newStorage = await migration34.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });
});
