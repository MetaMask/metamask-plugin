import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { addToAddressBook, hideModal } from '../../../../store/actions';
import { getQrCodeData } from '../../../../ducks/app/app';
import AddNewContactModal from './add-new-contact-modal.component';

const mapStateToProps = (state) => {
  return {
    qrCodeData: getQrCodeData(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    hideModal: () => dispatch(hideModal()),
    addToAddressBook: (recipient, nickname, memo) =>
      dispatch(addToAddressBook(recipient, nickname, memo)),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(AddNewContactModal);
