import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SendRowErrorMessage from './send-row-error-message'

export default class SendRowWrapper extends Component {

  static propTypes = {
    children: PropTypes.node,
    errors: PropTypes.object,
    errorType: PropTypes.string,
    label: PropTypes.string,
    showError: PropTypes.bool,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  renderAmountFormRow () {
    const {
      children,
      errorType = '',
      label,
      showError = false,
      errors,
    } = this.props
    const formField = Array.isArray(children) ? children[1] || children[0] : children
    const customLabelContent = children.length > 1 ? children[0] : null

    return (
      <div className="send-v2__form-row">
        <div className="send-v2__form-label">
          {label}
          {customLabelContent}
        </div>
        <div className="send-v2__form-field-container">
          <div className="send-v2__form-field">
            {formField}
          </div>
          <div>
            {showError && <SendRowErrorMessage errorType={errorType} customErrors={errors} />}
          </div>
        </div>
      </div>
    )
  }

  renderFormRow () {
    const {
      children,
      errorType = '',
      label,
      showError = false,
      errors,
    } = this.props

    const formField = Array.isArray(children) ? children[1] || children[0] : children
    const customLabelContent = (Array.isArray(children) && children.length) > 1 ? children[0] : null

    return (
      <div className="send-v2__form-row">
        <div className="send-v2__form-label">
          {label}
          {showError && <SendRowErrorMessage errorType={errorType} customErrors={errors} />}
          {customLabelContent}
        </div>
        <div className="send-v2__form-field">
          {formField}
        </div>
      </div>
    )
  }

  render () {
    const {
      errorType = '',
    } = this.props

    return (
      errorType === 'amount' ? this.renderAmountFormRow() : this.renderFormRow()
    )
  }

}
