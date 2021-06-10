import firstTimeState from '../first-time-state';
import migration26 from './026';

const oldStorage = {
  meta: { version: 25 },
  data: {
    PreferencesController: {},
    KeyringController: {
      walletNicknames: {
        '0x1e77e2': 'Test Account 1',
        '0x7e57e2': 'Test Account 2',
      },
    },
  },
};

describe('migration #26', () => {
  it('should move the identities from KeyringController', async () => {
    const newStorage = await migration26.migrate(oldStorage);

    const { identities } = newStorage.data.PreferencesController;

    expect(identities).toStrictEqual({
      '0x1e77e2': { name: 'Test Account 1', address: '0x1e77e2' },
      '0x7e57e2': { name: 'Test Account 2', address: '0x7e57e2' },
    });

    expect(newStorage.data.KeyringController.walletNicknames).toBeUndefined();
  });

  it('should successfully migrate first time state', async () => {
    const migratedData = await migration26.migrate({
      meta: {},
      data: firstTimeState,
    });
    expect(migratedData.meta.version).toStrictEqual(migration26.version);
  });
});
