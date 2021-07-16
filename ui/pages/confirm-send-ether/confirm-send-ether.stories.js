import React, { useEffect } from 'react';

import { select } from '@storybook/addon-knobs';
import { store } from '../../../.storybook/preview';
import { updateTransactionParams } from '../../store/actions';
import ConfirmSendEther from '.';

export default {
  title: 'Confirmation Screens',
};

// transaction id for redux dispatcher
const id = 3111025347726181;

const PageSet = ({ children }) => {
  const options = [];
  const receiverOptions = {
    'Address 1': '0xaD6D458402F60fD3Bd25163575031ACDce07538D',
    'Address 2': '0x55e0bfb2d400e9be8cf9b114e38a40969a02f69a',
  };
  const state = store.getState();
  const { identities } = state.metamask;
  Object.keys(identities).forEach(function (key) {
    options.push({
      label: identities[key].name,
      address: key,
    });
  });
  const sender = select('Sender', options, options[0]);
  const receiver = select(
    'Receiver',
    receiverOptions,
    '0xaD6D458402F60fD3Bd25163575031ACDce07538D',
  );

  const confirmTransactionState = state.confirmTransaction.txData.txParams;

  useEffect(() => {
    confirmTransactionState.from = sender.address;
    store.dispatch(updateTransactionParams(id, confirmTransactionState));
  }, [sender, confirmTransactionState]);

  useEffect(() => {
    confirmTransactionState.to = receiver;
    store.dispatch(updateTransactionParams(id, confirmTransactionState));
  }, [receiver, confirmTransactionState]);
  return children;
};

export const SendEther = () => {
  return (
    <PageSet>
      <ConfirmSendEther />
    </PageSet>
  );
};
