import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import { isValidAddress } from 'ethereumjs-util';
import Identicon from '../../../ui/identicon';
import TextField from '../../../ui/text-field';
import { isValidDomainName } from '../../../../helpers/utils/util';
import EnsInput from '../../../../pages/send/send-content/add-recipient/ens-input';
import PageContainerFooter from '../../../ui/page-container/page-container-footer';
import { getEnvironmentType } from '../../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../../shared/constants/app';

const environmentType = getEnvironmentType();
const isFullScreen = environmentType === ENVIRONMENT_TYPE_FULLSCREEN;
export default class AddNewContactModal extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    addToAddressBook: PropTypes.func,
    scanQrCode: PropTypes.func,
    qrCodeData:
      PropTypes.object /* eslint-disable-line react/no-unused-prop-types */,
    qrCodeDetected: PropTypes.func,
  };

  state = {
    newName: '',
    ethAddress: '',
    ensAddress: '',
    error: '',
    ensError: '',
    memo: '',
  };

  constructor(props) {
    super(props);
    this.dValidate = debounce(this.validate, 1000);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps?.qrCodeData?.type === 'address') {
      const scannedAddress = nextProps.qrCodeData.values.address.toLowerCase();
      const currentAddress = this.state.ensAddress || this.state.ethAddress;
      if (currentAddress.toLowerCase() !== scannedAddress) {
        this.setState({ ethAddress: scannedAddress, ensAddress: '' });
        // Clean up QR code data after handling
        this.props.qrCodeDetected(null);
      }
    }
  }

  validate = (address) => {
    const valid = isValidAddress(address);
    const validEnsAddress = isValidDomainName(address);

    if (valid || validEnsAddress || address === '') {
      this.setState({ error: '', ethAddress: address });
    } else {
      this.setState({ error: 'Invalid Address' });
    }
  };

  renderInput() {
    const { t } = this.context;
    return (
      <EnsInput
        className="send__to-row"
        placeholderText={isFullScreen ? t('addAnEthereumAddress') : ' '}
        scanQrCode={(_) => {
          this.props.scanQrCode();
        }}
        onChange={this.dValidate}
        onPaste={(text) => this.setState({ ethAddress: text })}
        onReset={() => this.setState({ ethAddress: '', ensAddress: '' })}
        updateEnsResolution={(address) => {
          this.setState({ ensAddress: address, error: '', ensError: '' });
        }}
        updateEnsResolutionError={(message) =>
          this.setState({ ensError: message })
        }
        value={this.state.ethAddress || ''}
      />
    );
  }

  render() {
    const { t } = this.context;
    const { addToAddressBook } = this.props;

    const errorToRender = this.state.ensError || this.state.error;

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
              margin="dense"
            />
          </div>

          <div className="address-book__view-contact__group">
            <div className="address-book__view-contact__group__label">
              {t('ethereumPublicAddress')}
            </div>
            {this.renderInput()}
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
            <TextField
              className="first-time-flow__textarea"
              type="text"
              id="memoInput"
              value={this.state.memo}
              onChange={(e) => this.setState({ memo: e.target.value })}
              placeholder={isFullScreen ? t('addMemo') : ''}
              fullWidth
              multiline
              margin="dense"
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
