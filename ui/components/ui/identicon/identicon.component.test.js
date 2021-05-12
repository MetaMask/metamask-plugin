import React from 'react';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { mount } from 'enzyme';
import Identicon from './identicon.component';

describe('Identicon', () => {
  const state = {
    metamask: {
      useBlockie: false,
      provider: {
        chainId: '0x539',
      },
    },
  };

  const middlewares = [thunk];
  const mockStore = configureMockStore(middlewares);
  const store = mockStore(state);

  it('renders empty identicon with no props', () => {
    const wrapper = mount(
      <Provider store={store}>
        <Identicon />
      </Provider>,
    );

    expect(wrapper.find('div').prop('className')).toStrictEqual(
      'identicon__image-border',
    );
  });

  it('renders custom image and add className props', () => {
    const wrapper = mount(
      <Provider store={store}>
        <Identicon className="test-image" image="test-image" />,
      </Provider>,
    );

    expect(wrapper.find('img.test-image').prop('className')).toStrictEqual(
      'identicon test-image',
    );
    expect(wrapper.find('img.test-image').prop('src')).toStrictEqual(
      'test-image',
    );
  });

  it('renders div with address prop', () => {
    const wrapper = mount(
      <Provider store={store}>
        <Identicon className="test-address" address="0x0" />,
      </Provider>,
    );

    expect(wrapper.find('div.test-address').prop('className')).toStrictEqual(
      'identicon test-address',
    );
  });
});
