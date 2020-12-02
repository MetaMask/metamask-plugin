import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { exportAsFile } from '../../../helpers/utils/util'
import ToggleButton from '../../../components/ui/toggle-button'
import TextField from '../../../components/ui/text-field'
import Button from '../../../components/ui/button'
import { MOBILE_SYNC_ROUTE } from '../../../helpers/constants/routes'

export default class AdvancedTab extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  static propTypes = {
    setUseNonceField: PropTypes.func,
    useNonceField: PropTypes.bool,
    setHexDataFeatureFlag: PropTypes.func,
    displayWarning: PropTypes.func,
    showResetAccountConfirmationModal: PropTypes.func,
    warning: PropTypes.string,
    history: PropTypes.object,
    sendHexData: PropTypes.bool,
    setAdvancedInlineGasFeatureFlag: PropTypes.func,
    advancedInlineGas: PropTypes.bool,
    setTransactionTimeFeatureFlag: PropTypes.func,
    transactionTime: PropTypes.bool,
    speedUpAnyTransaction: PropTypes.bool,
    setSpeedUpAnyTransaction: PropTypes.bool,
    showFiatInTestnets: PropTypes.bool,
    autoLockTimeLimit: PropTypes.number,
    setAutoLockTimeLimit: PropTypes.func.isRequired,
    setShowFiatConversionOnTestnetsPreference: PropTypes.func.isRequired,
    threeBoxSyncingAllowed: PropTypes.bool.isRequired,
    setThreeBoxSyncingPermission: PropTypes.func.isRequired,
    threeBoxDisabled: PropTypes.bool.isRequired,
    setIpfsGateway: PropTypes.func.isRequired,
    ipfsGateway: PropTypes.string.isRequired,
  }

  state = {
    autoLockTimeLimit: this.props.autoLockTimeLimit,
    lockTimeError: '',
    ipfsGateway: this.props.ipfsGateway,
    ipfsGatewayError: '',
  }

  renderMobileSync() {
    const { t } = this.context
    const { history } = this.props

    return (
      <div
        className="settings-page__content-row"
        data-testid="advanced-setting-mobile-sync"
      >
        <div className="settings-page__content-item">
          <span>{t('syncWithMobile')}</span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Button
              type="secondary"
              large
              onClick={(event) => {
                event.preventDefault()
                history.push(MOBILE_SYNC_ROUTE)
              }}
            >
              {t('syncWithMobile')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  renderStateLogs() {
    const { t } = this.context
    const { displayWarning } = this.props

    return (
      <div
        className="settings-page__content-row"
        data-testid="advanced-setting-state-logs"
      >
        <div className="settings-page__content-item">
          <span>{t('stateLogs')}</span>
          <span className="settings-page__content-description">
            {t('stateLogsDescription')}
          </span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Button
              type="secondary"
              large
              onClick={() => {
                window.logStateString((err, result) => {
                  if (err) {
                    displayWarning(t('stateLogError'))
                  } else {
                    exportAsFile(`${t('stateLogFileName')}.json`, result)
                  }
                })
              }}
            >
              {t('downloadStateLogs')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  renderResetAccount() {
    const { t } = this.context
    const { showResetAccountConfirmationModal } = this.props

    return (
      <div
        className="settings-page__content-row"
        data-testid="advanced-setting-reset-account"
      >
        <div className="settings-page__content-item">
          <span>{t('resetAccount')}</span>
          <span className="settings-page__content-description">
            {t('resetAccountDescription')}
          </span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Button
              type="warning"
              large
              className="settings-tab__button--red"
              onClick={(event) => {
                event.preventDefault()
                this.context.metricsEvent({
                  eventOpts: {
                    category: 'Settings',
                    action: 'Reset Account',
                    name: 'Reset Account',
                  },
                })
                showResetAccountConfirmationModal()
              }}
            >
              {t('resetAccount')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  renderHexDataOptIn() {
    const { t } = this.context
    const { sendHexData, setHexDataFeatureFlag } = this.props

    return (
      <div
        className="settings-page__content-row"
        data-testid="advanced-setting-hex-data"
      >
        <div className="settings-page__content-item">
          <span>{t('showHexData')}</span>
          <div className="settings-page__content-description">
            {t('showHexDataDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={sendHexData}
              onToggle={(value) => setHexDataFeatureFlag(!value)}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    )
  }

  renderAdvancedGasInputInline() {
    const { t } = this.context
    const { advancedInlineGas, setAdvancedInlineGasFeatureFlag } = this.props

    return (
      <div
        className="settings-page__content-row"
        data-testid="advanced-setting-advanced-gas-inline"
      >
        <div className="settings-page__content-item">
          <span>{t('showAdvancedGasInline')}</span>
          <div className="settings-page__content-description">
            {t('showAdvancedGasInlineDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={advancedInlineGas}
              onToggle={(value) => setAdvancedInlineGasFeatureFlag(!value)}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    )
  }

  renderTransactionTimeEstimates() {
    const { t } = this.context
    const { transactionTime, setTransactionTimeFeatureFlag } = this.props

    return (
      <div
        className="settings-page__content-row"
        data-testid="advanced-setting-transaction-time-inline"
      >
        <div className="settings-page__content-item">
          <span>{t('transactionTime')}</span>
          <div className="settings-page__content-description">
            {t('showTransactionTimeDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={transactionTime}
              onToggle={(value) => setTransactionTimeFeatureFlag(!value)}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    )
  }

  renderAllowSpeedUpAnyTransaction() {
    const { t } = this.context
    const { speedUpAnyTransaction, setSpeedUpAnyTransaction } = this.props

    return (
      <div
        className="settings-page__content-row"
        data-testid="advanced-setting-speedup-any-transaction"
      >
        <div className="settings-page__content-item">
          <span>{t('speedUpAnyTransaction')}</span>
          <div className="settings-page__content-description">
            {t('showSpeedUpAnyTransactionDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={speedUpAnyTransaction}
              onToggle={(value) => setSpeedUpAnyTransaction(!value)}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    )
  }

  renderShowConversionInTestnets() {
    const { t } = this.context
    const {
      showFiatInTestnets,
      setShowFiatConversionOnTestnetsPreference,
    } = this.props

    return (
      <div
        className="settings-page__content-row"
        data-testid="advanced-setting-show-testnet-conversion"
      >
        <div className="settings-page__content-item">
          <span>{t('showFiatConversionInTestnets')}</span>
          <div className="settings-page__content-description">
            {t('showFiatConversionInTestnetsDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={showFiatInTestnets}
              onToggle={(value) =>
                setShowFiatConversionOnTestnetsPreference(!value)
              }
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    )
  }

  renderUseNonceOptIn() {
    const { t } = this.context
    const { useNonceField, setUseNonceField } = this.props

    return (
      <div
        className="settings-page__content-row"
        data-testid="advanced-setting-custom-nonce"
      >
        <div className="settings-page__content-item">
          <span>{this.context.t('nonceField')}</span>
          <div className="settings-page__content-description">
            {t('nonceFieldDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={useNonceField}
              onToggle={(value) => setUseNonceField(!value)}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    )
  }

  handleLockChange(time) {
    const { t } = this.context
    const autoLockTimeLimit = Math.max(Number(time), 0)

    this.setState(() => {
      let lockTimeError = ''

      if (autoLockTimeLimit > 10080) {
        lockTimeError = t('lockTimeTooGreat')
      }

      return {
        autoLockTimeLimit,
        lockTimeError,
      }
    })
  }

  renderAutoLockTimeLimit() {
    const { t } = this.context
    const { lockTimeError } = this.state
    const { autoLockTimeLimit, setAutoLockTimeLimit } = this.props

    return (
      <div
        className="settings-page__content-row"
        data-testid="advanced-setting-auto-lock"
      >
        <div className="settings-page__content-item">
          <span>{t('autoLockTimeLimit')}</span>
          <div className="settings-page__content-description">
            {t('autoLockTimeLimitDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <TextField
              type="number"
              id="autoTimeout"
              placeholder="5"
              value={this.state.autoLockTimeLimit}
              defaultValue={autoLockTimeLimit}
              onChange={(e) => this.handleLockChange(e.target.value)}
              error={lockTimeError}
              fullWidth
              margin="dense"
              min={0}
            />
            <Button
              type="primary"
              className="settings-tab__rpc-save-button"
              disabled={lockTimeError !== ''}
              onClick={() => {
                setAutoLockTimeLimit(this.state.autoLockTimeLimit)
              }}
            >
              {t('save')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  renderThreeBoxControl() {
    const { t } = this.context
    const {
      threeBoxSyncingAllowed,
      setThreeBoxSyncingPermission,
      threeBoxDisabled,
    } = this.props

    let allowed = threeBoxSyncingAllowed
    let description = t('syncWithThreeBoxDescription')

    if (threeBoxDisabled) {
      allowed = false
      description = t('syncWithThreeBoxDisabled')
    }
    return (
      <div
        className="settings-page__content-row"
        data-testid="advanced-setting-3box"
      >
        <div className="settings-page__content-item">
          <span>{t('syncWithThreeBox')}</span>
          <div className="settings-page__content-description">
            {description}
          </div>
        </div>
        <div
          className={classnames('settings-page__content-item', {
            'settings-page__content-item--disabled': threeBoxDisabled,
          })}
        >
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={allowed}
              onToggle={(value) => {
                if (!threeBoxDisabled) {
                  setThreeBoxSyncingPermission(!value)
                }
              }}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    )
  }

  handleIpfsGatewayChange(url) {
    const { t } = this.context

    this.setState(() => {
      let ipfsGatewayError = ''

      try {
        const urlObj = new URL(addUrlProtocolPrefix(url))
        if (!urlObj.host) {
          throw new Error()
        }

        // don't allow the use of this gateway
        if (urlObj.host === 'gateway.ipfs.io') {
          throw new Error('Forbidden gateway')
        }
      } catch (error) {
        ipfsGatewayError =
          error.message === 'Forbidden gateway'
            ? t('forbiddenIpfsGateway')
            : t('invalidIpfsGateway')
      }

      return {
        ipfsGateway: url,
        ipfsGatewayError,
      }
    })
  }

  handleIpfsGatewaySave() {
    const url = new URL(addUrlProtocolPrefix(this.state.ipfsGateway))
    const { host } = url

    this.props.setIpfsGateway(host)
  }

  renderIpfsGatewayControl() {
    const { t } = this.context
    const { ipfsGatewayError } = this.state

    return (
      <div
        className="settings-page__content-row"
        data-testid="advanced-setting-ipfs-gateway"
      >
        <div className="settings-page__content-item">
          <span>{t('ipfsGateway')}</span>
          <div className="settings-page__content-description">
            {t('ipfsGatewayDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <TextField
              type="text"
              value={this.state.ipfsGateway}
              onChange={(e) => this.handleIpfsGatewayChange(e.target.value)}
              error={ipfsGatewayError}
              fullWidth
              margin="dense"
            />
            <Button
              type="primary"
              className="settings-tab__rpc-save-button"
              disabled={Boolean(ipfsGatewayError)}
              onClick={() => {
                this.handleIpfsGatewaySave()
              }}
            >
              {t('save')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  render() {
    const { warning } = this.props

    return (
      <div className="settings-page__body">
        {warning && <div className="settings-tab__error">{warning}</div>}
        {this.renderStateLogs()}
        {this.renderMobileSync()}
        {this.renderResetAccount()}
        {this.renderAdvancedGasInputInline()}
        {this.renderTransactionTimeEstimates()}
        {this.renderAllowSpeedUpAnyTransaction()}
        {this.renderHexDataOptIn()}
        {this.renderShowConversionInTestnets()}
        {this.renderUseNonceOptIn()}
        {this.renderAutoLockTimeLimit()}
        {this.renderThreeBoxControl()}
        {this.renderIpfsGatewayControl()}
      </div>
    )
  }
}

function addUrlProtocolPrefix(urlString) {
  if (!urlString.match(/(^http:\/\/)|(^https:\/\/)/u)) {
    return `https://${urlString}`
  }
  return urlString
}
