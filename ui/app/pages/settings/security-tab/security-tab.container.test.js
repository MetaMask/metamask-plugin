import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import SecurityTab from './security-tab.container';

describe('Security Tab', () => {
  let wrapper;

  const props = {
    revealSeedConfirmation: sinon.spy(),
    showClearApprovalModal: sinon.spy(),
    setParticipateInMetaMetrics: sinon.spy(),
    displayWarning: sinon.spy(),
    showExternalTransactions: false,
    setShowExternalTransactionsFeatureFlag: sinon.spy(),
    history: {
      push: sinon.spy(),
    },
    privacyMode: true,
    warning: '',
    participateInMetaMetrics: false,
    setUsePhishDetect: sinon.spy(),
    usePhishDetect: true,
  };

  beforeEach(() => {
    wrapper = mount(<SecurityTab.WrappedComponent {...props} />, {
      context: {
        t: (str) => str,
        metricsEvent: () => undefined,
      },
    });
  });

  it('navigates to reveal seed words page', () => {
    const seedWords = wrapper.find('.button.btn-danger.btn--large');

    seedWords.simulate('click');
    expect(props.history.push.calledOnce).toStrictEqual(true);
    expect(props.history.push.getCall(0).args[0]).toStrictEqual('/seed');
  });

  it('toggles external txs', () => {
    const externalTxs = wrapper.find({ type: 'checkbox' }).at(0);
    externalTxs.simulate('click');
    expect(
      props.setShowExternalTransactionsFeatureFlag.calledOnce,
    ).toStrictEqual(true);
  });

  it('toggles phishing detection', () => {
    const phishDetect = wrapper.find({ type: 'checkbox' }).at(1);
    phishDetect.simulate('click');
    expect(props.setUsePhishDetect.calledOnce).toStrictEqual(true);
  });

  it('toggles metaMetrics', () => {
    const metaMetrics = wrapper.find({ type: 'checkbox' }).at(2);

    metaMetrics.simulate('click');
    expect(props.setParticipateInMetaMetrics.calledOnce).toStrictEqual(true);
  });
});
