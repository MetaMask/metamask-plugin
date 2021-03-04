import assert from 'assert';
import { formatCurrency } from '../../ui/app/helpers/utils/confirm-tx.util';
import availableCurrencies from '../../ui/app/helpers/constants/available-conversions.json';

describe('currencyFormatting', function () {
  it('be able to format any infura currency', function (done) {
    const number = 10000;

    availableCurrencies.forEach((conversion) => {
      const code = conversion.code.toUpperCase();
      const result = formatCurrency(number, code, 'en');

      switch (code) {
        case 'USD':
          assert.equal(result, '$10,000.00');
          break;
        case 'JPY':
          assert.equal(result, '¥10,000');
          break;
        default:
          assert.ok(result, `Currency ${code} formatted as ${result}`);
      }
    });

    done();
  });
});
