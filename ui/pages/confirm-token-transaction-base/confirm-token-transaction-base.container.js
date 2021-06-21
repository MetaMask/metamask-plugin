import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import {
  contractExchangeRateSelector,
  transactionFeeSelector,
} from '../../selectors';
import { getTokens } from '../../ducks/metamask/metamask';
import { getTokenData } from '../../helpers/utils/transactions.util';
import {
  getTokenAddressParam,
  getTokenValueParam,
} from '../../helpers/utils/token-util';
import { calcTokenAmount } from '../../../shared/modules/token-utils';
import ConfirmTokenTransactionBase from './confirm-token-transaction-base.component';

const mapStateToProps = (state, ownProps) => {
  const {
    match: { params = {} },
  } = ownProps;
  const { id: paramsTransactionId } = params;
  const {
    confirmTransaction,
    metamask: { currentCurrency, conversionRate, currentNetworkTxList },
  } = state;

  const {
    txData: {
      id: transactionId,
      txParams: { to: tokenAddress, data } = {},
    } = {},
  } = confirmTransaction;

  const transaction =
    currentNetworkTxList.find(
      ({ id }) => id === (Number(paramsTransactionId) || transactionId),
    ) || {};

  const { ethTransactionTotal, fiatTransactionTotal } = transactionFeeSelector(
    state,
    transaction,
  );
  const tokens = getTokens(state);
  const currentToken = tokens?.find(({ address }) => tokenAddress === address);
  const { decimals, symbol: tokenSymbol } = currentToken || {};

  const tokenData = getTokenData(data);
  const tokenValue = getTokenValueParam(tokenData);
  const toAddress = getTokenAddressParam(tokenData);
  const tokenAmount =
    tokenData && calcTokenAmount(tokenValue, decimals).toFixed();
  const contractExchangeRate = contractExchangeRateSelector(state);

  return {
    toAddress,
    tokenAddress,
    tokenAmount,
    tokenSymbol,
    currentCurrency,
    conversionRate,
    contractExchangeRate,
    fiatTransactionTotal,
    ethTransactionTotal,
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(ConfirmTokenTransactionBase);
