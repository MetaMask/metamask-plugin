import migration48 from './048';

const localhostNetwork = {
  rpcUrl: 'http://localhost:8545',
  chainId: '0x539',
  ticker: 'ETH',
  nickname: 'Localhost 8545',
  rpcPrefs: {},
};
const expectedPreferencesState = {
  PreferencesController: {
    frequentRpcListDetail: [
      {
        ...localhostNetwork,
      },
    ],
  },
};

describe('migration #48', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 47,
      },
      data: {},
    };

    const newStorage = await migration48.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 48,
    });
  });

  it('should delete NetworkController.settings', async () => {
    const oldStorage = {
      meta: {},
      data: {
        NetworkController: {
          settings: {
            fizz: 'buzz',
          },
          provider: {
            type: 'notRpc',
          },
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration48.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      ...expectedPreferencesState,
      NetworkController: {
        provider: {
          type: 'notRpc',
        },
      },
      foo: 'bar',
    });
  });

  it('should migrate NetworkController.provider to Rinkeby if the type is "rpc" and the chainId is invalid (1)', async () => {
    const oldStorage = {
      meta: {},
      data: {
        NetworkController: {
          provider: {
            type: 'rpc',
            chainId: 'foo',
            fizz: 'buzz',
          },
          foo: 'bar',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration48.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      ...expectedPreferencesState,
      NetworkController: {
        provider: {
          type: 'rinkeby',
          rpcUrl: '',
          chainId: '0x4',
          nickname: '',
          rpcPrefs: {},
          ticker: 'ETH',
        },
        foo: 'bar',
      },
      foo: 'bar',
    });
  });

  it('should migrate NetworkController.provider to Rinkeby if the type is "rpc" and the chainId is invalid (2)', async () => {
    const oldStorage = {
      meta: {},
      data: {
        NetworkController: {
          provider: {
            type: 'rpc',
            chainId: '0x01',
            fizz: 'buzz',
          },
          foo: 'bar',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration48.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      ...expectedPreferencesState,
      NetworkController: {
        provider: {
          type: 'rinkeby',
          rpcUrl: '',
          chainId: '0x4',
          nickname: '',
          rpcPrefs: {},
          ticker: 'ETH',
        },
        foo: 'bar',
      },
      foo: 'bar',
    });
  });

  it('should not migrate NetworkController.provider to Rinkeby if the type is "rpc" and the chainId is valid', async () => {
    const oldStorage = {
      meta: {},
      data: {
        NetworkController: {
          provider: {
            type: 'rpc',
            chainId: '0x1',
            fizz: 'buzz',
          },
          foo: 'bar',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration48.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      ...expectedPreferencesState,
      NetworkController: {
        provider: {
          type: 'rpc',
          chainId: '0x1',
          fizz: 'buzz',
        },
        foo: 'bar',
      },
      foo: 'bar',
    });
  });

  it('should migrate NetworkController.provider to Rinkeby if the type is "localhost"', async () => {
    const oldStorage = {
      meta: {},
      data: {
        NetworkController: {
          provider: {
            type: 'localhost',
            fizz: 'buzz',
          },
          foo: 'bar',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration48.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      ...expectedPreferencesState,
      NetworkController: {
        provider: {
          type: 'rinkeby',
          rpcUrl: '',
          chainId: '0x4',
          nickname: '',
          rpcPrefs: {},
          ticker: 'ETH',
        },
        foo: 'bar',
      },
      foo: 'bar',
    });
  });

  it('should re-key NetworkController.provider.rpcTarget to rpcUrl if the type is not "rpc" or "localhost"', async () => {
    const oldStorage = {
      meta: {},
      data: {
        NetworkController: {
          provider: {
            type: 'someType',
            rpcTarget: 'foo.xyz',
            fizz: 'buzz',
          },
          foo: 'bar',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration48.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      ...expectedPreferencesState,
      NetworkController: {
        foo: 'bar',
        provider: {
          type: 'someType',
          rpcUrl: 'foo.xyz',
          fizz: 'buzz',
        },
      },
      foo: 'bar',
    });
  });

  it('should do nothing to NetworkController if affected state does not exist', async () => {
    const oldStorage = {
      meta: {},
      data: {
        NetworkController: {
          provider: {
            type: 'notRpc',
          },
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration48.migrate(oldStorage);
    expect({ ...expectedPreferencesState, ...oldStorage.data }).toStrictEqual({
      ...expectedPreferencesState,
      ...newStorage.data,
    });
  });

  it('should add frequentRpcListDetail item to beginning of list', async () => {
    const existingList = [
      { rpcUrl: 'foo', chainId: '0x1' },
      { rpcUrl: 'bar', chainId: '0x2' },
    ];

    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          frequentRpcListDetail: [...existingList],
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration48.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        frequentRpcListDetail: [{ ...localhostNetwork }, ...existingList],
      },
      foo: 'bar',
    });
  });

  it('should delete CachedBalancesController.cachedBalances', async () => {
    const oldStorage = {
      meta: {},
      data: {
        CachedBalancesController: {
          cachedBalances: {
            fizz: 'buzz',
          },
          bar: {
            baz: 'buzz',
          },
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration48.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      ...expectedPreferencesState,
      CachedBalancesController: {
        bar: {
          baz: 'buzz',
        },
      },
      foo: 'bar',
    });
  });

  it('should convert hex transaction metamaskNetworkId values to decimal', async () => {
    const oldStorage = {
      meta: {},
      data: {
        TransactionController: {
          transactions: [
            { fizz: 'buzz' },
            null,
            undefined,
            0,
            '',
            { foo: 'bar', metamaskNetworkId: '1' },
            { foo: 'bar', metamaskNetworkId: '0x1' },
            { foo: 'bar', metamaskNetworkId: 'kaplar' },
            { foo: 'bar', metamaskNetworkId: '0X2a' },
            { foo: 'bar', metamaskNetworkId: '3' },
          ],
          bar: {
            baz: 'buzz',
          },
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration48.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      ...expectedPreferencesState,
      TransactionController: {
        transactions: [
          { fizz: 'buzz' },
          null,
          undefined,
          0,
          '',
          { foo: 'bar', metamaskNetworkId: '1' },
          { foo: 'bar', metamaskNetworkId: '1' },
          { foo: 'bar', metamaskNetworkId: 'kaplar' },
          { foo: 'bar', metamaskNetworkId: '42' },
          { foo: 'bar', metamaskNetworkId: '3' },
        ],
        bar: {
          baz: 'buzz',
        },
      },
      foo: 'bar',
    });
  });

  it('should migrate the address book', async () => {
    const oldStorage = {
      meta: {},
      data: {
        AddressBookController: {
          addressBook: {
            '1': {
              address1: {
                chainId: '1',
                foo: 'bar',
              },
            },
            '100': {
              address1: {
                chainId: '100',
                foo: 'bar',
              },
            },
            '0x2': {
              address2: {
                chainId: '0x2',
                foo: 'bar',
              },
            },
          },
          bar: {
            baz: 'buzz',
          },
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration48.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      ...expectedPreferencesState,
      AddressBookController: {
        addressBook: {
          '0x1': {
            address1: {
              chainId: '0x1',
              foo: 'bar',
            },
          },
          '0x64': {
            address1: {
              chainId: '0x64',
              foo: 'bar',
            },
          },
          '0x2': {
            address2: {
              chainId: '0x2',
              foo: 'bar',
            },
          },
        },
        bar: {
          baz: 'buzz',
        },
      },
      foo: 'bar',
    });
  });

  it('should migrate the address book and merge entries', async () => {
    const oldStorage = {
      meta: {},
      data: {
        AddressBookController: {
          addressBook: {
            '2': {
              address1: {
                chainId: '2',
                key2: 'kaplar',
                key3: 'value3',
                key4: null,
                foo: 'bar',
              },
              address2: {
                chainId: '2',
                foo: 'bar',
              },
            },
            '0x2': {
              address1: {
                chainId: '0x2',
                key1: 'value1',
                key2: 'value2',
                foo: 'bar',
              },
              address3: {
                chainId: '0x2',
                foo: 'bar',
              },
            },
          },
          bar: {
            baz: 'buzz',
          },
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration48.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      ...expectedPreferencesState,
      AddressBookController: {
        addressBook: {
          '0x2': {
            address1: {
              chainId: '0x2',
              key1: 'value1',
              key2: 'value2',
              key3: 'value3',
              key4: '',
              foo: 'bar',
            },
            address2: {
              chainId: '0x2',
              foo: 'bar',
            },
            address3: {
              chainId: '0x2',
              foo: 'bar',
            },
          },
        },
        bar: {
          baz: 'buzz',
        },
      },
      foo: 'bar',
    });
  });

  it('should not modify address book if all entries are valid or un-parseable', async () => {
    const oldStorage = {
      meta: {},
      data: {
        AddressBookController: {
          addressBook: {
            '0x1': { foo: { bar: 'baz' } },
            'kaplar': { foo: { bar: 'baz' } },
          },
          bar: {
            baz: 'buzz',
          },
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration48.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      ...expectedPreferencesState,
      AddressBookController: {
        addressBook: {
          '0x1': { foo: { bar: 'baz' } },
          'kaplar': { foo: { bar: 'baz' } },
        },
        bar: {
          baz: 'buzz',
        },
      },
      foo: 'bar',
    });
  });

  it('should delete localhost key in IncomingTransactionsController', async () => {
    const oldStorage = {
      meta: {},
      data: {
        IncomingTransactionsController: {
          incomingTxLastFetchedBlocksByNetwork: {
            fizz: 'buzz',
            localhost: {},
          },
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration48.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      ...expectedPreferencesState,
      IncomingTransactionsController: {
        incomingTxLastFetchedBlocksByNetwork: {
          fizz: 'buzz',
        },
        bar: 'baz',
      },
      foo: 'bar',
    });
  });

  it('should not modify IncomingTransactionsController state if affected key is missing', async () => {
    const oldStorage = {
      meta: {},
      data: {
        IncomingTransactionsController: {
          incomingTxLastFetchedBlocksByNetwork: {
            fizz: 'buzz',
            rpc: {},
          },
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration48.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      ...expectedPreferencesState,
      IncomingTransactionsController: {
        incomingTxLastFetchedBlocksByNetwork: {
          fizz: 'buzz',
          rpc: {},
        },
        bar: 'baz',
      },
      foo: 'bar',
    });
  });

  it('should merge localhost token list into rpc token list', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          accountTokens: {
            address1: {
              localhost: [
                { address: '1', data1: 'stuff1' },
                { address: '2', a: 'X', b: 'B' },
              ],
              rpc: [
                { address: '2', a: 'A', c: 'C' },
                { address: '3', data3: 'stuff3' },
              ],
              foo: [],
            },
            address2: {
              localhost: [],
              rpc: [],
              foo: [],
            },
            address3: {},
          },
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration48.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        accountTokens: {
          address1: {
            rpc: [
              { address: '1', data1: 'stuff1' },
              { address: '2', a: 'A', b: 'B', c: 'C' },
              { address: '3', data3: 'stuff3' },
            ],
            foo: [],
          },
          address2: {
            rpc: [],
            foo: [],
          },
          address3: {},
        },
        bar: 'baz',
        // from other migration
        frequentRpcListDetail: [
          {
            ...localhostNetwork,
          },
        ],
      },
      foo: 'bar',
    });
  });
});
