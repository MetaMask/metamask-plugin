import { inherits } from 'util'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { getSelectedIdentity } from '../../../../selectors/selectors'

function mapStateToProps (state, ownProps) {
  return {
    selectedIdentity: ownProps.selectedIdentity || getSelectedIdentity(state),
  }
}

inherits(BidirectionalQrSignModalContainer, Component)
function BidirectionalQrSignModalContainer () {
  Component.call(this)
}

BidirectionalQrSignModalContainer.contextTypes = {
  t: PropTypes.func,
}

export default connect(mapStateToProps)(BidirectionalQrSignModalContainer)

BidirectionalQrSignModalContainer.prototype.render = function render () {
  let { children } = this.props

  if (children.constructor !== Array) {
    children = [children]
  }

  return (
    <div style={{ borderRadius: '4px' }}>
      <div className="account-modal-container">

        <div
          className="account-modal-close"
          onClick={this.props.hideModal}
        />

        {children}

      </div>
    </div>
  )
}
