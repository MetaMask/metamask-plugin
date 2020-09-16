import React, { PureComponent } from 'react'
import Select from 'react-select'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import QrView from '../../../ui/qr-code'
import SendRowWrapper from '../../../../pages/send/send-content/send-row-wrapper'
import PageContainerFooter from '../../../ui/page-container/page-container-footer'
import {
  updateSignature,
} from '../../../../ducks/confirm-transaction/confirm-transaction.duck'
import {
  cancelSignatureBidirectionalQr,
  submitSignatureBidirectionalQr,
  showQrScanner,
  qrCodeDetected,
  hideModal,
  hideLoadingIndication,
} from '../../../../store/actions'
import { CONFIRM_TRANSACTION_ROUTE } from '../../../../helpers/constants/routes'
import BidirectionalQrSignModalContainer from './bidirectional-qr-sign-modal-container'
import TxInput from './tx-input'
import AirSign from './bidirectional-qr-sign-signer-airsign'
import ParitySigner from './bidirectional-qr-sign-signer-parity'
import Erc67Signer from './bidirectional-qr-sign-signer-erc67'
import EllipalSigner from './bidirectional-qr-sign-signer-ellipal'
import {
  signatureInError,
  decodeSignature,
} from './bidirectional-qr-sign-modal-utils'

const mapStateToProps = (state) => {
  const { confirmTransaction } = state
  const {
    txData,
  } = confirmTransaction
  let {
    signature,
  } = confirmTransaction
  signature = signature || ''
  const { qrCodeData } = state.appState
  const { props } = state.appState.modal.modalState
  const { signable } = props
  const { defaultSigner } = props
  const { bidirectionalQrSignables } = state.metamask
  const { extCancel } = state.metamask
  const { extSigned } = state.metamask
  const signers = ['airsign', 'paritysigner', 'erc67', 'ellipal']
  const signerStrings = {
    airsign: 'AirSign',
    paritysigner: 'Parity Signer',
    erc67: 'Erc67 Signer',
    ellipal: 'Ellipal Signer',
  }
  const signerClasses = {
    airsign: AirSign,
    paritysigner: ParitySigner,
    erc67: Erc67Signer,
    ellipal: EllipalSigner,
  }
  const qrScanner = true // display qr scanner icon on input field
  return {
    defaultSigner,
    extCancel,
    extSigned,
    bidirectionalQrSignables,
    qrCodeData,
    qrScanner,
    signable,
    signature,
    txData,
    signers,
    signerStrings,
    signerClasses,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onChange: (newSignature) => {
      dispatch(updateSignature(newSignature))
    },
    scanSignatureQrCode: (props) => {
      dispatch(showQrScanner(CONFIRM_TRANSACTION_ROUTE, props))
    },
    qrCodeDetected: (data) => dispatch(qrCodeDetected(data)),
    onCancel: (id) => {
      dispatch(cancelSignatureBidirectionalQr(id))
      dispatch(hideModal())
    },
    onSubmit: (id, r, s, v) => {
      dispatch(submitSignatureBidirectionalQr(id, r, s, v))
      dispatch(hideModal())
    },
    hideLodingIndication: () => {
      dispatch(hideLoadingIndication())
    },
    hideModal: () => {
      dispatch(hideModal())
    },
  }
}

class BidirectionalQrSignModal extends PureComponent {
  static propTypes = {
    bidirectionalQrSignables: PropTypes.array,
    hideLodingIndication: PropTypes.func,
    hideModal: PropTypes.func,
    onCancel: PropTypes.func,
    onChange: PropTypes.func,
    onSubmit: PropTypes.func,
    qrCodeData: PropTypes.string,
    qrScanner: PropTypes.bool,
    scanSignatureQrCode: PropTypes.func,
    signable: PropTypes.object,
    signature: PropTypes.string,
    signerClasses: PropTypes.object,
    signers: PropTypes.array,
    signerStrings: PropTypes.object,
    defaultSigner: PropTypes.string,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  constructor (props) {
    super(props)
    this.state =
      {
        cancelOrSubmitPressed: false,
        scannerPressed: false,
        signer: props.defaultSigner || 'airsign',
      }
    this.onCancel = this.onCancel.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
    this.scanSignatureQrCode = this.scanSignatureQrCode.bind(this)
    this.container = null

    this.setContainerRef = (element) => {
      this.container = element
    }
  }

  render = () => {
    const {
      onChange,
      qrScanner,
      signable,
      signature,
      signers,
      signerStrings,
      signerClasses,
    } = this.props
    const { signer } = this.state
    let signerErrorType
    let signerShowError = false
    const signerErrors = {
      signerDoesNotSupport: 'signerDoesNotSupport',
    }
    let qrTxData
    let showError
    try {
      const signerObj = new signerClasses[signer]({
        signable,
      })
      qrTxData = signerObj.encodeSignRequestUri(0) // TODO: implement QR paging

      showError = signature && signatureInError(signable, signature, signerObj)
    } catch (e) {
      qrTxData = ''
      signerShowError = true
      signerErrorType = 'signerDoesNotSupport'
    }
    const errors = {
      invalidSignature: 'invalidSignature',
    }
    const errorType = showError ? 'invalidSignature' : null
    return (
      <BidirectionalQrSignModalContainer
        hideModal={this.onCancel}
      >
        <div>
          <QrView
            Qr={{
              data: qrTxData,
              width: Math.min(480, window.innerWidth - 70),
              isDataAddress: false,
            }}
          />
          <SendRowWrapper
            label={this.context.t('signature')}
            errors={errors}
            errorType={errorType}
            showError={showError}
          >
            <TxInput
              signature={signature}
              onChange={onChange}
              inError={showError}
              qrScanner={qrScanner}
              scanSignatureQrCode={this.scanSignatureQrCode}
              scannerProps={{
                showNext: 'BIDIRECTIONAL_QR_SIGN',
                nextProps: { signable, defaultSigner: signer },
              }}
            />
          </SendRowWrapper>
          <SendRowWrapper
            label={this.context.t('signWith')}
            errors={signerErrors}
            errorType={signerErrorType}
            showError={signerShowError}
          >
            <Select
              className="new-account-import-form__select"
              name="import-type-select"
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 19999 }) }}
              clearable={false}
              value={signer || signers[0]}
              options={signers.map((sgn) => {
                return {
                  value: sgn,
                  label: signerStrings[sgn],
                }
              })}
              onChange={(opt) => {
                this.setState({ signer: opt.value })
              }}
            />
          </SendRowWrapper>
        </div>
        <PageContainerFooter
          onCancel={this.onCancel}
          onSubmit={this.onSubmit}
          submitText={this.context.t('confirm')}
          disabled={showError || !signature}
        />
      </BidirectionalQrSignModalContainer>
    )
  }

  scanSignatureQrCode (props) {
    this.setState({ scannerPressed: true }, () => {
      this.props.scanSignatureQrCode(props)
    })
  }

  onCancel () {
    this.setState({ cancelOrSubmitPressed: true }, () => {
      this.cancelConfirm()
    })
  }

  cancelConfirm () {
    this.props.onCancel(this.props.signable.id)
  }

  onSubmit () {
    this.setState({ cancelOrSubmitPressed: true }, () => {
      const { signable, signature, signerClasses } = this.props
      const { r, s, v } = decodeSignature(this.state.signer, signature, signable, signerClasses)
      this.props.onSubmit(signable.id, r, s, v)
    })
  }

  componentDidMount () {
    const {
      onChange,
      qrCodeData,
      signerClasses,
      signable,
    } = this.props
    const { signer } = this.state
    let signature = qrCodeData
    if (signature) {
      const signerObj = new signerClasses[signer]({
        signable,
      })
      try {
        signature = signerObj.decodeSignatureString(`${signature.type}:${signature.values}`)
      } catch (e) {
      // no operations
      }
    }
    onChange(signature)
    qrCodeDetected(null)
    this.props.hideLodingIndication()
  }

  componentWillUnmount () {
    if (!this.state.cancelOrSubmitPressed && !this.state.scannerPressed) {
      this.cancelConfirm()
    }
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    if (nextProps.bidirectionalQrSignables.filter((sgn) => this.props.signable && sgn.id === this.props.signable.id).length === 0) {
      this.props.hideModal()
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(BidirectionalQrSignModal)
