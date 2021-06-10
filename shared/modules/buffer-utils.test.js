import BN from 'bn.js';
import { toBuffer } from './buffer-utils';

describe('buffer utils', function () {
  describe('toBuffer', function () {
    it('should work with prefixed hex strings', function () {
      const result = toBuffer('0xe');
      expect(result).toHaveLength(1);
    });

    it('should work with non prefixed hex strings', function () {
      const result = toBuffer('e');
      expect(result).toHaveLength(1);
    });

    it('should work with weirdly 0x prefixed non-hex strings', function () {
      const result = toBuffer('0xtest');
      expect(result).toHaveLength(6);
    });

    it('should work with regular strings', function () {
      const result = toBuffer('test');
      expect(result).toHaveLength(4);
    });

    it('should work with BN', function () {
      const result = toBuffer(new BN(100));
      expect(result).toHaveLength(1);
    });

    it('should work with Buffer', function () {
      const result = toBuffer(Buffer.from('test'));
      expect(result).toHaveLength(4);
    });

    it('should work with a number', function () {
      const result = toBuffer(100);
      expect(result).toHaveLength(1);
    });

    it('should work with null or undefined', function () {
      const result = toBuffer(null);
      const result2 = toBuffer(undefined);
      expect(result).toHaveLength(0);
      expect(result2).toHaveLength(0);
    });

    it('should work with UInt8Array', function () {
      const uint8 = new Uint8Array(2);
      const result = toBuffer(uint8);
      expect(result).toHaveLength(2);
    });

    it('should work with objects that have a toBuffer property', function () {
      const result = toBuffer({
        toBuffer: () => Buffer.from('hi'),
      });
      expect(result).toHaveLength(2);
    });

    it('should work with objects that have a toArray property', function () {
      const result = toBuffer({
        toArray: () => ['hi'],
      });
      expect(result).toHaveLength(1);
    });
  });
});
