import { addHexPrefix } from '../../app/scripts/lib/util';
import {
  conversionUtil,
  conversionGreaterThan,
} from '../../shared/modules/conversion-util';
import { formatCurrency } from '../helpers/utils/confirm-tx.util';
import { decEthToConvertedCurrency as ethTotalToConvertedCurrency } from '../helpers/utils/conversions.util';
import { formatETHFee } from '../helpers/utils/formatters';

import { GAS_ESTIMATE_TYPES } from '../helpers/constants/common';
import { BASIC_ESTIMATE_STATES, GAS_SOURCE } from '../ducks/gas/gas.duck';
import { GAS_LIMITS } from '../../shared/constants/gas';
import { calcGasTotal } from '../../shared/modules/gas-utils';
import {
  getCurrentCurrency,
  getIsMainnet,
  getPreferences,
  getGasPrice,
} from '.';

const NUMBER_OF_DECIMALS_SM_BTNS = 5;

export function getCustomGasLimit(state) {
  return state.gas.customData.limit;
}

export function getCustomGasPrice(state) {
  return state.gas.customData.price;
}

export function getBasicGasEstimateLoadingStatus(state) {
  return state.gas.basicEstimateStatus === 'LOADING';
}

export function getAveragePriceEstimateInHexWEI(state) {
  const averagePriceEstimate = state.gas.basicEstimates
    ? state.gas.basicEstimates.average
    : '0x0';
  return getGasPriceInHexWei(averagePriceEstimate);
}

export function getFastPriceEstimateInHexWEI(state) {
  const fastPriceEstimate = getFastPriceEstimate(state);
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

export function getFastPriceEstimate(state) {
  const {
    gas: {
      basicEstimates: { fast },
    },
  } = state;

  return fast;
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

export function isCustomPriceExcessive(state, checkSend = false) {
  const customPrice = checkSend ? getGasPrice(state) : getCustomGasPrice(state);
  const fastPrice = getFastPriceEstimate(state);

  if (!customPrice || !fastPrice) {
    return false;
  }

  // Custom gas should be considered excessive when it is 1.5 times greater than the fastest estimate.
  const customPriceExcessive = conversionGreaterThan(
    {
      value: customPrice,
      fromNumericBase: 'hex',
      fromDenomination: 'WEI',
      toDenomination: 'GWEI',
    },
    {
      fromNumericBase: 'dec',
      value: Math.floor(fastPrice * 1.5),
    },
  );

  return customPriceExcessive;
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

export function getRenderableEthFee(
  estimate,
  gasLimit,
  numberOfDecimals = 9,
  nativeCurrency = 'ETH',
) {
  const value = conversionUtil(estimate, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
  });
  const fee = basicPriceEstimateToETHTotal(value, gasLimit, numberOfDecimals);
  return formatETHFee(fee, nativeCurrency);
}

export function getRenderableConvertedCurrencyFee(
  estimate,
  gasLimit,
  convertedCurrency,
  conversionRate,
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
  return formatCurrency(feeInCurrency, convertedCurrency);
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
  nativeCurrency,
) {
  const { safeLow, average, fast } = estimates;

  const slowEstimateData = {
    gasEstimateType: GAS_ESTIMATE_TYPES.SLOW,
    feeInPrimaryCurrency: getRenderableEthFee(
      safeLow,
      gasLimit,
      9,
      nativeCurrency,
    ),
    feeInSecondaryCurrency: showFiat
      ? getRenderableConvertedCurrencyFee(
          safeLow,
          gasLimit,
          currentCurrency,
          conversionRate,
        )
      : '',
    priceInHexWei: getGasPriceInHexWei(safeLow),
  };
  const averageEstimateData = {
    gasEstimateType: GAS_ESTIMATE_TYPES.AVERAGE,
    feeInPrimaryCurrency: getRenderableEthFee(
      average,
      gasLimit,
      9,
      nativeCurrency,
    ),
    feeInSecondaryCurrency: showFiat
      ? getRenderableConvertedCurrencyFee(
          average,
          gasLimit,
          currentCurrency,
          conversionRate,
        )
      : '',
    priceInHexWei: getGasPriceInHexWei(average),
  };
  const fastEstimateData = {
    gasEstimateType: GAS_ESTIMATE_TYPES.FAST,
    feeInPrimaryCurrency: getRenderableEthFee(
      fast,
      gasLimit,
      9,
      nativeCurrency,
    ),
    feeInSecondaryCurrency: showFiat
      ? getRenderableConvertedCurrencyFee(
          fast,
          gasLimit,
          currentCurrency,
          conversionRate,
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
    state.send.gasLimit || getCustomGasLimit(state) || GAS_LIMITS.SIMPLE;
  const { conversionRate } = state.metamask;
  const currentCurrency = getCurrentCurrency(state);
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
          )
        : '',
      feeInPrimaryCurrency: getRenderableEthFee(
        safeLow,
        gasLimit,
        NUMBER_OF_DECIMALS_SM_BTNS,
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
          )
        : '',
      feeInPrimaryCurrency: getRenderableEthFee(
        average,
        gasLimit,
        NUMBER_OF_DECIMALS_SM_BTNS,
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
          )
        : '',
      feeInPrimaryCurrency: getRenderableEthFee(
        fast,
        gasLimit,
        NUMBER_OF_DECIMALS_SM_BTNS,
      ),
      priceInHexWei: getGasPriceInHexWei(fast, true),
    },
  ];
}

export function getIsEthGasPriceFetched(state) {
  const gasState = state.gas;
  return Boolean(
    gasState.estimateSource === GAS_SOURCE.ETHGASPRICE &&
      gasState.basicEstimateStatus === BASIC_ESTIMATE_STATES.READY &&
      getIsMainnet(state),
  );
}

export function getNoGasPriceFetched(state) {
  const gasState = state.gas;
  return Boolean(gasState.basicEstimateStatus === BASIC_ESTIMATE_STATES.FAILED);
}

export function getIsGasEstimatesFetched(state) {
  const gasState = state.gas;
  return Boolean(
    gasState.estimateSource === GAS_SOURCE.METASWAPS &&
      gasState.basicEstimateStatus === BASIC_ESTIMATE_STATES.READY,
  );
}
