import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import { isValidAddress } from 'ethereumjs-util';
import Identicon from '../../../ui/identicon';
import TextField from '../../../ui/text-field';
import { isValidDomainName } from '../../../../helpers/utils/util';
import PageContainerFooter from '../../../ui/page-container/page-container-footer';
import { getEnvironmentType } from '../../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../../shared/constants/app';
import {
  isBurnAddress,
  isValidHexAddress,
} from '../../../../../shared/modules/hexstring-utils';

const environmentType = getEnvironmentType();
const isFullScreen = environmentType === ENVIRONMENT_TYPE_FULLSCREEN;
export default class AddNewContactModal extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    addToAddressBook: PropTypes.func,
  };

  state = {
    newName: '',
    ethAddress: '',
    ensAddress: '',
    error: '',
    ethAddressError: '',
    memo: '',
  };

  constructor(props) {
    super(props);
    this.dValidate = debounce(this.validate, 1000);
  }

  onAddressChange = (e) => {
    const { t } = this.context;
    const ethAddress = e.target.value;

    if (
      ethAddress &&
      isValidHexAddress(ethAddress, { mixedCaseUseChecksum: true })
    ) {
      if (isBurnAddress(ethAddress)) {
        this.setState({
          ethAddress,
          ethAddressError: t('burnAddress'),
        });
      } else {
        this.setState({
          ethAddress,
          ethAddressError: '',
        });
      }
    } else {
      this.setState({
        ethAddress,
        ethAddressError: t('invalidAddress'),
      });
    }
  };

  validate = (address) => {
    const valid = isValidAddress(address);
    const validEnsAddress = isValidDomainName(address);

    if (valid || validEnsAddress || address === '') {
      this.setState({ error: '', ethAddress: address });
    } else {
      this.setState({ error: 'Invalid Address' });
    }
  };

  renderEthAddressInput() {
    const { t } = this.context;
    return (
      <TextField
        type="text"
        value={this.state.ethAddress}
        onChange={this.onAddressChange}
        placeholder={isFullScreen ? t('addAnEthereumAddress') : ''}
        fullWidth
        margin="dense"
      />
    );
  }

  render() {
    const { t } = this.context;
    const { addToAddressBook } = this.props;

    const errorToRender = this.state.ethAddressError || this.state.error;

    return (
      <div className="settings-page__content-row address-book__add-contact">
        {this.state.ensAddress && (
          <div className="address-book__view-contact__group">
            <Identicon address={this.state.ensAddress} diameter={60} />
            <div className="address-book__view-contact__group__value">
              {this.state.ensAddress}
            </div>
          </div>
        )}
        <div className="address-book__add-contact__content">
          <h2 className="address-book__header__name">{t('newContact')}</h2>
          <div className="address-book__view-contact__group">
            <div className="address-book__view-contact__group__label">
              {t('userName')}
            </div>
            <TextField
              type="text"
              id="nickname"
              value={this.state.newName}
              onChange={(e) => this.setState({ newName: e.target.value })}
              placeholder={isFullScreen ? t('userName') : ''}
              fullWidth
              autoFocus
              margin="dense"
            />
          </div>

          <div className="address-book__view-contact__group">
            <div className="address-book__view-contact__group__label">
              {t('ethereumPublicAddress')}
            </div>
            {this.renderEthAddressInput()}
            {errorToRender && (
              <div className="address-book__add-contact__error">
                {errorToRender}
              </div>
            )}
          </div>

          <div className="add-to-address-book-modal__content">
            <div className="address-book__view-contact__group__label--capitalized">
              {t('memo')}
            </div>
            <textarea
              className="add-new-contact-modal__textarea"
              value={this.state.memo}
              onChange={(e) => this.setState({ memo: e.target.value })}
              placeholder={isFullScreen ? t('addMemo') : ''}
            />
          </div>
        </div>
        <PageContainerFooter
          cancelText={this.context.t('cancel')}
          disabled={Boolean(this.state.error || this.state.ethAddress < 1)}
          onSubmit={async () => {
            await addToAddressBook(
              this.state.ensAddress || this.state.ethAddress,
              this.state.newName,
              this.state.memo,
            );
            this.props.hideModal();
          }}
          onCancel={() => {
            this.props.hideModal();
          }}
          submitText={this.context.t('save')}
          submitButtonType="confirm"
        />
      </div>
    );
  }
}
