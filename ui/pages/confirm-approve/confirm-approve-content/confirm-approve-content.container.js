import { connect } from 'react-redux';
import {
  getCurrentChainId,
  getCurrentChecksumUsesChainId,
} from '../../../selectors';
import ConfirmApproveContent from './confirm-approve-content.component';

const mapStateToProps = (state) => {
  return {
    chainId: getCurrentChainId(state),
    checksumUsesChainId: getCurrentChecksumUsesChainId(state),
  };
};

export default connect(mapStateToProps)(ConfirmApproveContent);
