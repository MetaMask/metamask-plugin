import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import { addHexPrefix } from 'ethereumjs-util';
import { showModal, showSidebar } from '../store/actions';
import { isBalanceSufficient } from '../pages/send/send.utils';
import {
  getHexGasTotal,
  increaseLastGasPrice,
} from '../helpers/utils/confirm-tx.util';
import { getSelectedAccount, getIsMainnet } from '../selectors';
import { getConversionRate } from '../ducks/metamask/metamask';

import {
  setCustomGasLimit,
  setCustomGasPriceForRetry,
} from '../ducks/gas/gas.duck';
import { multiplyCurrencies } from '../../shared/modules/conversion-util';
import { GAS_LIMITS } from '../../shared/constants/gas';

/**
 * Determine whether a transaction can be cancelled and provide a method to
 * kick off the process of cancellation.
 *
 * Provides a reusable hook that, given a transactionGroup, will return
 * whether or not the account has enough funds to cover the gas cancellation
 * fee, and a method for beginning the cancellation process
 * @param {Object} transactionGroup
 * @return {[boolean, Function]}
 */
export function useCancelTransaction(transactionGroup) {
  const { primaryTransaction } = transactionGroup;

  const transactionGasPrice = primaryTransaction.txParams?.gasPrice;
  const gasPrice =
    transactionGasPrice === undefined || transactionGasPrice?.startsWith('-')
      ? '0x0'
      : primaryTransaction.txParams?.gasPrice;
  const transaction = primaryTransaction;
  const dispatch = useDispatch();
  const selectedAccount = useSelector(getSelectedAccount);
  const conversionRate = useSelector(getConversionRate);
  const defaultNewGasPrice = addHexPrefix(
    multiplyCurrencies(gasPrice, 1.1, {
      toNumericBase: 'hex',
      multiplicandBase: 16,
      multiplierBase: 10,
    }),
  );
  const isMainnet = useSelector(getIsMainnet);
  const hideBasic = !(isMainnet || process.env.IN_TEST);
  const cancelTransaction = useCallback(
    (event) => {
      event.stopPropagation();
      dispatch(setCustomGasLimit(GAS_LIMITS.SIMPLE));
      dispatch(setCustomGasPriceForRetry(defaultNewGasPrice));
      const tx = {
        ...transaction,
        txParams: {
          ...transaction.txParams,
          gas: GAS_LIMITS.SIMPLE,
          value: '0x0',
        },
      };
      return dispatch(
        showSidebar({
          transitionName: 'sidebar-left',
          type: 'customize-gas',
          props: {
            hideBasic,
            transaction: tx,
            onSubmit: (newGasLimit, newGasPrice) => {
              const userCustomizedGasTotal = getHexGasTotal({
                gasPrice: newGasPrice,
                gasLimit: newGasLimit,
              });
              dispatch(
                showModal({
                  name: 'CANCEL_TRANSACTION',
                  newGasFee: userCustomizedGasTotal,
                  transactionId: transaction.id,
                  defaultNewGasPrice: newGasPrice,
                  gasLimit: newGasLimit,
                }),
              );
            },
          },
        }),
      );
    },
    [dispatch, transaction, defaultNewGasPrice, hideBasic],
  );

  const hasEnoughCancelGas =
    primaryTransaction.txParams &&
    isBalanceSufficient({
      amount: '0x0',
      gasTotal: getHexGasTotal({
        gasPrice: increaseLastGasPrice(gasPrice),
        gasLimit: primaryTransaction.txParams.gas,
      }),
      balance: selectedAccount.balance,
      conversionRate,
    });

  return [hasEnoughCancelGas, cancelTransaction];
}
