import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../shared/constants/app';
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import ConfirmPageContainer, {
  ConfirmDetailRow,
} from '../../components/app/confirm-page-container';
import { isBalanceSufficient } from '../send/send.utils';
import {
  CONFIRM_TRANSACTION_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';
import {
  INSUFFICIENT_FUNDS_ERROR_KEY,
  TRANSACTION_ERROR_KEY,
  GAS_LIMIT_TOO_LOW_ERROR_KEY,
  ETH_GAS_PRICE_FETCH_WARNING_KEY,
  GAS_PRICE_FETCH_FAILURE_ERROR_KEY,
} from '../../helpers/constants/error-keys';
import UserPreferencedCurrencyDisplay from '../../components/app/user-preferenced-currency-display';
import { PRIMARY, SECONDARY } from '../../helpers/constants/common';
import AdvancedGasInputs from '../../components/app/gas-customization/advanced-gas-inputs';
import TextField from '../../components/ui/text-field';
import {
  TRANSACTION_TYPES,
  TRANSACTION_STATUSES,
} from '../../../shared/constants/transaction';
import { getTransactionTypeTitle } from '../../helpers/utils/transactions.util';
import ErrorMessage from '../../components/ui/error-message';
import { toBuffer } from '../../../shared/modules/buffer-utils';
import { hexToDecimal } from '../../../shared/modules/conversion-util';

export default class ConfirmTransactionBase extends Component {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  static propTypes = {
    // react-router props
    history: PropTypes.object,
    // Redux props
    balance: PropTypes.string,
    cancelTransaction: PropTypes.func,
    cancelAllTransactions: PropTypes.func,
    clearConfirmTransaction: PropTypes.func,
    conversionRate: PropTypes.number,
    fromAddress: PropTypes.string,
    fromName: PropTypes.string,
    hexTransactionAmount: PropTypes.string,
    hexTransactionFee: PropTypes.string,
    hexTransactionTotal: PropTypes.string,
    isTxReprice: PropTypes.bool,
    methodData: PropTypes.object,
    nonce: PropTypes.string,
    useNonceField: PropTypes.bool,
    customNonceValue: PropTypes.string,
    updateCustomNonce: PropTypes.func,
    assetImage: PropTypes.string,
    sendTransaction: PropTypes.func,
    showCustomizeGasModal: PropTypes.func,
    showTransactionConfirmedModal: PropTypes.func,
    showRejectTransactionsConfirmationModal: PropTypes.func,
    toAddress: PropTypes.string,
    tokenData: PropTypes.object,
    tokenProps: PropTypes.object,
    toName: PropTypes.string,
    toEns: PropTypes.string,
    toNickname: PropTypes.string,
    transactionStatus: PropTypes.string,
    txData: PropTypes.object,
    unapprovedTxCount: PropTypes.number,
    currentNetworkUnapprovedTxs: PropTypes.object,
    updateGasAndCalculate: PropTypes.func,
    customGas: PropTypes.object,
    // Component props
    actionKey: PropTypes.string,
    contentComponent: PropTypes.node,
    dataComponent: PropTypes.node,
    primaryTotalTextOverride: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.node,
    ]),
    secondaryTotalTextOverride: PropTypes.string,
    hideData: PropTypes.bool,
    hideSubtitle: PropTypes.bool,
    identiconAddress: PropTypes.string,
    onEdit: PropTypes.func,
    setMetaMetricsSendCount: PropTypes.func,
    metaMetricsSendCount: PropTypes.number,
    subtitleComponent: PropTypes.node,
    title: PropTypes.string,
    advancedInlineGasShown: PropTypes.bool,
    insufficientBalance: PropTypes.bool,
    hideFiatConversion: PropTypes.bool,
    type: PropTypes.string,
    getNextNonce: PropTypes.func,
    nextNonce: PropTypes.number,
    tryReverseResolveAddress: PropTypes.func.isRequired,
    hideSenderToRecipient: PropTypes.bool,
    showAccountInHeader: PropTypes.bool,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    isMainnet: PropTypes.bool,
    isEthGasPrice: PropTypes.bool,
    noGasPrice: PropTypes.bool,
    setDefaultHomeActiveTabName: PropTypes.func,
  };

  state = {
    submitting: false,
    submitError: null,
    submitWarning: '',
    ethGasPriceWarning: '',
  };

  componentDidUpdate(prevProps) {
    const {
      transactionStatus,
      showTransactionConfirmedModal,
      history,
      clearConfirmTransaction,
      nextNonce,
      customNonceValue,
      toAddress,
      tryReverseResolveAddress,
      isEthGasPrice,
      setDefaultHomeActiveTabName,
    } = this.props;
    const {
      customNonceValue: prevCustomNonceValue,
      nextNonce: prevNextNonce,
      toAddress: prevToAddress,
      transactionStatus: prevTxStatus,
      isEthGasPrice: prevIsEthGasPrice,
    } = prevProps;
    const statusUpdated = transactionStatus !== prevTxStatus;
    const txDroppedOrConfirmed =
      transactionStatus === TRANSACTION_STATUSES.DROPPED ||
      transactionStatus === TRANSACTION_STATUSES.CONFIRMED;

    if (
      nextNonce !== prevNextNonce ||
      customNonceValue !== prevCustomNonceValue
    ) {
      if (nextNonce !== null && customNonceValue > nextNonce) {
        this.setState({
          submitWarning: this.context.t('nextNonceWarning', [nextNonce]),
        });
      } else {
        this.setState({ submitWarning: '' });
      }
    }

    if (statusUpdated && txDroppedOrConfirmed) {
      showTransactionConfirmedModal({
        onSubmit: () => {
          clearConfirmTransaction();
          setDefaultHomeActiveTabName('Activity').then(() => {
            history.push(DEFAULT_ROUTE);
          });
        },
      });
    }

    if (toAddress && toAddress !== prevToAddress) {
      tryReverseResolveAddress(toAddress);
    }

    if (isEthGasPrice !== prevIsEthGasPrice) {
      if (isEthGasPrice) {
        this.setState({
          ethGasPriceWarning: this.context.t(ETH_GAS_PRICE_FETCH_WARNING_KEY),
        });
      } else {
        this.setState({
          ethGasPriceWarning: '',
        });
      }
    }
  }

  getErrorKey() {
    const {
      balance,
      conversionRate,
      hexTransactionFee,
      txData: { simulationFails, txParams: { value: amount } = {} } = {},
      customGas,
      noGasPrice,
    } = this.props;

    const insufficientBalance =
      balance &&
      !isBalanceSufficient({
        amount,
        gasTotal: hexTransactionFee || '0x0',
        balance,
        conversionRate,
      });

    if (insufficientBalance) {
      return {
        valid: false,
        errorKey: INSUFFICIENT_FUNDS_ERROR_KEY,
      };
    }

    if (hexToDecimal(customGas.gasLimit) < 21000) {
      return {
        valid: false,
        errorKey: GAS_LIMIT_TOO_LOW_ERROR_KEY,
      };
    }

    if (simulationFails) {
      return {
        valid: true,
        errorKey: simulationFails.errorKey
          ? simulationFails.errorKey
          : TRANSACTION_ERROR_KEY,
      };
    }

    if (noGasPrice) {
      return {
        valid: false,
        errorKey: GAS_PRICE_FETCH_FAILURE_ERROR_KEY,
      };
    }

    return {
      valid: true,
    };
  }

  handleEditGas() {
    const {
      showCustomizeGasModal,
      actionKey,
      txData: { origin },
      methodData = {},
    } = this.props;

    this.context.metricsEvent({
      eventOpts: {
        category: 'Transactions',
        action: 'Confirm Screen',
        name: 'User clicks "Edit" on gas',
      },
      customVariables: {
        recipientKnown: null,
        functionType:
          actionKey ||
          getMethodName(methodData.name) ||
          TRANSACTION_TYPES.CONTRACT_INTERACTION,
        origin,
      },
    });

    showCustomizeGasModal();
  }

  renderDetails() {
    const {
      primaryTotalTextOverride,
      secondaryTotalTextOverride,
      hexTransactionFee,
      hexTransactionTotal,
      useNonceField,
      customNonceValue,
      updateCustomNonce,
      advancedInlineGasShown,
      customGas,
      insufficientBalance,
      updateGasAndCalculate,
      hideFiatConversion,
      nextNonce,
      getNextNonce,
      isMainnet,
      isEthGasPrice,
      noGasPrice,
    } = this.props;
    const { t } = this.context;

    const notMainnetOrTest = !(isMainnet || process.env.IN_TEST);
    const gasPriceFetchFailure = isEthGasPrice || noGasPrice;

    return (
      <div className="confirm-page-container-content__details">
        <div className="confirm-page-container-content__gas-fee">
          <ConfirmDetailRow
            label={t('gasFee')}
            value={hexTransactionFee}
            headerText={notMainnetOrTest || gasPriceFetchFailure ? '' : 'Edit'}
            headerTextClassName={
              notMainnetOrTest || gasPriceFetchFailure
                ? ''
                : 'confirm-detail-row__header-text--edit'
            }
            onHeaderClick={
              notMainnetOrTest || gasPriceFetchFailure
                ? null
                : () => this.handleEditGas()
            }
            secondaryText={
              hideFiatConversion ? t('noConversionRateAvailable') : ''
            }
          />
          {advancedInlineGasShown ||
          notMainnetOrTest ||
          gasPriceFetchFailure ? (
            <AdvancedGasInputs
              updateCustomGasPrice={(newGasPrice) =>
                updateGasAndCalculate({ ...customGas, gasPrice: newGasPrice })
              }
              updateCustomGasLimit={(newGasLimit) =>
                updateGasAndCalculate({ ...customGas, gasLimit: newGasLimit })
              }
              customGasPrice={customGas.gasPrice}
              customGasLimit={customGas.gasLimit}
              insufficientBalance={insufficientBalance}
              customPriceIsSafe
              isSpeedUp={false}
            />
          ) : null}
          {noGasPrice ? (
            <div className="confirm-page-container-content__error-container">
              <ErrorMessage errorKey={GAS_PRICE_FETCH_FAILURE_ERROR_KEY} />
            </div>
          ) : null}
        </div>
        <div
          className={
            useNonceField ? 'confirm-page-container-content__gas-fee' : null
          }
        >
          <ConfirmDetailRow
            label={t('total')}
            value={hexTransactionTotal}
            primaryText={primaryTotalTextOverride}
            secondaryText={
              hideFiatConversion
                ? t('noConversionRateAvailable')
                : secondaryTotalTextOverride
            }
            headerText={t('amountGasFee')}
            headerTextClassName="confirm-detail-row__header-text--total"
            primaryValueTextColor="#2f9ae0"
          />
        </div>
        {useNonceField ? (
          <div>
            <div className="confirm-detail-row">
              <div className="confirm-detail-row__label">
                {t('nonceFieldHeading')}
              </div>
              <div className="custom-nonce-input">
                <TextField
                  type="number"
                  min="0"
                  placeholder={
                    typeof nextNonce === 'number' ? nextNonce.toString() : null
                  }
                  onChange={({ target: { value } }) => {
                    if (!value.length || Number(value) < 0) {
                      updateCustomNonce('');
                    } else {
                      updateCustomNonce(String(Math.floor(value)));
                    }
                    getNextNonce();
                  }}
                  fullWidth
                  margin="dense"
                  value={customNonceValue || ''}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  renderData(functionType) {
    const { t } = this.context;
    const {
      txData: { txParams: { data } = {} } = {},
      methodData: { params } = {},
      hideData,
      dataComponent,
    } = this.props;

    if (hideData) {
      return null;
    }

    return (
      dataComponent || (
        <div className="confirm-page-container-content__data">
          <div className="confirm-page-container-content__data-box-label">
            {`${t('functionType')}:`}
            <span className="confirm-page-container-content__function-type">
              {functionType}
            </span>
          </div>
          {params && (
            <div className="confirm-page-container-content__data-box">
              <div className="confirm-page-container-content__data-field-label">
                {`${t('parameters')}:`}
              </div>
              <div>
                <pre>{JSON.stringify(params, null, 2)}</pre>
              </div>
            </div>
          )}
          <div className="confirm-page-container-content__data-box-label">
            {`${t('hexData')}: ${toBuffer(data).length} bytes`}
          </div>
          <div className="confirm-page-container-content__data-box">{data}</div>
        </div>
      )
    );
  }

  handleEdit() {
    const {
      txData,
      tokenData,
      tokenProps,
      onEdit,
      actionKey,
      txData: { origin },
      methodData = {},
    } = this.props;

    this.context.metricsEvent({
      eventOpts: {
        category: 'Transactions',
        action: 'Confirm Screen',
        name: 'Edit Transaction',
      },
      customVariables: {
        recipientKnown: null,
        functionType:
          actionKey ||
          getMethodName(methodData.name) ||
          TRANSACTION_TYPES.CONTRACT_INTERACTION,
        origin,
      },
    });

    onEdit({ txData, tokenData, tokenProps });
  }

  handleCancelAll() {
    const {
      cancelAllTransactions,
      clearConfirmTransaction,
      history,
      mostRecentOverviewPage,
      showRejectTransactionsConfirmationModal,
      unapprovedTxCount,
    } = this.props;

    showRejectTransactionsConfirmationModal({
      unapprovedTxCount,
      onSubmit: async () => {
        this._removeBeforeUnload();
        await cancelAllTransactions();
        clearConfirmTransaction();
        history.push(mostRecentOverviewPage);
      },
    });
  }

  handleCancel() {
    const { metricsEvent } = this.context;
    const {
      txData,
      cancelTransaction,
      history,
      mostRecentOverviewPage,
      clearConfirmTransaction,
      actionKey,
      txData: { origin },
      methodData = {},
      updateCustomNonce,
    } = this.props;

    this._removeBeforeUnload();
    metricsEvent({
      eventOpts: {
        category: 'Transactions',
        action: 'Confirm Screen',
        name: 'Cancel',
      },
      customVariables: {
        recipientKnown: null,
        functionType:
          actionKey ||
          getMethodName(methodData.name) ||
          TRANSACTION_TYPES.CONTRACT_INTERACTION,
        origin,
      },
    });
    updateCustomNonce('');
    cancelTransaction(txData).then(() => {
      clearConfirmTransaction();
      history.push(mostRecentOverviewPage);
    });
  }

  handleSubmit() {
    const { metricsEvent } = this.context;
    const {
      txData: { origin },
      sendTransaction,
      clearConfirmTransaction,
      txData,
      history,
      actionKey,
      mostRecentOverviewPage,
      metaMetricsSendCount = 0,
      setMetaMetricsSendCount,
      methodData = {},
      updateCustomNonce,
    } = this.props;
    const { submitting } = this.state;

    if (submitting) {
      return;
    }

    this.setState(
      {
        submitting: true,
        submitError: null,
      },
      () => {
        this._removeBeforeUnload();
        metricsEvent({
          eventOpts: {
            category: 'Transactions',
            action: 'Confirm Screen',
            name: 'Transaction Completed',
          },
          customVariables: {
            recipientKnown: null,
            functionType:
              actionKey ||
              getMethodName(methodData.name) ||
              TRANSACTION_TYPES.CONTRACT_INTERACTION,
            origin,
          },
        });

        setMetaMetricsSendCount(metaMetricsSendCount + 1).then(() => {
          sendTransaction(txData)
            .then(() => {
              clearConfirmTransaction();
              this.setState(
                {
                  submitting: false,
                },
                () => {
                  history.push(mostRecentOverviewPage);
                  updateCustomNonce('');
                },
              );
            })
            .catch((error) => {
              this.setState({
                submitting: false,
                submitError: error.message,
              });
              updateCustomNonce('');
            });
        });
      },
    );
  }

  renderTitleComponent() {
    const { title, hexTransactionAmount } = this.props;

    // Title string passed in by props takes priority
    if (title) {
      return null;
    }

    return (
      <UserPreferencedCurrencyDisplay
        value={hexTransactionAmount}
        type={PRIMARY}
        showEthLogo
        ethLogoHeight="26"
        hideLabel
      />
    );
  }

  renderSubtitleComponent() {
    const { subtitleComponent, hexTransactionAmount } = this.props;

    return (
      subtitleComponent || (
        <UserPreferencedCurrencyDisplay
          value={hexTransactionAmount}
          type={SECONDARY}
          showEthLogo
          hideLabel
        />
      )
    );
  }

  handleNextTx(txId) {
    const { history, clearConfirmTransaction } = this.props;

    if (txId) {
      clearConfirmTransaction();
      history.push(`${CONFIRM_TRANSACTION_ROUTE}/${txId}`);
    }
  }

  getNavigateTxData() {
    const { currentNetworkUnapprovedTxs, txData: { id } = {} } = this.props;
    const enumUnapprovedTxs = Object.keys(currentNetworkUnapprovedTxs);
    const currentPosition = enumUnapprovedTxs.indexOf(id ? id.toString() : '');

    return {
      totalTx: enumUnapprovedTxs.length,
      positionOfCurrentTx: currentPosition + 1,
      nextTxId: enumUnapprovedTxs[currentPosition + 1],
      prevTxId: enumUnapprovedTxs[currentPosition - 1],
      showNavigation: enumUnapprovedTxs.length > 1,
      firstTx: enumUnapprovedTxs[0],
      lastTx: enumUnapprovedTxs[enumUnapprovedTxs.length - 1],
      ofText: this.context.t('ofTextNofM'),
      requestsWaitingText: this.context.t('requestsAwaitingAcknowledgement'),
    };
  }

  _beforeUnload = () => {
    const { txData: { origin, id } = {}, cancelTransaction } = this.props;
    const { metricsEvent } = this.context;
    metricsEvent({
      eventOpts: {
        category: 'Transactions',
        action: 'Confirm Screen',
        name: 'Cancel Tx Via Notification Close',
      },
      customVariables: {
        origin,
      },
    });
    cancelTransaction({ id });
  };

  _removeBeforeUnload = () => {
    if (getEnvironmentType() === ENVIRONMENT_TYPE_NOTIFICATION) {
      window.removeEventListener('beforeunload', this._beforeUnload);
    }
  };

  componentDidMount() {
    const {
      toAddress,
      txData: { origin } = {},
      getNextNonce,
      tryReverseResolveAddress,
    } = this.props;
    const { metricsEvent } = this.context;
    metricsEvent({
      eventOpts: {
        category: 'Transactions',
        action: 'Confirm Screen',
        name: 'Confirm: Started',
      },
      customVariables: {
        origin,
      },
    });

    if (getEnvironmentType() === ENVIRONMENT_TYPE_NOTIFICATION) {
      window.addEventListener('beforeunload', this._beforeUnload);
    }

    getNextNonce();
    if (toAddress) {
      tryReverseResolveAddress(toAddress);
    }
  }

  componentWillUnmount() {
    this._removeBeforeUnload();
  }

  render() {
    const { t } = this.context;
    const {
      isTxReprice,
      fromName,
      fromAddress,
      toName,
      toAddress,
      toEns,
      toNickname,
      methodData,
      title,
      hideSubtitle,
      identiconAddress,
      contentComponent,
      onEdit,
      nonce,
      customNonceValue,
      assetImage,
      unapprovedTxCount,
      type,
      hideSenderToRecipient,
      showAccountInHeader,
      txData,
    } = this.props;
    const {
      submitting,
      submitError,
      submitWarning,
      ethGasPriceWarning,
    } = this.state;

    const { name } = methodData;
    const { valid, errorKey } = this.getErrorKey();
    const {
      totalTx,
      positionOfCurrentTx,
      nextTxId,
      prevTxId,
      showNavigation,
      firstTx,
      lastTx,
      ofText,
      requestsWaitingText,
    } = this.getNavigateTxData();

    let functionType = getMethodName(name);
    if (!functionType) {
      if (type) {
        functionType = getTransactionTypeTitle(t, type);
      } else {
        functionType = t('contractInteraction');
      }
    }
    return (
      <ConfirmPageContainer
        fromName={fromName}
        fromAddress={fromAddress}
        showAccountInHeader={showAccountInHeader}
        toName={toName}
        toAddress={toAddress}
        toEns={toEns}
        toNickname={toNickname}
        showEdit={onEdit && !isTxReprice}
        action={functionType}
        title={title}
        titleComponent={this.renderTitleComponent()}
        subtitleComponent={this.renderSubtitleComponent()}
        hideSubtitle={hideSubtitle}
        detailsComponent={this.renderDetails()}
        dataComponent={this.renderData(functionType)}
        contentComponent={contentComponent}
        nonce={customNonceValue || nonce}
        unapprovedTxCount={unapprovedTxCount}
        assetImage={assetImage}
        identiconAddress={identiconAddress}
        errorMessage={submitError}
        errorKey={errorKey}
        warning={submitWarning}
        totalTx={totalTx}
        positionOfCurrentTx={positionOfCurrentTx}
        nextTxId={nextTxId}
        prevTxId={prevTxId}
        showNavigation={showNavigation}
        onNextTx={(txId) => this.handleNextTx(txId)}
        firstTx={firstTx}
        lastTx={lastTx}
        ofText={ofText}
        requestsWaitingText={requestsWaitingText}
        disabled={!valid || submitting}
        onEdit={() => this.handleEdit()}
        onCancelAll={() => this.handleCancelAll()}
        onCancel={() => this.handleCancel()}
        onSubmit={() => this.handleSubmit()}
        hideSenderToRecipient={hideSenderToRecipient}
        origin={txData.origin}
        ethGasPriceWarning={ethGasPriceWarning}
      />
    );
  }
}

export function getMethodName(camelCase) {
  if (!camelCase || typeof camelCase !== 'string') {
    return '';
  }

  return camelCase
    .replace(/([a-z])([A-Z])/gu, '$1 $2')
    .replace(/([A-Z])([a-z])/gu, ' $1$2')
    .replace(/ +/gu, ' ');
}
