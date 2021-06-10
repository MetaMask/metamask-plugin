import { stripHexPrefix } from 'ethereumjs-util';
import accountImporter from '.';

describe('Account Import Strategies', () => {
  const privkey =
    '4cfd3e90fc78b0f86bf7524722150bb8da9c60cd532564d7ff43f5716514f553';
  const json =
    '{"version":3,"id":"dbb54385-0a99-437f-83c0-647de9f244c3","address":"a7f92ce3fba24196cf6f4bd2e1eb3db282ba998c","Crypto":{"ciphertext":"bde13d9ade5c82df80281ca363320ce254a8a3a06535bbf6ffdeaf0726b1312c","cipherparams":{"iv":"fbf93718a57f26051b292f072f2e5b41"},"cipher":"aes-128-ctr","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"7ffe00488319dec48e4c49a120ca49c6afbde9272854c64d9541c83fc6acdffe","n":8192,"r":8,"p":1},"mac":"2adfd9c4bc1cdac4c85bddfb31d9e21a684e0e050247a70c5698facf6b7d4681"}}';

  describe('private key import', () => {
    it('imports a private key and strips 0x prefix', async () => {
      const importPrivKey = await accountImporter.importAccount('Private Key', [
        privkey,
      ]);
      expect(importPrivKey).toStrictEqual(stripHexPrefix(privkey));
    });

    it('throws an error for empty string private key', async () => {
      await expect(
        accountImporter.importAccount('Private Key', ['']),
      ).rejects.toThrow('Cannot import an empty key.');
    });

    it('throws an error for undefined string private key', async () => {
      await expect(
        accountImporter.importAccount('Private Key', [undefined]),
      ).rejects.toThrow('Cannot import an empty key.');

      await expect(
        accountImporter.importAccount('Private Key', []),
      ).rejects.toThrow('Cannot import an empty key.');
    });

    it('throws an error for invalid private key', async () => {
      await expect(
        accountImporter.importAccount('Private Key', ['popcorn']),
      ).rejects.toThrow(
        'Cannot convert string to buffer. toBuffer only supports 0x-prefixed hex strings and this string was given: 0xpopcorn',
      );
    });
  });

  describe('JSON keystore import', () => {
    it('fails when password is incorrect for keystore', async () => {
      const wrongPassword = 'password2';

      await expect(
        accountImporter.importAccount('JSON File', [json, wrongPassword]),
      ).rejects.toThrow('Key derivation failed - possibly wrong passphrase');
    });

    it('imports json string and password to return a private key', async () => {
      const fileContentsPassword = 'password1';
      const importJson = await accountImporter.importAccount('JSON File', [
        json,
        fileContentsPassword,
      ]);
      expect(importJson).toStrictEqual(
        '0x5733876abe94146069ce8bcbabbde2677f2e35fa33e875e92041ed2ac87e5bc7',
      );
    });
  });
});
