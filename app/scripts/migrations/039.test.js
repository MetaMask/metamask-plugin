import migration39 from './039';

describe('migration #39', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 38,
      },
      data: {},
    };

    const newStorage = await migration39.migrate(oldStorage);
    expect(newStorage.meta.version).toStrictEqual(39);
  });

  it('should update old DAI token symbol to SAI in tokens', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          tokens: [
            {
              address: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
              decimals: 18,
              symbol: 'DAI',
            },
            {
              address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
              symbol: 'BAT',
              decimals: 18,
            },
            {
              address: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
              symbol: 'META',
              decimals: 18,
            },
          ],
        },
      },
    };

    const newStorage = await migration39.migrate(oldStorage);
    expect(newStorage.data.PreferencesController).toStrictEqual({
      tokens: [
        {
          address: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
          decimals: 18,
          symbol: 'SAI',
        },
        {
          address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
          symbol: 'BAT',
          decimals: 18,
        },
        {
          address: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
          symbol: 'META',
          decimals: 18,
        },
      ],
    });
  });

  it('should update old DAI token symbol to SAI in accountTokens', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          accountTokens: {
            '0x7250739de134d33ec7ab1ee592711e15098c9d2d': {
              mainnet: [
                {
                  address: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
                  decimals: 18,
                  symbol: 'DAI',
                },
              ],
            },
            '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5': {
              mainnet: [],
              rinkeby: [],
            },
            '0x8e5d75d60224ea0c33d1041e75de68b1c3cb6dd5': {},
            '0xb3958fb96c8201486ae20be1d5c9f58083df343a': {
              mainnet: [
                {
                  address: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
                  decimals: 18,
                  symbol: 'DAI',
                },
                {
                  address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
                  decimals: 18,
                  symbol: 'BAT',
                },
                {
                  address: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
                  decimals: 18,
                  symbol: 'META',
                },
              ],
            },
          },
        },
      },
    };

    const newStorage = await migration39.migrate(oldStorage);
    expect(newStorage.data.PreferencesController).toStrictEqual({
      accountTokens: {
        '0x7250739de134d33ec7ab1ee592711e15098c9d2d': {
          mainnet: [
            {
              address: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
              decimals: 18,
              symbol: 'SAI',
            },
          ],
        },
        '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5': {
          mainnet: [],
          rinkeby: [],
        },
        '0x8e5d75d60224ea0c33d1041e75de68b1c3cb6dd5': {},
        '0xb3958fb96c8201486ae20be1d5c9f58083df343a': {
          mainnet: [
            {
              address: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
              decimals: 18,
              symbol: 'SAI',
            },
            {
              address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
              decimals: 18,
              symbol: 'BAT',
            },
            {
              address: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
              decimals: 18,
              symbol: 'META',
            },
          ],
        },
      },
    });
  });

  it('should NOT change any state if accountTokens is not an object', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          accountTokens: [],
        },
      },
    };

    const newStorage = await migration39.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('should NOT change any state if accountTokens is an object with invalid values', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          accountTokens: {
            '0x7250739de134d33ec7ab1ee592711e15098c9d2d': [
              {
                address: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
                decimals: 18,
                symbol: 'DAI',
              },
            ],
            '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359': null,
            '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5': {
              mainnet: [null, undefined, [], 42],
              rinkeby: null,
            },
          },
        },
      },
    };

    const newStorage = await migration39.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('should NOT change any state if accountTokens includes the new DAI token', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          accountTokens: {
            '0x7250739de134d33ec7ab1ee592711e15098c9d2d': {
              mainnet: [
                {
                  address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
                  decimals: 18,
                  symbol: 'DAI',
                },
              ],
            },
            '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5': {
              mainnet: [],
              rinkeby: [],
            },
            '0x8e5d75d60224ea0c33d1041e75de68b1c3cb6dd5': {},
            '0xb3958fb96c8201486ae20be1d5c9f58083df343a': {
              mainnet: [
                {
                  address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
                  decimals: 18,
                  symbol: 'DAI',
                },
                {
                  address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
                  decimals: 18,
                  symbol: 'BAT',
                },
                {
                  address: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
                  decimals: 18,
                  symbol: 'META',
                },
              ],
            },
          },
        },
      },
    };

    const newStorage = await migration39.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('should NOT change any state if tokens includes the new DAI token', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          tokens: [
            {
              address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
              symbol: 'DAI',
              decimals: 18,
            },
            {
              address: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
              symbol: 'META',
              decimals: 18,
            },
          ],
        },
      },
    };

    const newStorage = await migration39.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('should NOT change any state if tokens does not include DAI', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          tokens: [
            {
              address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
              symbol: 'BAT',
              decimals: 18,
            },
            {
              address: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
              symbol: 'META',
              decimals: 18,
            },
          ],
        },
      },
    };

    const newStorage = await migration39.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('should NOT change any state if a tokens property has invalid entries', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          tokens: [null, [], undefined, 42],
        },
      },
    };

    const newStorage = await migration39.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('should NOT change any state if a tokens property is not an array', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          tokens: {},
        },
      },
    };

    const newStorage = await migration39.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('should NOT change any state if a tokens property is null', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          tokens: null,
        },
      },
    };

    const newStorage = await migration39.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('should NOT change any state if a tokens property is missing', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {},
      },
    };

    const newStorage = await migration39.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('should NOT change any state if a accountTokens property is missing', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {},
      },
    };

    const newStorage = await migration39.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('should NOT change any state if PreferencesController is missing', async () => {
    const oldStorage = {
      meta: {},
      data: {},
    };

    const newStorage = await migration39.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });
});
