import { inherits } from 'util'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { connect } from 'react-redux'

TxInput.contextTypes = {
  t: PropTypes.func,
}

export default connect()(TxInput)

inherits(TxInput, Component)
function TxInput () {
  Component.call(this)
}

TxInput.prototype.resetInput = function resetInput () {
  this.props.onChange('')
}

TxInput.prototype.render = function render () {
  const {
    signature,
    onChange,
    inError,
    scanSignatureQrCode,
    scannerProps,
  } = this.props

  return (
    <div className={classnames('ens-input', 'send__to-row')}>
      <div
        className={classnames('ens-input__wrapper', {
          'ens-input__wrapper__status-icon--error': false,
          'ens-input__wrapper__status-icon--valid': false,
        })}
      >
        {!inError && signature ? (<div className="ens-input__wrapper__status-icon ens-input__wrapper__status-icon--valid" />) : null}
        <input
          className="ens-input__wrapper__input"
          type="text"
          dir="auto"
          placeholder={this.context.t('signature')}
          value={signature}
          onChange={(event) => onChange(event.target.value)}
          style={{
            borderColor: inError ? 'red' : null,
          }}
        />
        <div
          className={classnames('ens-input__wrapper__action-icon', {
            'ens-input__wrapper__action-icon--erase': signature,
            'ens-input__wrapper__action-icon--qrcode': !signature,
          })}
          onClick={() => {
            if (signature) {
              this.resetInput()
            } else {
              scanSignatureQrCode(scannerProps)
            }
          }}
        />
      </div>
    </div>
  )
}
