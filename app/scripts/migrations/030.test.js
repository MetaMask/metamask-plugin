import migrationTemplate from './030';

const storage = {
  meta: {},
  data: {
    NetworkController: {
      network: 'fail',
      provider: {
        chainId: 'fail',
        nickname: '',
        rpcTarget: 'https://api.myetherwallet.com/eth',
        ticker: 'ETH',
        type: 'rinkeby',
      },
    },
    PreferencesController: {
      frequentRpcListDetail: [
        {
          chainId: 'fail',
          nickname: '',
          rpcUrl: 'http://127.0.0.1:8545',
          ticker: '',
        },
        {
          chainId: '1',
          nickname: '',
          rpcUrl: 'https://api.myetherwallet.com/eth',
          ticker: 'ETH',
        },
      ],
    },
  },
};

describe('storage is migrated successfully', () => {
  it('should work', async () => {
    const migratedData = await migrationTemplate.migrate(storage);

    expect(migratedData.meta.version).toStrictEqual(30);
    expect(
      migratedData.data.PreferencesController.frequentRpcListDetail[0].chainId,
    ).toBeUndefined();
    expect(
      migratedData.data.PreferencesController.frequentRpcListDetail[1].chainId,
    ).toStrictEqual('1');
    expect(
      migratedData.data.NetworkController.provider.chainId,
    ).toBeUndefined();
    expect(migratedData.data.NetworkController.network).toBeUndefined();
  });
});
