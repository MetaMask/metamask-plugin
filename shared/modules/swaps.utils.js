import BigNumber from 'bignumber.js';
import log from 'loglevel';
import { MAINNET_CHAIN_ID } from '../constants/network';
import {
  METASWAP_CHAINID_API_HOST_MAP,
  SWAPS_CHAINID_DEFAULT_TOKEN_MAP,
} from '../constants/swaps';
import { SECOND } from '../constants/time';
import {
  decimalToHex,
  subtractCurrencies,
  toPrecisionWithoutTrailingZeros,
} from './conversion-util';
import fetchWithCache from './fetch-with-cache';
import { calcGasTotal } from './gas-utils';
import { isValidHexAddress } from './hexstring-utils';
import { calcTokenAmount, calcTokenValue } from './token-utils';
import { constructTxParams } from './transaction.utils';

const TOKEN_TRANSFER_LOG_TOPIC_HASH =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

export const getBaseApi = function (type, chainId = MAINNET_CHAIN_ID) {
  switch (type) {
    case 'trade':
      return `${METASWAP_CHAINID_API_HOST_MAP[chainId]}/trades?`;
    case 'tokens':
      return `${METASWAP_CHAINID_API_HOST_MAP[chainId]}/tokens`;
    case 'token':
      return `${METASWAP_CHAINID_API_HOST_MAP[chainId]}/token`;
    case 'topAssets':
      return `${METASWAP_CHAINID_API_HOST_MAP[chainId]}/topAssets`;
    case 'featureFlag':
      return `${METASWAP_CHAINID_API_HOST_MAP[chainId]}/featureFlag`;
    case 'aggregatorMetadata':
      return `${METASWAP_CHAINID_API_HOST_MAP[chainId]}/aggregatorMetadata`;
    case 'gasPrices':
      return `${METASWAP_CHAINID_API_HOST_MAP[chainId]}/gasPrices`;
    case 'refreshTime':
      return `${METASWAP_CHAINID_API_HOST_MAP[chainId]}/quoteRefreshRate`;
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

export function validateData(validators, object, urlUsed) {
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

/**
 * Checks whether the provided address is strictly equal to the address for
 * the default swaps token of the provided chain.
 *
 * @param {string} address - The string to compare to the default token address
 * @param {string} chainId - The hex encoded chain ID of the default swaps token to check
 * @returns {boolean} Whether the address is the provided chain's default token address
 */
export function isSwapsDefaultTokenAddress(address, chainId) {
  if (!address || !chainId) {
    return false;
  }

  return address === SWAPS_CHAINID_DEFAULT_TOKEN_MAP[chainId]?.address;
}

/**
 * Checks whether the provided symbol is strictly equal to the symbol for
 * the default swaps token of the provided chain.
 *
 * @param {string} symbol - The string to compare to the default token symbol
 * @param {string} chainId - The hex encoded chain ID of the default swaps token to check
 * @returns {boolean} Whether the symbl is the provided chain's default token symbol
 */
export function isSwapsDefaultTokenSymbol(symbol, chainId) {
  if (!symbol || !chainId) {
    return false;
  }

  return symbol === SWAPS_CHAINID_DEFAULT_TOKEN_MAP[chainId]?.symbol;
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
  { chainId },
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
  const tradeURL = `${getBaseApi('trade', chainId)}${queryString}`;
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

export async function fetchSwapsFeatureLiveness(chainId) {
  const status = await fetchWithCache(
    getBaseApi('featureFlag', chainId),
    { method: 'GET' },
    { cacheRefreshTime: 600000 },
  );
  return status?.active;
}

export async function fetchSwapsQuoteRefreshTime(chainId) {
  const response = await fetchWithCache(
    getBaseApi('refreshTime', chainId),
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
