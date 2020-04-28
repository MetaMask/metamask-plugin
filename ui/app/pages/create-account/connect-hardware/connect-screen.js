import classnames from 'classnames'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import Button from '../../../components/ui/button'

class ConnectScreen extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    connectToHardwareWallet: PropTypes.func.isRequired,
    browserSupported: PropTypes.bool.isRequired,
  }

  state = {
    selectedDevice: null,
  }

  connect = () => {
    if (this.state.selectedDevice) {
      this.props.connectToHardwareWallet(this.state.selectedDevice)
    }
    return null
  }

  renderConnectToTrezorButton () {
    return (
      <button
        className={classnames('hw-connect__btn', {
          'selected': this.state.selectedDevice === 'trezor',
        })}
        onClick={(_) => this.setState({ selectedDevice: 'trezor' })}
      >
        <img
          className="hw-connect__btn__img"
          src="images/trezor-logo.svg"
          alt=""
        />
      </button>
    )
  }

  renderConnectToCoolWalletButton () {
    return (
      <button
        className={classnames('hw-connect__btn', {
          'selected': this.state.selectedDevice === 'coolwallet',
        })}
        onClick={(_) => this.setState({ selectedDevice: 'coolwallet' })}
      >
        <img
          className="hw-connect__btn__img"
          src="images/coolwallets-logo.svg"
          alt=""
        />
      </button>
    )
  }

  renderConnectToLedgerButton () {
    return (
      <button
        className={classnames('hw-connect__btn', {
          'selected': this.state.selectedDevice === 'ledger',
        })}
        onClick={(_) => this.setState({ selectedDevice: 'ledger' })}
      >
        <img
          className="hw-connect__btn__img"
          src="images/ledger-logo.svg"
          alt=""
        />
      </button>
    )
  }

  renderButtons () {
    return (
      <div>
        <div className="hw-connect__btn-wrapper">
          {this.renderConnectToLedgerButton()}
          {this.renderConnectToTrezorButton()}
        </div>
        <div>
          {this.renderConnectToCoolWalletButton()}
        </div>
        <Button
          type="primary"
          large
          className="hw-connect__connect-btn"
          onClick={this.connect}
          disabled={!this.state.selectedDevice}
        >
          {this.context.t('connect')}
        </Button>
      </div>
    )
  }

  renderUnsupportedBrowser () {
    return (
      <div className="new-account-connect-form unsupported-browser">
        <div className="hw-connect">
          <h3 className="hw-connect__title">{this.context.t('browserNotSupported')}</h3>
          <p className="hw-connect__msg">{this.context.t('chromeRequiredForHardwareWallets')}</p>
        </div>
        <Button
          type="primary"
          large
          onClick={() => global.platform.openTab({
            url: 'https://google.com/chrome',
          })}
        >
          {this.context.t('downloadGoogleChrome')}
        </Button>
      </div>
    )
  }

  renderHeader () {
    return (
      <div className="hw-connect__header">
        <h3 className="hw-connect__header__title">{this.context.t('hardwareWallets')}</h3>
        <p className="hw-connect__header__msg">{this.context.t('hardwareWalletsMsg')}</p>
      </div>
    )
  }

  getAffiliateLinks () {
    const links = {
      trezor: `<a class='hw-connect__get-hw__link' href='https://shop.trezor.io/?a=metamask' target='_blank'>Trezor</a>`,
      ledger: `<a class='hw-connect__get-hw__link' href='https://www.ledger.com/products/ledger-nano-s?r=17c4991a03fa&tracker=MY_TRACKER' target='_blank'>Ledger</a>`,
      coolwallet: `<a class='hw-connect__get-hw__link' href='https://www.coolwallet.io/product/coolwallet/' target='_blank'>CoolWallet</a>`,
    }

    const text = this.context.t('orderOneHere')
    const response = text.replace('Trezor', links.trezor).replace('Ledger', links.ledger).replace('CoolWallet', links.coolwallet)

    return (
      <div
        className="hw-connect__get-hw__msg"
        dangerouslySetInnerHTML={{ __html: response }}
      />
    )
  }

  renderTrezorAffiliateLink () {
    return (
      <div className="hw-connect__get-hw">
        <p className="hw-connect__get-hw__msg">{this.context.t('dontHaveAHardwareWallet')}</p>
        {this.getAffiliateLinks()}
      </div>
    )
  }


  scrollToTutorial = () => {
    if (this.referenceNode) {
      this.referenceNode.scrollIntoView({ behavior: 'smooth' })
    }
  }

  renderLearnMore () {
    return (
      <p className="hw-connect__learn-more" onClick={this.scrollToTutorial}>
        {this.context.t('learnMore')}
        <img className="hw-connect__learn-more__arrow" src="images/caret-right.svg" alt="" />
      </p>
    )
  }

  renderTutorialSteps () {
    const steps = [
      {
        asset: 'hardware-wallet-step-1',
        dimensions: { width: '225px', height: '75px' },
        title: this.context.t('step1HardwareWallet'),
        message: this.context.t('step1HardwareWalletMsg'),
      },
      {
        asset: 'hardware-wallet-step-2',
        dimensions: { width: '300px', height: '100px' },
        title: this.context.t('step2HardwareWallet'),
        message: this.context.t('step2HardwareWalletMsg'),
      },
      {
        asset: 'hardware-wallet-step-3',
        dimensions: { width: '120px', height: '90px' },
        title: this.context.t('step3HardwareWallet'),
        message: this.context.t('step3HardwareWalletMsg'),
      },
    ]

    return (
      <div
        className="hw-tutorial"
        ref={(node) => {
          this.referenceNode = node
        }}
      >
        {steps.map((step, index) => (
          <div className="hw-connect" key={index}>
            <h3 className="hw-connect__title">{step.title}</h3>
            <p className="hw-connect__msg">{step.message}</p>
            <img className="hw-connect__step-asset" src={`images/${step.asset}.svg`} {...step.dimensions} alt="" />
          </div>
        ))}
      </div>
    )
  }

  renderFooter () {
    return (
      <div className="hw-connect__footer">
        <h3 className="hw-connect__footer__title">{this.context.t('readyToConnect')}</h3>
        {this.renderButtons()}
        <p className="hw-connect__footer__msg">
          {this.context.t('havingTroubleConnecting')}
          <a className="hw-connect__footer__link" href="https://support.metamask.io/" target="_blank" rel="noopener noreferrer">
            {this.context.t('getHelp')}
          </a>
        </p>
      </div>
    )
  }

  renderConnectScreen () {
    return (
      <div className="new-account-connect-form">
        {this.renderHeader()}
        {this.renderButtons()}
        {this.renderTrezorAffiliateLink()}
        {this.renderLearnMore()}
        {this.renderTutorialSteps()}
        {this.renderFooter()}
      </div>
    )
  }

  render () {
    if (this.props.browserSupported) {
      return this.renderConnectScreen()
    }
    return this.renderUnsupportedBrowser()
  }
}

export default ConnectScreen

