import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import UrlIcon from '../../../components/ui/url-icon';
import { addressSummary } from '../../../helpers/utils/util';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';
import { ConfirmPageContainerWarning } from '../../../components/app/confirm-page-container/confirm-page-container-content';
import Typography from '../../../components/ui/typography';
import {
  TYPOGRAPHY,
  FONT_WEIGHT,
  BLOCK_SIZES,
  JUSTIFY_CONTENT,
} from '../../../helpers/constants/design-system';
import Box from '../../../components/ui/box';
import Button from '../../../components/ui/button';

export default class ConfirmApproveContent extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    chainId: PropTypes.string,
    checksumUsesChainId: PropTypes.bool,
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
    useNonceField: PropTypes.bool,
    customNonceValue: PropTypes.string,
    updateCustomNonce: PropTypes.func,
    getNextNonce: PropTypes.func,
    nextNonce: PropTypes.number,
    showCustomizeNonceModal: PropTypes.func,
    warning: PropTypes.string,
  };

  state = {
    showFullTxDetails: false,
  };

  renderApproveContentCard({
    showHeader = true,
    symbol,
    title,
    showEdit,
    onEditClick,
    content,
    footer,
    noBorder,
  }) {
    const { t } = this.context;
    return (
      <div
        className={classnames({
          'confirm-approve-content__card': !noBorder,
          'confirm-approve-content__card--no-border': noBorder,
        })}
      >
        {showHeader && (
          <div className="confirm-approve-content__card-header">
            <div className="confirm-approve-content__card-header__symbol">
              {symbol}
            </div>
            <div className="confirm-approve-content__card-header__title">
              {title}
            </div>
            {showEdit && (
              <Box width={BLOCK_SIZES.ONE_SIXTH}>
                <Button
                  type="link"
                  className="confirm-approve-content__small-blue-text"
                  onClick={() => onEditClick()}
                >
                  {t('edit')}
                </Button>
              </Box>
            )}
          </div>
        )}
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
    } = this.props;
    return (
      <div className="confirm-approve-content__transaction-details-content">
        <div className="confirm-approve-content__small-text">
          {t('feeAssociatedRequest')}
        </div>
        <div className="confirm-approve-content__transaction-details-content__fee">
          <div className="confirm-approve-content__transaction-details-content__primary-fee">
            {formatCurrency(fiatTransactionTotal, currentCurrency)}
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
      chainId,
      checksumUsesChainId,
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
            {addressSummary(toAddress, chainId, checksumUsesChainId)}
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

  renderCustomNonceContent() {
    const { t } = this.context;
    const {
      useNonceField,
      customNonceValue,
      updateCustomNonce,
      getNextNonce,
      nextNonce,
      showCustomizeNonceModal,
    } = this.props;
    return (
      <>
        {useNonceField && (
          <div className="confirm-approve-content__custom-nonce-content">
            <Box
              className="confirm-approve-content__custom-nonce-header"
              justifyContent={JUSTIFY_CONTENT.FLEX_START}
            >
              <Typography
                variant={TYPOGRAPHY.H6}
                fontWeight={FONT_WEIGHT.NORMAL}
              >
                {t('nonce')}
              </Typography>
              <Button
                type="link"
                className="confirm-approve-content__custom-nonce-edit"
                onClick={() =>
                  showCustomizeNonceModal({
                    nextNonce,
                    customNonceValue,
                    updateCustomNonce,
                    getNextNonce,
                  })
                }
              >
                {t('edit')}
              </Button>
            </Box>
            <Typography
              className="confirm-approve-content__custom-nonce-value"
              variant={TYPOGRAPHY.H6}
              fontWeight={FONT_WEIGHT.BOLD}
            >
              {customNonceValue || nextNonce}
            </Typography>
          </div>
        )}
      </>
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
      useNonceField,
      warning,
    } = this.props;
    const { showFullTxDetails } = this.state;

    return (
      <div
        className={classnames('confirm-approve-content', {
          'confirm-approve-content--full': showFullTxDetails,
        })}
      >
        {warning && (
          <div className="confirm-approve-content__custom-nonce-warning">
            <ConfirmPageContainerWarning warning={warning} />
          </div>
        )}
        <div className="confirm-approve-content__identicon-wrapper">
          <UrlIcon
            className="confirm-approve-content__identicon"
            fallbackClassName="confirm-approve-content__identicon"
            name={origin ? new URL(origin).hostname : ''}
            url={siteImage}
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
            noBorder: useNonceField || !showFullTxDetails,
            footer: !useNonceField && (
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
          {useNonceField &&
            this.renderApproveContentCard({
              showHeader: false,
              content: this.renderCustomNonceContent(),
              useNonceField,
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
