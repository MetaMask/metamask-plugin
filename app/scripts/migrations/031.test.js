import migration31 from './031';

describe('migration #31', () => {
  it('should set completedOnboarding to true if vault exists', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          tokens: [
            { address: '0xa', symbol: 'A', decimals: 4 },
            { address: '0xb', symbol: 'B', decimals: 4 },
          ],
          identities: {
            '0x6d14': {},
            '0x3695': {},
          },
        },
        KeyringController: {
          vault: {
            data: 'test0',
            iv: 'test1',
            salt: 'test2',
          },
        },
      },
    };

    const newStorage = await migration31.migrate(oldStorage);

    expect(
      newStorage.data.PreferencesController.completedOnboarding,
    ).toStrictEqual(true);
  });

  it('should set completedOnboarding to false if vault does not exist', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          tokens: [
            { address: '0xa', symbol: 'A', decimals: 4 },
            { address: '0xb', symbol: 'B', decimals: 4 },
          ],
          identities: {
            '0x6d14': {},
            '0x3695': {},
          },
        },
        KeyringController: {},
      },
    };

    const newStorage = await migration31.migrate(oldStorage);
    expect(
      newStorage.data.PreferencesController.completedOnboarding,
    ).toStrictEqual(false);
  });
});
