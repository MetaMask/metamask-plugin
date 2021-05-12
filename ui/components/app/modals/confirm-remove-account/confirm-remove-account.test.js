import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import sinon from 'sinon';
import configureStore from 'redux-mock-store';
import { mount } from 'enzyme';
import ConfirmRemoveAccount from './confirm-remove-account.container';

describe('Confirm Remove Account', () => {
  let wrapper;

  const state = {
    metamask: {
      provider: {
        chainId: '0x539',
      },
    },
  };

  const props = {
    hideModal: sinon.spy(),
    removeAccount: sinon.stub().resolves(),
    network: '101',
    identity: {
      address: '0x0',
      name: 'Account 1',
    },
  };

  const mockStore = configureStore();
  const store = mockStore(state);

  beforeEach(() => {
    wrapper = mount(
      <Provider store={store}>
        <ConfirmRemoveAccount.WrappedComponent {...props} />
      </Provider>,
      {
        context: {
          t: (str) => str,
          store,
        },
        childContextTypes: {
          t: PropTypes.func,
          store: PropTypes.object,
        },
      },
    );
  });

  afterEach(() => {
    props.hideModal.resetHistory();
  });

  it('nevermind', () => {
    const nevermind = wrapper.find({ type: 'default' });
    nevermind.simulate('click');

    expect(props.hideModal.calledOnce).toStrictEqual(true);
  });

  it('remove', async () => {
    const remove = wrapper.find({ type: 'secondary' });
    remove.simulate('click');

    expect(await props.removeAccount.calledOnce).toStrictEqual(true);
    expect(props.removeAccount.getCall(0).args[0]).toStrictEqual(
      props.identity.address,
    );

    expect(props.hideModal.calledOnce).toStrictEqual(true);
  });

  it('closes', () => {
    const close = wrapper.find('.modal-container__header-close');
    close.simulate('click');

    expect(props.hideModal.calledOnce).toStrictEqual(true);
  });
});
