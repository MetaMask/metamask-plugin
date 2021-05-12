import { connect } from 'react-redux';
import {
  getCurrentChainId,
  getCurrentChecksumUsesChainId,
} from '../../../selectors';
import Jazzicon from './jazzicon.component';

const mapStateToProps = (state) => {
  return {
    chainId: getCurrentChainId(state),
    checksumUsesChainId: getCurrentChecksumUsesChainId(state),
  };
};

export default connect(mapStateToProps)(Jazzicon);
