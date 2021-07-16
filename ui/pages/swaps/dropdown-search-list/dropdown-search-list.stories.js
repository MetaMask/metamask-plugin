import React from 'react';
import DropdownSearchList from '.';

const tokens = [
  {
    primaryLabel: 'MetaMark (META)',
    name: 'MetaMark',
    iconUrl: 'metamark.svg',
    erc20: true,
    decimals: 18,
    symbol: 'META',
    address: '0x617b3f8050a0BD94b6b1da02B4384eE5B4DF13F4',
  },
  {
    primaryLabel: '0x (ZRX)',
    name: '0x',
    iconUrl: '0x.svg',
    erc20: true,
    symbol: 'ZRX',
    decimals: 18,
    address: '0xE41d2489571d322189246DaFA5ebDe1F4699F498',
  },
  {
    primaryLabel: 'AirSwap Token (AST)',
    name: 'AirSwap Token',
    iconUrl: 'AST.png',
    erc20: true,
    symbol: 'AST',
    decimals: 4,
    address: '0x27054b13b1B798B345b591a4d22e6562d47eA75a',
  },
  {
    primaryLabel: 'Basic Attention Token (BAT)',
    name: 'Basic Attention Token',
    iconUrl: 'BAT_icon.svg',
    erc20: true,
    symbol: 'BAT',
    decimals: 18,
    address: '0x0D8775F648430679A709E98d2b0Cb6250d2887EF',
  },
  {
    primaryLabel: 'Civil Token (CVL)',
    name: 'Civil Token',
    iconUrl: 'CVL_token.svg',
    erc20: true,
    symbol: 'CVL',
    decimals: 18,
    address: '0x01FA555c97D7958Fa6f771f3BbD5CCD508f81e22',
  },
  {
    primaryLabel: 'Gladius (GLA)',
    name: 'Gladius',
    iconUrl: 'gladius.svg',
    erc20: true,
    symbol: 'GLA',
    decimals: 8,
    address: '0x71D01dB8d6a2fBEa7f8d434599C237980C234e4C',
  },
  {
    primaryLabel: 'Gnosis Token (GNO)',
    name: 'Gnosis Token',
    iconUrl: 'gnosis.svg',
    erc20: true,
    symbol: 'GNO',
    decimals: 18,
    address: '0x6810e776880C02933D47DB1b9fc05908e5386b96',
  },
  {
    primaryLabel: 'OmiseGO (OMG)',
    name: 'OmiseGO',
    iconUrl: 'omg.jpg',
    erc20: true,
    symbol: 'OMG',
    decimals: 18,
    address: '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07',
  },
  {
    primaryLabel: 'Sai Stablecoin v1.0 (SAI)',
    name: 'Sai Stablecoin v1.0',
    iconUrl: 'sai.svg',
    erc20: true,
    symbol: 'SAI',
    decimals: 18,
    address: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359',
  },
  {
    primaryLabel: 'Tether USD (USDT)',
    name: 'Tether USD',
    iconUrl: 'tether_usd.png',
    erc20: true,
    symbol: 'USDT',
    decimals: 6,
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  },
  {
    primaryLabel: 'WednesdayCoin (WED)',
    name: 'WednesdayCoin',
    iconUrl: 'wed.png',
    erc20: true,
    symbol: 'WED',
    decimals: 18,
    address: '0x7848ae8F19671Dc05966dafBeFbBbb0308BDfAbD',
  },
  {
    primaryLabel: 'Wrapped BTC (WBTC)',
    name: 'Wrapped BTC',
    iconUrl: 'wbtc.png',
    erc20: true,
    symbol: 'WBTC',
    decimals: 8,
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  },
];

export default {
  title: 'DropdownSearchList',
};

const tokensToSearch = tokens.map((token) => ({
  ...token,
  primaryLabel: token.symbol,
  secondaryLabel: token.name,
  rightPrimaryLabel: `${(Math.random() * 100).toFixed(
    Math.floor(Math.random() * 6),
  )} ${token.symbol}`,
  rightSecondaryLabel: `$${(Math.random() * 1000).toFixed(2)}`,
}));

export const TokenSearchDropdown = () => {
  return (
    <div style={{ height: '82vh', width: '357px' }}>
      <DropdownSearchList
        startingItem={tokensToSearch[0]}
        itemsToSearch={tokensToSearch}
        searchPlaceholderText="Search for a token"
        fuseSearchKeys={[
          { name: 'name', weight: 0.5 },
          { name: 'symbol', weight: 0.5 },
        ]}
        maxListItems={tokensToSearch.length}
        defaultToAll
      />
    </div>
  );
};
