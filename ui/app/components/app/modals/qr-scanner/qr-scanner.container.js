import { connect } from 'react-redux'
import { hideModal, showModal, qrCodeDetected, showQrScanner } from '../../../../store/actions'
import {
  SEND_ROUTE,
} from '../../../../helpers/constants/routes'
import QrScanner from './qr-scanner.component'

const mapStateToProps = (state) => {
  const { props } = state.appState.modal.modalState
  return {
    ...props,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    showModal: (props) => dispatch(showModal(props)),
    hideModal: () => dispatch(hideModal()),
    qrCodeDetected: (data) => dispatch(qrCodeDetected(data)),
    scanQrCode: (route, props) => dispatch(showQrScanner(route || SEND_ROUTE, props)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(QrScanner)
