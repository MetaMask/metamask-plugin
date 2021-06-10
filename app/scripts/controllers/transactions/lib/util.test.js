import * as txUtils from './util';

describe('txUtils', () => {
  describe('#validateTxParams', () => {
    it('does not throw for positive values', () => {
      const sample = {
        from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
        to: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
        value: '0x01',
      };
      expect(() => txUtils.validateTxParams(sample)).not.toThrow();
    });

    it('throws for invalid params value', () => {
      expect(() => txUtils.validateTxParams()).toThrow({
        message: 'Invalid transaction params: must be an object.',
      });
      expect(() => txUtils.validateTxParams(null)).toThrow({
        message: 'Invalid transaction params: must be an object.',
      });
      expect(() => txUtils.validateTxParams(true)).toThrow({
        message: 'Invalid transaction params: must be an object.',
      });
      expect(() => txUtils.validateTxParams([])).toThrow({
        message: 'Invalid transaction params: must be an object.',
      });
    });

    it('throws for missing "to" and "data"', () => {
      const sample = {
        from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
        value: '0x01',
      };
      expect(() => txUtils.validateTxParams(sample)).toThrow({
        message:
          'Invalid transaction params: must specify "data" for contract deployments, or "to" (and optionally "data") for all other types of transactions.',
      });
    });

    it('throws for negative values', () => {
      const sample = {
        from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
        to: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
        value: '-0x01',
      };
      expect(() => txUtils.validateTxParams(sample)).toThrow({
        message: 'Invalid transaction value "-0x01": not a positive number.',
      });
    });
  });

  describe('#normalizeTxParams', () => {
    it('should normalize txParams', () => {
      const txParams = {
        chainId: '0x1',
        from: 'a7df1beDBF813f57096dF77FCd515f0B3900e402',
        to: null,
        data: '68656c6c6f20776f726c64',
        random: 'hello world',
      };

      let normalizedTxParams = txUtils.normalizeTxParams(txParams);

      expect(normalizedTxParams.chainId).toBeUndefined();
      expect(normalizedTxParams.to).toBeUndefined();
      expect(normalizedTxParams.from.slice(0, 2)).toStrictEqual('0x');
      expect(normalizedTxParams.data.slice(0, 2)).toStrictEqual('0x');
      expect(normalizedTxParams.random).toBeUndefined();

      txParams.to = 'a7df1beDBF813f57096dF77FCd515f0B3900e402';
      normalizedTxParams = txUtils.normalizeTxParams(txParams);
      expect(normalizedTxParams.to.slice(0, 2)).toStrictEqual('0x');
    });
  });

  describe('#validateRecipient', () => {
    it('removes recipient for txParams with 0x when contract data is provided', () => {
      const zeroRecipientDataTxParams = {
        from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
        to: '0x',
        data: 'bytecode',
      };
      const sanitizedTxParams = txUtils.validateRecipient(
        zeroRecipientDataTxParams,
      );
      expect(sanitizedTxParams).toStrictEqual({
        from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
        data: 'bytecode',
      });
    });

    it('should error when recipient is 0x', () => {
      const zeroRecipientTxParams = {
        from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
        to: '0x',
      };
      expect(() => {
        txUtils.validateRecipient(zeroRecipientTxParams);
      }).toThrow('Invalid "to" address');
    });
  });

  describe('#validateFrom', () => {
    it('should error when from is not a hex string', () => {
      // where from is undefined
      const txParams = {};
      expect(() => {
        txUtils.validateFrom(txParams);
      }).toThrow('Invalid "from" address "undefined": not a string.');

      // where from is array
      txParams.from = [];
      expect(() => {
        txUtils.validateFrom(txParams);
      }).toThrow('Invalid "from" address "": not a string.');

      // where from is a object
      txParams.from = {};
      expect(() => {
        txUtils.validateFrom(txParams);
      }).toThrow('Invalid "from" address "[object Object]": not a string.');

      // where from is a invalid address
      txParams.from = 'im going to fail';
      expect(() => {
        txUtils.validateFrom(txParams);
      }).toThrow('Invalid "from" address.');

      // should run
      txParams.from = '0x1678a085c290ebd122dc42cba69373b5953b831d';
      txUtils.validateFrom(txParams);
    });
  });
});
