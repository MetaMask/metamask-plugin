import assert from 'assert';
import * as utils from './confirm-tx.util';

const formatCurrencyData = require('../../../../test/data/format-currency-data.json');

describe('Confirm Transaction utils', function () {
  describe('increaseLastGasPrice', function () {
    it('should increase the gasPrice by 10%', function () {
      const increasedGasPrice = utils.increaseLastGasPrice('0xa');
      assert.strictEqual(increasedGasPrice, '0xb');
    });

    it('should prefix the result with 0x', function () {
      const increasedGasPrice = utils.increaseLastGasPrice('a');
      assert.strictEqual(increasedGasPrice, '0xb');
    });
  });

  describe('hexGreaterThan', function () {
    it('should return true if the first value is greater than the second value', function () {
      assert.strictEqual(utils.hexGreaterThan('0xb', '0xa'), true);
    });

    it('should return false if the first value is less than the second value', function () {
      assert.strictEqual(utils.hexGreaterThan('0xa', '0xb'), false);
    });

    it('should return false if the first value is equal to the second value', function () {
      assert.strictEqual(utils.hexGreaterThan('0xa', '0xa'), false);
    });

    it('should correctly compare prefixed and non-prefixed hex values', function () {
      assert.strictEqual(utils.hexGreaterThan('0xb', 'a'), true);
    });
  });

  describe('getHexGasTotal', function () {
    it('should multiply the hex gasLimit and hex gasPrice values together', function () {
      assert.strictEqual(
        utils.getHexGasTotal({ gasLimit: '0x5208', gasPrice: '0x3b9aca00' }),
        '0x1319718a5000',
      );
    });

    it('should prefix the result with 0x', function () {
      assert.strictEqual(
        utils.getHexGasTotal({ gasLimit: '5208', gasPrice: '3b9aca00' }),
        '0x1319718a5000',
      );
    });
  });

  describe('addEth', function () {
    it('should add two values together rounding to 6 decimal places', function () {
      assert.strictEqual(utils.addEth('0.12345678', '0'), '0.123457');
    });

    it('should add any number of values together rounding to 6 decimal places', function () {
      assert.strictEqual(
        utils.addEth(
          '0.1',
          '0.02',
          '0.003',
          '0.0004',
          '0.00005',
          '0.000006',
          '0.0000007',
        ),
        '0.123457',
      );
    });
  });

  describe('addFiat', function () {
    it('should add two values together rounding to 2 decimal places', function () {
      assert.strictEqual(utils.addFiat('0.12345678', '0'), '0.12');
    });

    it('should add any number of values together rounding to 2 decimal places', function () {
      assert.strictEqual(
        utils.addFiat(
          '0.1',
          '0.02',
          '0.003',
          '0.0004',
          '0.00005',
          '0.000006',
          '0.0000007',
        ),
        '0.12',
      );
    });
  });

  describe('getValueFromWeiHex', function () {
    it('should get the transaction amount in ETH', function () {
      const ethTransactionAmount = utils.getValueFromWeiHex({
        value: '0xde0b6b3a7640000',
        toCurrency: 'ETH',
        conversionRate: 468.58,
        numberOfDecimals: 6,
      });

      assert.strictEqual(ethTransactionAmount, '1');
    });

    it('should get the transaction amount in fiat', function () {
      const fiatTransactionAmount = utils.getValueFromWeiHex({
        value: '0xde0b6b3a7640000',
        toCurrency: 'usd',
        conversionRate: 468.58,
        numberOfDecimals: 2,
      });

      assert.strictEqual(fiatTransactionAmount, '468.58');
    });
  });

  describe('getTransactionFee', function () {
    it('should get the transaction fee in ETH', function () {
      const ethTransactionFee = utils.getTransactionFee({
        value: '0x1319718a5000',
        toCurrency: 'ETH',
        conversionRate: 468.58,
        numberOfDecimals: 6,
      });

      assert.strictEqual(ethTransactionFee, '0.000021');
    });

    it('should get the transaction fee in fiat', function () {
      const fiatTransactionFee = utils.getTransactionFee({
        value: '0x1319718a5000',
        toCurrency: 'usd',
        conversionRate: 468.58,
        numberOfDecimals: 2,
      });

      assert.strictEqual(fiatTransactionFee, '0.01');
    });
  });

  function loadLocaleCodePolyfill(code) {
    const locale = code.replace('_', '-');
    const languageTag = code.split('_')[0];
    try {
      // eslint-disable-next-line node/global-require, import/no-dynamic-require
      require(`@formatjs/intl-numberformat/locale-data/${
        locale === 'no' ? 'nb' : locale
      }`);
    } catch {
      try {
        // eslint-disable-next-line node/global-require, import/no-dynamic-require
        require(`@formatjs/intl-numberformat/locale-data/${languageTag}`);
      } catch {
        console.debug(
          `@formatjs/intl-numberformat/locale-data/${languageTag} missing`,
        );
      }
      console.debug(
        `@formatjs/intl-numberformat/locale-data/${locale} missing`,
      );
    }
  }

  describe('formatCurrency', function () {
    it('should format USD values', function () {
      formatCurrencyData.forEach(({ code, formattedUSD }) => {
        loadLocaleCodePolyfill(code);
        const value = utils.formatCurrency('1234567.89', 'usd', code);
        assert.equal(
          value,
          formattedUSD,
          `USD ${code} formatted: ${formattedUSD}`,
        );
      });
    });
    it('should format EUR values', function () {
      formatCurrencyData.forEach(({ code, formattedEUR }) => {
        loadLocaleCodePolyfill(code);
        const value = utils.formatCurrency('1234567.89', 'eur', code);
        assert.equal(
          value,
          formattedEUR,
          `EUR ${code} formatted: ${value} should be ${formattedEUR}`,
        );
      });
    });
  });
});
