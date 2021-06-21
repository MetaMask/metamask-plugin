import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import ConfirmTransactionBase from '../confirm-transaction-base';
import {
  showModal,
  updateCustomNonce,
  getNextNonce,
} from '../../store/actions';
import { getTokenData } from '../../helpers/utils/transactions.util';
import {
  getTokenAddressParam,
  getTokenValueParam,
} from '../../helpers/utils/token-util';
import { useTokenTracker } from '../../hooks/useTokenTracker';
import { getTokens, getNativeCurrency } from '../../ducks/metamask/metamask';
import {
  transactionFeeSelector,
  txDataSelector,
  getCurrentCurrency,
  getDomainMetadata,
  getUseNonceField,
  getCustomNonceValue,
  getNextSuggestedNonce,
  getNoGasPriceFetched,
  getIsEthGasPriceFetched,
  getIsMainnet,
} from '../../selectors';

import { currentNetworkTxListSelector } from '../../selectors/transactions';
import Loading from '../../components/ui/loading-screen';
import { calcTokenAmount } from '../../../shared/modules/token-utils';
import { getCustomTxParamsData } from './confirm-approve.util';
import ConfirmApproveContent from './confirm-approve-content';

export default function ConfirmApprove() {
  const dispatch = useDispatch();
  const { id: paramsTransactionId } = useParams();
  const {
    id: transactionId,
    txParams: { to: tokenAddress, data } = {},
  } = useSelector(txDataSelector);

  const currentCurrency = useSelector(getCurrentCurrency);
  const nativeCurrency = useSelector(getNativeCurrency);
  const currentNetworkTxList = useSelector(currentNetworkTxListSelector);
  const domainMetadata = useSelector(getDomainMetadata);
  const tokens = useSelector(getTokens);
  const useNonceField = useSelector(getUseNonceField);
  const nextNonce = useSelector(getNextSuggestedNonce);
  const customNonceValue = useSelector(getCustomNonceValue);

  const transaction =
    currentNetworkTxList.find(
      ({ id }) => id === (Number(paramsTransactionId) || transactionId),
    ) || {};
  const { ethTransactionTotal, fiatTransactionTotal } = useSelector((state) =>
    transactionFeeSelector(state, transaction),
  );

  const currentToken = (tokens &&
    tokens.find(({ address }) => tokenAddress === address)) || {
    address: tokenAddress,
  };

  const { tokensWithBalances } = useTokenTracker([currentToken]);
  const tokenTrackerBalance = tokensWithBalances[0]?.balance || '';

  const tokenSymbol = currentToken?.symbol;
  const decimals = Number(currentToken?.decimals);
  const tokenData = getTokenData(data);
  const tokenValue = getTokenValueParam(tokenData);
  const toAddress = getTokenAddressParam(tokenData);
  const tokenAmount =
    tokenData && calcTokenAmount(tokenValue, decimals).toString(10);

  const [customPermissionAmount, setCustomPermissionAmount] = useState('');

  const previousTokenAmount = useRef(tokenAmount);

  useEffect(() => {
    if (customPermissionAmount && previousTokenAmount.current !== tokenAmount) {
      setCustomPermissionAmount(tokenAmount);
    }
    previousTokenAmount.current = tokenAmount;
  }, [customPermissionAmount, tokenAmount]);

  const [submitWarning, setSubmitWarning] = useState('');
  const prevNonce = useRef(nextNonce);
  const prevCustomNonce = useRef(customNonceValue);
  useEffect(() => {
    if (
      prevNonce.current !== nextNonce ||
      prevCustomNonce.current !== customNonceValue
    ) {
      if (nextNonce !== null && customNonceValue > nextNonce) {
        setSubmitWarning(
          `Nonce is higher than suggested nonce of ${nextNonce}`,
        );
      } else {
        setSubmitWarning('');
      }
    }
    prevCustomNonce.current = customNonceValue;
    prevNonce.current = nextNonce;
  }, [customNonceValue, nextNonce]);
  const { origin } = transaction;
  const formattedOrigin = origin
    ? origin[0].toUpperCase() + origin.slice(1)
    : '';
  const txData = transaction;

  const { icon: siteImage = '' } = domainMetadata[origin] || {};

  const tokensText = `${Number(tokenAmount)} ${tokenSymbol}`;
  const tokenBalance = tokenTrackerBalance
    ? calcTokenAmount(tokenTrackerBalance, decimals).toString(10)
    : '';
  const customData = customPermissionAmount
    ? getCustomTxParamsData(data, { customPermissionAmount, decimals })
    : null;
  const isEthGasPrice = useSelector(getIsEthGasPriceFetched);
  const noGasPrice = useSelector(getNoGasPriceFetched);
  const isMainnet = useSelector(getIsMainnet);
  const hideBasic =
    isEthGasPrice || noGasPrice || !(isMainnet || process.env.IN_TEST);
  return tokenSymbol === undefined ? (
    <Loading />
  ) : (
    <ConfirmTransactionBase
      toAddress={toAddress}
      identiconAddress={tokenAddress}
      showAccountInHeader
      title={tokensText}
      contentComponent={
        <ConfirmApproveContent
          decimals={decimals}
          siteImage={siteImage}
          setCustomAmount={setCustomPermissionAmount}
          customTokenAmount={String(customPermissionAmount)}
          tokenAmount={tokenAmount}
          origin={formattedOrigin}
          tokenSymbol={tokenSymbol}
          tokenBalance={tokenBalance}
          showCustomizeGasModal={() =>
            dispatch(
              showModal({
                name: 'CUSTOMIZE_GAS',
                txData,
                hideBasic,
              }),
            )
          }
          showEditApprovalPermissionModal={({
            /* eslint-disable no-shadow */
            customTokenAmount,
            decimals,
            origin,
            setCustomAmount,
            tokenAmount,
            tokenBalance,
            tokenSymbol,
            /* eslint-enable no-shadow */
          }) =>
            dispatch(
              showModal({
                name: 'EDIT_APPROVAL_PERMISSION',
                customTokenAmount,
                decimals,
                origin,
                setCustomAmount,
                tokenAmount,
                tokenBalance,
                tokenSymbol,
              }),
            )
          }
          data={customData || data}
          toAddress={toAddress}
          currentCurrency={currentCurrency}
          nativeCurrency={nativeCurrency}
          ethTransactionTotal={ethTransactionTotal}
          fiatTransactionTotal={fiatTransactionTotal}
          useNonceField={useNonceField}
          nextNonce={nextNonce}
          customNonceValue={customNonceValue}
          updateCustomNonce={(value) => {
            dispatch(updateCustomNonce(value));
          }}
          getNextNonce={() => dispatch(getNextNonce())}
          showCustomizeNonceModal={({
            /* eslint-disable no-shadow */
            useNonceField,
            nextNonce,
            customNonceValue,
            updateCustomNonce,
            getNextNonce,
            /* eslint-disable no-shadow */
          }) =>
            dispatch(
              showModal({
                name: 'CUSTOMIZE_NONCE',
                useNonceField,
                nextNonce,
                customNonceValue,
                updateCustomNonce,
                getNextNonce,
              }),
            )
          }
          warning={submitWarning}
        />
      }
      hideSenderToRecipient
      customTxParamsData={customData}
    />
  );
}
