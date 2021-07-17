import { addHexPrefix } from 'ethereumjs-util';
import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { GAS_ESTIMATE_TYPES } from '../../shared/constants/gas';
import { multiplyCurrencies } from '../../shared/modules/conversion.utils';
import {
  getMaximumGasTotalInHexWei,
  getMinimumGasTotalInHexWei,
} from '../../shared/modules/gas.utils';
import { PRIMARY, SECONDARY } from '../helpers/constants/common';
import {
  decGWEIToHexWEI,
  decimalToHex,
} from '../helpers/utils/conversions.util';
import { getShouldShowFiat } from '../selectors';
import { GAS_FORM_ERRORS } from '../helpers/constants/gas';
import { useCurrencyDisplay } from './useCurrencyDisplay';
import { useGasFeeEstimates } from './useGasFeeEstimates';
import { useUserPreferencedCurrency } from './useUserPreferencedCurrency';

const HIGH_FEE_WARNING_MULTIPLIER = 1.5;

/**
 * Opaque string type representing a decimal (base 10) number in GWEI
 * @typedef {`${number}`} DecGweiString
 */

/**
 * String value representing the active estimate level to use
 * @typedef {'low' | 'medium' | 'high'} EstimateLevel
 */

/**
 * Pulls out gasPrice estimate from either of the two gasPrice estimation
 * sources, based on the gasEstimateType and current estimateToUse.
 * @param {{import(
 *   '@metamask/controllers'
 * ).GasFeeState['gasFeeEstimates']}} gasFeeEstimates - estimates returned from
 *  the controller
 * @param {import(
 *  './useGasFeeEstimates'
 * ).GasEstimates} gasEstimateType - type of estimate returned from controller
 * @param {EstimateLevel} estimateToUse - current estimate level to use
 * @returns {[DecGweiString]} - gasPrice estimate to use or null
 */
function getGasPriceEstimate(gasFeeEstimates, gasEstimateType, estimateToUse) {
  if (gasEstimateType === GAS_ESTIMATE_TYPES.LEGACY) {
    return gasFeeEstimates?.[estimateToUse] ?? '0';
  } else if (gasEstimateType === GAS_ESTIMATE_TYPES.ETH_GASPRICE) {
    return gasFeeEstimates?.gasPrice ?? '0';
  }
  return '0';
}

/**
 * Pulls out gas fee estimate from the estimates returned from controller,
 * based on the gasEstimateType and current estimateToUse.
 * @param {'maxFeePerGas' | 'maxPriorityFeePerGas'} field - field to select
 * @param {{import(
 *   '@metamask/controllers'
 * ).GasFeeState['gasFeeEstimates']}} gasFeeEstimates - estimates returned from
 *  the controller
 * @param {import(
 *  './useGasFeeEstimates'
 * ).GasEstimates} gasEstimateType - type of estimate returned from controller
 * @param {EstimateLevel} estimateToUse - current estimate level to use
 * @returns {[DecGweiString]} - gas fee estimate to use or null
 */
function getGasFeeEstimate(
  field,
  gasFeeEstimates,
  gasEstimateType,
  estimateToUse,
) {
  if (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
    return gasFeeEstimates?.[estimateToUse]?.[field] ?? '0';
  }
  return '0';
}

/**
 * @typedef {Object} GasFeeInputReturnType
 * @property {DecGweiString} [maxFeePerGas] - the maxFeePerGas input value.
 * @property {string} [maxFeePerGasFiat] - the maxFeePerGas converted to the
 *  user's preferred currency.
 * @property {(DecGweiString) => void} setMaxFeePerGas - state setter method to
 *  update the maxFeePerGas.
 * @property {DecGweiString} [maxPriorityFeePerGas] - the maxPriorityFeePerGas
 *  input value.
 * @property {string} [maxPriorityFeePerGasFiat] - the maxPriorityFeePerGas
 *  converted to the user's preferred currency.
 * @property {(DecGweiString) => void} setMaxPriorityFeePerGas - state setter
 *  method to update the maxPriorityFeePerGas.
 * @property {DecGweiString} [gasPrice] - the gasPrice input value.
 * @property {(DecGweiString) => void} setGasPrice - state setter method to
 *  update the gasPrice.
 * @property {DecGweiString} gasLimit - the gasLimit input value.
 * @property {(DecGweiString) => void} setGasLimit - state setter method to
 *  update the gasLimit.
 * @property {EstimateLevel} [estimateToUse] - the estimate level currently
 *  selected. This will be null if the user has ejected from using the
 *  estimates.
 * @property {([EstimateLevel]) => void} setEstimateToUse - Setter method for
 *  choosing which EstimateLevel to use.
 * @property {string} [estimatedMinimumFiat] - The amount estimated to be paid
 *  based on current network conditions. Expressed in user's preferred
 *  currency.
 * @property {string} [estimatedMaximumFiat] - the maximum amount estimated to be
 *  paid if current network transaction volume increases. Expressed in user's
 *  preferred currency.
 * @property {string} [estimatedMaximumNative] - the maximum amount estimated to
 *  be paid if the current network transaction volume increases. Expressed in
 *  the network's native currency.
 */

/**
 * Uses gasFeeEstimates and state to keep track of user gas fee inputs.
 * Will update the gas fee state when estimates update if the user has not yet
 * modified the fields.
 * @param {EstimateLevel} defaultEstimateToUse - which estimate
 *  level to default the 'estimateToUse' state variable to.
 * @returns {GasFeeInputReturnType & import(
 *  './useGasFeeEstimates'
 * ).GasEstimates} - gas fee input state and the GasFeeEstimates object
 */
export function useGasFeeInputs(defaultEstimateToUse = 'medium') {
  // We need to know whether to show fiat conversions or not, so that we can
  // default our fiat values to empty strings if showing fiat is not wanted or
  // possible.
  const showFiat = useSelector(getShouldShowFiat);

  // We need to know the current network's currency and its decimal precision
  // to calculate the amount to display to the user.
  const {
    currency: primaryCurrency,
    numberOfDecimals: primaryNumberOfDecimals,
  } = useUserPreferencedCurrency(PRIMARY);

  // For calculating the value of gas fees in the user's preferred currency we
  // first have to know what that currency is and its decimal precision
  const {
    currency: fiatCurrency,
    numberOfDecimals: fiatNumberOfDecimals,
  } = useUserPreferencedCurrency(SECONDARY);

  // This hook keeps track of a few pieces of transitional state. It is
  // transitional because it is only used to modify a transaction in the
  // metamask (background) state tree.
  const [maxFeePerGas, setMaxFeePerGas] = useState(null);
  const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = useState(null);
  const [gasPrice, setGasPrice] = useState(null);
  const [gasLimit, setGasLimit] = useState(21000);
  const [estimateToUse, setInternalEstimateToUse] = useState(
    defaultEstimateToUse,
  );

  // We need the gas estimates from the GasFeeController in the background.
  // Calling this hooks initiates polling for new gas estimates and returns the
  // current estimate.
  const {
    gasEstimateType,
    gasFeeEstimates,
    isGasEstimatesLoading,
    estimatedGasFeeTimeBounds,
  } = useGasFeeEstimates();

  // When a user selects an estimate level, it will wipe out what they have
  // previously put in the inputs. This returns the inputs to the estimated
  // values at the level specified.
  const setEstimateToUse = useCallback((estimateLevel) => {
    setInternalEstimateToUse(estimateLevel);
    setMaxFeePerGas(null);
    setMaxPriorityFeePerGas(null);
    setGasPrice(null);
  }, []);

  // We specify whether to use the estimate value by checking if the state
  // value has been set. The state value is only set by user input and is wiped
  // when the user selects an estimate. Default here is '0' to avoid bignumber
  // errors in later calculations for nullish values.
  const maxFeePerGasToUse =
    maxFeePerGas ??
    getGasFeeEstimate(
      'suggestedMaxFeePerGas',
      gasFeeEstimates,
      gasEstimateType,
      estimateToUse,
    );

  const maxPriorityFeePerGasToUse =
    maxPriorityFeePerGas ??
    getGasFeeEstimate(
      'suggestedMaxPriorityFeePerGas',
      gasFeeEstimates,
      gasEstimateType,
      estimateToUse,
    );

  const gasPriceToUse =
    gasPrice ??
    getGasPriceEstimate(gasFeeEstimates, gasEstimateType, estimateToUse);

  // We have two helper methods that take an object that can have either
  // gasPrice OR the EIP-1559 fields on it, plus gasLimit. This object is
  // conditionally set to the appropriate fields to compute the minimum
  // and maximum cost of a transaction given the current estimates or selected
  // gas fees.
  const gasSettings = {
    gasLimit: decimalToHex(gasLimit),
  };
  if (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
    gasSettings.maxFeePerGas = decGWEIToHexWEI(maxFeePerGasToUse);
    gasSettings.maxPriorityFeePerGas = decGWEIToHexWEI(
      maxPriorityFeePerGasToUse,
    );
    gasSettings.baseFeePerGas = decGWEIToHexWEI(
      gasFeeEstimates.estimatedBaseFee ?? '0',
    );
  } else if (gasEstimateType === GAS_ESTIMATE_TYPES.NONE) {
    gasSettings.gasPrice = '0x0';
  } else {
    gasSettings.gasPrice = decGWEIToHexWEI(gasPriceToUse);
  }

  // The maximum amount this transaction will cost
  const maximumCostInHexWei = getMaximumGasTotalInHexWei(gasSettings);
  // The minimum amount this transaction will cost's
  const minimumCostInHexWei = getMinimumGasTotalInHexWei(gasSettings);

  // We need to display the estimated fiat currency impact of the
  // maxPriorityFeePerGas field to the user. This hook calculates that amount.
  const [, { value: maxPriorityFeePerGasFiat }] = useCurrencyDisplay(
    addHexPrefix(
      multiplyCurrencies(maxPriorityFeePerGasToUse, gasLimit, {
        toNumericBase: 'hex',
        fromDenomination: 'GWEI',
        toDenomination: 'WEI',
        multiplicandBase: 10,
        multiplierBase: 10,
      }),
    ),
    {
      numberOfDecimals: fiatNumberOfDecimals,
      currency: fiatCurrency,
    },
  );

  // We need to display thee estimated fiat currency impact of the maxFeePerGas
  // field to the user. This hook calculates that amount. This also works for
  // the gasPrice amount because in legacy transactions cost is always gasPrice
  // * gasLimit.
  const [, { value: maxFeePerGasFiat }] = useCurrencyDisplay(
    maximumCostInHexWei,
    {
      numberOfDecimals: fiatNumberOfDecimals,
      currency: fiatCurrency,
    },
  );

  // We need to display the total amount of native currency will be expended
  // given the selected gas fees.
  const [estimatedMaximumNative] = useCurrencyDisplay(maximumCostInHexWei, {
    numberOfDecimals: primaryNumberOfDecimals,
    currency: primaryCurrency,
  });

  // We also need to display our closest estimate of the low end of estimation
  // in fiat.
  const [, { value: estimatedMinimumFiat }] = useCurrencyDisplay(
    minimumCostInHexWei,
    {
      numberOfDecimals: fiatNumberOfDecimals,
      currency: fiatCurrency,
    },
  );

  // Separating errors from warnings so we can know which value problems
  // are blocking or simply useful information for the users
  const gasErrors = {};
  const gasWarnings = {};

  if (gasLimit < 21000 || gasLimit > 7920027) {
    gasErrors.gasLimit = GAS_FORM_ERRORS.GAS_LIMIT_OUT_OF_BOUNDS;
  }

  switch (gasEstimateType) {
    case GAS_ESTIMATE_TYPES.FEE_MARKET:
      if (maxPriorityFeePerGasToUse < 1) {
        gasErrors.maxPriorityFee = GAS_FORM_ERRORS.MAX_PRIORITY_FEE_ZERO;
      } else if (
        !isGasEstimatesLoading &&
        maxPriorityFeePerGasToUse <
          gasFeeEstimates?.low?.suggestedMaxPriorityFeePerGas
      ) {
        gasErrors.maxPriorityFee = GAS_FORM_ERRORS.MAX_PRIORITY_FEE_TOO_LOW;
      } else if (
        gasFeeEstimates?.high &&
        maxPriorityFeePerGasToUse >
          gasFeeEstimates.high.suggestedMaxPriorityFeePerGas *
            HIGH_FEE_WARNING_MULTIPLIER
      ) {
        gasWarnings.maxPriorityFee =
          GAS_FORM_ERRORS.MAX_PRIORITY_FEE_HIGH_WARNING;
      }

      if (
        !isGasEstimatesLoading &&
        maxFeePerGasToUse < gasFeeEstimates?.low?.suggestedMaxFeePerGas
      ) {
        gasErrors.maxFee = GAS_FORM_ERRORS.MAX_FEE_TOO_LOW;
      } else if (
        gasFeeEstimates?.high &&
        maxFeePerGasToUse >
          gasFeeEstimates.high.suggestedMaxFeePerGas *
            HIGH_FEE_WARNING_MULTIPLIER
      ) {
        gasWarnings.maxFee = GAS_FORM_ERRORS.MAX_FEE_HIGH_WARNING;
      }
      break;
    default:
      break;
  }

  // Determine if we have any errors which should block submission
  const hasBlockingGasErrors = Boolean(Object.keys(gasErrors).length);

  // Now that we've determined errors that block submission, we can pool the warnings
  // and errors into one object for easier use within the UI.  This object should have
  // no effect on whether or not the user can submit the form
  const errorsAndWarnings = {
    ...gasErrors,
    ...gasWarnings,
  };

  return {
    maxFeePerGas: maxFeePerGasToUse,
    maxFeePerGasFiat: showFiat ? maxFeePerGasFiat : '',
    setMaxFeePerGas,
    maxPriorityFeePerGas: maxPriorityFeePerGasToUse,
    maxPriorityFeePerGasFiat: showFiat ? maxPriorityFeePerGasFiat : '',
    setMaxPriorityFeePerGas,
    gasPrice: gasPriceToUse,
    setGasPrice,
    gasLimit,
    setGasLimit,
    estimateToUse,
    setEstimateToUse,
    estimatedMinimumFiat: showFiat ? estimatedMinimumFiat : '',
    estimatedMaximumFiat: showFiat ? maxFeePerGasFiat : '',
    estimatedMaximumNative,
    isGasEstimatesLoading,
    gasFeeEstimates,
    gasEstimateType,
    estimatedGasFeeTimeBounds,
    gasErrors: errorsAndWarnings,
    hasGasErrors: hasBlockingGasErrors,
  };
}
