import { connect } from 'react-redux';
import { addHexPrefix } from '../../../../../app/scripts/lib/util';
import {
  hideModal,
  createRetryTransaction,
  createSpeedUpTransaction,
  hideSidebar,
  updateTransaction,
} from '../../../../store/actions';
import {
  setCustomGasPrice,
  setCustomGasLimit,
  resetCustomData,
  fetchBasicGasEstimates,
} from '../../../../ducks/gas/gas.duck';
import {
  hideGasButtonGroup,
  setGasLimit,
  setGasPrice,
  setGasTotal,
  updateSendAmount,
  updateSendErrors,
} from '../../../../ducks/send/send.duck';
import {
  conversionRateSelector as getConversionRate,
  getCurrentCurrency,
  getCurrentEthBalance,
  getIsMainnet,
  getSendToken,
  getPreferences,
  getBasicGasEstimateLoadingStatus,
  getCustomGasLimit,
  getCustomGasPrice,
  getDefaultActiveButtonIndex,
  getRenderableBasicEstimateData,
  isCustomPriceSafe,
  getTokenBalance,
  getSendMaxModeState,
  getAveragePriceEstimateInHexWEI,
  isCustomPriceExcessive,
  getIsGasEstimatesFetched,
} from '../../../../selectors';

import {
  addHexes,
  subtractHexWEIsToDec,
  hexWEIToDecGWEI,
  getValueFromWeiHex,
  sumHexWEIsToRenderableFiat,
} from '../../../../helpers/utils/conversions.util';
import { formatETHFee } from '../../../../helpers/utils/formatters';
import { isBalanceSufficient } from '../../../../pages/send/send.utils';
import { MIN_GAS_LIMIT_DEC } from '../../../../pages/send/send.constants';
import { calcMaxAmount } from '../../../../pages/send/send-content/send-amount-row/amount-max-button/amount-max-button.utils';
import { TRANSACTION_STATUSES } from '../../../../../shared/constants/transaction';
import { GAS_LIMITS } from '../../../../../shared/constants/gas';
import { calcGasTotal } from '../../../../../shared/modules/gas-utils';
import GasModalPageContainer from './gas-modal-page-container.component';

const mapStateToProps = (state, ownProps) => {
  const {
    metamask: { currentNetworkTxList },
    send,
  } = state;
  const { modalState: { props: modalProps } = {} } = state.appState.modal || {};
  const { txData = {} } = modalProps || {};
  const { transaction = {}, onSubmit } = ownProps;
  const selectedTransaction = currentNetworkTxList.find(
    ({ id }) => id === (transaction.id || txData.id),
  );
  const buttonDataLoading = getBasicGasEstimateLoadingStatus(state);
  const sendToken = getSendToken(state);

  // a "default" txParams is used during the send flow, since the transaction doesn't exist yet in that case
  const txParams = selectedTransaction?.txParams
    ? selectedTransaction.txParams
    : {
        gas: send.gasLimit || GAS_LIMITS.SIMPLE,
        gasPrice: send.gasPrice || getAveragePriceEstimateInHexWEI(state, true),
        value: sendToken ? '0x0' : send.amount,
      };

  const { gasPrice: currentGasPrice, gas: currentGasLimit } = txParams;
  const value = ownProps.transaction?.txParams?.value || txParams.value;
  const customModalGasPriceInHex = getCustomGasPrice(state) || currentGasPrice;
  const customModalGasLimitInHex =
    getCustomGasLimit(state) || currentGasLimit || GAS_LIMITS.SIMPLE;
  const customGasTotal = calcGasTotal(
    customModalGasLimitInHex,
    customModalGasPriceInHex,
  );

  const gasButtonInfo = getRenderableBasicEstimateData(
    state,
    customModalGasLimitInHex,
  );

  const currentCurrency = getCurrentCurrency(state);
  const conversionRate = getConversionRate(state);
  const newTotalFiat = sumHexWEIsToRenderableFiat(
    [value, customGasTotal],
    currentCurrency,
    conversionRate,
  );

  const { hideBasic } = state.appState.modal.modalState.props;

  const customGasPrice = calcCustomGasPrice(customModalGasPriceInHex);

  const maxModeOn = getSendMaxModeState(state);

  const balance = getCurrentEthBalance(state);

  const { showFiatInTestnets } = getPreferences(state);
  const isMainnet = getIsMainnet(state);
  const showFiat = Boolean(isMainnet || showFiatInTestnets);

  const isSendTokenSet = Boolean(sendToken);

  const newTotalEth =
    maxModeOn && !isSendTokenSet
      ? sumHexWEIsToRenderableEth([balance, '0x0'])
      : sumHexWEIsToRenderableEth([value, customGasTotal]);

  const sendAmount =
    maxModeOn && !isSendTokenSet
      ? subtractHexWEIsFromRenderableEth(balance, customGasTotal)
      : sumHexWEIsToRenderableEth([value, '0x0']);

  const insufficientBalance = maxModeOn
    ? false
    : !isBalanceSufficient({
        amount: value,
        gasTotal: customGasTotal,
        balance,
        conversionRate,
      });
  const isGasEstimate = getIsGasEstimatesFetched(state);
  return {
    hideBasic,
    isConfirm: isConfirm(state),
    customModalGasPriceInHex,
    customModalGasLimitInHex,
    customGasPrice,
    customGasLimit: calcCustomGasLimit(customModalGasLimitInHex),
    customGasTotal,
    newTotalFiat,
    customPriceIsSafe:
      (isMainnet || process.env.IN_TEST) && isGasEstimate
        ? isCustomPriceSafe(state)
        : true,
    customPriceIsExcessive: isCustomPriceExcessive(state),
    maxModeOn,
    gasPriceButtonGroupProps: {
      buttonDataLoading,
      defaultActiveButtonIndex: getDefaultActiveButtonIndex(
        gasButtonInfo,
        customModalGasPriceInHex,
      ),
      gasButtonInfo,
    },
    infoRowProps: {
      originalTotalFiat: sumHexWEIsToRenderableFiat(
        [value, customGasTotal],
        currentCurrency,
        conversionRate,
      ),
      originalTotalEth: sumHexWEIsToRenderableEth([value, customGasTotal]),
      newTotalFiat: showFiat ? newTotalFiat : '',
      newTotalEth,
      transactionFee: sumHexWEIsToRenderableEth(['0x0', customGasTotal]),
      sendAmount,
    },
    transaction: txData || transaction,
    isSpeedUp: transaction.status === TRANSACTION_STATUSES.SUBMITTED,
    isRetry: transaction.status === TRANSACTION_STATUSES.FAILED,
    txId: transaction.id,
    insufficientBalance,
    isMainnet,
    sendToken,
    balance,
    tokenBalance: getTokenBalance(state),
    conversionRate,
    value,
    onSubmit,
  };
};

const mapDispatchToProps = (dispatch) => {
  const updateCustomGasPrice = (newPrice) =>
    dispatch(setCustomGasPrice(addHexPrefix(newPrice)));

  return {
    cancelAndClose: () => {
      dispatch(resetCustomData());
      dispatch(hideModal());
    },
    hideModal: () => dispatch(hideModal()),
    updateCustomGasPrice,
    updateCustomGasLimit: (newLimit) =>
      dispatch(setCustomGasLimit(addHexPrefix(newLimit))),
    setGasData: (newLimit, newPrice) => {
      dispatch(setGasLimit(newLimit));
      dispatch(setGasPrice(newPrice));
    },
    updateConfirmTxGasAndCalculate: (gasLimit, gasPrice, updatedTx) => {
      updateCustomGasPrice(gasPrice);
      dispatch(setCustomGasLimit(addHexPrefix(gasLimit.toString(16))));
      return dispatch(updateTransaction(updatedTx));
    },
    createRetryTransaction: (txId, gasPrice, gasLimit) => {
      return dispatch(createRetryTransaction(txId, gasPrice, gasLimit));
    },
    createSpeedUpTransaction: (txId, gasPrice, gasLimit) => {
      return dispatch(createSpeedUpTransaction(txId, gasPrice, gasLimit));
    },
    hideGasButtonGroup: () => dispatch(hideGasButtonGroup()),
    hideSidebar: () => dispatch(hideSidebar()),
    fetchBasicGasEstimates: () => dispatch(fetchBasicGasEstimates()),
    setGasTotal: (total) => dispatch(setGasTotal(total)),
    setAmountToMax: (maxAmountDataObject) => {
      dispatch(updateSendErrors({ amount: null }));
      dispatch(updateSendAmount(calcMaxAmount(maxAmountDataObject)));
    },
  };
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const {
    gasPriceButtonGroupProps,
    // eslint-disable-next-line no-shadow
    isConfirm,
    txId,
    isSpeedUp,
    isRetry,
    insufficientBalance,
    maxModeOn,
    customGasPrice,
    customGasTotal,
    balance,
    sendToken,
    tokenBalance,
    customGasLimit,
    transaction,
  } = stateProps;
  const {
    hideGasButtonGroup: dispatchHideGasButtonGroup,
    setGasData: dispatchSetGasData,
    updateConfirmTxGasAndCalculate: dispatchUpdateConfirmTxGasAndCalculate,
    createSpeedUpTransaction: dispatchCreateSpeedUpTransaction,
    createRetryTransaction: dispatchCreateRetryTransaction,
    hideSidebar: dispatchHideSidebar,
    cancelAndClose: dispatchCancelAndClose,
    hideModal: dispatchHideModal,
    setAmountToMax: dispatchSetAmountToMax,
    ...otherDispatchProps
  } = dispatchProps;

  return {
    ...stateProps,
    ...otherDispatchProps,
    ...ownProps,
    onSubmit: (gasLimit, gasPrice) => {
      if (ownProps.onSubmit) {
        dispatchHideSidebar();
        dispatchCancelAndClose();
        ownProps.onSubmit(gasLimit, gasPrice);
        return;
      }
      if (isConfirm) {
        const updatedTx = {
          ...transaction,
          txParams: {
            ...transaction.txParams,
            gas: gasLimit,
            gasPrice,
          },
        };
        dispatchUpdateConfirmTxGasAndCalculate(gasLimit, gasPrice, updatedTx);
        dispatchHideModal();
      } else if (isSpeedUp) {
        dispatchCreateSpeedUpTransaction(txId, gasPrice, gasLimit);
        dispatchHideSidebar();
        dispatchCancelAndClose();
      } else if (isRetry) {
        dispatchCreateRetryTransaction(txId, gasPrice, gasLimit);
        dispatchHideSidebar();
        dispatchCancelAndClose();
      } else {
        dispatchSetGasData(gasLimit, gasPrice);
        dispatchHideGasButtonGroup();
        dispatchCancelAndClose();
      }
      if (maxModeOn) {
        dispatchSetAmountToMax({
          balance,
          gasTotal: customGasTotal,
          sendToken,
          tokenBalance,
        });
      }
    },
    gasPriceButtonGroupProps: {
      ...gasPriceButtonGroupProps,
      handleGasPriceSelection: ({ gasPrice }) =>
        otherDispatchProps.updateCustomGasPrice(gasPrice),
    },
    cancelAndClose: () => {
      dispatchCancelAndClose();
      if (isSpeedUp || isRetry) {
        dispatchHideSidebar();
      }
    },
    disableSave:
      insufficientBalance ||
      (isSpeedUp && customGasPrice === 0) ||
      customGasLimit < Number(MIN_GAS_LIMIT_DEC),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(GasModalPageContainer);

function isConfirm(state) {
  return Boolean(Object.keys(state.confirmTransaction.txData).length);
}

function calcCustomGasPrice(customGasPriceInHex) {
  return Number(hexWEIToDecGWEI(customGasPriceInHex));
}

function calcCustomGasLimit(customGasLimitInHex) {
  return parseInt(customGasLimitInHex, 16);
}

function sumHexWEIsToRenderableEth(hexWEIs) {
  const hexWEIsSum = hexWEIs.filter(Boolean).reduce(addHexes);
  return formatETHFee(
    getValueFromWeiHex({
      value: hexWEIsSum,
      toCurrency: 'ETH',
      numberOfDecimals: 6,
    }),
  );
}

function subtractHexWEIsFromRenderableEth(aHexWEI, bHexWEI) {
  return formatETHFee(subtractHexWEIsToDec(aHexWEI, bHexWEI));
}
