import { inherits } from 'util'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import * as actions from '../../../store/actions'
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes'
import Button from '../../../components/ui/button'

BidirectionalQrImportView.contextTypes = {
  t: PropTypes.func,
}

module.exports = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(BidirectionalQrImportView)

function mapStateToProps (state) {
  return {
    error: state.appState.warning,
    firstAddress: Object.keys(state.metamask.accounts)[0],
  }
}

function mapDispatchToProps (dispatch) {
  return {
    addBidirectionalQrAccount: (addresses) => {
      return dispatch(actions.addBidirectionalQrAccount(addresses))
    },
    displayWarning: (message) => dispatch(actions.displayWarning(message || null)),
    setSelectedAddress: (address) => dispatch(actions.setSelectedAddress(address)),
  }
}

inherits(BidirectionalQrImportView, Component)
function BidirectionalQrImportView () {
  this.createKeyringOnEnter = this.createKeyringOnEnter.bind(this)
  Component.call(this)
}

BidirectionalQrImportView.prototype.render = function render () {
  const { error, displayWarning } = this.props

  return (
    <div className="new-account-import-form__private-key">

      <span className="new-account-create-form__instruction"> {this.context.t('pasteBidirectionalQr')}</span>

      <div className="new-account-import-form__private-key-password-container">

        <input
          className="new-account-import-form__input-password"
          type="text"
          id="bidirectional-qr-account-box"
          onKeyPress={(e) => this.createKeyringOnEnter(e)}
        />

      </div>

      <div className="new-account-import-form__buttons">

        <Button
          type="default"
          large
          className="new-account-create-form__button"
          onClick={() => {
            displayWarning(null)
            this.props.history.push(DEFAULT_ROUTE)
          }}
        >
          {this.context.t('cancel')}
        </Button>

        <Button
          type="primary"
          large
          className="new-account-create-form__button"
          onClick={() => this.createNewKeychain()}
        >
          {this.context.t('create')}
        </Button>

      </div>

      {error && (<span className="error"> {error} </span>)}

    </div>
  )
}

BidirectionalQrImportView.prototype.createKeyringOnEnter = function (event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    this.createNewKeychain()
  }
}

BidirectionalQrImportView.prototype.createNewKeychain = function () {
  const input = document.getElementById('bidirectional-qr-account-box')
  const addresses = input.value
  const { addBidirectionalQrAccount, history, displayWarning, setSelectedAddress, firstAddress } = this.props

  addBidirectionalQrAccount(addresses)
    .then(({ selectedAddress }) => {
      if (selectedAddress) {
        history.push(DEFAULT_ROUTE)
        displayWarning(null)
      } else {
        displayWarning('Error adding bidirectional QR account.')
        setSelectedAddress(firstAddress)
      }
    })
    .catch((err) => err && displayWarning(err.message || err))
}
