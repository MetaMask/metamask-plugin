import { JsonRpcEngine, createScaffoldMiddleware } from 'json-rpc-engine';
import { providerAsMiddleware } from 'eth-json-rpc-middleware';
import GanacheCore from 'ganache-core';

export function getTestSeed() {
  return 'people carpet cluster attract ankle motor ozone mass dove original primary mask';
}

export function getTestAccounts() {
  return [
    {
      address: '0x88bb7F89eB5e5b30D3e15a57C68DBe03C6aCCB21',
      key: Buffer.from(
        '254A8D551474F35CCC816388B4ED4D20B945C96B7EB857A68064CB9E9FB2C092',
        'hex',
      ),
    },
    {
      address: '0x1fe9aAB565Be19629fF4e8541ca2102fb42D7724',
      key: Buffer.from(
        '6BAB5A4F2A6911AF8EE2BD32C6C05F6643AC48EF6C939CDEAAAE6B1620805A9B',
        'hex',
      ),
    },
    {
      address: '0xbda5c89aa6bA1b352194291AD6822C92AbC87c7B',
      key: Buffer.from(
        '9B11D7F833648F26CE94D544855558D7053ECD396E4F4563968C232C012879B0',
        'hex',
      ),
    },
  ];
}

export function createEngineForTestData() {
  return new JsonRpcEngine();
}

export function providerFromEngine(engine) {
  const provider = { sendAsync: engine.handle.bind(engine) };
  return provider;
}

export function createTestProviderTools(opts = {}) {
  const engine = createEngineForTestData();
  // handle provided hooks
  engine.push(createScaffoldMiddleware(opts.scaffold || {}));
  // handle block tracker methods
  engine.push(
    providerAsMiddleware(
      GanacheCore.provider({
        mnemonic: getTestSeed(),
        network_id: opts.networkId,
        _chainId: opts.chainId,
        _chainIdRpc: opts.chainId,
      }),
    ),
  );
  // wrap in standard provider interface
  const provider = providerFromEngine(engine);
  return { provider, engine };
}
