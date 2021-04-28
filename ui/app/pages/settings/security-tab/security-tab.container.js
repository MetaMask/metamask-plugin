import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  setFeatureFlag,
  setParticipateInMetaMetrics,
  setUsePhishDetect,
} from '../../../store/actions';
import SecurityTab from './security-tab.component';

const mapStateToProps = (state) => {
  const {
    appState: { warning },
    metamask,
  } = state;
  const {
    featureFlags: { showExternalTransactions } = {},
    participateInMetaMetrics,
    usePhishDetect,
  } = metamask;

  return {
    warning,
    showExternalTransactions,
    participateInMetaMetrics,
    usePhishDetect,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setParticipateInMetaMetrics: (val) =>
      dispatch(setParticipateInMetaMetrics(val)),
    setShowExternalTransactionsFeatureFlag: (shouldShow) =>
      dispatch(setFeatureFlag('showExternalTransactions', shouldShow)),
    setUsePhishDetect: (val) => dispatch(setUsePhishDetect(val)),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(SecurityTab);
