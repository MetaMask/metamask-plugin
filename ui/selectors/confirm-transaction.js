import { createSelector } from 'reselect';
import txHelper from '../helpers/utils/tx-helper';
import { calcTokenAmount } from '../helpers/utils/token-util';
import {
  roundExponential,
  getValueFromWeiHex,
  getTransactionFee,
  addFiat,
  addEth,
} from '../helpers/utils/confirm-tx.util';
import { sumHexes } from '../helpers/utils/transactions.util';
import { transactionMatchesNetwork } from '../../shared/modules/transaction.utils';
import {
  getGasEstimateType,
  getGasFeeEstimates,
  getNativeCurrency,
} from '../ducks/metamask/metamask';
import { TRANSACTION_ENVELOPE_TYPES } from '../../shared/constants/transaction';
import { decGWEIToHexWEI } from '../helpers/utils/conversions.util';
import { GAS_ESTIMATE_TYPES } from '../../shared/constants/gas';
import {
  getMaximumGasTotalInHexWei,
  getMinimumGasTotalInHexWei,
} from '../../shared/modules/gas.utils';
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
  (tokenProps) => tokenProps && tokenProps.decimals,
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
        value = calcTokenAmount(value, tokenDecimals).toFixed();
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
  const gasFeeEstimates = getGasFeeEstimates(state);
  const gasEstimateType = getGasEstimateType(state);

  const gasEstimationObject = {
    gasLimit: txData.txParams?.gas ?? '0x0',
  };

  switch (gasEstimateType) {
    case GAS_ESTIMATE_TYPES.NONE:
      gasEstimationObject.gasPrice = txData.txParams?.gasPrice ?? '0x0';
      break;
    case GAS_ESTIMATE_TYPES.ETH_GASPRICE:
      gasEstimationObject.gasPrice =
        txData.txParams?.gasPrice ?? decGWEIToHexWEI(gasFeeEstimates.gasPrice);
      break;
    case GAS_ESTIMATE_TYPES.LEGACY:
      gasEstimationObject.gasPrice =
        txData.txParams?.gasPrice ?? getAveragePriceEstimateInHexWEI(state);
      break;
    case GAS_ESTIMATE_TYPES.FEE_MARKET:
      if (txData.txParams?.type === TRANSACTION_ENVELOPE_TYPES.LEGACY) {
        gasEstimationObject.gasPrice = txData.txParams?.gasPrice ?? '0x0';
      } else {
        gasEstimationObject.maxFeePerGas =
          txData.txParams?.maxFeePerGas ??
          decGWEIToHexWEI(gasFeeEstimates.medium.suggestedMaxFeePerGas);
        gasEstimationObject.maxPriorityFeePerGas =
          txData.txParams?.maxPriorityFeePerGas ??
          decGWEIToHexWEI(gasFeeEstimates.medium.suggestedMaxPriorityFeePerGas);
        gasEstimationObject.baseFeePerGas = decGWEIToHexWEI(
          gasFeeEstimates.estimatedBaseFee,
        );
      }
      break;
    default:
      break;
  }

  const { txParams: { value = '0x0' } = {} } = txData;

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

  const hexMinimumTransactionFee = getMinimumGasTotalInHexWei(
    gasEstimationObject,
  );
  const hexMaximumTransactionFee = getMaximumGasTotalInHexWei(
    gasEstimationObject,
  );

  const fiatMinimumTransactionFee = getTransactionFee({
    value: hexMinimumTransactionFee,
    fromCurrency: nativeCurrency,
    toCurrency: currentCurrency,
    numberOfDecimals: 2,
    conversionRate,
  });

  const fiatMaximumTransactionFee = getTransactionFee({
    value: hexMaximumTransactionFee,
    fromCurrency: nativeCurrency,
    toCurrency: currentCurrency,
    numberOfDecimals: 2,
    conversionRate,
  });

  const ethTransactionFee = getTransactionFee({
    value: hexMinimumTransactionFee,
    fromCurrency: nativeCurrency,
    toCurrency: nativeCurrency,
    numberOfDecimals: 6,
    conversionRate,
  });

  const fiatTransactionTotal = addFiat(
    fiatMinimumTransactionFee,
    fiatTransactionAmount,
  );
  const ethTransactionTotal = addEth(ethTransactionFee, ethTransactionAmount);
  const hexTransactionTotal = sumHexes(value, hexMinimumTransactionFee);

  return {
    hexTransactionAmount: value,
    fiatTransactionAmount,
    ethTransactionAmount,
    hexMinimumTransactionFee,
    fiatMinimumTransactionFee,
    hexMaximumTransactionFee,
    fiatMaximumTransactionFee,
    ethTransactionFee,
    fiatTransactionTotal,
    ethTransactionTotal,
    hexTransactionTotal,
  };
};
