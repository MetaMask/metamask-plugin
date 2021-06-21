import BigNumber from 'bignumber.js';
import abi from 'human-standard-token-abi';
import {
  SWAPS_CHAINID_DEFAULT_TOKEN_MAP,
  SWAPS_CHAINID_CONTRACT_ADDRESS_MAP,
  ETH_WETH_CONTRACT_ADDRESS,
} from '../../../shared/constants/swaps';
import {
  getBaseApi,
  isSwapsDefaultTokenAddress,
  isSwapsDefaultTokenSymbol,
  validateData,
} from '../../../shared/modules/swaps.utils';
import {
  ETH_SYMBOL,
  WETH_SYMBOL,
  MAINNET_CHAIN_ID,
} from '../../../shared/constants/network';
import { getValueFromWeiHex } from '../../helpers/utils/conversions.util';

import {
  decimalToHex,
  toPrecisionWithoutTrailingZeros,
} from '../../../shared/modules/conversion-util';
import { formatCurrency } from '../../helpers/utils/confirm-tx.util';
import fetchWithCache from '../../../shared/modules/fetch-with-cache';

import { isValidHexAddress } from '../../../shared/modules/hexstring-utils';
import { calcGasTotal } from '../../../shared/modules/gas-utils';
import { calcTokenAmount } from '../../../shared/modules/token-utils';

const CACHE_REFRESH_FIVE_MINUTES = 300000;

const truthyString = (string) => Boolean(string?.length);

const TOKEN_VALIDATORS = [
  {
    property: 'address',
    type: 'string',
    validator: (input) => isValidHexAddress(input, { allowNonPrefixed: false }),
  },
  {
    property: 'symbol',
    type: 'string',
    validator: (string) => truthyString(string) && string.length <= 12,
  },
  {
    property: 'decimals',
    type: 'string|number',
    validator: (string) => Number(string) >= 0 && Number(string) <= 36,
  },
];

const TOP_ASSET_VALIDATORS = TOKEN_VALIDATORS.slice(0, 2);

const AGGREGATOR_METADATA_VALIDATORS = [
  {
    property: 'color',
    type: 'string',
    validator: (string) => Boolean(string.match(/^#[A-Fa-f0-9]+$/u)),
  },
  {
    property: 'title',
    type: 'string',
    validator: truthyString,
  },
  {
    property: 'icon',
    type: 'string',
    validator: (string) => Boolean(string.match(/^data:image/u)),
  },
];

const isValidDecimalNumber = (string) =>
  !isNaN(string) && string.match(/^[.0-9]+$/u) && !isNaN(parseFloat(string));

const SWAP_GAS_PRICE_VALIDATOR = [
  {
    property: 'SafeGasPrice',
    type: 'string',
    validator: isValidDecimalNumber,
  },
  {
    property: 'ProposeGasPrice',
    type: 'string',
    validator: isValidDecimalNumber,
  },
  {
    property: 'FastGasPrice',
    type: 'string',
    validator: isValidDecimalNumber,
  },
];

export async function fetchToken(contractAddress, chainId) {
  const tokenUrl = getBaseApi('token', chainId);
  const token = await fetchWithCache(
    `${tokenUrl}?address=${contractAddress}`,
    { method: 'GET' },
    { cacheRefreshTime: CACHE_REFRESH_FIVE_MINUTES },
  );
  return token;
}

export async function fetchTokens(chainId) {
  const tokensUrl = getBaseApi('tokens', chainId);
  const tokens = await fetchWithCache(
    tokensUrl,
    { method: 'GET' },
    { cacheRefreshTime: CACHE_REFRESH_FIVE_MINUTES },
  );
  const filteredTokens = [
    SWAPS_CHAINID_DEFAULT_TOKEN_MAP[chainId],
    ...tokens.filter((token) => {
      return (
        validateData(TOKEN_VALIDATORS, token, tokensUrl) &&
        !(
          isSwapsDefaultTokenSymbol(token.symbol, chainId) ||
          isSwapsDefaultTokenAddress(token.address, chainId)
        )
      );
    }),
  ];
  return filteredTokens;
}

export async function fetchAggregatorMetadata(chainId) {
  const aggregatorMetadataUrl = getBaseApi('aggregatorMetadata', chainId);
  const aggregators = await fetchWithCache(
    aggregatorMetadataUrl,
    { method: 'GET' },
    { cacheRefreshTime: CACHE_REFRESH_FIVE_MINUTES },
  );
  const filteredAggregators = {};
  for (const aggKey in aggregators) {
    if (
      validateData(
        AGGREGATOR_METADATA_VALIDATORS,
        aggregators[aggKey],
        aggregatorMetadataUrl,
      )
    ) {
      filteredAggregators[aggKey] = aggregators[aggKey];
    }
  }
  return filteredAggregators;
}

export async function fetchTopAssets(chainId) {
  const topAssetsUrl = getBaseApi('topAssets', chainId);
  const response = await fetchWithCache(
    topAssetsUrl,
    { method: 'GET' },
    { cacheRefreshTime: CACHE_REFRESH_FIVE_MINUTES },
  );
  const topAssetsMap = response.reduce((_topAssetsMap, asset, index) => {
    if (validateData(TOP_ASSET_VALIDATORS, asset, topAssetsUrl)) {
      return { ..._topAssetsMap, [asset.address]: { index: String(index) } };
    }
    return _topAssetsMap;
  }, {});
  return topAssetsMap;
}

export async function fetchTokenPrice(address) {
  const query = `contract_addresses=${address}&vs_currencies=eth`;

  const prices = await fetchWithCache(
    `https://api.coingecko.com/api/v3/simple/token_price/ethereum?${query}`,
    { method: 'GET' },
    { cacheRefreshTime: 60000 },
  );
  return prices && prices[address]?.eth;
}

export async function fetchTokenBalance(address, userAddress) {
  const tokenContract = global.eth.contract(abi).at(address);
  const tokenBalancePromise = tokenContract
    ? tokenContract.balanceOf(userAddress)
    : Promise.resolve();
  const usersToken = await tokenBalancePromise;
  return usersToken;
}

export async function fetchSwapsGasPrices(chainId) {
  const gasPricesUrl = getBaseApi('gasPrices', chainId);
  const response = await fetchWithCache(
    gasPricesUrl,
    { method: 'GET' },
    { cacheRefreshTime: 30000 },
  );
  const responseIsValid = validateData(
    SWAP_GAS_PRICE_VALIDATOR,
    response,
    gasPricesUrl,
  );

  if (!responseIsValid) {
    throw new Error(`${gasPricesUrl} response is invalid`);
  }

  const {
    SafeGasPrice: safeLow,
    ProposeGasPrice: average,
    FastGasPrice: fast,
  } = response;

  return {
    safeLow,
    average,
    fast,
  };
}

export function getRenderableNetworkFeesForQuote({
  tradeGas,
  approveGas,
  gasPrice,
  currentCurrency,
  conversionRate,
  tradeValue,
  sourceSymbol,
  sourceAmount,
  chainId,
  nativeCurrencySymbol,
}) {
  const totalGasLimitForCalculation = new BigNumber(tradeGas || '0x0', 16)
    .plus(approveGas || '0x0', 16)
    .toString(16);
  const gasTotalInWeiHex = calcGasTotal(totalGasLimitForCalculation, gasPrice);

  const nonGasFee = new BigNumber(tradeValue, 16)
    .minus(
      isSwapsDefaultTokenSymbol(sourceSymbol, chainId) ? sourceAmount : 0,
      10,
    )
    .toString(16);

  const totalWeiCost = new BigNumber(gasTotalInWeiHex, 16)
    .plus(nonGasFee, 16)
    .toString(16);

  const ethFee = getValueFromWeiHex({
    value: totalWeiCost,
    toDenomination: 'ETH',
    numberOfDecimals: 5,
  });
  const rawNetworkFees = getValueFromWeiHex({
    value: totalWeiCost,
    toCurrency: currentCurrency,
    conversionRate,
    numberOfDecimals: 2,
  });
  const formattedNetworkFee = formatCurrency(rawNetworkFees, currentCurrency);

  const chainCurrencySymbolToUse =
    nativeCurrencySymbol || SWAPS_CHAINID_DEFAULT_TOKEN_MAP[chainId].symbol;

  return {
    rawNetworkFees,
    rawEthFee: ethFee,
    feeInFiat: formattedNetworkFee,
    feeInEth: `${ethFee} ${chainCurrencySymbolToUse}`,
    nonGasFee,
  };
}

export function quotesToRenderableData(
  quotes,
  gasPrice,
  conversionRate,
  currentCurrency,
  approveGas,
  tokenConversionRates,
  chainId,
) {
  return Object.values(quotes).map((quote) => {
    const {
      destinationAmount = 0,
      sourceAmount = 0,
      sourceTokenInfo,
      destinationTokenInfo,
      slippage,
      aggType,
      aggregator,
      gasEstimateWithRefund,
      averageGas,
      fee,
      trade,
    } = quote;
    const sourceValue = calcTokenAmount(
      sourceAmount,
      sourceTokenInfo.decimals,
    ).toString(10);
    const destinationValue = calcTokenAmount(
      destinationAmount,
      destinationTokenInfo.decimals,
    ).toPrecision(8);

    const {
      feeInFiat,
      rawNetworkFees,
      rawEthFee,
      feeInEth,
    } = getRenderableNetworkFeesForQuote({
      tradeGas: gasEstimateWithRefund || decimalToHex(averageGas || 800000),
      approveGas,
      gasPrice,
      currentCurrency,
      conversionRate,
      tradeValue: trade.value,
      sourceSymbol: sourceTokenInfo.symbol,
      sourceAmount,
      chainId,
    });

    const slippageMultiplier = new BigNumber(100 - slippage).div(100);
    const minimumAmountReceived = new BigNumber(destinationValue)
      .times(slippageMultiplier)
      .toFixed(6);

    const tokenConversionRate =
      tokenConversionRates[destinationTokenInfo.address];
    const ethValueOfTrade = isSwapsDefaultTokenSymbol(
      destinationTokenInfo.symbol,
      chainId,
    )
      ? calcTokenAmount(destinationAmount, destinationTokenInfo.decimals).minus(
          rawEthFee,
          10,
        )
      : new BigNumber(tokenConversionRate || 0, 10)
          .times(
            calcTokenAmount(destinationAmount, destinationTokenInfo.decimals),
            10,
          )
          .minus(rawEthFee, 10);

    let liquiditySourceKey;
    let renderedSlippage = slippage;

    if (aggType === 'AGG') {
      liquiditySourceKey = 'swapAggregator';
    } else if (aggType === 'RFQ') {
      liquiditySourceKey = 'swapRequestForQuotation';
      renderedSlippage = 0;
    } else if (aggType === 'DEX') {
      liquiditySourceKey = 'swapDecentralizedExchange';
    } else {
      liquiditySourceKey = 'swapUnknown';
    }

    return {
      aggId: aggregator,
      amountReceiving: `${destinationValue} ${destinationTokenInfo.symbol}`,
      destinationTokenDecimals: destinationTokenInfo.decimals,
      destinationTokenSymbol: destinationTokenInfo.symbol,
      destinationTokenValue: formatSwapsValueForDisplay(destinationValue),
      destinationIconUrl: destinationTokenInfo.iconUrl,
      isBestQuote: quote.isBestQuote,
      liquiditySourceKey,
      feeInEth,
      detailedNetworkFees: `${feeInEth} (${feeInFiat})`,
      networkFees: feeInFiat,
      quoteSource: aggType,
      rawNetworkFees,
      slippage: renderedSlippage,
      sourceTokenDecimals: sourceTokenInfo.decimals,
      sourceTokenSymbol: sourceTokenInfo.symbol,
      sourceTokenValue: sourceValue,
      sourceTokenIconUrl: sourceTokenInfo.iconUrl,
      ethValueOfTrade,
      minimumAmountReceived,
      metaMaskFee: fee,
    };
  });
}

export function formatSwapsValueForDisplay(destinationAmount) {
  let amountToDisplay = toPrecisionWithoutTrailingZeros(destinationAmount, 12);
  if (amountToDisplay.match(/e[+-]/u)) {
    amountToDisplay = new BigNumber(amountToDisplay).toFixed();
  }
  return amountToDisplay;
}

/**
 * Checks whether a contract address is valid before swapping tokens.
 *
 * @param {string} contractAddress - E.g. "0x881d40237659c251811cec9c364ef91dc08d300c" for mainnet
 * @param {object} swapMetaData - We check the following 2 fields, e.g. { token_from: "ETH", token_to: "WETH" }
 * @param {string} chainId - The hex encoded chain ID to check
 * @returns {boolean} Whether a contract address is valid or not
 */
export const isContractAddressValid = (
  contractAddress,
  swapMetaData,
  chainId = MAINNET_CHAIN_ID,
) => {
  const contractAddressForChainId = SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[chainId];
  if (!contractAddress || !contractAddressForChainId) {
    return false;
  }
  if (
    (swapMetaData.token_from === ETH_SYMBOL &&
      swapMetaData.token_to === WETH_SYMBOL) ||
    (swapMetaData.token_from === WETH_SYMBOL &&
      swapMetaData.token_to === ETH_SYMBOL)
  ) {
    // Sometimes we get a contract address with a few upper-case chars and since addresses are
    // case-insensitive, we compare uppercase versions for validity.
    return (
      contractAddress.toUpperCase() ===
        ETH_WETH_CONTRACT_ADDRESS.toUpperCase() ||
      contractAddressForChainId.toUpperCase() === contractAddress.toUpperCase()
    );
  }
  return (
    contractAddressForChainId.toUpperCase() === contractAddress.toUpperCase()
  );
};
