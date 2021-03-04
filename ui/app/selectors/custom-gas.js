import { addHexPrefix } from '../../../app/scripts/lib/util';
import {
  conversionUtil,
  conversionGreaterThan,
} from '../helpers/utils/conversion-util';
import { formatCurrency } from '../helpers/utils/confirm-tx.util';
import { decEthToConvertedCurrency as ethTotalToConvertedCurrency } from '../helpers/utils/conversions.util';
import { formatETHFee } from '../helpers/utils/formatters';
import { calcGasTotal } from '../pages/send/send.utils';
import { getCurrentLocale } from '../ducks/metamask/metamask';

import { GAS_ESTIMATE_TYPES } from '../helpers/constants/common';
import { getCurrentCurrency, getIsMainnet, getPreferences } from '.';

const NUMBER_OF_DECIMALS_SM_BTNS = 5;

export function getCustomGasLimit(state) {
  return state.gas.customData.limit;
}

export function getCustomGasPrice(state) {
  return state.gas.customData.price;
}

export function getBasicGasEstimateLoadingStatus(state) {
  return state.gas.basicEstimateIsLoading;
}

export function getAveragePriceEstimateInHexWEI(state) {
  const averagePriceEstimate = state.gas.basicEstimates.average;
  return getGasPriceInHexWei(averagePriceEstimate || '0x0');
}

export function getFastPriceEstimateInHexWEI(state) {
  const fastPriceEstimate = state.gas.basicEstimates.fast;
  return getGasPriceInHexWei(fastPriceEstimate || '0x0');
}

export function getDefaultActiveButtonIndex(
  gasButtonInfo,
  customGasPriceInHex,
  gasPrice,
) {
  return gasButtonInfo
    .map(({ priceInHexWei }) => priceInHexWei)
    .lastIndexOf(addHexPrefix(customGasPriceInHex || gasPrice));
}

export function getSafeLowEstimate(state) {
  const {
    gas: {
      basicEstimates: { safeLow },
    },
  } = state;

  return safeLow;
}

export function isCustomPriceSafe(state) {
  const safeLow = getSafeLowEstimate(state);

  const customGasPrice = getCustomGasPrice(state);

  if (!customGasPrice) {
    return true;
  }

  if (!safeLow) {
    return false;
  }

  const customPriceSafe = conversionGreaterThan(
    {
      value: customGasPrice,
      fromNumericBase: 'hex',
      fromDenomination: 'WEI',
      toDenomination: 'GWEI',
    },
    { value: safeLow, fromNumericBase: 'dec' },
  );

  return customPriceSafe;
}

export function basicPriceEstimateToETHTotal(
  estimate,
  gasLimit,
  numberOfDecimals = 9,
) {
  return conversionUtil(calcGasTotal(gasLimit, estimate), {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'GWEI',
    numberOfDecimals,
  });
}

export function getRenderableEthFee(estimate, gasLimit, numberOfDecimals = 9) {
  const value = conversionUtil(estimate, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
  });
  const fee = basicPriceEstimateToETHTotal(value, gasLimit, numberOfDecimals);
  return formatETHFee(fee);
}

export function getRenderableConvertedCurrencyFee(
  estimate,
  gasLimit,
  convertedCurrency,
  conversionRate,
  currentLocale,
) {
  const value = conversionUtil(estimate, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
  });
  const fee = basicPriceEstimateToETHTotal(value, gasLimit);
  const feeInCurrency = ethTotalToConvertedCurrency(
    fee,
    convertedCurrency,
    conversionRate,
  );
  return formatCurrency(feeInCurrency, convertedCurrency, currentLocale);
}

export function priceEstimateToWei(priceEstimate) {
  return conversionUtil(priceEstimate, {
    fromNumericBase: 'hex',
    toNumericBase: 'hex',
    fromDenomination: 'GWEI',
    toDenomination: 'WEI',
    numberOfDecimals: 9,
  });
}

export function getGasPriceInHexWei(price) {
  const value = conversionUtil(price, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
  });
  return addHexPrefix(priceEstimateToWei(value));
}

export function getRenderableGasButtonData(
  estimates,
  gasLimit,
  showFiat,
  conversionRate,
  currentCurrency,
  currentLocale,
) {
  const { safeLow, average, fast } = estimates;

  const slowEstimateData = {
    gasEstimateType: GAS_ESTIMATE_TYPES.SLOW,
    feeInPrimaryCurrency: getRenderableEthFee(safeLow, gasLimit),
    feeInSecondaryCurrency: showFiat
      ? getRenderableConvertedCurrencyFee(
          safeLow,
          gasLimit,
          currentCurrency,
          conversionRate,
          currentLocale,
        )
      : '',
    priceInHexWei: getGasPriceInHexWei(safeLow),
  };
  const averageEstimateData = {
    gasEstimateType: GAS_ESTIMATE_TYPES.AVERAGE,
    feeInPrimaryCurrency: getRenderableEthFee(average, gasLimit),
    feeInSecondaryCurrency: showFiat
      ? getRenderableConvertedCurrencyFee(
          average,
          gasLimit,
          currentCurrency,
          conversionRate,
          currentLocale,
        )
      : '',
    priceInHexWei: getGasPriceInHexWei(average),
  };
  const fastEstimateData = {
    gasEstimateType: GAS_ESTIMATE_TYPES.FAST,
    feeInPrimaryCurrency: getRenderableEthFee(fast, gasLimit),
    feeInSecondaryCurrency: showFiat
      ? getRenderableConvertedCurrencyFee(
          fast,
          gasLimit,
          currentCurrency,
          conversionRate,
          currentLocale,
        )
      : '',
    priceInHexWei: getGasPriceInHexWei(fast),
  };

  return {
    slowEstimateData,
    averageEstimateData,
    fastEstimateData,
  };
}

export function getRenderableBasicEstimateData(state, gasLimit) {
  if (getBasicGasEstimateLoadingStatus(state)) {
    return [];
  }

  const { showFiatInTestnets } = getPreferences(state);
  const isMainnet = getIsMainnet(state);
  const showFiat = isMainnet || Boolean(showFiatInTestnets);
  const { conversionRate } = state.metamask;
  const currentCurrency = getCurrentCurrency(state);
  const currentLocale = getCurrentLocale(state);
  const {
    slowEstimateData,
    averageEstimateData,
    fastEstimateData,
  } = getRenderableGasButtonData(
    state.gas.basicEstimates,
    gasLimit,
    showFiat,
    conversionRate,
    currentCurrency,
    currentLocale,
  );

  return [slowEstimateData, averageEstimateData, fastEstimateData];
}

export function getRenderableEstimateDataForSmallButtonsFromGWEI(state) {
  if (getBasicGasEstimateLoadingStatus(state)) {
    return [];
  }

  const { showFiatInTestnets } = getPreferences(state);
  const isMainnet = getIsMainnet(state);
  const showFiat = isMainnet || Boolean(showFiatInTestnets);
  const gasLimit =
    state.metamask.send.gasLimit || getCustomGasLimit(state) || '0x5208';
  const { conversionRate } = state.metamask;
  const currentCurrency = getCurrentCurrency(state);
  const currentLocale = getCurrentLocale(state);
  const {
    gas: {
      basicEstimates: { safeLow, average, fast },
    },
  } = state;

  return [
    {
      gasEstimateType: GAS_ESTIMATE_TYPES.SLOW,
      feeInSecondaryCurrency: showFiat
        ? getRenderableConvertedCurrencyFee(
            safeLow,
            gasLimit,
            currentCurrency,
            conversionRate,
            currentLocale,
          )
        : '',
      feeInPrimaryCurrency: getRenderableEthFee(
        safeLow,
        gasLimit,
        NUMBER_OF_DECIMALS_SM_BTNS,
        true,
      ),
      priceInHexWei: getGasPriceInHexWei(safeLow, true),
    },
    {
      gasEstimateType: GAS_ESTIMATE_TYPES.AVERAGE,
      feeInSecondaryCurrency: showFiat
        ? getRenderableConvertedCurrencyFee(
            average,
            gasLimit,
            currentCurrency,
            conversionRate,
            currentLocale,
          )
        : '',
      feeInPrimaryCurrency: getRenderableEthFee(
        average,
        gasLimit,
        NUMBER_OF_DECIMALS_SM_BTNS,
        true,
      ),
      priceInHexWei: getGasPriceInHexWei(average, true),
    },
    {
      gasEstimateType: GAS_ESTIMATE_TYPES.FAST,
      feeInSecondaryCurrency: showFiat
        ? getRenderableConvertedCurrencyFee(
            fast,
            gasLimit,
            currentCurrency,
            conversionRate,
            currentLocale,
          )
        : '',
      feeInPrimaryCurrency: getRenderableEthFee(
        fast,
        gasLimit,
        NUMBER_OF_DECIMALS_SM_BTNS,
        true,
      ),
      priceInHexWei: getGasPriceInHexWei(fast, true),
    },
  ];
}
