import React, { Component } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import ContactList from '../../../components/app/contact-list';
import { showModal } from '../../../store/actions';
import { CONTACT_VIEW_ROUTE } from '../../../helpers/constants/routes';
import EditContact from './edit-contact';
import AddContact from './add-contact';
import ViewContact from './view-contact';

AddContactButton.propTypes = {
  label: PropTypes.string,
};

RenderAddContactLink.propTypes = {
  label: PropTypes.string,
};

function RenderAddContactLink(props) {
  const { label } = props;
  const dispatch = useDispatch();

  return (
    <div>
      <button
        className="address-book__link"
        onClick={(e) => {
          e.preventDefault();
          dispatch(showModal({ name: 'ADD_NEW_CONTACT' }));
        }}
      >
        + {label}
      </button>
    </div>
  );
}

function AddContactButton(props) {
  const { label } = props;
  const dispatch = useDispatch();

  return (
    <button
      className="address-book-add-button__button button btn-secondary btn--rounded"
      onClick={(e) => {
        e.preventDefault();
        dispatch(showModal({ name: 'ADD_NEW_CONTACT' }));
      }}
    >
      {label}
    </button>
  );
}

export default class ContactListTab extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    addressBook: PropTypes.array,
    history: PropTypes.object,
    selectedAddress: PropTypes.string,
    viewingContact: PropTypes.bool,
    editingContact: PropTypes.bool,
    addingContact: PropTypes.bool,
    showContactContent: PropTypes.bool,
    hideAddressBook: PropTypes.bool,
  };

  renderAddresses() {
    const { addressBook, history, selectedAddress } = this.props;
    const contacts = addressBook.filter(({ name }) => Boolean(name));
    const nonContacts = addressBook.filter(({ name }) => !name);
    const { t } = this.context;

    if (addressBook.length) {
      return (
        <div>
          <ContactList
            searchForContacts={() => contacts}
            searchForRecents={() => nonContacts}
            selectRecipient={(address) => {
              history.push(`${CONTACT_VIEW_ROUTE}/${address}`);
            }}
            selectedAddress={selectedAddress}
          />
        </div>
      );
    }
    return (
      <div className="address-book__container">
        <div>
          <img src="./images/address-book.svg" alt={t('addressBookIcon')} />
          <h4 className="address-book__title">{t('buildContactList')}</h4>
          <p className="address-book__sub-title">
            {t('addFriendsAndAddresses')}
          </p>
          <RenderAddContactLink label={t('addContact')} />
        </div>
      </div>
    );
  }

  renderContactContent() {
    const {
      viewingContact,
      editingContact,
      addingContact,
      showContactContent,
    } = this.props;

    if (!showContactContent) {
      return null;
    }

    let ContactContentComponent = null;
    if (viewingContact) {
      ContactContentComponent = ViewContact;
    } else if (editingContact) {
      ContactContentComponent = EditContact;
    } else if (addingContact) {
      ContactContentComponent = AddContact;
    }

    return (
      ContactContentComponent && (
        <div className="address-book-contact-content">
          <ContactContentComponent />
        </div>
      )
    );
  }

  renderAddressBookContent() {
    const { hideAddressBook } = this.props;

    if (!hideAddressBook) {
      return <div className="address-book">{this.renderAddresses()}</div>;
    }
    return null;
  }

  render() {
    return (
      <div className="address-book-wrapper">
        {this.renderAddressBookContent()}
        {this.renderContactContent()}
        <div className="address-book-add-button">
          <AddContactButton label={this.context.t('addContact')} />
        </div>
      </div>
    );
  }
}
