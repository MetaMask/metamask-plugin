import {
  multiplyCurrencies,
  subtractCurrencies,
} from '../../../../../../shared/modules/conversion-util';
import { addHexPrefix } from '../../../../../../app/scripts/lib/util';

export function calcMaxAmount({ balance, gasTotal, sendToken, tokenBalance }) {
  const { decimals } = sendToken || {};
  const multiplier = Math.pow(10, Number(decimals || 0));

  return sendToken
    ? multiplyCurrencies(tokenBalance, multiplier, {
        toNumericBase: 'hex',
        multiplicandBase: 16,
        multiplierBase: 10,
      })
    : subtractCurrencies(addHexPrefix(balance), addHexPrefix(gasTotal), {
        toNumericBase: 'hex',
        aBase: 16,
        bBase: 16,
      });
}
