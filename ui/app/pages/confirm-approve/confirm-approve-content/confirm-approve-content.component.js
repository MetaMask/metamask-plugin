import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Identicon from '../../../components/ui/identicon';
import { addressSummary } from '../../../helpers/utils/util';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';

export default class ConfirmApproveContent extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    decimals: PropTypes.number,
    tokenAmount: PropTypes.string,
    customTokenAmount: PropTypes.string,
    tokenSymbol: PropTypes.string,
    siteImage: PropTypes.string,
    showCustomizeGasModal: PropTypes.func,
    showEditApprovalPermissionModal: PropTypes.func,
    origin: PropTypes.string,
    setCustomAmount: PropTypes.func,
    tokenBalance: PropTypes.string,
    data: PropTypes.string,
    toAddress: PropTypes.string,
    currentCurrency: PropTypes.string,
    nativeCurrency: PropTypes.string,
    fiatTransactionTotal: PropTypes.string,
    ethTransactionTotal: PropTypes.string,
    currentLocale: PropTypes.string,
  };

  state = {
    showFullTxDetails: false,
  };

  renderApproveContentCard({
    symbol,
    title,
    showEdit,
    onEditClick,
    content,
    footer,
    noBorder,
  }) {
    return (
      <div
        className={classnames({
          'confirm-approve-content__card': !noBorder,
          'confirm-approve-content__card--no-border': noBorder,
        })}
      >
        <div className="confirm-approve-content__card-header">
          <div className="confirm-approve-content__card-header__symbol">
            {symbol}
          </div>
          <div className="confirm-approve-content__card-header__title">
            {title}
          </div>
          {showEdit && (
            <div
              className="confirm-approve-content__small-blue-text cursor-pointer"
              onClick={() => onEditClick()}
            >
              Edit
            </div>
          )}
        </div>
        <div className="confirm-approve-content__card-content">{content}</div>
        {footer}
      </div>
    );
  }

  // TODO: Add "Learn Why" with link to the feeAssociatedRequest text
  renderTransactionDetailsContent() {
    const { t } = this.context;
    const {
      currentCurrency,
      nativeCurrency,
      ethTransactionTotal,
      fiatTransactionTotal,
      currentLocale,
    } = this.props;
    return (
      <div className="confirm-approve-content__transaction-details-content">
        <div className="confirm-approve-content__small-text">
          {t('feeAssociatedRequest')}
        </div>
        <div className="confirm-approve-content__transaction-details-content__fee">
          <div className="confirm-approve-content__transaction-details-content__primary-fee">
            {formatCurrency(
              fiatTransactionTotal,
              currentCurrency,
              currentLocale,
            )}
          </div>
          <div className="confirm-approve-content__transaction-details-content__secondary-fee">
            {`${ethTransactionTotal} ${nativeCurrency}`}
          </div>
        </div>
      </div>
    );
  }

  renderPermissionContent() {
    const { t } = this.context;
    const {
      customTokenAmount,
      tokenAmount,
      tokenSymbol,
      origin,
      toAddress,
    } = this.props;

    return (
      <div className="flex-column">
        <div className="confirm-approve-content__small-text">
          {t('accessAndSpendNotice', [origin])}
        </div>
        <div className="flex-row">
          <div className="confirm-approve-content__label">
            {t('amountWithColon')}
          </div>
          <div className="confirm-approve-content__medium-text">
            {`${Number(customTokenAmount || tokenAmount)} ${tokenSymbol}`}
          </div>
        </div>
        <div className="flex-row">
          <div className="confirm-approve-content__label">
            {t('toWithColon')}
          </div>
          <div className="confirm-approve-content__medium-text">
            {addressSummary(toAddress)}
          </div>
        </div>
      </div>
    );
  }

  renderDataContent() {
    const { t } = this.context;
    const { data } = this.props;
    return (
      <div className="flex-column">
        <div className="confirm-approve-content__small-text">
          {t('functionApprove')}
        </div>
        <div className="confirm-approve-content__small-text confirm-approve-content__data__data-block">
          {data}
        </div>
      </div>
    );
  }

  render() {
    const { t } = this.context;
    const {
      decimals,
      siteImage,
      tokenAmount,
      customTokenAmount,
      origin,
      tokenSymbol,
      showCustomizeGasModal,
      showEditApprovalPermissionModal,
      setCustomAmount,
      tokenBalance,
    } = this.props;
    const { showFullTxDetails } = this.state;

    return (
      <div
        className={classnames('confirm-approve-content', {
          'confirm-approve-content--full': showFullTxDetails,
        })}
      >
        <div className="confirm-approve-content__identicon-wrapper">
          <Identicon
            className="confirm-approve-content__identicon"
            diameter={48}
            address={origin}
            image={siteImage}
          />
        </div>
        <div className="confirm-approve-content__title">
          {t('allowOriginSpendToken', [origin, tokenSymbol])}
        </div>
        <div className="confirm-approve-content__description">
          {t('trustSiteApprovePermission', [origin, tokenSymbol])}
        </div>
        <div className="confirm-approve-content__edit-submission-button-container">
          <div
            className="confirm-approve-content__medium-link-text cursor-pointer"
            onClick={() =>
              showEditApprovalPermissionModal({
                customTokenAmount,
                decimals,
                origin,
                setCustomAmount,
                tokenAmount,
                tokenSymbol,
                tokenBalance,
              })
            }
          >
            {t('editPermission')}
          </div>
        </div>
        <div className="confirm-approve-content__card-wrapper">
          {this.renderApproveContentCard({
            symbol: <i className="fa fa-tag" />,
            title: 'Transaction Fee',
            showEdit: true,
            onEditClick: showCustomizeGasModal,
            content: this.renderTransactionDetailsContent(),
            noBorder: !showFullTxDetails,
            footer: (
              <div
                className="confirm-approve-content__view-full-tx-button-wrapper"
                onClick={() =>
                  this.setState({
                    showFullTxDetails: !this.state.showFullTxDetails,
                  })
                }
              >
                <div className="confirm-approve-content__view-full-tx-button cursor-pointer">
                  <div className="confirm-approve-content__small-blue-text">
                    View full transaction details
                  </div>
                  <i
                    className={classnames({
                      'fa fa-caret-up': showFullTxDetails,
                      'fa fa-caret-down': !showFullTxDetails,
                    })}
                  />
                </div>
              </div>
            ),
          })}
        </div>

        {showFullTxDetails ? (
          <div className="confirm-approve-content__full-tx-content">
            <div className="confirm-approve-content__permission">
              {this.renderApproveContentCard({
                symbol: <img src="/images/user-check.svg" alt="" />,
                title: 'Permission',
                content: this.renderPermissionContent(),
                showEdit: true,
                onEditClick: () =>
                  showEditApprovalPermissionModal({
                    customTokenAmount,
                    decimals,
                    origin,
                    setCustomAmount,
                    tokenAmount,
                    tokenSymbol,
                    tokenBalance,
                  }),
              })}
            </div>
            <div className="confirm-approve-content__data">
              {this.renderApproveContentCard({
                symbol: <i className="fa fa-file" />,
                title: 'Data',
                content: this.renderDataContent(),
                noBorder: true,
              })}
            </div>
          </div>
        ) : null}
      </div>
    );
  }
}
