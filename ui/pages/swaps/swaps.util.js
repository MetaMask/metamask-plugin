import log from 'loglevel';
import BigNumber from 'bignumber.js';
import abi from 'human-standard-token-abi';
import {
  SWAPS_CHAINID_DEFAULT_TOKEN_MAP,
  METASWAP_CHAINID_API_HOST_MAP,
  SWAPS_CHAINID_CONTRACT_ADDRESS_MAP,
  ETH_WETH_CONTRACT_ADDRESS,
  ETHEREUM,
  POLYGON,
  BSC,
} from '../../../shared/constants/swaps';
import {
  isSwapsDefaultTokenAddress,
  isSwapsDefaultTokenSymbol,
} from '../../../shared/modules/swaps.utils';
import {
  ETH_SYMBOL,
  WETH_SYMBOL,
  MAINNET_CHAIN_ID,
  BSC_CHAIN_ID,
  POLYGON_CHAIN_ID,
  LOCALHOST_CHAIN_ID,
} from '../../../shared/constants/network';
import { SECOND } from '../../../shared/constants/time';
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

import { subtractCurrencies } from '../../../shared/modules/conversion.utils';
import { formatCurrency } from '../../helpers/utils/confirm-tx.util';
import fetchWithCache from '../../helpers/utils/fetch-with-cache';

import { calcGasTotal } from '../send/send.utils';
import { isValidHexAddress } from '../../../shared/modules/hexstring-utils';

const TOKEN_TRANSFER_LOG_TOPIC_HASH =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

const CACHE_REFRESH_FIVE_MINUTES = 300000;

const SWAPS_API_V2_BASE_URL = 'https://api2.metaswap.codefi.network';
const GAS_API_BASE_URL = 'https://gas-api.metaswap.codefi.network';

/**
 * @param {string} type Type of an API call, e.g. "tokens"
 * @param {string} chainId
 * @returns string
 */
const getBaseUrlForNewSwapsApi = (type, chainId) => {
  const noNetworkSpecificTypes = ['refreshTime']; // These types don't need network info in the URL.
  if (noNetworkSpecificTypes.includes(type)) {
    return SWAPS_API_V2_BASE_URL;
  }
  const chainIdDecimal = chainId && parseInt(chainId, 16);
  const gasApiTypes = ['gasPrices'];
  if (gasApiTypes.includes(type)) {
    return `${GAS_API_BASE_URL}/networks/${chainIdDecimal}`; // Gas calculations are in its own repo.
  }
  return `${SWAPS_API_V2_BASE_URL}/networks/${chainIdDecimal}`;
};

const getBaseApi = function (
  type,
  chainId = MAINNET_CHAIN_ID,
  useNewSwapsApi = false,
) {
  const baseUrl = useNewSwapsApi
    ? getBaseUrlForNewSwapsApi(type, chainId)
    : METASWAP_CHAINID_API_HOST_MAP[chainId];
  if (!baseUrl) {
    throw new Error(`baseUrl for API calls is empty for chainId: ${chainId}`);
  }
  switch (type) {
    case 'trade':
      return `${baseUrl}/trades?`;
    case 'tokens':
      return `${baseUrl}/tokens`;
    case 'token':
      return `${baseUrl}/token`;
    case 'topAssets':
      return `${baseUrl}/topAssets`;
    case 'aggregatorMetadata':
      return `${baseUrl}/aggregatorMetadata`;
    case 'gasPrices':
      return `${baseUrl}/gasPrices`;
    case 'refreshTime':
      return `${baseUrl}/quoteRefreshRate`;
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
      isValidHexAddress(trade.to, { allowNonPrefixed: false }) &&
      isValidHexAddress(trade.from, { allowNonPrefixed: false }) &&
      truthyString(trade.value),
  },
  {
    property: 'approvalNeeded',
    type: 'object',
    validator: (approvalTx) =>
      approvalTx === null ||
      (approvalTx &&
        validHex(approvalTx.data) &&
        isValidHexAddress(approvalTx.to, { allowNonPrefixed: false }) &&
        isValidHexAddress(approvalTx.from, { allowNonPrefixed: false })),
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
    validator: (input) => isValidHexAddress(input, { allowNonPrefixed: false }),
  },
  {
    property: 'destinationToken',
    type: 'string',
    validator: (input) => isValidHexAddress(input, { allowNonPrefixed: false }),
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
  {
    property: 'fee',
    type: 'number',
  },
];

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

export async function fetchTradesInfo(
  {
    slippage,
    sourceToken,
    sourceDecimals,
    destinationToken,
    value,
    fromAddress,
    exchangeList,
  },
  { chainId, useNewSwapsApi },
) {
  const urlParams = {
    destinationToken,
    sourceToken,
    sourceAmount: calcTokenValue(value, sourceDecimals).toString(10),
    slippage,
    timeout: SECOND * 10,
    walletAddress: fromAddress,
  };

  if (exchangeList) {
    urlParams.exchangeList = exchangeList;
  }

  const queryString = new URLSearchParams(urlParams).toString();
  const tradeURL = `${getBaseApi(
    'trade',
    chainId,
    useNewSwapsApi,
  )}${queryString}`;
  const tradesResponse = await fetchWithCache(
    tradeURL,
    { method: 'GET' },
    { cacheRefreshTime: 0, timeout: SECOND * 15 },
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

export async function fetchToken(contractAddress, chainId, useNewSwapsApi) {
  const tokenUrl = getBaseApi('token', chainId, useNewSwapsApi);
  const token = await fetchWithCache(
    `${tokenUrl}?address=${contractAddress}`,
    { method: 'GET' },
    { cacheRefreshTime: CACHE_REFRESH_FIVE_MINUTES },
  );
  return token;
}

export async function fetchTokens(chainId, useNewSwapsApi) {
  const tokensUrl = getBaseApi('tokens', chainId, useNewSwapsApi);
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

export async function fetchAggregatorMetadata(chainId, useNewSwapsApi) {
  const aggregatorMetadataUrl = getBaseApi(
    'aggregatorMetadata',
    chainId,
    useNewSwapsApi,
  );
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

export async function fetchTopAssets(chainId, useNewSwapsApi) {
  const topAssetsUrl = getBaseApi('topAssets', chainId, useNewSwapsApi);
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

export async function fetchSwapsFeatureFlags() {
  const response = await fetchWithCache(
    `${SWAPS_API_V2_BASE_URL}/featureFlags`,
    { method: 'GET' },
    { cacheRefreshTime: 600000 },
  );
  return response;
}

export async function fetchSwapsQuoteRefreshTime(chainId, useNewSwapsApi) {
  const response = await fetchWithCache(
    getBaseApi('refreshTime', chainId, useNewSwapsApi),
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

export async function fetchSwapsGasPrices(chainId, useNewSwapsApi) {
  const gasPricesUrl = getBaseApi('gasPrices', chainId, useNewSwapsApi);
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

export function getSwapsTokensReceivedFromTxMeta(
  tokenSymbol,
  txMeta,
  tokenAddress,
  accountAddress,
  tokenDecimals,
  approvalTxMeta,
  chainId,
) {
  const txReceipt = txMeta?.txReceipt;
  if (isSwapsDefaultTokenSymbol(tokenSymbol, chainId)) {
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

/**
 * @param {string} chainId
 * @returns string e.g. ethereum, bsc or polygon
 */
export const getNetworkNameByChainId = (chainId) => {
  switch (chainId) {
    case MAINNET_CHAIN_ID:
      return ETHEREUM;
    case BSC_CHAIN_ID:
      return BSC;
    case POLYGON_CHAIN_ID:
      return POLYGON;
    default:
      return '';
  }
};

/**
 * It returns info about if Swaps are enabled and if we should use our new APIs for it.
 * @param {object} swapsFeatureFlags
 * @param {string} chainId
 * @returns object with 2 items: "swapsFeatureIsLive" and "useNewSwapsApi"
 */
export const getSwapsLivenessForNetwork = (swapsFeatureFlags = {}, chainId) => {
  const networkName = getNetworkNameByChainId(chainId);
  // Use old APIs for testnet.
  if (chainId === LOCALHOST_CHAIN_ID) {
    return {
      swapsFeatureIsLive: true,
      useNewSwapsApi: false,
    };
  }
  // If a network name is not found in the list of feature flags, disable Swaps.
  if (!swapsFeatureFlags[networkName]) {
    return {
      swapsFeatureIsLive: false,
      useNewSwapsApi: false,
    };
  }
  const isNetworkEnabledForNewApi =
    swapsFeatureFlags[networkName].extension_active;
  if (isNetworkEnabledForNewApi) {
    return {
      swapsFeatureIsLive: true,
      useNewSwapsApi: true,
    };
  }
  return {
    swapsFeatureIsLive: swapsFeatureFlags[networkName].fallback_to_v1,
    useNewSwapsApi: false,
  };
};
