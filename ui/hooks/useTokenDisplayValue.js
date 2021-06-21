import { useMemo } from 'react';
import { calcTokenAmount } from '../../shared/modules/token-utils';
import { getTokenValueParam } from '../helpers/utils/token-util';
import { useTokenData } from './useTokenData';

/**
 * Defines the shape for the Token input parameter for useTokenDisplayValue
 * @typedef {Object} Token
 * @property {string} symbol   - The string to use as a suffix for the token (eg. DAI)
 * @property {number} decimals - The number of decimals to show when displaying this type of token
 */

/**
 * useTokenDisplayValue
 * Given the data string from txParams and a token object with symbol and decimals, return
 * a displayValue that represents a string representing that token amount as a string. Also
 * return a tokenData object for downstream usage and the suffix for the token to use as props
 * for other hooks and/or components
 * @param {string}  [transactionData]    - Raw data string from token transaction
 * @param {Token}   [token]              - The token associated with this transaction
 * @param {boolean} [isTokenTransaction] - Due to the nature of hooks, it isn't possible
 *                                         to conditionally call this hook. This flag will
 *                                         force this hook to return null if it set as false
 *                                         which indicates the transaction is not associated
 *                                         with a token.
 * @return {string} - The computed displayValue of the provided transactionData and token
 */
export function useTokenDisplayValue(
  transactionData,
  token,
  isTokenTransaction = true,
) {
  const tokenData = useTokenData(transactionData, isTokenTransaction);
  const shouldCalculateTokenValue = Boolean(
    // If we are currently processing a token transaction
    isTokenTransaction &&
      // and raw transaction data string is provided
      transactionData &&
      // and a token object has been provided
      token &&
      // and we are able to parse the token details from the raw data
      tokenData?.args?.length,
  );

  const displayValue = useMemo(() => {
    if (!shouldCalculateTokenValue) {
      return null;
    }
    const tokenValue = getTokenValueParam(tokenData);
    return calcTokenAmount(tokenValue, token.decimals).toString(10);
  }, [shouldCalculateTokenValue, tokenData, token]);

  return displayValue;
}
