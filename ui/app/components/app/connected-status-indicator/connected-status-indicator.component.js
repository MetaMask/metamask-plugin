import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { ENVIRONMENT_TYPE_POPUP } from '../../../../../app/scripts/lib/enums'
import { getEnvironmentType } from '../../../../../app/scripts/lib/util'
import {
  STATUS_CONNECTED,
  STATUS_CONNECTED_TO_ANOTHER_ACCOUNT,
  STATUS_NOT_CONNECTED,
} from '../../../helpers/constants/connected-sites'

export default class ConnectedStatusIndicator extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    status: PropTypes.oneOf([ STATUS_CONNECTED, STATUS_CONNECTED_TO_ANOTHER_ACCOUNT, STATUS_NOT_CONNECTED ]),
  }

  static defaultProps = {
    status: STATUS_NOT_CONNECTED,
  }

  renderStatusCircle = () => {
    const { status } = this.props

    return (
      <div className={classnames({
        'connected-status-indicator__green-circle': status === STATUS_CONNECTED,
        'connected-status-indicator__yellow-circle': status === STATUS_CONNECTED_TO_ANOTHER_ACCOUNT,
        'connected-status-indicator__grey-circle': status === STATUS_NOT_CONNECTED,
      })}
      />
    )
  }

  renderStatusText = () => {
    const { t } = this.context
    const { status } = this.props

    let text = ''

    if (status === STATUS_CONNECTED) {
      text = t('statusConnected')
    } else if (status === STATUS_CONNECTED_TO_ANOTHER_ACCOUNT || status === STATUS_NOT_CONNECTED) {
      text = t('statusNotConnected')
    }

    return (
      <div className="connected-status-indicator__text">{ text }</div>
    )
  }

  render () {
    return (
      <div className={classnames('connected-status-indicator', {
        invisible: getEnvironmentType() !== ENVIRONMENT_TYPE_POPUP,
      })}
      >
        { this.renderStatusCircle() }
        { this.renderStatusText() }
      </div>
    )
  }
}
