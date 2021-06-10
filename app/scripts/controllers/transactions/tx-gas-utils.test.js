import Transaction from 'ethereumjs-tx';
import { hexToBn, bnToHex } from '../../lib/util';
import TxUtils from './tx-gas-utils';

describe('txUtils', () => {
  let txUtils;

  beforeAll(() => {
    txUtils = new TxUtils(
      new Proxy(
        {},
        {
          get: () => {
            return () => undefined;
          },
        },
      ),
    );
  });

  describe('chain Id', () => {
    it('prepares a transaction with the provided chainId', () => {
      const txParams = {
        to: '0x70ad465e0bab6504002ad58c744ed89c7da38524',
        from: '0x69ad465e0bab6504002ad58c744ed89c7da38525',
        value: '0x0',
        gas: '0x7b0c',
        gasPrice: '0x199c82cc00',
        data: '0x',
        nonce: '0x3',
        chainId: 42,
      };
      const ethTx = new Transaction(txParams);
      expect(ethTx.getChainId()).toStrictEqual(42);
    });
  });

  describe('addGasBuffer', () => {
    it('multiplies by 1.5, when within block gas limit', () => {
      // naive estimatedGas: 0x16e360 (1.5 mil)
      const inputHex = '0x16e360';
      // dummy gas limit: 0x3d4c52 (4 mil)
      const blockGasLimitHex = '0x3d4c52';
      const output = txUtils.addGasBuffer(inputHex, blockGasLimitHex);
      const inputBn = hexToBn(inputHex);
      const outputBn = hexToBn(output);
      const expectedBn = inputBn.muln(1.5);
      expect(outputBn.eq(expectedBn)).toStrictEqual(true);
    });

    it('uses original estimatedGas, when above block gas limit', () => {
      // naive estimatedGas: 0x16e360 (1.5 mil)
      const inputHex = '0x16e360';
      // dummy gas limit: 0x0f4240 (1 mil)
      const blockGasLimitHex = '0x0f4240';
      const output = txUtils.addGasBuffer(inputHex, blockGasLimitHex);
      // const inputBn = hexToBn(inputHex)
      const outputBn = hexToBn(output);
      const expectedBn = hexToBn(inputHex);
      expect(outputBn).toStrictEqual(expectedBn);
    });

    it('buffers up to recommend gas limit recommended ceiling', () => {
      // naive estimatedGas: 0x16e360 (1.5 mil)
      const inputHex = '0x16e360';
      // dummy gas limit: 0x1e8480 (2 mil)
      const blockGasLimitHex = '0x1e8480';
      const blockGasLimitBn = hexToBn(blockGasLimitHex);
      const ceilGasLimitBn = blockGasLimitBn.muln(0.9);
      const output = txUtils.addGasBuffer(inputHex, blockGasLimitHex);
      // const inputBn = hexToBn(inputHex)
      // const outputBn = hexToBn(output)
      const expectedHex = bnToHex(ceilGasLimitBn);
      expect(output).toStrictEqual(expectedHex);
    });
  });
});
