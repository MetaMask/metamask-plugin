import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import contractMap from '@metamask/contract-metadata';
import { clearConfirmTransaction } from '../../ducks/confirm-transaction/confirm-transaction.duck';

import {
  updateCustomNonce,
  cancelTx,
  cancelTxs,
  updateAndApproveTx,
  showModal,
  getNextNonce,
  tryReverseResolveAddress,
  setDefaultHomeActiveTabName,
} from '../../store/actions';
import {
  INSUFFICIENT_FUNDS_ERROR_KEY,
  GAS_LIMIT_TOO_LOW_ERROR_KEY,
} from '../../helpers/constants/error-keys';
import { getHexGasTotal } from '../../helpers/utils/confirm-tx.util';
import { isBalanceSufficient, calcGasTotal } from '../send/send.utils';
import { conversionGreaterThan } from '../../../shared/modules/conversion.utils';
import { MIN_GAS_LIMIT_DEC } from '../send/send.constants';
import { shortenAddress, valuesFor } from '../../helpers/utils/util';
import {
  getAdvancedInlineGasShown,
  getCustomNonceValue,
  getIsMainnet,
  getKnownMethodData,
  getMetaMaskAccounts,
  getUseNonceField,
  transactionFeeSelector,
  getNoGasPriceFetched,
  getIsEthGasPriceFetched,
  getShouldShowFiat,
} from '../../selectors';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import { transactionMatchesNetwork } from '../../../shared/modules/transaction.utils';
import { toChecksumHexAddress } from '../../../shared/modules/hexstring-utils';
import { updateTransactionGasFees } from '../../ducks/metamask/metamask';
import ConfirmTransactionBase from './confirm-transaction-base.component';

const casedContractMap = Object.keys(contractMap).reduce((acc, base) => {
  return {
    ...acc,
    [base.toLowerCase()]: contractMap[base],
  };
}, {});

let customNonceValue = '';
const customNonceMerge = (txData) =>
  customNonceValue
    ? {
        ...txData,
        customNonceValue,
      }
    : txData;

const mapStateToProps = (state, ownProps) => {
  const {
    toAddress: propsToAddress,
    customTxParamsData,
    match: { params = {} },
  } = ownProps;
  const { id: paramsTransactionId } = params;
  const isMainnet = getIsMainnet(state);
  const { confirmTransaction, metamask } = state;
  const {
    ensResolutionsByAddress,
    conversionRate,
    identities,
    addressBook,
    assetImages,
    network,
    unapprovedTxs,
    nextNonce,
    provider: { chainId },
  } = metamask;
  const { tokenData, txData, tokenProps, nonce } = confirmTransaction;
  const { txParams = {}, id: transactionId, type } = txData;
  const transaction =
    Object.values(unapprovedTxs).find(
      ({ id }) => id === (transactionId || Number(paramsTransactionId)),
    ) || {};
  const {
    from: fromAddress,
    to: txParamsToAddress,
    gasPrice,
    gas: gasLimit,
    value: amount,
    data,
  } = (transaction && transaction.txParams) || txParams;
  const accounts = getMetaMaskAccounts(state);
  const assetImage = assetImages[txParamsToAddress];

  const { balance } = accounts[fromAddress];
  const { name: fromName } = identities[fromAddress];
  const toAddress = propsToAddress || txParamsToAddress;

  const toName =
    identities[toAddress]?.name ||
    casedContractMap[toAddress]?.name ||
    shortenAddress(toChecksumHexAddress(toAddress));

  const checksummedAddress = toChecksumHexAddress(toAddress);
  const addressBookObject = addressBook[checksummedAddress];
  const toEns = ensResolutionsByAddress[checksummedAddress] || '';
  const toNickname = addressBookObject ? addressBookObject.name : '';
  const transactionStatus = transaction ? transaction.status : '';

  const {
    hexTransactionAmount,
    hexMinimumTransactionFee,
    hexMaximumTransactionFee,
    hexTransactionTotal,
  } = transactionFeeSelector(state, transaction);

  if (transaction && transaction.simulationFails) {
    txData.simulationFails = transaction.simulationFails;
  }

  const currentNetworkUnapprovedTxs = Object.keys(unapprovedTxs)
    .filter((key) =>
      transactionMatchesNetwork(unapprovedTxs[key], chainId, network),
    )
    .reduce((acc, key) => ({ ...acc, [key]: unapprovedTxs[key] }), {});
  const unapprovedTxCount = valuesFor(currentNetworkUnapprovedTxs).length;

  const insufficientBalance = !isBalanceSufficient({
    amount,
    gasTotal: calcGasTotal(gasLimit, gasPrice),
    balance,
    conversionRate,
  });

  const methodData = getKnownMethodData(state, data) || {};

  let fullTxData = { ...txData, ...transaction };
  if (customTxParamsData) {
    fullTxData = {
      ...fullTxData,
      txParams: {
        ...fullTxData.txParams,
        data: customTxParamsData,
      },
    };
  }
  customNonceValue = getCustomNonceValue(state);
  const isEthGasPrice = getIsEthGasPriceFetched(state);
  const noGasPrice = getNoGasPriceFetched(state);

  return {
    balance,
    fromAddress,
    fromName,
    toAddress,
    toEns,
    toName,
    toNickname,
    hexTransactionAmount,
    hexMinimumTransactionFee,
    hexMaximumTransactionFee,
    hexTransactionTotal,
    txData: fullTxData,
    tokenData,
    methodData,
    tokenProps,
    conversionRate,
    transactionStatus,
    nonce,
    assetImage,
    unapprovedTxs,
    unapprovedTxCount,
    currentNetworkUnapprovedTxs,
    customGas: {
      gasLimit,
      gasPrice,
    },
    advancedInlineGasShown: getAdvancedInlineGasShown(state),
    useNonceField: getUseNonceField(state),
    customNonceValue,
    insufficientBalance,
    hideSubtitle: !getShouldShowFiat(state),
    hideFiatConversion: !getShouldShowFiat(state),
    type,
    nextNonce,
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    isMainnet,
    isEthGasPrice,
    noGasPrice,
  };
};

export const mapDispatchToProps = (dispatch) => {
  return {
    tryReverseResolveAddress: (address) => {
      return dispatch(tryReverseResolveAddress(address));
    },
    updateCustomNonce: (value) => {
      customNonceValue = value;
      dispatch(updateCustomNonce(value));
    },
    clearConfirmTransaction: () => dispatch(clearConfirmTransaction()),
    showTransactionConfirmedModal: ({ onSubmit }) => {
      return dispatch(showModal({ name: 'TRANSACTION_CONFIRMED', onSubmit }));
    },
    showCustomizeGasModal: ({ txData, onSubmit, validate }) => {
      return dispatch(
        showModal({
          name: 'CUSTOMIZE_GAS',
          txData,
          onSubmit,
          validate,
        }),
      );
    },
    showRejectTransactionsConfirmationModal: ({
      onSubmit,
      unapprovedTxCount,
    }) => {
      return dispatch(
        showModal({ name: 'REJECT_TRANSACTIONS', onSubmit, unapprovedTxCount }),
      );
    },
    cancelTransaction: ({ id }) => dispatch(cancelTx({ id })),
    cancelAllTransactions: (txList) => dispatch(cancelTxs(txList)),
    sendTransaction: (txData) =>
      dispatch(updateAndApproveTx(customNonceMerge(txData))),
    getNextNonce: () => dispatch(getNextNonce()),
    setDefaultHomeActiveTabName: (tabName) =>
      dispatch(setDefaultHomeActiveTabName(tabName)),
    updateTransactionGasFees: (gasFees) => {
      dispatch(updateTransactionGasFees({ ...gasFees, expectHexWei: true }));
    },
  };
};

const getValidateEditGas = ({ balance, conversionRate, txData }) => {
  const { txParams: { value: amount } = {} } = txData;

  return ({ gasLimit, gasPrice }) => {
    const gasTotal = getHexGasTotal({ gasLimit, gasPrice });
    const hasSufficientBalance = isBalanceSufficient({
      amount,
      gasTotal,
      balance,
      conversionRate,
    });

    if (!hasSufficientBalance) {
      return {
        valid: false,
        errorKey: INSUFFICIENT_FUNDS_ERROR_KEY,
      };
    }

    const gasLimitTooLow =
      gasLimit &&
      conversionGreaterThan(
        {
          value: MIN_GAS_LIMIT_DEC,
          fromNumericBase: 'dec',
          conversionRate,
        },
        {
          value: gasLimit,
          fromNumericBase: 'hex',
        },
      );

    if (gasLimitTooLow) {
      return {
        valid: false,
        errorKey: GAS_LIMIT_TOO_LOW_ERROR_KEY,
      };
    }

    return {
      valid: true,
    };
  };
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { balance, conversionRate, txData, unapprovedTxs } = stateProps;

  const {
    cancelAllTransactions: dispatchCancelAllTransactions,
    showCustomizeGasModal: dispatchShowCustomizeGasModal,
    updateTransactionGasFees: dispatchUpdateTransactionGasFees,
    ...otherDispatchProps
  } = dispatchProps;

  const validateEditGas = getValidateEditGas({
    balance,
    conversionRate,
    txData,
  });

  return {
    ...stateProps,
    ...otherDispatchProps,
    ...ownProps,
    showCustomizeGasModal: () =>
      dispatchShowCustomizeGasModal({
        txData,
        onSubmit: (customGas) => dispatchUpdateTransactionGasFees(customGas),
        validate: validateEditGas,
      }),
    cancelAllTransactions: () =>
      dispatchCancelAllTransactions(valuesFor(unapprovedTxs)),
    updateGasAndCalculate: ({ gasLimit, gasPrice }) => {
      dispatchUpdateTransactionGasFees({
        gasLimit,
        gasPrice,
        transaction: txData,
      });
    },
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps, mergeProps),
)(ConfirmTransactionBase);
