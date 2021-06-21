import { createSelector } from 'reselect';
import txHelper from '../helpers/utils/tx-helper';
import {
  roundExponential,
  getValueFromWeiHex,
  getHexGasTotal,
  getTransactionFee,
  addFiat,
  addEth,
} from '../helpers/utils/confirm-tx.util';
import { sumHexes } from '../helpers/utils/transactions.util';
import { transactionMatchesNetwork } from '../../shared/modules/transaction.utils';
import { getNativeCurrency } from '../ducks/metamask/metamask';
import { calcTokenValue } from '../../shared/modules/token-utils';
import { getAveragePriceEstimateInHexWEI } from './custom-gas';
import { getCurrentChainId, deprecatedGetCurrentNetworkId } from './selectors';

const unapprovedTxsSelector = (state) => state.metamask.unapprovedTxs;
const unapprovedMsgsSelector = (state) => state.metamask.unapprovedMsgs;
const unapprovedPersonalMsgsSelector = (state) =>
  state.metamask.unapprovedPersonalMsgs;
const unapprovedDecryptMsgsSelector = (state) =>
  state.metamask.unapprovedDecryptMsgs;
const unapprovedEncryptionPublicKeyMsgsSelector = (state) =>
  state.metamask.unapprovedEncryptionPublicKeyMsgs;
const unapprovedTypedMessagesSelector = (state) =>
  state.metamask.unapprovedTypedMessages;

export const unconfirmedTransactionsListSelector = createSelector(
  unapprovedTxsSelector,
  unapprovedMsgsSelector,
  unapprovedPersonalMsgsSelector,
  unapprovedDecryptMsgsSelector,
  unapprovedEncryptionPublicKeyMsgsSelector,
  unapprovedTypedMessagesSelector,
  deprecatedGetCurrentNetworkId,
  getCurrentChainId,
  (
    unapprovedTxs = {},
    unapprovedMsgs = {},
    unapprovedPersonalMsgs = {},
    unapprovedDecryptMsgs = {},
    unapprovedEncryptionPublicKeyMsgs = {},
    unapprovedTypedMessages = {},
    network,
    chainId,
  ) =>
    txHelper(
      unapprovedTxs,
      unapprovedMsgs,
      unapprovedPersonalMsgs,
      unapprovedDecryptMsgs,
      unapprovedEncryptionPublicKeyMsgs,
      unapprovedTypedMessages,
      network,
      chainId,
    ) || [],
);

export const unconfirmedTransactionsHashSelector = createSelector(
  unapprovedTxsSelector,
  unapprovedMsgsSelector,
  unapprovedPersonalMsgsSelector,
  unapprovedDecryptMsgsSelector,
  unapprovedEncryptionPublicKeyMsgsSelector,
  unapprovedTypedMessagesSelector,
  deprecatedGetCurrentNetworkId,
  getCurrentChainId,
  (
    unapprovedTxs = {},
    unapprovedMsgs = {},
    unapprovedPersonalMsgs = {},
    unapprovedDecryptMsgs = {},
    unapprovedEncryptionPublicKeyMsgs = {},
    unapprovedTypedMessages = {},
    network,
    chainId,
  ) => {
    const filteredUnapprovedTxs = Object.keys(unapprovedTxs).reduce(
      (acc, address) => {
        const transactions = { ...acc };

        if (
          transactionMatchesNetwork(unapprovedTxs[address], chainId, network)
        ) {
          transactions[address] = unapprovedTxs[address];
        }

        return transactions;
      },
      {},
    );

    return {
      ...filteredUnapprovedTxs,
      ...unapprovedMsgs,
      ...unapprovedPersonalMsgs,
      ...unapprovedDecryptMsgs,
      ...unapprovedEncryptionPublicKeyMsgs,
      ...unapprovedTypedMessages,
    };
  },
);

const unapprovedMsgCountSelector = (state) => state.metamask.unapprovedMsgCount;
const unapprovedPersonalMsgCountSelector = (state) =>
  state.metamask.unapprovedPersonalMsgCount;
const unapprovedDecryptMsgCountSelector = (state) =>
  state.metamask.unapprovedDecryptMsgCount;
const unapprovedEncryptionPublicKeyMsgCountSelector = (state) =>
  state.metamask.unapprovedEncryptionPublicKeyMsgCount;
const unapprovedTypedMessagesCountSelector = (state) =>
  state.metamask.unapprovedTypedMessagesCount;

export const unconfirmedTransactionsCountSelector = createSelector(
  unapprovedTxsSelector,
  unapprovedMsgCountSelector,
  unapprovedPersonalMsgCountSelector,
  unapprovedDecryptMsgCountSelector,
  unapprovedEncryptionPublicKeyMsgCountSelector,
  unapprovedTypedMessagesCountSelector,
  deprecatedGetCurrentNetworkId,
  getCurrentChainId,
  (
    unapprovedTxs = {},
    unapprovedMsgCount = 0,
    unapprovedPersonalMsgCount = 0,
    unapprovedDecryptMsgCount = 0,
    unapprovedEncryptionPublicKeyMsgCount = 0,
    unapprovedTypedMessagesCount = 0,
    network,
    chainId,
  ) => {
    const filteredUnapprovedTxIds = Object.keys(unapprovedTxs).filter((txId) =>
      transactionMatchesNetwork(unapprovedTxs[txId], chainId, network),
    );

    return (
      filteredUnapprovedTxIds.length +
      unapprovedTypedMessagesCount +
      unapprovedMsgCount +
      unapprovedPersonalMsgCount +
      unapprovedDecryptMsgCount +
      unapprovedEncryptionPublicKeyMsgCount
    );
  },
);

export const currentCurrencySelector = (state) =>
  state.metamask.currentCurrency;
export const conversionRateSelector = (state) => state.metamask.conversionRate;

export const txDataSelector = (state) => state.confirmTransaction.txData;
const tokenDataSelector = (state) => state.confirmTransaction.tokenData;
const tokenPropsSelector = (state) => state.confirmTransaction.tokenProps;

const contractExchangeRatesSelector = (state) =>
  state.metamask.contractExchangeRates;

const tokenDecimalsSelector = createSelector(
  tokenPropsSelector,
  (tokenProps) => tokenProps && tokenProps.tokenDecimals,
);

const tokenDataArgsSelector = createSelector(
  tokenDataSelector,
  (tokenData) => (tokenData && tokenData.args) || [],
);

const txParamsSelector = createSelector(
  txDataSelector,
  (txData) => (txData && txData.txParams) || {},
);

export const tokenAddressSelector = createSelector(
  txParamsSelector,
  (txParams) => txParams && txParams.to,
);

const TOKEN_PARAM_TO = '_to';
const TOKEN_PARAM_VALUE = '_value';

export const sendTokenTokenAmountAndToAddressSelector = createSelector(
  tokenDataArgsSelector,
  tokenDecimalsSelector,
  (args, tokenDecimals) => {
    let toAddress = '';
    let tokenAmount = '0';

    // Token params here are ethers BigNumbers, which have a different
    // interface than bignumber.js
    if (args && args.length) {
      toAddress = args[TOKEN_PARAM_TO];
      let value = args[TOKEN_PARAM_VALUE].toString();

      if (tokenDecimals) {
        // bignumber.js return value
        value = calcTokenValue(value, tokenDecimals).toFixed();
      }

      tokenAmount = roundExponential(value);
    }

    return {
      toAddress,
      tokenAmount,
    };
  },
);

export const contractExchangeRateSelector = createSelector(
  contractExchangeRatesSelector,
  tokenAddressSelector,
  (contractExchangeRates, tokenAddress) => contractExchangeRates[tokenAddress],
);

export const transactionFeeSelector = function (state, txData) {
  const currentCurrency = currentCurrencySelector(state);
  const conversionRate = conversionRateSelector(state);
  const nativeCurrency = getNativeCurrency(state);

  const { txParams: { value = '0x0', gas: gasLimit = '0x0' } = {} } = txData;

  // if the gas price from our infura endpoint is null or undefined
  // use the metaswap average price estimation as a fallback
  let {
    txParams: { gasPrice },
  } = txData;
  if (!gasPrice) {
    gasPrice = getAveragePriceEstimateInHexWEI(state) || '0x0';
  }

  const fiatTransactionAmount = getValueFromWeiHex({
    value,
    fromCurrency: nativeCurrency,
    toCurrency: currentCurrency,
    conversionRate,
    numberOfDecimals: 2,
  });
  const ethTransactionAmount = getValueFromWeiHex({
    value,
    fromCurrency: nativeCurrency,
    toCurrency: nativeCurrency,
    conversionRate,
    numberOfDecimals: 6,
  });

  const hexTransactionFee = getHexGasTotal({ gasLimit, gasPrice });

  const fiatTransactionFee = getTransactionFee({
    value: hexTransactionFee,
    fromCurrency: nativeCurrency,
    toCurrency: currentCurrency,
    numberOfDecimals: 2,
    conversionRate,
  });
  const ethTransactionFee = getTransactionFee({
    value: hexTransactionFee,
    fromCurrency: nativeCurrency,
    toCurrency: nativeCurrency,
    numberOfDecimals: 6,
    conversionRate,
  });

  const fiatTransactionTotal = addFiat(
    fiatTransactionFee,
    fiatTransactionAmount,
  );
  const ethTransactionTotal = addEth(ethTransactionFee, ethTransactionAmount);
  const hexTransactionTotal = sumHexes(value, hexTransactionFee);

  return {
    hexTransactionAmount: value,
    fiatTransactionAmount,
    ethTransactionAmount,
    hexTransactionFee,
    fiatTransactionFee,
    ethTransactionFee,
    fiatTransactionTotal,
    ethTransactionTotal,
    hexTransactionTotal,
  };
};
