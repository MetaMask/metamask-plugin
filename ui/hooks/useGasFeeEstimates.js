import { useSelector } from 'react-redux';
import { GAS_ESTIMATE_TYPES } from '../../shared/constants/gas';
import {
  getEstimatedGasFeeTimeBounds,
  getGasEstimateType,
  getGasFeeEstimates,
  isEIP1559Network,
} from '../ducks/metamask/metamask';
import { useSafeGasEstimatePolling } from './useSafeGasEstimatePolling';

/**
 * @typedef {keyof typeof GAS_ESTIMATE_TYPES} GasEstimateTypes
 */

/**
 * @typedef {object} GasEstimates
 * @property {GasEstimateTypes} gasEstimateType - The type of estimate provided
 * @property {import(
 *   '@metamask/controllers'
 * ).GasFeeState['gasFeeEstimates']} gasFeeEstimates - The estimate object
 * @property {import(
 *   '@metamask/controllers'
 * ).GasFeeState['estimatedGasFeeTimeBounds']} [estimatedGasFeeTimeBounds] -
 *  estimated time boundaries for fee-market type estimates
 * @property {boolean} isGasEstimateLoading - indicates whether the gas
 *  estimates are currently loading.
 */

/**
 * Gets the current gasFeeEstimates from state and begins polling for new
 * estimates. When this hook is removed from the tree it will signal to the
 * GasFeeController that it is done requiring new gas estimates. Also checks
 * the returned gas estimate for validity on the current network.
 *
 * @returns {GasFeeEstimates} - GasFeeEstimates object
 */
export function useGasFeeEstimates() {
  const supportsEIP1559 = useSelector(isEIP1559Network);
  const gasEstimateType = useSelector(getGasEstimateType);
  const gasFeeEstimates = useSelector(getGasFeeEstimates);
  const estimatedGasFeeTimeBounds = useSelector(getEstimatedGasFeeTimeBounds);
  useSafeGasEstimatePolling();

  // We consider the gas estimate to be loading if the gasEstimateType is
  // 'NONE' or if the current gasEstimateType does not match the type we expect
  // for the current network. e.g, a ETH_GASPRICE estimate when on a network
  // supporting EIP-1559.
  const isGasEstimatesLoading =
    gasEstimateType === GAS_ESTIMATE_TYPES.NONE ||
    (supportsEIP1559 && gasEstimateType !== GAS_ESTIMATE_TYPES.FEE_MARKET) ||
    (!supportsEIP1559 && gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET);

  return {
    gasFeeEstimates,
    gasEstimateType,
    estimatedGasFeeTimeBounds,
    isGasEstimatesLoading,
  };
}
