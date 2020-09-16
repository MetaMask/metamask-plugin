import { inherits } from 'util'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

// Subviews
const BidirectionalQrImportView = require('./bidirectional-qr.js')

BidirectionalQrForm.contextTypes = {
  t: PropTypes.func,
}

export default connect()(BidirectionalQrForm)

inherits(BidirectionalQrForm, Component)
function BidirectionalQrForm () {
  Component.call(this)
}

BidirectionalQrForm.prototype.render = function render () {

  return (
    <div className="new-account-import-form">

      <div className="new-account-import-disclaimer">
        <span> {this.context.t('bidirectionalQrMsg')} </span>
      </div>

      <div className="new-account-import-form__select-section">
        <BidirectionalQrImportView />
      </div>

    </div>
  )
}
