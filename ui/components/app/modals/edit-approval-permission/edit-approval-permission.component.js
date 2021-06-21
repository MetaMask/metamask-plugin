import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import log from 'loglevel';
import classnames from 'classnames';
import BigNumber from 'bignumber.js';
import Modal from '../../modal';
import Identicon from '../../../ui/identicon';
import TextField from '../../../ui/text-field';
import { calcTokenAmount } from '../../../../../shared/modules/token-utils';

const MAX_UNSIGNED_256_INT = new BigNumber(2).pow(256).minus(1).toString(10);

export default class EditApprovalPermission extends PureComponent {
  static propTypes = {
    decimals: PropTypes.number,
    hideModal: PropTypes.func.isRequired,
    selectedIdentity: PropTypes.object,
    tokenAmount: PropTypes.string,
    customTokenAmount: PropTypes.string,
    tokenSymbol: PropTypes.string,
    tokenBalance: PropTypes.string,
    setCustomAmount: PropTypes.func,
    origin: PropTypes.string.isRequired,
    requiredMinimum: PropTypes.instanceOf(BigNumber),
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  state = {
    // This is used as a TextField value, which should be a string.
    customSpendLimit: this.props.customTokenAmount || '',
    selectedOptionIsUnlimited: !this.props.customTokenAmount,
  };

  renderModalContent(error) {
    const { t } = this.context;
    const {
      hideModal,
      selectedIdentity,
      tokenAmount,
      tokenSymbol,
      tokenBalance,
      customTokenAmount,
      origin,
    } = this.props;
    const { name, address } = selectedIdentity || {};
    const { selectedOptionIsUnlimited } = this.state;

    return (
      <div className="edit-approval-permission">
        <div className="edit-approval-permission__header">
          <div className="edit-approval-permission__title">
            {t('editPermission')}
          </div>
          <div
            className="edit-approval-permission__header__close"
            onClick={() => hideModal()}
          />
        </div>
        <div className="edit-approval-permission__account-info">
          <div className="edit-approval-permission__account-info__account">
            <Identicon address={address} diameter={32} />
            <div className="edit-approval-permission__name-and-balance-container">
              <div className="edit-approval-permission__account-info__name">
                {name}
              </div>
              <div>{t('balance')}</div>
            </div>
          </div>
          <div className="edit-approval-permission__account-info__balance">
            {`${Number(tokenBalance).toPrecision(9)} ${tokenSymbol}`}
          </div>
        </div>
        <div className="edit-approval-permission__edit-section">
          <div className="edit-approval-permission__edit-section__title">
            {t('spendLimitPermission')}
          </div>
          <div className="edit-approval-permission__edit-section__description">
            {t('allowWithdrawAndSpend', [origin])}
          </div>
          <div className="edit-approval-permission__edit-section__option">
            <div
              className="edit-approval-permission__edit-section__radio-button"
              onClick={() => this.setState({ selectedOptionIsUnlimited: true })}
            >
              <div
                className={classnames({
                  'edit-approval-permission__edit-section__radio-button-outline': !selectedOptionIsUnlimited,
                  'edit-approval-permission__edit-section__radio-button-outline--selected': selectedOptionIsUnlimited,
                })}
              />
              <div className="edit-approval-permission__edit-section__radio-button-fill" />
              {selectedOptionIsUnlimited && (
                <div className="edit-approval-permission__edit-section__radio-button-dot" />
              )}
            </div>
            <div className="edit-approval-permission__edit-section__option-text">
              <div
                className={classnames({
                  'edit-approval-permission__edit-section__option-label': !selectedOptionIsUnlimited,
                  'edit-approval-permission__edit-section__option-label--selected': selectedOptionIsUnlimited,
                })}
              >
                {new BigNumber(tokenAmount).lessThan(
                  new BigNumber(tokenBalance),
                )
                  ? t('proposedApprovalLimit')
                  : t('unlimited')}
              </div>
              <div className="edit-approval-permission__edit-section__option-description">
                {t('spendLimitRequestedBy', [origin])}
              </div>
              <div className="edit-approval-permission__edit-section__option-value">
                {`${Number(tokenAmount)} ${tokenSymbol}`}
              </div>
            </div>
          </div>
          <div className="edit-approval-permission__edit-section__option">
            <div
              className="edit-approval-permission__edit-section__radio-button"
              onClick={() =>
                this.setState({ selectedOptionIsUnlimited: false })
              }
            >
              <div
                className={classnames({
                  'edit-approval-permission__edit-section__radio-button-outline': selectedOptionIsUnlimited,
                  'edit-approval-permission__edit-section__radio-button-outline--selected': !selectedOptionIsUnlimited,
                })}
              />
              <div className="edit-approval-permission__edit-section__radio-button-fill" />
              {!selectedOptionIsUnlimited && (
                <div className="edit-approval-permission__edit-section__radio-button-dot" />
              )}
            </div>
            <div className="edit-approval-permission__edit-section__option-text">
              <div
                className={classnames({
                  'edit-approval-permission__edit-section__option-label': selectedOptionIsUnlimited,
                  'edit-approval-permission__edit-section__option-label--selected': !selectedOptionIsUnlimited,
                })}
              >
                {t('customSpendLimit')}
              </div>
              <div className="edit-approval-permission__edit-section__option-description">
                {t('enterMaxSpendLimit')}
              </div>
              <div className="edit-approval-permission__edit-section__option-input">
                <TextField
                  type="number"
                  placeholder={`${Number(
                    customTokenAmount || tokenAmount,
                  )} ${tokenSymbol}`}
                  onChange={(event) => {
                    this.setState({ customSpendLimit: event.target.value });
                    if (selectedOptionIsUnlimited) {
                      this.setState({ selectedOptionIsUnlimited: false });
                    }
                  }}
                  fullWidth
                  margin="dense"
                  value={this.state.customSpendLimit}
                  error={error}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  validateSpendLimit() {
    const { t } = this.context;
    const { decimals, requiredMinimum } = this.props;
    const { selectedOptionIsUnlimited, customSpendLimit } = this.state;

    if (selectedOptionIsUnlimited || !customSpendLimit) {
      return undefined;
    }

    let customSpendLimitNumber;
    try {
      customSpendLimitNumber = new BigNumber(customSpendLimit);
    } catch (error) {
      log.debug(`Error converting '${customSpendLimit}' to BigNumber:`, error);
      return t('spendLimitInvalid');
    }

    if (customSpendLimitNumber.isNegative()) {
      return t('spendLimitInvalid');
    }

    const maxTokenAmount = calcTokenAmount(MAX_UNSIGNED_256_INT, decimals);
    if (customSpendLimitNumber.greaterThan(maxTokenAmount)) {
      return t('spendLimitTooLarge');
    }

    if (
      requiredMinimum !== undefined &&
      customSpendLimitNumber.lessThan(requiredMinimum)
    ) {
      return t('spendLimitInsufficient');
    }

    return undefined;
  }

  render() {
    const { t } = this.context;
    const { setCustomAmount, hideModal, customTokenAmount } = this.props;
    const { selectedOptionIsUnlimited, customSpendLimit } = this.state;

    const error = this.validateSpendLimit();
    const disabled = Boolean(
      (customSpendLimit === customTokenAmount && !selectedOptionIsUnlimited) ||
        error,
    );

    return (
      <Modal
        onSubmit={() => {
          setCustomAmount(selectedOptionIsUnlimited ? '' : customSpendLimit);
          hideModal();
        }}
        submitText={t('save')}
        submitType="primary"
        contentClass="edit-approval-permission-modal-content"
        containerClass="edit-approval-permission-modal-container"
        submitDisabled={disabled}
      >
        {this.renderModalContent(error)}
      </Modal>
    );
  }
}
