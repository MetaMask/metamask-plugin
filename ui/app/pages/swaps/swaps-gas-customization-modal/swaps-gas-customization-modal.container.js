import { connect } from 'react-redux';
import BigNumber from 'bignumber.js';
import { hideModal, customSwapsGasParamsUpdated } from '../../../store/actions';
import {
  conversionRateSelector as getConversionRate,
  getCurrentCurrency,
  getCurrentEthBalance,
  getDefaultActiveButtonIndex,
  getRenderableGasButtonData,
  getUSDConversionRate,
} from '../../../selectors';

import {
  getSwapsCustomizationModalPrice,
  getSwapsCustomizationModalLimit,
  swapGasEstimateLoadingHasFailed,
  swapGasPriceEstimateIsLoading,
  getSwapGasPriceEstimateData,
  swapCustomGasModalPriceEdited,
  swapCustomGasModalLimitEdited,
  shouldShowCustomPriceTooLowWarning,
  swapCustomGasModalClosed,
} from '../../../ducks/swaps/swaps';

import {
  addHexes,
  getValueFromWeiHex,
  sumHexWEIsToRenderableFiat,
} from '../../../helpers/utils/conversions.util';
import { getCurrentLocale } from '../../../ducks/metamask/metamask';
import { formatETHFee } from '../../../helpers/utils/formatters';
import { calcGasTotal, isBalanceSufficient } from '../../send/send.utils';
import SwapsGasCustomizationModalComponent from './swaps-gas-customization-modal.component';

const mapStateToProps = (state) => {
  const currentCurrency = getCurrentCurrency(state);
  const conversionRate = getConversionRate(state);
  const currentLocale = getCurrentLocale(state);

  const { modalState: { props: modalProps } = {} } = state.appState.modal || {};
  const {
    value,
    customGasLimitMessage = '',
    customTotalSupplement = '',
    extraInfoRow = null,
    initialGasPrice,
    initialGasLimit,
    minimumGasLimit,
  } = modalProps;
  const buttonDataLoading = swapGasPriceEstimateIsLoading(state);

  const swapsCustomizationModalPrice = getSwapsCustomizationModalPrice(state);
  const swapsCustomizationModalLimit = getSwapsCustomizationModalLimit(state);

  const customGasPrice = swapsCustomizationModalPrice || initialGasPrice;
  const customGasLimit = swapsCustomizationModalLimit || initialGasLimit;

  const customGasTotal = calcGasTotal(customGasLimit, customGasPrice);

  const swapsGasPriceEstimates = getSwapGasPriceEstimateData(state);

  const { averageEstimateData, fastEstimateData } = getRenderableGasButtonData(
    swapsGasPriceEstimates,
    customGasLimit,
    true,
    conversionRate,
    currentCurrency,
    currentLocale,
  );
  const gasButtonInfo = [averageEstimateData, fastEstimateData];

  const newTotalFiat = sumHexWEIsToRenderableFiat(
    [value, customGasTotal, customTotalSupplement],
    currentCurrency,
    conversionRate,
    currentLocale,
  );

  const balance = getCurrentEthBalance(state);

  const newTotalEth = sumHexWEIsToRenderableEth([
    value,
    customGasTotal,
    customTotalSupplement,
  ]);

  const sendAmount = sumHexWEIsToRenderableEth([value, '0x0']);

  const insufficientBalance = !isBalanceSufficient({
    amount: value,
    gasTotal: customGasTotal,
    balance,
    conversionRate,
  });

  const customGasLimitTooLow = new BigNumber(customGasLimit, 16).lt(
    minimumGasLimit,
    10,
  );

  return {
    customGasPrice,
    customGasLimit,
    showCustomPriceTooLowWarning: shouldShowCustomPriceTooLowWarning(state),
    gasPriceButtonGroupProps: {
      buttonDataLoading,
      defaultActiveButtonIndex: getDefaultActiveButtonIndex(
        gasButtonInfo,
        customGasPrice,
      ),
      gasButtonInfo,
    },
    infoRowProps: {
      originalTotalFiat: sumHexWEIsToRenderableFiat(
        [value, customGasTotal, customTotalSupplement],
        currentCurrency,
        conversionRate,
        currentLocale,
      ),
      originalTotalEth: sumHexWEIsToRenderableEth([
        value,
        customGasTotal,
        customTotalSupplement,
      ]),
      newTotalFiat,
      newTotalEth,
      transactionFee: sumHexWEIsToRenderableEth(['0x0', customGasTotal]),
      sendAmount,
      extraInfoRow,
    },
    gasEstimateLoadingHasFailed: swapGasEstimateLoadingHasFailed(state),
    insufficientBalance,
    customGasLimitMessage,
    customTotalSupplement,
    usdConversionRate: getUSDConversionRate(state),
    disableSave: insufficientBalance || customGasLimitTooLow,
    minimumGasLimit,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    cancelAndClose: () => {
      dispatch(swapCustomGasModalClosed());
      dispatch(hideModal());
    },
    onSubmit: async (gasLimit, gasPrice) => {
      await dispatch(customSwapsGasParamsUpdated(gasLimit, gasPrice));
      dispatch(swapCustomGasModalClosed());
      dispatch(hideModal());
    },
    setSwapsCustomizationModalPrice: (newPrice) => {
      dispatch(swapCustomGasModalPriceEdited(newPrice));
    },
    setSwapsCustomizationModalLimit: (newLimit) => {
      dispatch(swapCustomGasModalLimitEdited(newLimit));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SwapsGasCustomizationModalComponent);

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
