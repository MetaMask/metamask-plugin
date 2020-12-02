import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import {
  displayWarning,
  setFeatureFlag,
  showModal,
  setShowFiatConversionOnTestnetsPreference,
  setAutoLockTimeLimit,
  setThreeBoxSyncingPermission,
  turnThreeBoxSyncingOnAndInitialize,
  setUseNonceField,
  setIpfsGateway,
} from '../../../store/actions'
import { getPreferences } from '../../../selectors'
import AdvancedTab from './advanced-tab.component'

export const mapStateToProps = (state) => {
  const {
    appState: { warning },
    metamask,
  } = state
  const {
    featureFlags: {
      sendHexData,
      transactionTime,
      speedUpAnyTransaction,
      advancedInlineGas,
    } = {},
    threeBoxSyncingAllowed,
    threeBoxDisabled,
    useNonceField,
    ipfsGateway,
  } = metamask
  const { showFiatInTestnets, autoLockTimeLimit } = getPreferences(state)

  return {
    warning,
    sendHexData,
    advancedInlineGas,
    transactionTime,
    speedUpAnyTransaction,
    showFiatInTestnets,
    autoLockTimeLimit,
    threeBoxSyncingAllowed,
    threeBoxDisabled,
    useNonceField,
    ipfsGateway,
  }
}

export const mapDispatchToProps = (dispatch) => {
  return {
    setHexDataFeatureFlag: (shouldShow) =>
      dispatch(setFeatureFlag('sendHexData', shouldShow)),
    displayWarning: (warning) => dispatch(displayWarning(warning)),
    showResetAccountConfirmationModal: () =>
      dispatch(showModal({ name: 'CONFIRM_RESET_ACCOUNT' })),
    setAdvancedInlineGasFeatureFlag: (shouldShow) =>
      dispatch(setFeatureFlag('advancedInlineGas', shouldShow)),
    setTransactionTimeFeatureFlag: (shouldShow) =>
      dispatch(setFeatureFlag('transactionTime', shouldShow)),
    setSpeedUpAnyTransaction: (shouldShow) => {
      dispatch(setFeatureFlag('speedUpAnyTransaction', shouldShow))
    },
    setUseNonceField: (value) => dispatch(setUseNonceField(value)),
    setShowFiatConversionOnTestnetsPreference: (value) => {
      return dispatch(setShowFiatConversionOnTestnetsPreference(value))
    },
    setAutoLockTimeLimit: (value) => {
      return dispatch(setAutoLockTimeLimit(value))
    },
    setThreeBoxSyncingPermission: (newThreeBoxSyncingState) => {
      if (newThreeBoxSyncingState) {
        dispatch(turnThreeBoxSyncingOnAndInitialize())
      } else {
        dispatch(setThreeBoxSyncingPermission(newThreeBoxSyncingState))
      }
    },
    setIpfsGateway: (value) => {
      return dispatch(setIpfsGateway(value))
    },
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(AdvancedTab)
