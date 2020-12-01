import { connect } from 'react-redux'
import { updateSendHexData, updateSendIsHcaptchaVerified } from '../../../../store/actions'
import SendCaptchaDataRowComponent from './send-captcha-data-row.component'

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SendCaptchaDataRowComponent)

function mapStateToProps(state) {
  return {
    hexData: state.metamask.send.data,
    isVerified: state.metamask.isHcaptchaVerified,
    lang: state.metamask.currentLocale
  }
}

function mapDispatchToProps(dispatch) {
  return {
    updateSendHexData(data) {
      return dispatch(updateSendHexData(data))
    },
    updateSendIsHcaptchaVerified(value) {
      return dispatch(updateSendIsHcaptchaVerified(value))
    }
  }
}
