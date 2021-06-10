import {
  MAINNET_CHAIN_ID,
  ROPSTEN_CHAIN_ID,
} from '../../../shared/constants/network';
import migration54 from './054';

describe('migration #54', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 53,
      },
      data: {},
    };

    const newStorage = await migration54.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 54,
    });
  });

  it('should retype instance of 0 decimal values to numbers [tokens]', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          tokens: [
            {
              address: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
              decimals: '0',
              symbol: 'CK',
            },
            {
              address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
              decimals: 18,
              symbol: 'BAT',
            },
            {
              address: '0x514910771af9ca656af840dff83e8264ecf986ca',
              decimals: 18,
              symbol: 'LINK',
            },
            {
              address: '0x629a673a8242c2ac4b7b8c5d8735fbeac21a6205',
              decimals: '0',
              symbol: 'SOR',
            },
          ],
          accountTokens: [],
        },
      },
    };

    const newStorage = await migration54.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        tokens: [
          {
            address: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
            decimals: 0,
            symbol: 'CK',
          },
          {
            address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
            decimals: 18,
            symbol: 'BAT',
          },
          {
            address: '0x514910771af9ca656af840dff83e8264ecf986ca',
            decimals: 18,
            symbol: 'LINK',
          },
          {
            address: '0x629a673a8242c2ac4b7b8c5d8735fbeac21a6205',
            decimals: 0,
            symbol: 'SOR',
          },
        ],
        accountTokens: [],
      },
    });
  });

  it('should do nothing if all decimal value typings are correct [tokens]', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          tokens: [
            {
              address: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
              decimals: 0,
              symbol: 'CK',
            },
            {
              address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
              decimals: 18,
              symbol: 'BAT',
            },
            {
              address: '0x514910771af9ca656af840dff83e8264ecf986ca',
              decimals: 18,
              symbol: 'LINK',
            },
            {
              address: '0x629a673a8242c2ac4b7b8c5d8735fbeac21a6205',
              decimals: 0,
              symbol: 'SOR',
            },
          ],
          accountTokens: [],
        },
      },
    };

    const newStorage = await migration54.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        tokens: [
          {
            address: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
            decimals: 0,
            symbol: 'CK',
          },
          {
            address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
            decimals: 18,
            symbol: 'BAT',
          },
          {
            address: '0x514910771af9ca656af840dff83e8264ecf986ca',
            decimals: 18,
            symbol: 'LINK',
          },
          {
            address: '0x629a673a8242c2ac4b7b8c5d8735fbeac21a6205',
            decimals: 0,
            symbol: 'SOR',
          },
        ],
        accountTokens: [],
      },
    });
  });

  it('should retype instance of 0 decimal values to numbers [accountTokens]', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          accountTokens: {
            '0x1111': {
              [MAINNET_CHAIN_ID]: [
                {
                  address: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
                  decimals: '0',
                  symbol: 'CK',
                },
                {
                  address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
                  decimals: 18,
                  symbol: 'BAT',
                },
                {
                  address: '0x514910771af9ca656af840dff83e8264ecf986ca',
                  decimals: 18,
                  symbol: 'LINK',
                },
                {
                  address: '0x629a673a8242c2ac4b7b8c5d8735fbeac21a6205',
                  decimals: '0',
                  symbol: 'SOR',
                },
              ],
            },
            '0x1112': {
              [ROPSTEN_CHAIN_ID]: [
                {
                  address: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
                  decimals: '0',
                  symbol: 'CK',
                },
                {
                  address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
                  decimals: 18,
                  symbol: 'BAT',
                },
                {
                  address: '0x514910771af9ca656af840dff83e8264ecf986ca',
                  decimals: 18,
                  symbol: 'LINK',
                },
                {
                  address: '0x629a673a8242c2ac4b7b8c5d8735fbeac21a6205',
                  decimals: '0',
                  symbol: 'SOR',
                },
              ],
            },
          },
          tokens: [],
        },
      },
    };

    const newStorage = await migration54.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        accountTokens: {
          '0x1111': {
            [MAINNET_CHAIN_ID]: [
              {
                address: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
                decimals: 0,
                symbol: 'CK',
              },
              {
                address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
                decimals: 18,
                symbol: 'BAT',
              },
              {
                address: '0x514910771af9ca656af840dff83e8264ecf986ca',
                decimals: 18,
                symbol: 'LINK',
              },
              {
                address: '0x629a673a8242c2ac4b7b8c5d8735fbeac21a6205',
                decimals: 0,
                symbol: 'SOR',
              },
            ],
          },
          '0x1112': {
            [ROPSTEN_CHAIN_ID]: [
              {
                address: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
                decimals: 0,
                symbol: 'CK',
              },
              {
                address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
                decimals: 18,
                symbol: 'BAT',
              },
              {
                address: '0x514910771af9ca656af840dff83e8264ecf986ca',
                decimals: 18,
                symbol: 'LINK',
              },
              {
                address: '0x629a673a8242c2ac4b7b8c5d8735fbeac21a6205',
                decimals: 0,
                symbol: 'SOR',
              },
            ],
          },
        },
        tokens: [],
      },
    });
  });

  it('should do nothing if all decimal value typings are correct [accountTokens]', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          accountTokens: {
            '0x1111': {
              [MAINNET_CHAIN_ID]: [
                {
                  address: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
                  decimals: 0,
                  symbol: 'CK',
                },
                {
                  address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
                  decimals: 18,
                  symbol: 'BAT',
                },
                {
                  address: '0x514910771af9ca656af840dff83e8264ecf986ca',
                  decimals: 18,
                  symbol: 'LINK',
                },
                {
                  address: '0x629a673a8242c2ac4b7b8c5d8735fbeac21a6205',
                  decimals: 0,
                  symbol: 'SOR',
                },
              ],
            },
            '0x1112': {
              [ROPSTEN_CHAIN_ID]: [
                {
                  address: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
                  decimals: 0,
                  symbol: 'CK',
                },
                {
                  address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
                  decimals: 18,
                  symbol: 'BAT',
                },
                {
                  address: '0x514910771af9ca656af840dff83e8264ecf986ca',
                  decimals: 18,
                  symbol: 'LINK',
                },
                {
                  address: '0x629a673a8242c2ac4b7b8c5d8735fbeac21a6205',
                  decimals: 0,
                  symbol: 'SOR',
                },
              ],
            },
          },
          tokens: [],
        },
      },
    };

    const newStorage = await migration54.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        accountTokens: {
          '0x1111': {
            [MAINNET_CHAIN_ID]: [
              {
                address: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
                decimals: 0,
                symbol: 'CK',
              },
              {
                address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
                decimals: 18,
                symbol: 'BAT',
              },
              {
                address: '0x514910771af9ca656af840dff83e8264ecf986ca',
                decimals: 18,
                symbol: 'LINK',
              },
              {
                address: '0x629a673a8242c2ac4b7b8c5d8735fbeac21a6205',
                decimals: 0,
                symbol: 'SOR',
              },
            ],
          },
          '0x1112': {
            [ROPSTEN_CHAIN_ID]: [
              {
                address: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
                decimals: 0,
                symbol: 'CK',
              },
              {
                address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
                decimals: 18,
                symbol: 'BAT',
              },
              {
                address: '0x514910771af9ca656af840dff83e8264ecf986ca',
                decimals: 18,
                symbol: 'LINK',
              },
              {
                address: '0x629a673a8242c2ac4b7b8c5d8735fbeac21a6205',
                decimals: 0,
                symbol: 'SOR',
              },
            ],
          },
        },
        tokens: [],
      },
    });
  });

  it('should retype instance of 0 decimal values to numbers [accountTokens and tokens]', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          accountTokens: {
            '0x1111': {
              [MAINNET_CHAIN_ID]: [
                {
                  address: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
                  decimals: '0',
                  symbol: 'CK',
                },
                {
                  address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
                  decimals: 18,
                  symbol: 'BAT',
                },
                {
                  address: '0x514910771af9ca656af840dff83e8264ecf986ca',
                  decimals: 18,
                  symbol: 'LINK',
                },
                {
                  address: '0x629a673a8242c2ac4b7b8c5d8735fbeac21a6205',
                  decimals: '0',
                  symbol: 'SOR',
                },
              ],
            },
            '0x1112': {
              [ROPSTEN_CHAIN_ID]: [
                {
                  address: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
                  decimals: '0',
                  symbol: 'CK',
                },
                {
                  address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
                  decimals: 18,
                  symbol: 'BAT',
                },
                {
                  address: '0x514910771af9ca656af840dff83e8264ecf986ca',
                  decimals: 18,
                  symbol: 'LINK',
                },
                {
                  address: '0x629a673a8242c2ac4b7b8c5d8735fbeac21a6205',
                  decimals: '0',
                  symbol: 'SOR',
                },
              ],
            },
          },
          tokens: [
            {
              address: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
              decimals: '0',
              symbol: 'CK',
            },
            {
              address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
              decimals: 18,
              symbol: 'BAT',
            },
            {
              address: '0x514910771af9ca656af840dff83e8264ecf986ca',
              decimals: 18,
              symbol: 'LINK',
            },
            {
              address: '0x629a673a8242c2ac4b7b8c5d8735fbeac21a6205',
              decimals: '0',
              symbol: 'SOR',
            },
          ],
        },
      },
    };

    const newStorage = await migration54.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        accountTokens: {
          '0x1111': {
            [MAINNET_CHAIN_ID]: [
              {
                address: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
                decimals: 0,
                symbol: 'CK',
              },
              {
                address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
                decimals: 18,
                symbol: 'BAT',
              },
              {
                address: '0x514910771af9ca656af840dff83e8264ecf986ca',
                decimals: 18,
                symbol: 'LINK',
              },
              {
                address: '0x629a673a8242c2ac4b7b8c5d8735fbeac21a6205',
                decimals: 0,
                symbol: 'SOR',
              },
            ],
          },
          '0x1112': {
            [ROPSTEN_CHAIN_ID]: [
              {
                address: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
                decimals: 0,
                symbol: 'CK',
              },
              {
                address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
                decimals: 18,
                symbol: 'BAT',
              },
              {
                address: '0x514910771af9ca656af840dff83e8264ecf986ca',
                decimals: 18,
                symbol: 'LINK',
              },
              {
                address: '0x629a673a8242c2ac4b7b8c5d8735fbeac21a6205',
                decimals: 0,
                symbol: 'SOR',
              },
            ],
          },
        },
        tokens: [
          {
            address: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
            decimals: 0,
            symbol: 'CK',
          },
          {
            address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
            decimals: 18,
            symbol: 'BAT',
          },
          {
            address: '0x514910771af9ca656af840dff83e8264ecf986ca',
            decimals: 18,
            symbol: 'LINK',
          },
          {
            address: '0x629a673a8242c2ac4b7b8c5d8735fbeac21a6205',
            decimals: 0,
            symbol: 'SOR',
          },
        ],
      },
    });
  });

  it('should retype instance of 0 decimal values to numbers, and remove tokens with corrupted decimal values [accountTokens and tokens]', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          accountTokens: {
            '0x1111': {
              [MAINNET_CHAIN_ID]: [
                {
                  address: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
                  decimals: '',
                  symbol: 'CK',
                },
                {
                  address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
                  decimals: 18,
                  symbol: 'BAT',
                },
                {
                  address: '0x514910771af9ca656af840dff83e8264ecf986ca',
                  decimals: 18,
                  symbol: 'LINK',
                },
                {
                  address: '0x629a673a8242c2ac4b7b8c5d8735fbeac21a6205',
                  decimals: '0',
                  symbol: 'SOR',
                },
              ],
            },
            '0x1112': {
              [ROPSTEN_CHAIN_ID]: [
                {
                  address: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
                  decimals: '0',
                  symbol: 'CK',
                },
                {
                  address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
                  decimals: 18,
                  symbol: 'BAT',
                },
                {
                  address: '0x514910771af9ca656af840dff83e8264ecf986ca',
                  decimals: 18,
                  symbol: 'LINK',
                },
                {
                  address: '0x629a673a8242c2ac4b7b8c5d8735fbeac21a6205',
                  decimals: 'corrupted_decimal?',
                  symbol: 'SOR',
                },
              ],
            },
          },
          tokens: [
            {
              address: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
              decimals: '0',
              symbol: 'CK',
            },
            {
              address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
              decimals: 18,
              symbol: 'BAT',
            },
            {
              address: '0x514910771af9ca656af840dff83e8264ecf986ca',
              decimals: 18,
              symbol: 'LINK',
            },
            {
              address: '0x629a673a8242c2ac4b7b8c5d8735fbeac21a6205',
              decimals: '18xx',
              symbol: 'SOR',
            },
          ],
        },
      },
    };

    const newStorage = await migration54.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        accountTokens: {
          '0x1111': {
            [MAINNET_CHAIN_ID]: [
              {
                address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
                decimals: 18,
                symbol: 'BAT',
              },
              {
                address: '0x514910771af9ca656af840dff83e8264ecf986ca',
                decimals: 18,
                symbol: 'LINK',
              },
              {
                address: '0x629a673a8242c2ac4b7b8c5d8735fbeac21a6205',
                decimals: 0,
                symbol: 'SOR',
              },
            ],
          },
          '0x1112': {
            [ROPSTEN_CHAIN_ID]: [
              {
                address: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
                decimals: 0,
                symbol: 'CK',
              },
              {
                address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
                decimals: 18,
                symbol: 'BAT',
              },
              {
                address: '0x514910771af9ca656af840dff83e8264ecf986ca',
                decimals: 18,
                symbol: 'LINK',
              },
            ],
          },
        },
        tokens: [
          {
            address: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
            decimals: 0,
            symbol: 'CK',
          },
          {
            address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
            decimals: 18,
            symbol: 'BAT',
          },
          {
            address: '0x514910771af9ca656af840dff83e8264ecf986ca',
            decimals: 18,
            symbol: 'LINK',
          },
        ],
      },
    });
  });
});
