import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

export default class SendRowErrorMessage extends Component {

  static propTypes = {
    errors: PropTypes.object,
    errorType: PropTypes.string,
    customErrors: PropTypes.object,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  render () {
    const { errors, errorType, customErrors } = this.props

    const errorMessage = errors[errorType] || customErrors[errorType]

    return (
      errorMessage
        ? <div className={classnames('send-v2__error', { 'send-v2__error-amount': errorType === 'amount' })}>{this.context.t(errorMessage)}</div>
        : null
    )
  }

}
