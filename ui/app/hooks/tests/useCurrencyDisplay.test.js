import assert from 'assert';
import { renderHook } from '@testing-library/react-hooks';
import * as reactRedux from 'react-redux';
import sinon from 'sinon';
import { useCurrencyDisplay } from '../useCurrencyDisplay';
import {
  getCurrentCurrency,
  getNativeCurrency,
  getConversionRate,
} from '../../selectors';
import { getCurrentLocale } from '../../ducks/metamask/metamask';

const tests = [
  {
    input: {
      value: '0x2386f26fc10000',
      numberOfDecimals: 2,
      currency: 'usd',
    },
    result: {
      value: '$2.80',
      suffix: 'USD',
      displayValue: '$2.80 USD',
    },
  },
  {
    input: {
      value: '0x2386f26fc10000',
      currency: 'usd',
    },
    result: {
      value: '$2.80',
      suffix: 'USD',
      displayValue: '$2.80 USD',
    },
  },
  {
    input: {
      value: '0x1193461d01595930',
      currency: 'ETH',
      numberOfDecimals: 3,
    },
    result: {
      value: '1.266',
      suffix: 'ETH',
      displayValue: '1.266 ETH',
    },
  },
  {
    input: {
      value: '0x1193461d01595930',
      currency: 'ETH',
      numberOfDecimals: 3,
      hideLabel: true,
    },
    result: {
      value: '1.266',
      suffix: undefined,
      displayValue: '1.266',
    },
  },
  {
    input: {
      value: '0x3b9aca00',
      currency: 'ETH',
      denomination: 'GWEI',
      hideLabel: true,
    },
    result: {
      value: '1',
      suffix: undefined,
      displayValue: '1',
    },
  },
  {
    input: {
      value: '0x3b9aca00',
      currency: 'ETH',
      denomination: 'WEI',
      hideLabel: true,
    },
    result: {
      value: '1000000000',
      suffix: undefined,
      displayValue: '1000000000',
    },
  },
  {
    input: {
      value: '0x3b9aca00',
      currency: 'ETH',
      numberOfDecimals: 100,
      hideLabel: true,
    },
    result: {
      value: '0.000000001',
      suffix: undefined,
      displayValue: '0.000000001',
    },
  },
];

describe('useCurrencyDisplay', function () {
  tests.forEach(({ input: { value, ...restProps }, result }) => {
    describe(`when input is { value: ${value}, decimals: ${restProps.numberOfDecimals}, denomation: ${restProps.denomination} }`, function () {
      const stub = sinon.stub(reactRedux, 'useSelector');
      stub.callsFake((selector) => {
        if (selector === getCurrentCurrency) {
          return 'usd';
        } else if (selector === getNativeCurrency) {
          return 'ETH';
        } else if (selector === getConversionRate) {
          return 280.45;
        } else if (selector === getCurrentLocale) {
          return 'en';
        }
        return undefined;
      });
      const hookReturn = renderHook(() => useCurrencyDisplay(value, restProps));
      const [displayValue, parts] = hookReturn.result.current;
      stub.restore();
      it(`should return ${result.displayValue} as displayValue`, function () {
        assert.strictEqual(displayValue, result.displayValue);
      });
      it(`should return ${result.value} as value`, function () {
        assert.strictEqual(parts.value, result.value);
      });
      it(`should return ${result.suffix} as suffix`, function () {
        assert.strictEqual(parts.suffix, result.suffix);
      });
    });
  });
});
