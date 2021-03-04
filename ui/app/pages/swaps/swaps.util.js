import log from 'loglevel';
import BigNumber from 'bignumber.js';
import abi from 'human-standard-token-abi';
import { isValidAddress } from 'ethereumjs-util';
import { ETH_SWAPS_TOKEN_OBJECT } from '../../helpers/constants/swaps';
import {
  calcTokenValue,
  calcTokenAmount,
} from '../../helpers/utils/token-util';
import {
  constructTxParams,
  toPrecisionWithoutTrailingZeros,
} from '../../helpers/utils/util';
import {
  decimalToHex,
  getValueFromWeiHex,
} from '../../helpers/utils/conversions.util';

import { subtractCurrencies } from '../../helpers/utils/conversion-util';
import { formatCurrency } from '../../helpers/utils/confirm-tx.util';
import fetchWithCache from '../../helpers/utils/fetch-with-cache';

import { calcGasTotal } from '../send/send.utils';

const TOKEN_TRANSFER_LOG_TOPIC_HASH =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

const CACHE_REFRESH_ONE_HOUR = 3600000;

const METASWAP_API_HOST = 'https://api.metaswap.codefi.network';

const getBaseApi = function (type) {
  switch (type) {
    case 'trade':
      return `${METASWAP_API_HOST}/trades?`;
    case 'tokens':
      return `${METASWAP_API_HOST}/tokens`;
    case 'topAssets':
      return `${METASWAP_API_HOST}/topAssets`;
    case 'featureFlag':
      return `${METASWAP_API_HOST}/featureFlag`;
    case 'aggregatorMetadata':
      return `${METASWAP_API_HOST}/aggregatorMetadata`;
    case 'gasPrices':
      return `${METASWAP_API_HOST}/gasPrices`;
    case 'refreshTime':
      return `${METASWAP_API_HOST}/quoteRefreshRate`;
    default:
      throw new Error('getBaseApi requires an api call type');
  }
};

const validHex = (string) => Boolean(string?.match(/^0x[a-f0-9]+$/u));
const truthyString = (string) => Boolean(string?.length);
const truthyDigitString = (string) =>
  truthyString(string) && Boolean(string.match(/^\d+$/u));

const QUOTE_VALIDATORS = [
  {
    property: 'trade',
    type: 'object',
    validator: (trade) =>
      trade &&
      validHex(trade.data) &&
      isValidAddress(trade.to) &&
      isValidAddress(trade.from) &&
      truthyString(trade.value),
  },
  {
    property: 'approvalNeeded',
    type: 'object',
    validator: (approvalTx) =>
      approvalTx === null ||
      (approvalTx &&
        validHex(approvalTx.data) &&
        isValidAddress(approvalTx.to) &&
        isValidAddress(approvalTx.from)),
  },
  {
    property: 'sourceAmount',
    type: 'string',
    validator: truthyDigitString,
  },
  {
    property: 'destinationAmount',
    type: 'string',
    validator: truthyDigitString,
  },
  {
    property: 'sourceToken',
    type: 'string',
    validator: isValidAddress,
  },
  {
    property: 'destinationToken',
    type: 'string',
    validator: isValidAddress,
  },
  {
    property: 'aggregator',
    type: 'string',
    validator: truthyString,
  },
  {
    property: 'aggType',
    type: 'string',
    validator: truthyString,
  },
  {
    property: 'error',
    type: 'object',
    validator: (error) => error === null || typeof error === 'object',
  },
  {
    property: 'averageGas',
    type: 'number',
  },
  {
    property: 'maxGas',
    type: 'number',
  },
  {
    property: 'gasEstimate',
    type: 'number|undefined',
    validator: (gasEstimate) => gasEstimate === undefined || gasEstimate > 0,
  },
];

const TOKEN_VALIDATORS = [
  {
    property: 'address',
    type: 'string',
    validator: isValidAddress,
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

function validateData(validators, object, urlUsed) {
  return validators.every(({ property, type, validator }) => {
    const types = type.split('|');

    const valid =
      types.some((_type) => typeof object[property] === _type) &&
      (!validator || validator(object[property]));
    if (!valid) {
      log.error(
        `response to GET ${urlUsed} invalid for property ${property}; value was:`,
        object[property],
        '| type was: ',
        typeof object[property],
      );
    }
    return valid;
  });
}

export async function fetchTradesInfo({
  slippage,
  sourceToken,
  sourceDecimals,
  destinationToken,
  value,
  fromAddress,
  exchangeList,
}) {
  const urlParams = {
    destinationToken,
    sourceToken,
    sourceAmount: calcTokenValue(value, sourceDecimals).toString(10),
    slippage,
    timeout: 10000,
    walletAddress: fromAddress,
  };

  if (exchangeList) {
    urlParams.exchangeList = exchangeList;
  }

  const queryString = new URLSearchParams(urlParams).toString();
  const tradeURL = `${getBaseApi('trade')}${queryString}`;
  const tradesResponse = await fetchWithCache(
    tradeURL,
    { method: 'GET' },
    { cacheRefreshTime: 0, timeout: 15000 },
  );
  const newQuotes = tradesResponse.reduce((aggIdTradeMap, quote) => {
    if (
      quote.trade &&
      !quote.error &&
      validateData(QUOTE_VALIDATORS, quote, tradeURL)
    ) {
      const constructedTrade = constructTxParams({
        to: quote.trade.to,
        from: quote.trade.from,
        data: quote.trade.data,
        amount: decimalToHex(quote.trade.value),
        gas: decimalToHex(quote.maxGas),
      });

      let { approvalNeeded } = quote;

      if (approvalNeeded) {
        approvalNeeded = constructTxParams({
          ...approvalNeeded,
        });
      }

      return {
        ...aggIdTradeMap,
        [quote.aggregator]: {
          ...quote,
          slippage,
          trade: constructedTrade,
          approvalNeeded,
        },
      };
    }
    return aggIdTradeMap;
  }, {});

  return newQuotes;
}

export async function fetchTokens() {
  const tokenUrl = getBaseApi('tokens');
  const tokens = await fetchWithCache(
    tokenUrl,
    { method: 'GET' },
    { cacheRefreshTime: CACHE_REFRESH_ONE_HOUR },
  );
  const filteredTokens = tokens.filter((token) => {
    return (
      validateData(TOKEN_VALIDATORS, token, tokenUrl) &&
      token.address !== ETH_SWAPS_TOKEN_OBJECT.address
    );
  });
  filteredTokens.push(ETH_SWAPS_TOKEN_OBJECT);
  return filteredTokens;
}

export async function fetchAggregatorMetadata() {
  const aggregatorMetadataUrl = getBaseApi('aggregatorMetadata');
  const aggregators = await fetchWithCache(
    aggregatorMetadataUrl,
    { method: 'GET' },
    { cacheRefreshTime: CACHE_REFRESH_ONE_HOUR },
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

export async function fetchTopAssets() {
  const topAssetsUrl = getBaseApi('topAssets');
  const response = await fetchWithCache(
    topAssetsUrl,
    { method: 'GET' },
    { cacheRefreshTime: CACHE_REFRESH_ONE_HOUR },
  );
  const topAssetsMap = response.reduce((_topAssetsMap, asset, index) => {
    if (validateData(TOP_ASSET_VALIDATORS, asset, topAssetsUrl)) {
      return { ..._topAssetsMap, [asset.address]: { index: String(index) } };
    }
    return _topAssetsMap;
  }, {});
  return topAssetsMap;
}

export async function fetchSwapsFeatureLiveness() {
  const status = await fetchWithCache(
    getBaseApi('featureFlag'),
    { method: 'GET' },
    { cacheRefreshTime: 600000 },
  );
  return status?.active;
}

export async function fetchSwapsQuoteRefreshTime() {
  const response = await fetchWithCache(
    getBaseApi('refreshTime'),
    { method: 'GET' },
    { cacheRefreshTime: 600000 },
  );

  // We presently use milliseconds in the UI
  if (typeof response?.seconds === 'number' && response.seconds > 0) {
    return response.seconds * 1000;
  }

  throw new Error(
    `MetaMask - refreshTime provided invalid response: ${response}`,
  );
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

export async function fetchSwapsGasPrices() {
  const gasPricesUrl = getBaseApi('gasPrices');
  const response = await fetchWithCache(
    gasPricesUrl,
    { method: 'GET' },
    { cacheRefreshTime: 15000 },
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

export function getRenderableNetworkFeesForQuote(
  tradeGas,
  approveGas,
  gasPrice,
  currentCurrency,
  currentLocale,
  conversionRate,
  tradeValue,
  sourceSymbol,
  sourceAmount,
) {
  const totalGasLimitForCalculation = new BigNumber(tradeGas || '0x0', 16)
    .plus(approveGas || '0x0', 16)
    .toString(16);
  const gasTotalInWeiHex = calcGasTotal(totalGasLimitForCalculation, gasPrice);

  const nonGasFee = new BigNumber(tradeValue, 16)
    .minus(sourceSymbol === 'ETH' ? sourceAmount : 0, 10)
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
  const formattedNetworkFee = formatCurrency(
    rawNetworkFees,
    currentCurrency,
    currentLocale,
  );
  return {
    rawNetworkFees,
    rawEthFee: ethFee,
    feeInFiat: formattedNetworkFee,
    feeInEth: `${ethFee} ETH`,
    nonGasFee,
  };
}

export function quotesToRenderableData(
  quotes,
  gasPrice,
  conversionRate,
  currentCurrency,
  currentLocale,
  approveGas,
  tokenConversionRates,
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
    } = getRenderableNetworkFeesForQuote(
      gasEstimateWithRefund || decimalToHex(averageGas || 800000),
      approveGas,
      gasPrice,
      currentCurrency,
      currentLocale,
      conversionRate,
      trade.value,
      sourceTokenInfo.symbol,
      sourceAmount,
    );

    const slippageMultiplier = new BigNumber(100 - slippage).div(100);
    const minimumAmountReceived = new BigNumber(destinationValue)
      .times(slippageMultiplier)
      .toFixed(6);

    const tokenConversionRate =
      tokenConversionRates[destinationTokenInfo.address];
    const ethValueOfTrade =
      destinationTokenInfo.symbol === 'ETH'
        ? calcTokenAmount(
            destinationAmount,
            destinationTokenInfo.decimals,
          ).minus(rawEthFee, 10)
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

export function getSwapsTokensReceivedFromTxMeta(
  tokenSymbol,
  txMeta,
  tokenAddress,
  accountAddress,
  tokenDecimals,
  approvalTxMeta,
) {
  const txReceipt = txMeta?.txReceipt;
  if (tokenSymbol === 'ETH') {
    if (
      !txReceipt ||
      !txMeta ||
      !txMeta.postTxBalance ||
      !txMeta.preTxBalance
    ) {
      return null;
    }

    let approvalTxGasCost = '0x0';
    if (approvalTxMeta && approvalTxMeta.txReceipt) {
      approvalTxGasCost = calcGasTotal(
        approvalTxMeta.txReceipt.gasUsed,
        approvalTxMeta.txParams.gasPrice,
      );
    }

    const gasCost = calcGasTotal(txReceipt.gasUsed, txMeta.txParams.gasPrice);
    const totalGasCost = new BigNumber(gasCost, 16)
      .plus(approvalTxGasCost, 16)
      .toString(16);

    const preTxBalanceLessGasCost = subtractCurrencies(
      txMeta.preTxBalance,
      totalGasCost,
      {
        aBase: 16,
        bBase: 16,
        toNumericBase: 'hex',
      },
    );

    const ethReceived = subtractCurrencies(
      txMeta.postTxBalance,
      preTxBalanceLessGasCost,
      {
        aBase: 16,
        bBase: 16,
        fromDenomination: 'WEI',
        toDenomination: 'ETH',
        toNumericBase: 'dec',
        numberOfDecimals: 6,
      },
    );
    return ethReceived;
  }
  const txReceiptLogs = txReceipt?.logs;
  if (txReceiptLogs && txReceipt?.status !== '0x0') {
    const tokenTransferLog = txReceiptLogs.find((txReceiptLog) => {
      const isTokenTransfer =
        txReceiptLog.topics &&
        txReceiptLog.topics[0] === TOKEN_TRANSFER_LOG_TOPIC_HASH;
      const isTransferFromGivenToken = txReceiptLog.address === tokenAddress;
      const isTransferFromGivenAddress =
        txReceiptLog.topics &&
        txReceiptLog.topics[2] &&
        txReceiptLog.topics[2].match(accountAddress.slice(2));
      return (
        isTokenTransfer &&
        isTransferFromGivenToken &&
        isTransferFromGivenAddress
      );
    });
    return tokenTransferLog
      ? toPrecisionWithoutTrailingZeros(
          calcTokenAmount(tokenTransferLog.data, tokenDecimals).toString(10),
          6,
        )
      : '';
  }
  return null;
}

export function formatSwapsValueForDisplay(destinationAmount) {
  let amountToDisplay = toPrecisionWithoutTrailingZeros(destinationAmount, 12);
  if (amountToDisplay.match(/e[+-]/u)) {
    amountToDisplay = new BigNumber(amountToDisplay).toFixed();
  }
  return amountToDisplay;
}
