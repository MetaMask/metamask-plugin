import {
  KOVAN_CHAIN_ID,
  MAINNET_CHAIN_ID,
  RINKEBY_CHAIN_ID,
  ROPSTEN_CHAIN_ID,
} from '../../../shared/constants/network';
import getBuyEthUrl from './buy-eth-url';

describe('buy-eth-url', () => {
  const mainnet = {
    chainId: MAINNET_CHAIN_ID,
    amount: 5,
    address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
  };
  const ropsten = {
    chainId: ROPSTEN_CHAIN_ID,
  };
  const rinkeby = {
    chainId: RINKEBY_CHAIN_ID,
  };
  const kovan = {
    chainId: KOVAN_CHAIN_ID,
  };

  it('returns wyre url with address for network 1', () => {
    const wyreUrl = getBuyEthUrl(mainnet);

    expect(wyreUrl).toStrictEqual(
      'https://pay.sendwyre.com/purchase?dest=ethereum:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc&destCurrency=ETH&accountId=AC-7AG3W4XH4N2&paymentMethod=debit-card',
    );
  });

  it('returns metamask ropsten faucet for network 3', () => {
    const ropstenUrl = getBuyEthUrl(ropsten);
    expect(ropstenUrl).toStrictEqual('https://faucet.metamask.io/');
  });

  it('returns rinkeby dapp for network 4', () => {
    const rinkebyUrl = getBuyEthUrl(rinkeby);
    expect(rinkebyUrl).toStrictEqual('https://www.rinkeby.io/');
  });

  it('returns kovan github test faucet for network 42', () => {
    const kovanUrl = getBuyEthUrl(kovan);
    expect(kovanUrl).toStrictEqual('https://github.com/kovan-testnet/faucet');
  });
});
