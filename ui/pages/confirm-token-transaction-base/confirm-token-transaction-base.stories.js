import React from 'react';
import { store } from '../../../.storybook/preview';
import ConfirmTokenTransactionBase from './confirm-token-transaction-base.component';

export default {
  title: 'Confirmation Screens',
};

const state = store.getState();

export const ConfirmTokenTransaction = () => {
  const { metamask, confirmTransaction } = state;
  const { currentCurrency } = metamask;
  const { fiatTransactionTotal } = confirmTransaction;
  console.log('kresna', metamask);
  return (
    <ConfirmTokenTransactionBase
      currentCurrency={currentCurrency}
      fiatTransactionTotal={fiatTransactionTotal}
      tokenSymbol="DAI"
    />
  );
};
