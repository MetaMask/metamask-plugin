import { connect } from 'react-redux';
import {
  getCurrentChainId,
  getCurrentChecksumUsesChainId,
} from '../../../selectors';
import AccountListItem from './account-list-item';

const mapStateToProps = (state) => {
  return {
    chainId: getCurrentChainId(state),
    checksumUsesChainId: getCurrentChecksumUsesChainId(state),
  };
};

export default connect(mapStateToProps)(AccountListItem);
