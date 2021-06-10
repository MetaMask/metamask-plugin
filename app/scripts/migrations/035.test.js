import migration35 from './035';

describe('migration #35', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 34,
      },
      data: {},
    };

    const newStorage = await migration35.migrate(oldStorage);
    expect(newStorage.meta.version).toStrictEqual(35);
  });

  it('should delete seedWords', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          seedWords: 'seed words',
        },
      },
    };

    const newStorage = await migration35.migrate(oldStorage);
    expect(newStorage.data.PreferencesController).toStrictEqual({});
  });

  it('should delete falsy seedWords', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          seedWords: '',
        },
      },
    };

    const newStorage = await migration35.migrate(oldStorage);
    expect(newStorage.data.PreferencesController).toStrictEqual({});
  });

  it('should leave state without seedWords unchanged', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          frequentRpcListDetail: [],
          accountTokens: {},
          assetImages: {},
          tokens: [],
          suggestedTokens: {},
          useBlockie: false,
          knownMethodData: {},
          participateInMetaMetrics: null,
          firstTimeFlowType: null,
          currentLocale: 'en',
          identities: {},
          lostIdentities: {},
          forgottenPassword: false,
          preferences: {
            useNativeCurrencyAsPrimaryCurrency: true,
          },
          completedOnboarding: false,
          migratedPrivacyMode: false,
          metaMetricsId: null,
          metaMetricsSendCount: 0,
        },
      },
    };

    const newStorage = await migration35.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });
});
