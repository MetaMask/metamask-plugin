import migration36 from './036';

describe('migration #36', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 35,
      },
      data: {},
    };

    const newStorage = await migration36.migrate(oldStorage);
    expect(newStorage.meta.version).toStrictEqual(36);
  });

  it('should remove privacyMode if featureFlags.privacyMode was false', async () => {
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

    const newStorage = await migration36.migrate(oldStorage);
    expect(newStorage.data.PreferencesController).toStrictEqual({
      featureFlags: {},
    });
  });

  it('should remove privacyMode if featureFlags.privacyMode was true', async () => {
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

    const newStorage = await migration36.migrate(oldStorage);
    expect(newStorage.data.PreferencesController).toStrictEqual({
      featureFlags: {},
    });
  });

  it('should NOT change any state if privacyMode does not exist', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          migratedPrivacyMode: true,
          featureFlags: {},
        },
      },
    };

    const newStorage = await migration36.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('should NOT change any state if PreferencesController is missing', async () => {
    const oldStorage = {
      meta: {},
      data: {},
    };

    const newStorage = await migration36.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('should NOT change any state if featureFlags is missing', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {},
      },
    };

    const newStorage = await migration36.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });
});
