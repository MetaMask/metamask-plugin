import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { calculateHexData } from '../../send.utils';
import SendRowWrapper from '../send-row-wrapper'
import HCaptcha from '../../../../components/app/captcha'

export default class CaptchaRowComponent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasTriedSolveCaptchaChallenge: false,
      isCaptchaChallengePassed: false,
    }
  }

  componentDidMount() {
    this.updateData();
  }

  onCaptchaVerified() {
    this.setState(
      {
        hasTriedSolveCaptchaChallenge: true,
        isCaptchaChallengePassed: true,
      },
      this.updateData,
    )
  }

  onCaptchaClosed() {
    this.setState(
      {
        hasTriedSolveCaptchaChallenge: true,
        isCaptchaChallengePassed: false,
      },
      this.updateData,
    )
  }

  updateData() {
    const {
      updateSendIsHcaptchaVerified,
      hexData,
      updateSendHexData,
      updateGas,
      isVerified
    } = this.props
    const { isCaptchaChallengePassed } = this.state
    if (!isVerified) {
      updateSendIsHcaptchaVerified(isCaptchaChallengePassed)
    }
    const data = calculateHexData(hexData, isCaptchaChallengePassed || isVerified)
    updateSendHexData(data);
    updateGas({ data })
  }

  render() {
    const siteKey = process.env.HCAPTCHA_SITE_KEY
    return (
      <HCaptcha
        sitekey={siteKey}
        onVerify={this.onCaptchaVerified}
        onClose={this.onCaptchaClosed}
        languageOverride={this.props.lang}
      />
    )
  }
}
CaptchaRowComponent.propTypes = {
  hexData: PropTypes.string,
  updateSendHexData: PropTypes.func.isRequired,
  lang: PropTypes.string
}
