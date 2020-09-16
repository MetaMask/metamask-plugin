import PropTypes from 'prop-types'
import React, { Component } from 'react'

import { connect } from 'react-redux'
import * as actions from '../../../store/actions'
import { resetCustomData as resetCustomGasData } from '../../../ducks/gas/gas.duck'
import isMobileView from '../../../../lib/is-mobile-view'
import { getEnvironmentType } from '../../../../../app/scripts/lib/util'
import { ENVIRONMENT_TYPE_POPUP } from '../../../../../app/scripts/lib/enums'

// Modal Components
import ConfirmCustomizeGasModal from '../gas-customization/gas-modal-page-container'
import DepositEtherModal from './deposit-ether-modal'
import AccountDetailsModal from './account-details-modal'
import ExportPrivateKeyModal from './export-private-key-modal'
import HideTokenConfirmationModal from './hide-token-confirmation-modal'
import NotifcationModal from './notification-modal'
import QRScanner from './qr-scanner'

import ConfirmRemoveAccount from './confirm-remove-account'
import ConfirmResetAccount from './confirm-reset-account'
import TransactionConfirmed from './transaction-confirmed'
import CancelTransaction from './cancel-transaction'

import FadeModal from './fade-modal'
import MetaMetricsOptInModal from './metametrics-opt-in-modal'
import RejectTransactions from './reject-transactions'
import ConfirmDeleteNetwork from './confirm-delete-network'
import AddToAddressBookModal from './add-to-addressbook-modal'
import EditApprovalPermission from './edit-approval-permission'
import NewAccountModal from './new-account-modal'
import BidirectionalQrSignModal from './bidirectional-qr-sign-modal'

const modalContainerBaseStyle = {
  transform: 'translate3d(-50%, 0, 0px)',
  border: '1px solid #CCCFD1',
  borderRadius: '8px',
  backgroundColor: '#FFFFFF',
  boxShadow: '0 2px 22px 0 rgba(0,0,0,0.2)',
}

const modalContainerLaptopStyle = {
  ...modalContainerBaseStyle,
  width: '344px',
  top: '15%',
}

const modalContainerMobileStyle = {
  ...modalContainerBaseStyle,
  width: '309px',
  top: '12.5%',
}

const accountModalStyle = {
  mobileModalStyle: {
    width: '95%',
    // top: isPopupOrNotification() === 'popup' ? '52vh' : '36.5vh',
    boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 2px 2px',
    borderRadius: '4px',
    top: '10%',
    transform: 'none',
    left: '0',
    right: '0',
    margin: '0 auto',
  },
  laptopModalStyle: {
    width: '360px',
    // top: 'calc(33% + 45px)',
    boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 2px 2px',
    borderRadius: '4px',
    top: '10%',
    transform: 'none',
    left: '0',
    right: '0',
    margin: '0 auto',
  },
  contentStyle: {
    borderRadius: '4px',
  },
}

const MODALS = {
  DEPOSIT_ETHER: {
    contents: <DepositEtherModal />,
    onHide: (props) => props.hideWarning(),
    mobileModalStyle: {
      width: '100%',
      height: '100%',
      transform: 'none',
      left: '0',
      right: '0',
      margin: '0 auto',
      boxShadow: '0 0 7px 0 rgba(0,0,0,0.08)',
      top: '0',
      display: 'flex',
    },
    laptopModalStyle: {
      width: 'initial',
      maxWidth: '850px',
      top: 'calc(10% + 10px)',
      left: '0',
      right: '0',
      margin: '0 auto',
      boxShadow: '0 0 6px 0 rgba(0,0,0,0.3)',
      borderRadius: '7px',
      transform: 'none',
      height: 'calc(80% - 20px)',
      overflowY: 'hidden',
    },
    contentStyle: {
      borderRadius: '7px',
      height: '100%',
    },
  },

  ADD_TO_ADDRESSBOOK: {
    contents: <AddToAddressBookModal />,
    mobileModalStyle: {
      width: '95%',
      top: '10%',
      boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 2px 2px',
      transform: 'none',
      left: '0',
      right: '0',
      margin: '0 auto',
      borderRadius: '10px',
    },
    laptopModalStyle: {
      width: '375px',
      top: '10%',
      boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 2px 2px',
      transform: 'none',
      left: '0',
      right: '0',
      margin: '0 auto',
      borderRadius: '10px',
    },
    contentStyle: {
      borderRadius: '10px',
    },
  },

  NEW_ACCOUNT: {
    contents: <NewAccountModal />,
    mobileModalStyle: {
      width: '95%',
      top: '10%',
      boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 2px 2px',
      transform: 'none',
      left: '0',
      right: '0',
      margin: '0 auto',
      borderRadius: '10px',
    },
    laptopModalStyle: {
      width: '375px',
      top: '10%',
      boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 2px 2px',
      transform: 'none',
      left: '0',
      right: '0',
      margin: '0 auto',
      borderRadius: '10px',
    },
    contentStyle: {
      borderRadius: '10px',
    },
  },

  ACCOUNT_DETAILS: {
    contents: <AccountDetailsModal />,
    ...accountModalStyle,
  },

  BIDIRECTIONAL_QR_SIGN: {
    contents: <BidirectionalQrSignModal />,
    mobileModalStyle: {
      width: '100vw',
      height: '100vh',
      top: '0',
      transform: 'none',
      left: '0',
      right: '0',
      margin: '0 auto',
    },
    laptopModalStyle: {
      width: '600px',
      height: '640px',
      top: '20px',
      transform: 'none',
      left: '0',
      right: '0',
      margin: '0 auto',
    },
  },

  EXPORT_PRIVATE_KEY: {
    contents: <ExportPrivateKeyModal />,
    ...accountModalStyle,
  },

  HIDE_TOKEN_CONFIRMATION: {
    contents: <HideTokenConfirmationModal />,
    mobileModalStyle: {
      width: '95%',
      top: getEnvironmentType() === ENVIRONMENT_TYPE_POPUP ? '52vh' : '36.5vh',
    },
    laptopModalStyle: {
      width: '449px',
      top: 'calc(33% + 45px)',
    },
  },

  METAMETRICS_OPT_IN_MODAL: {
    contents: <MetaMetricsOptInModal />,
    mobileModalStyle: {
      ...modalContainerMobileStyle,
      width: '100%',
      height: '100%',
      top: '0px',
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
      top: '10%',
    },
    contentStyle: {
      borderRadius: '8px',
    },
  },

  GAS_PRICE_INFO_MODAL: {
    contents: <NotifcationModal header="gasPriceNoDenom" message="gasPriceInfoModalContent" />,
    mobileModalStyle: {
      width: '95%',
      top: getEnvironmentType() === ENVIRONMENT_TYPE_POPUP ? '52vh' : '36.5vh',
    },
    laptopModalStyle: {
      width: '449px',
      top: 'calc(33% + 45px)',
    },
  },

  GAS_LIMIT_INFO_MODAL: {
    contents: <NotifcationModal header="gasLimit" message="gasLimitInfoModalContent" />,
    mobileModalStyle: {
      width: '95%',
      top: getEnvironmentType() === ENVIRONMENT_TYPE_POPUP ? '52vh' : '36.5vh',
    },
    laptopModalStyle: {
      width: '449px',
      top: 'calc(33% + 45px)',
    },
  },

  CONFIRM_RESET_ACCOUNT: {
    contents: <ConfirmResetAccount />,
    mobileModalStyle: {
      ...modalContainerMobileStyle,
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
    },
    contentStyle: {
      borderRadius: '8px',
    },
  },

  CONFIRM_REMOVE_ACCOUNT: {
    contents: <ConfirmRemoveAccount />,
    mobileModalStyle: {
      ...modalContainerMobileStyle,
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
    },
    contentStyle: {
      borderRadius: '8px',
    },
  },

  CONFIRM_DELETE_NETWORK: {
    contents: <ConfirmDeleteNetwork />,
    mobileModalStyle: {
      ...modalContainerMobileStyle,
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
    },
    contentStyle: {
      borderRadius: '8px',
    },
  },

  CUSTOMIZE_GAS: {
    contents: <ConfirmCustomizeGasModal />,
    mobileModalStyle: {
      width: '100vw',
      height: '100vh',
      top: '0',
      transform: 'none',
      left: '0',
      right: '0',
      margin: '0 auto',
    },
    laptopModalStyle: {
      width: 'auto',
      height: '0px',
      top: '80px',
      left: '0px',
      transform: 'none',
      margin: '0 auto',
      position: 'relative',
    },
    contentStyle: {
      borderRadius: '8px',
    },
    customOnHideOpts: {
      action: resetCustomGasData,
      args: [],
    },
  },

  EDIT_APPROVAL_PERMISSION: {
    contents: <EditApprovalPermission />,
    mobileModalStyle: {
      width: '95vw',
      height: '100vh',
      top: '50px',
      transform: 'none',
      left: '0',
      right: '0',
      margin: '0 auto',
    },
    laptopModalStyle: {
      width: 'auto',
      height: '0px',
      top: '80px',
      left: '0px',
      transform: 'none',
      margin: '0 auto',
      position: 'relative',
    },
    contentStyle: {
      borderRadius: '8px',
    },
  },

  TRANSACTION_CONFIRMED: {
    disableBackdropClick: true,
    contents: <TransactionConfirmed />,
    mobileModalStyle: {
      ...modalContainerMobileStyle,
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
    },
    contentStyle: {
      borderRadius: '8px',
    },
  },

  QR_SCANNER: {
    contents: <QRScanner />,
    mobileModalStyle: {
      ...modalContainerMobileStyle,
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
    },
    contentStyle: {
      borderRadius: '8px',
    },
  },

  CANCEL_TRANSACTION: {
    contents: <CancelTransaction />,
    mobileModalStyle: {
      ...modalContainerMobileStyle,
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
    },
    contentStyle: {
      borderRadius: '8px',
    },
  },

  REJECT_TRANSACTIONS: {
    contents: <RejectTransactions />,
    mobileModalStyle: {
      ...modalContainerMobileStyle,
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
    },
    contentStyle: {
      borderRadius: '8px',
    },
  },

  DEFAULT: {
    contents: [],
    mobileModalStyle: {},
    laptopModalStyle: {},
  },
}

const BACKDROPSTYLE = {
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
}

function mapStateToProps (state) {
  return {
    active: state.appState.modal.open,
    modalState: state.appState.modal.modalState,
    bidirectionalQrSignables: state.metamask.bidirectionalQrSignables,
    txData: state.confirmTransaction ? state.confirmTransaction.txData : null,
    isLoading: state.appState.isLoading,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    hideModal: (customOnHideOpts) => {
      dispatch(actions.hideModal())
      if (customOnHideOpts && customOnHideOpts.action) {
        dispatch(customOnHideOpts.action(...customOnHideOpts.args))
      }
    },
    hideWarning: () => {
      dispatch(actions.hideWarning())
    },
    showModal: (payload) => {
      dispatch(actions.showModal(payload))
    },
  }
}

class Modal extends Component {
  static propTypes = {
    active: PropTypes.bool.isRequired,
    hideModal: PropTypes.func.isRequired,
    hideWarning: PropTypes.func.isRequired,
    modalState: PropTypes.object.isRequired,
    bidirectionalQrSignables: PropTypes.array,
    showModal: PropTypes.func,
  }

  hide () {
    this.modalRef.hide()
  }

  show () {
    this.modalRef.show()
  }

  UNSAFE_componentWillReceiveProps (nextProps, _) {
    if (nextProps.bidirectionalQrSignables &&
      nextProps.bidirectionalQrSignables.length > 0) {

      const nextBidirectionalQrSignable = nextProps
        .bidirectionalQrSignables[nextProps.bidirectionalQrSignables.length - 1]
      if (
        (
          !this.props.bidirectionalQrSignables ||
          nextProps.bidirectionalQrSignables.length >
          this.props.bidirectionalQrSignables.length
        ) &&
        !(
          this.props.modalState.name === 'BIDIRECTIONAL_QR_SIGN' &&
          this.props.modalState.open
        )
      ) {
        this.props.showModal({
          name: 'BIDIRECTIONAL_QR_SIGN',
          signable: nextBidirectionalQrSignable || {},
          updateMetamask: true,
        })
      }
    }
    if (nextProps.active) {
      this.show()
    } else if (this.props.active) {
      this.hide()
    }
  }

  render () {
    const modal = MODALS[this.props.modalState.name || 'DEFAULT']
    const { contents: children, disableBackdropClick = false } = modal
    const modalStyle = modal[isMobileView() ? 'mobileModalStyle' : 'laptopModalStyle']
    const contentStyle = modal.contentStyle || {}

    return (
      <FadeModal
        keyboard={false}
        onHide={() => {
          if (modal.onHide) {
            modal.onHide({
              hideWarning: this.props.hideWarning,
            })
          }
          this.props.hideModal(modal.customOnHideOpts)
        }}
        ref={(ref) => {
          this.modalRef = ref
        }}
        modalStyle={modalStyle}
        contentStyle={contentStyle}
        backdropStyle={BACKDROPSTYLE}
        closeOnClick={!disableBackdropClick}
      >
        {children}
      </FadeModal>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Modal)
