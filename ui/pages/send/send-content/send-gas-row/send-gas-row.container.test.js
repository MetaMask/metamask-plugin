import sinon from 'sinon';

import { showModal } from '../../../../store/actions';

import {
  resetCustomData,
  setCustomGasPrice,
  setCustomGasLimit,
} from '../../../../ducks/gas/gas.duck';

import {
  showGasButtonGroup,
  setGasPrice,
  setGasTotal,
  setGasLimit,
} from '../../../../ducks/send/send.duck';

let mapDispatchToProps;
let mergeProps;

jest.mock('react-redux', () => ({
  connect: (_, md, mp) => {
    mapDispatchToProps = md;
    mergeProps = mp;
    return () => ({});
  },
}));

jest.mock('../../../../selectors', () => ({
  getSendMaxModeState: (s) => `mockMaxModeOn:${s}`,
}));

jest.mock('../../send.utils.js', () => ({
  isBalanceSufficient: ({ amount, gasTotal, balance, conversionRate }) =>
    `${amount}:${gasTotal}:${balance}:${conversionRate}`,
}));

jest.mock('../../../../../shared/modules/gas-utils', () => ({
  calcGasTotal: (gasLimit, gasPrice) => gasLimit + gasPrice,
}));

jest.mock('../../../../store/actions', () => ({
  showModal: jest.fn(),
}));

jest.mock('../../../../ducks/send/send.duck', () => ({
  showGasButtonGroup: jest.fn(),
  setGasPrice: jest.fn(),
  setGasTotal: jest.fn(),
  setGasLimit: jest.fn(),
}));

jest.mock('../../../../ducks/gas/gas.duck', () => ({
  resetCustomData: jest.fn(),
  setCustomGasPrice: jest.fn(),
  setCustomGasLimit: jest.fn(),
}));

require('./send-gas-row.container.js');

describe('send-gas-row container', () => {
  describe('mapDispatchToProps()', () => {
    let dispatchSpy;
    let mapDispatchToPropsObject;

    beforeEach(() => {
      dispatchSpy = sinon.spy();
      mapDispatchToPropsObject = mapDispatchToProps(dispatchSpy);
    });

    describe('showCustomizeGasModal()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.showCustomizeGasModal();
        expect(dispatchSpy.calledOnce).toStrictEqual(true);
        expect(showModal).toHaveBeenCalledWith({
          name: 'CUSTOMIZE_GAS',
          hideBasic: true,
        });
      });
    });

    describe('setGasPrice()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.setGasPrice({
          gasPrice: 'mockNewPrice',
          gasLimit: 'mockLimit',
        });
        expect(dispatchSpy.calledThrice).toStrictEqual(true);
        expect(setGasPrice).toHaveBeenCalled();
        expect(setCustomGasPrice).toHaveBeenCalledWith('mockNewPrice');
        expect(setGasTotal).toHaveBeenCalled();
        expect(setGasTotal).toHaveBeenCalledWith('mockLimitmockNewPrice');
      });
    });

    describe('setGasLimit()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.setGasLimit('mockNewLimit', 'mockPrice');
        expect(dispatchSpy.calledThrice).toStrictEqual(true);
        expect(setGasLimit).toHaveBeenCalled();
        expect(setCustomGasLimit).toHaveBeenCalledWith('mockNewLimit');
        expect(setGasTotal).toHaveBeenCalled();
        expect(setGasTotal).toHaveBeenCalledWith('mockNewLimitmockPrice');
      });
    });

    describe('showGasButtonGroup()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.showGasButtonGroup();
        expect(dispatchSpy.calledOnce).toStrictEqual(true);
        expect(showGasButtonGroup).toHaveBeenCalled();
      });
    });

    describe('resetCustomData()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.resetCustomData();
        expect(dispatchSpy.calledOnce).toStrictEqual(true);
        expect(resetCustomData).toHaveBeenCalled();
      });
    });
  });

  describe('mergeProps', () => {
    it('should return the expected props when isConfirm is true', () => {
      const stateProps = {
        gasPriceButtonGroupProps: {
          someGasPriceButtonGroupProp: 'foo',
          anotherGasPriceButtonGroupProp: 'bar',
        },
        someOtherStateProp: 'baz',
      };
      const dispatchProps = {
        setGasPrice: sinon.spy(),
        someOtherDispatchProp: sinon.spy(),
      };
      const ownProps = { someOwnProp: 123 };
      const result = mergeProps(stateProps, dispatchProps, ownProps);

      expect(result.someOtherStateProp).toStrictEqual('baz');
      expect(
        result.gasPriceButtonGroupProps.someGasPriceButtonGroupProp,
      ).toStrictEqual('foo');
      expect(
        result.gasPriceButtonGroupProps.anotherGasPriceButtonGroupProp,
      ).toStrictEqual('bar');
      expect(result.someOwnProp).toStrictEqual(123);

      expect(dispatchProps.setGasPrice.callCount).toStrictEqual(0);
      result.gasPriceButtonGroupProps.handleGasPriceSelection();
      expect(dispatchProps.setGasPrice.callCount).toStrictEqual(1);

      expect(dispatchProps.someOtherDispatchProp.callCount).toStrictEqual(0);
      result.someOtherDispatchProp();
      expect(dispatchProps.someOtherDispatchProp.callCount).toStrictEqual(1);
    });
  });
});
