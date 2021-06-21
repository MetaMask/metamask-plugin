import React, { Component } from 'react';
import PropTypes from 'prop-types';
import copyToClipboard from 'copy-to-clipboard';
import classnames from 'classnames';

import AccountListItem from '../../components/app/account-list-item';
import Button from '../../components/ui/button';
import Identicon from '../../components/ui/identicon';
import Tooltip from '../../components/ui/tooltip';
import Copy from '../../components/ui/icon/copy-icon.component';

import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../shared/constants/app';
import { SECOND } from '../../../shared/constants/time';
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import { conversionUtil } from '../../../shared/modules/conversion-util';

export default class ConfirmDecryptMessage extends Component {
  static contextTypes = {
    t: PropTypes.func.isRequired,
    metricsEvent: PropTypes.func.isRequired,
  };

  static propTypes = {
    fromAccount: PropTypes.shape({
      address: PropTypes.string.isRequired,
      balance: PropTypes.string,
      name: PropTypes.string,
    }).isRequired,
    clearConfirmTransaction: PropTypes.func.isRequired,
    cancelDecryptMessage: PropTypes.func.isRequired,
    decryptMessage: PropTypes.func.isRequired,
    decryptMessageInline: PropTypes.func.isRequired,
    conversionRate: PropTypes.number,
    history: PropTypes.object.isRequired,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    requesterAddress: PropTypes.string,
    txData: PropTypes.object,
    domainMetadata: PropTypes.object,
  };

  state = {
    fromAccount: this.props.fromAccount,
    copyToClipboardPressed: false,
    hasCopied: false,
  };

  componentDidMount = () => {
    if (
      getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_NOTIFICATION
    ) {
      window.addEventListener('beforeunload', this._beforeUnload);
    }
  };

  componentWillUnmount = () => {
    this._removeBeforeUnload();
  };

  _beforeUnload = async (event) => {
    const {
      clearConfirmTransaction,
      cancelDecryptMessage,
      txData,
    } = this.props;
    const { metricsEvent } = this.context;
    await cancelDecryptMessage(txData, event);
    metricsEvent({
      eventOpts: {
        category: 'Messages',
        action: 'Decrypt Message Request',
        name: 'Cancel Via Notification Close',
      },
    });
    clearConfirmTransaction();
  };

  _removeBeforeUnload = () => {
    if (
      getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_NOTIFICATION
    ) {
      window.removeEventListener('beforeunload', this._beforeUnload);
    }
  };

  copyMessage = () => {
    copyToClipboard(this.state.rawMessage);
    this.context.metricsEvent({
      eventOpts: {
        category: 'Messages',
        action: 'Decrypt Message Copy',
        name: 'Copy',
      },
    });
    this.setState({ hasCopied: true });
    setTimeout(() => this.setState({ hasCopied: false }), SECOND * 3);
  };

  renderHeader = () => {
    return (
      <div className="request-decrypt-message__header">
        <div className="request-decrypt-message__header-background" />

        <div className="request-decrypt-message__header__text">
          {this.context.t('decryptRequest')}
        </div>

        <div className="request-decrypt-message__header__tip-container">
          <div className="request-decrypt-message__header__tip" />
        </div>
      </div>
    );
  };

  renderAccount = () => {
    const { fromAccount } = this.state;
    const { t } = this.context;

    return (
      <div className="request-decrypt-message__account">
        <div className="request-decrypt-message__account-text">
          {`${t('account')}:`}
        </div>

        <div className="request-decrypt-message__account-item">
          <AccountListItem account={fromAccount} />
        </div>
      </div>
    );
  };

  renderBalance = () => {
    const { conversionRate } = this.props;
    const {
      fromAccount: { balance },
    } = this.state;
    const { t } = this.context;

    const balanceInEther = conversionUtil(balance, {
      fromNumericBase: 'hex',
      toNumericBase: 'dec',
      fromDenomination: 'WEI',
      numberOfDecimals: 6,
      conversionRate,
    });

    return (
      <div className="request-decrypt-message__balance">
        <div className="request-decrypt-message__balance-text">
          {`${t('balance')}:`}
        </div>
        <div className="request-decrypt-message__balance-value">
          {`${balanceInEther} ETH`}
        </div>
      </div>
    );
  };

  renderRequestIcon = () => {
    const { requesterAddress } = this.props;

    return (
      <div className="request-decrypt-message__request-icon">
        <Identicon diameter={40} address={requesterAddress} />
      </div>
    );
  };

  renderAccountInfo = () => {
    return (
      <div className="request-decrypt-message__account-info">
        {this.renderAccount()}
        {this.renderRequestIcon()}
        {this.renderBalance()}
      </div>
    );
  };

  renderBody = () => {
    const { decryptMessageInline, domainMetadata, txData } = this.props;
    const { t } = this.context;

    const originMetadata = domainMetadata[txData.msgParams.origin];
    const name = originMetadata?.hostname || txData.msgParams.origin;
    const notice = t('decryptMessageNotice', [txData.msgParams.origin]);

    const {
      hasCopied,
      hasDecrypted,
      hasError,
      rawMessage,
      errorMessage,
      copyToClipboardPressed,
    } = this.state;

    return (
      <div className="request-decrypt-message__body">
        {this.renderAccountInfo()}
        <div className="request-decrypt-message__visual">
          <section>
            {originMetadata?.icon ? (
              <img
                className="request-decrypt-message__visual-identicon"
                src={originMetadata.icon}
                alt=""
              />
            ) : (
              <i className="request-decrypt-message__visual-identicon--default">
                {name.charAt(0).toUpperCase()}
              </i>
            )}
            <div className="request-decrypt-message__notice">{notice}</div>
          </section>
        </div>
        <div className="request-decrypt-message__message">
          <div className="request-decrypt-message__message-text">
            {!hasDecrypted && !hasError ? txData.msgParams.data : rawMessage}
            {hasError ? errorMessage : ''}
          </div>
          <div
            className={classnames({
              'request-decrypt-message__message-cover': true,
              'request-decrypt-message__message-lock--pressed':
                hasDecrypted || hasError,
            })}
          />
          <div
            className={classnames({
              'request-decrypt-message__message-lock': true,
              'request-decrypt-message__message-lock--pressed':
                hasDecrypted || hasError,
            })}
            onClick={(event) => {
              decryptMessageInline(txData, event).then((result) => {
                if (result.error) {
                  this.setState({
                    hasError: true,
                    errorMessage: this.context.t('decryptInlineError', [
                      result.error,
                    ]),
                  });
                } else {
                  this.setState({
                    hasDecrypted: true,
                    rawMessage: result.rawData,
                  });
                }
              });
            }}
          >
            <img src="images/lock.svg" alt="" />
            <div className="request-decrypt-message__message-lock-text">
              {t('decryptMetamask')}
            </div>
          </div>
        </div>
        {hasDecrypted ? (
          <div
            className={classnames({
              'request-decrypt-message__message-copy': true,
              'request-decrypt-message__message-copy--pressed': copyToClipboardPressed,
            })}
            onClick={() => this.copyMessage()}
            onMouseDown={() => this.setState({ copyToClipboardPressed: true })}
            onMouseUp={() => this.setState({ copyToClipboardPressed: false })}
          >
            <Tooltip
              position="bottom"
              title={hasCopied ? t('copiedExclamation') : t('copyToClipboard')}
              wrapperClassName="request-decrypt-message__message-copy-tooltip"
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <div className="request-decrypt-message__message-copy-text">
                {t('decryptCopy')}
              </div>
              <Copy size={17} color="#3098DC" />
            </Tooltip>
          </div>
        ) : (
          <div></div>
        )}
      </div>
    );
  };

  renderFooter = () => {
    const {
      cancelDecryptMessage,
      clearConfirmTransaction,
      decryptMessage,
      history,
      mostRecentOverviewPage,
      txData,
    } = this.props;
    const { metricsEvent, t } = this.context;

    return (
      <div className="request-decrypt-message__footer">
        <Button
          type="default"
          large
          className="request-decrypt-message__footer__cancel-button"
          onClick={async (event) => {
            this._removeBeforeUnload();
            await cancelDecryptMessage(txData, event);
            metricsEvent({
              eventOpts: {
                category: 'Messages',
                action: 'Decrypt Message Request',
                name: 'Cancel',
              },
            });
            clearConfirmTransaction();
            history.push(mostRecentOverviewPage);
          }}
        >
          {t('cancel')}
        </Button>
        <Button
          type="secondary"
          large
          className="request-decrypt-message__footer__sign-button"
          onClick={async (event) => {
            this._removeBeforeUnload();
            await decryptMessage(txData, event);
            metricsEvent({
              eventOpts: {
                category: 'Messages',
                action: 'Decrypt Message Request',
                name: 'Confirm',
              },
            });
            clearConfirmTransaction();
            history.push(mostRecentOverviewPage);
          }}
        >
          {t('decrypt')}
        </Button>
      </div>
    );
  };

  render = () => {
    return (
      <div className="request-decrypt-message__container">
        {this.renderHeader()}
        {this.renderBody()}
        {this.renderFooter()}
      </div>
    );
  };
}
