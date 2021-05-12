import log from 'loglevel';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { stripHexPrefix } from 'ethereumjs-util';
import copyToClipboard from 'copy-to-clipboard';
import { checksumAddress } from '../../../../helpers/utils/util';
import ReadOnlyInput from '../../../ui/readonly-input';
import Button from '../../../ui/button';
import AccountModalContainer from '../account-modal-container';

export default class ExportPrivateKeyModal extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static defaultProps = {
    warning: null,
    previousModalState: null,
  };

  static propTypes = {
    chainId: PropTypes.string,
    checksumUsesChainId: PropTypes.bool,
    exportAccount: PropTypes.func.isRequired,
    selectedIdentity: PropTypes.object.isRequired,
    warning: PropTypes.node,
    showAccountDetailModal: PropTypes.func.isRequired,
    hideModal: PropTypes.func.isRequired,
    hideWarning: PropTypes.func.isRequired,
    clearAccountDetails: PropTypes.func.isRequired,
    previousModalState: PropTypes.string,
  };

  state = {
    password: '',
    privateKey: null,
    showWarning: true,
  };

  componentWillUnmount() {
    this.props.clearAccountDetails();
    this.props.hideWarning();
  }

  exportAccountAndGetPrivateKey = (password, address) => {
    const { exportAccount } = this.props;

    exportAccount(password, address)
      .then((privateKey) =>
        this.setState({
          privateKey,
          showWarning: false,
        }),
      )
      .catch((e) => log.error(e));
  };

  renderPasswordLabel(privateKey) {
    return (
      <span className="export-private-key-modal__password-label">
        {privateKey
          ? this.context.t('copyPrivateKey')
          : this.context.t('typePassword')}
      </span>
    );
  }

  renderPasswordInput(privateKey) {
    const plainKey = privateKey && stripHexPrefix(privateKey);

    if (!privateKey) {
      return (
        <input
          type="password"
          className="export-private-key-modal__password-input"
          onChange={(event) => this.setState({ password: event.target.value })}
        />
      );
    }

    return (
      <ReadOnlyInput
        wrapperClass="export-private-key-modal__password-display-wrapper"
        inputClass="export-private-key-modal__password-display-textarea"
        textarea
        value={plainKey}
        onClick={() => copyToClipboard(plainKey)}
      />
    );
  }

  renderButtons(privateKey, address, hideModal) {
    return (
      <div className="export-private-key-modal__buttons">
        {!privateKey && (
          <Button
            type="default"
            large
            className="export-private-key-modal__button export-private-key-modal__button--cancel"
            onClick={() => hideModal()}
          >
            {this.context.t('cancel')}
          </Button>
        )}
        {privateKey ? (
          <Button
            onClick={() => hideModal()}
            type="secondary"
            large
            className="export-private-key-modal__button"
          >
            {this.context.t('done')}
          </Button>
        ) : (
          <Button
            onClick={() =>
              this.exportAccountAndGetPrivateKey(this.state.password, address)
            }
            type="secondary"
            large
            className="export-private-key-modal__button"
            disabled={!this.state.password}
          >
            {this.context.t('confirm')}
          </Button>
        )}
      </div>
    );
  }

  render() {
    const {
      chainId,
      checksumUsesChainId,
      selectedIdentity,
      warning,
      showAccountDetailModal,
      hideModal,
      previousModalState,
    } = this.props;
    const { name, address } = selectedIdentity;

    const { privateKey, showWarning } = this.state;

    return (
      <AccountModalContainer
        className="export-private-key-modal"
        selectedIdentity={selectedIdentity}
        showBackButton={previousModalState === 'ACCOUNT_DETAILS'}
        backButtonAction={() => showAccountDetailModal()}
      >
        <span className="export-private-key-modal__account-name">{name}</span>
        <ReadOnlyInput
          wrapperClass="ellip-address-wrapper"
          value={checksumAddress(address, chainId, checksumUsesChainId)}
        />
        <div className="export-private-key-modal__divider" />
        <span className="export-private-key-modal__body-title">
          {this.context.t('showPrivateKeys')}
        </span>
        <div className="export-private-key-modal__password">
          {this.renderPasswordLabel(privateKey)}
          {this.renderPasswordInput(privateKey)}
          {showWarning && warning ? (
            <span className="export-private-key-modal__password--error">
              {warning}
            </span>
          ) : null}
        </div>
        <div className="export-private-key-modal__password--warning">
          {this.context.t('privateKeyWarning')}
        </div>
        {this.renderButtons(privateKey, address, hideModal)}
      </AccountModalContainer>
    );
  }
}
