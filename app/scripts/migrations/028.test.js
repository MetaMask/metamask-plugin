import firstTimeState from '../first-time-state';
import migration28 from './028';

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
  },
};

describe('migration #28', () => {
  it('should add corresponding tokens to accountTokens', async () => {
    const newStorage = await migration28.migrate(oldStorage);

    const newTokens = newStorage.data.PreferencesController.tokens;
    const newAccountTokens =
      newStorage.data.PreferencesController.accountTokens;

    const testTokens = [
      { address: '0xa', symbol: 'A', decimals: 4 },
      { address: '0xb', symbol: 'B', decimals: 4 },
    ];
    expect(newTokens).toHaveLength(0);

    expect(newAccountTokens['0x6d14'].mainnet).toHaveLength(2);

    expect(newAccountTokens['0x3695'].mainnet).toHaveLength(2);

    expect(Object.keys(newAccountTokens)).toHaveLength(2);

    expect(newAccountTokens['0x6d14'].mainnet).toStrictEqual(testTokens);

    expect(newAccountTokens['0x3695'].mainnet).toStrictEqual(testTokens);
  });

  it('should successfully migrate first time state', async () => {
    const migratedData = await migration28.migrate({
      meta: {},
      data: firstTimeState,
    });

    expect(migratedData.meta.version).toStrictEqual(migration28.version);
  });
});
