import assert from 'assert';
import React from 'react';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { MemoryRouter } from 'react-router-dom';

import Identicon from '../../ui/identicon';
import TokenCell from '.';

describe('Token Cell', function () {
  let wrapper;

  const state = {
    metamask: {
      currentCurrency: 'usd',
      currentLocale: 'en',
      selectedAddress: '0xAddress',
      contractExchangeRates: {
        '0xAnotherToken': 0.015,
      },
      conversionRate: 7.0,
      preferences: {},
      provider: {
        chainId: '0x1',
        ticker: 'ETH',
        type: 'mainnet',
      },
    },
    appState: {
      sidebar: {
        isOpen: true,
      },
    },
  };

  const middlewares = [thunk];
  const mockStore = configureMockStore(middlewares);
  const store = mockStore(state);

  let onClick;

  beforeEach(function () {
    onClick = sinon.stub();
    wrapper = mount(
      <Provider store={store}>
        <MemoryRouter>
          <TokenCell
            address="0xAnotherToken"
            symbol="TEST"
            string="5.000"
            currentCurrency="usd"
            image="./test-image"
            onClick={onClick}
          />
        </MemoryRouter>
      </Provider>,
    );
  });

  afterEach(function () {
    sinon.restore();
  });

  it('renders Identicon with props from token cell', function () {
    assert.strictEqual(
      wrapper.find(Identicon).prop('address'),
      '0xAnotherToken',
    );
    assert.strictEqual(wrapper.find(Identicon).prop('image'), './test-image');
  });

  it('renders token balance', function () {
    assert.strictEqual(
      wrapper.find('.asset-list-item__token-value').text(),
      '5.000',
    );
  });

  it('renders token symbol', function () {
    assert.strictEqual(
      wrapper.find('.asset-list-item__token-symbol').text(),
      'TEST',
    );
  });

  it('renders converted fiat amount', function () {
    assert.strictEqual(
      wrapper.find('.list-item__subheading').text(),
      '$0.52 USD',
    );
  });

  it('calls onClick when clicked', function () {
    assert.ok(!onClick.called);
    wrapper.simulate('click');
    assert.ok(onClick.called);
  });
});
