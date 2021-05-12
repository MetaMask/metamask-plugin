import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import * as utils from '../../../helpers/utils/util';
import Identicon from '../../ui/identicon';
import AccountListItem from './account-list-item';

describe('AccountListItem Component', () => {
  let wrapper, propsMethodSpies, checksumAddressStub;

  describe('render', () => {
    beforeAll(() => {
      checksumAddressStub = sinon
        .stub(utils, 'checksumAddress')
        .returns('mockCheckSumAddress');
      propsMethodSpies = {
        handleClick: sinon.spy(),
      };
    });
    beforeEach(() => {
      wrapper = shallow(
        <AccountListItem
          account={{
            address: 'mockAddress',
            name: 'mockName',
            balance: 'mockBalance',
          }}
          chainId="0x539"
          checksumUsesChainId
          className="mockClassName"
          displayAddress={false}
          handleClick={propsMethodSpies.handleClick}
          icon={<i className="mockIcon" />}
        />,
        { context: { t: (str) => `${str}_t` } },
      );
    });

    afterEach(() => {
      propsMethodSpies.handleClick.resetHistory();
      checksumAddressStub.resetHistory();
    });

    afterAll(() => {
      sinon.restore();
    });

    it('should render a div with the passed className', () => {
      expect(wrapper.find('.mockClassName')).toHaveLength(1);
      expect(wrapper.find('.mockClassName').is('div')).toStrictEqual(true);
      expect(
        wrapper.find('.mockClassName').hasClass('account-list-item'),
      ).toStrictEqual(true);
    });

    it('should call handleClick with the expected props when the root div is clicked', () => {
      const { onClick } = wrapper.find('.mockClassName').props();
      expect(propsMethodSpies.handleClick.callCount).toStrictEqual(0);
      onClick();
      expect(propsMethodSpies.handleClick.callCount).toStrictEqual(1);
      expect(propsMethodSpies.handleClick.getCall(0).args).toStrictEqual([
        { address: 'mockAddress', name: 'mockName', balance: 'mockBalance' },
      ]);
    });

    it('should have a top row div', () => {
      expect(
        wrapper.find('.mockClassName > .account-list-item__top-row'),
      ).toHaveLength(1);
      expect(
        wrapper.find('.mockClassName > .account-list-item__top-row').is('div'),
      ).toStrictEqual(true);
    });

    it('should have an identicon, name and icon in the top row', () => {
      const topRow = wrapper.find(
        '.mockClassName > .account-list-item__top-row',
      );
      expect(topRow.find(Identicon)).toHaveLength(1);
      expect(topRow.find('.account-list-item__account-name')).toHaveLength(1);
      expect(topRow.find('.account-list-item__icon')).toHaveLength(1);
    });

    it('should show the account name if it exists', () => {
      const topRow = wrapper.find(
        '.mockClassName > .account-list-item__top-row',
      );
      expect(
        topRow.find('.account-list-item__account-name').text(),
      ).toStrictEqual('mockName');
    });

    it('should show the account address if there is no name', () => {
      wrapper.setProps({ account: { address: 'addressButNoName' } });
      const topRow = wrapper.find(
        '.mockClassName > .account-list-item__top-row',
      );
      expect(
        topRow.find('.account-list-item__account-name').text(),
      ).toStrictEqual('addressButNoName');
    });

    it('should render the passed icon', () => {
      const topRow = wrapper.find(
        '.mockClassName > .account-list-item__top-row',
      );
      expect(
        topRow.find('.account-list-item__icon').childAt(0).is('i'),
      ).toStrictEqual(true);
      expect(
        topRow.find('.account-list-item__icon').childAt(0).hasClass('mockIcon'),
      ).toStrictEqual(true);
    });

    it('should not render an icon if none is passed', () => {
      wrapper.setProps({ icon: null });
      const topRow = wrapper.find(
        '.mockClassName > .account-list-item__top-row',
      );
      expect(topRow.find('.account-list-item__icon')).toHaveLength(0);
    });

    it('should render the account address as a checksumAddress if displayAddress is true and name is provided', () => {
      wrapper.setProps({ displayAddress: true });
      expect(wrapper.find('.account-list-item__account-address')).toHaveLength(
        1,
      );
      expect(
        wrapper.find('.account-list-item__account-address').text(),
      ).toStrictEqual('mockCheckSumAddress');
      expect(checksumAddressStub.getCall(0).args).toStrictEqual([
        'mockAddress',
        '0x539',
        true,
      ]);
    });

    it('should not render the account address as a checksumAddress if displayAddress is false', () => {
      wrapper.setProps({ displayAddress: false });
      expect(wrapper.find('.account-list-item__account-address')).toHaveLength(
        0,
      );
    });

    it('should not render the account address as a checksumAddress if name is not provided', () => {
      wrapper.setProps({ account: { address: 'someAddressButNoName' } });
      expect(wrapper.find('.account-list-item__account-address')).toHaveLength(
        0,
      );
    });
  });
});
