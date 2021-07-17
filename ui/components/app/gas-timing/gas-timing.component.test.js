import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';

import messages from '../../../../app/_locales/en/messages.json';

import { getMessage } from '../../../helpers/utils/i18n-helper';

import * as i18nhooks from '../../../hooks/useI18nContext';
import * as useGasFeeEstimatesExport from '../../../hooks/useGasFeeEstimates';
import * as useGasFeeInputsExport from '../../../hooks/useGasFeeInputs';

import GasTiming from '.';

const MOCK_FEE_ESTIMATE = {
  low: {
    minWaitTimeEstimate: 180000,
    maxWaitTimeEstimate: 300000,
    suggestedMaxPriorityFeePerGas: '3',
    suggestedMaxFeePerGas: '53',
  },
  medium: {
    minWaitTimeEstimate: 15000,
    maxWaitTimeEstimate: 60000,
    suggestedMaxPriorityFeePerGas: '7',
    suggestedMaxFeePerGas: '70',
  },
  high: {
    minWaitTimeEstimate: 0,
    maxWaitTimeEstimate: 15000,
    suggestedMaxPriorityFeePerGas: '10',
    suggestedMaxFeePerGas: '100',
  },
  estimatedBaseFee: '50',
};

describe('Gas timing', () => {
  let useI18nContext;

  beforeEach(() => {
    useI18nContext = sinon.stub(i18nhooks, 'useI18nContext');
    useI18nContext.returns((key, variables) =>
      getMessage('en', messages, key, variables),
    );
  });
  afterEach(() => {
    sinon.restore();
  });

  it('renders nothing when gas is loading', () => {
    sinon.stub(useGasFeeEstimatesExport, 'useGasFeeEstimates').returns({
      isGasEstimatesLoading: true,
      gasFeeEstimates: null,
    });

    sinon.stub(useGasFeeInputsExport, 'useGasFeeInputs').returns({
      maxPriorityFeePerGas: 10,
    });

    const wrapper = shallow(<GasTiming />);
    expect(wrapper.html()).toBeNull();
  });

  it('renders "very likely" when high estimate is chosen', () => {
    sinon.stub(useGasFeeEstimatesExport, 'useGasFeeEstimates').returns({
      isGasEstimatesLoading: false,
      gasFeeEstimates: MOCK_FEE_ESTIMATE,
    });

    sinon.stub(useGasFeeInputsExport, 'useGasFeeInputs').returns({
      maxPriorityFeePerGas: 10,
    });

    const wrapper = shallow(<GasTiming />);
    expect(wrapper.html()).toContain('gasTimingVeryPositive');
  });

  it('renders "likely" when medium estimate is chosen', () => {
    sinon.stub(useGasFeeEstimatesExport, 'useGasFeeEstimates').returns({
      isGasEstimatesLoading: false,
      gasFeeEstimates: MOCK_FEE_ESTIMATE,
    });

    sinon.stub(useGasFeeInputsExport, 'useGasFeeInputs').returns({
      maxPriorityFeePerGas: 8,
    });

    const wrapper = shallow(<GasTiming />);
    expect(wrapper.html()).toContain('gasTimingPositive');
  });

  it('renders "maybe" when low estimate is chosen', () => {
    sinon.stub(useGasFeeEstimatesExport, 'useGasFeeEstimates').returns({
      isGasEstimatesLoading: false,
      gasFeeEstimates: MOCK_FEE_ESTIMATE,
    });

    sinon.stub(useGasFeeInputsExport, 'useGasFeeInputs').returns({
      maxPriorityFeePerGas: 3,
    });

    const wrapper = shallow(<GasTiming />);
    expect(wrapper.html()).toContain('gasTimingNegative');
  });
});
