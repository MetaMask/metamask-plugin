import { cloneDeep } from 'lodash';
import KeyringController from 'eth-keyring-controller';
import firstTimeState from '../first-time-state';
import mockEncryptor from '../../../test/lib/mock-encryptor';
import seedPhraseVerifier from './seed-phrase-verifier';

describe('SeedPhraseVerifier', () => {
  describe('verifyAccounts', () => {
    const password = 'passw0rd1';
    const hdKeyTree = 'HD Key Tree';

    let keyringController;
    let primaryKeyring;

    beforeEach(async () => {
      keyringController = new KeyringController({
        initState: cloneDeep(firstTimeState),
        encryptor: mockEncryptor,
      });

      expect.any(keyringController);

      await keyringController.createNewVaultAndKeychain(password);
      primaryKeyring = keyringController.getKeyringsByType(hdKeyTree)[0];
    });

    it('should be able to verify created account with seed words', async () => {
      const createdAccounts = await primaryKeyring.getAccounts();
      expect(createdAccounts).toHaveLength(1);

      const serialized = await primaryKeyring.serialize();
      const seedWords = serialized.mnemonic;
      expect(seedWords).not.toHaveLength(0);

      await seedPhraseVerifier.verifyAccounts(createdAccounts, seedWords);
    });

    it('should be able to verify created account (upper case) with seed words', async () => {
      const createdAccounts = await primaryKeyring.getAccounts();
      expect(createdAccounts).toHaveLength(1);

      const upperCaseAccounts = [createdAccounts[0].toUpperCase()];

      const serialized = await primaryKeyring.serialize();
      const seedWords = serialized.mnemonic;
      expect(seedWords).not.toHaveLength(0);

      await seedPhraseVerifier.verifyAccounts(upperCaseAccounts, seedWords);
    });

    it('should be able to verify created account (lower case) with seed words', async () => {
      const createdAccounts = await primaryKeyring.getAccounts();
      expect(createdAccounts).toHaveLength(1);
      const lowerCaseAccounts = [createdAccounts[0].toLowerCase()];

      const serialized = await primaryKeyring.serialize();
      const seedWords = serialized.mnemonic;
      expect(seedWords).not.toHaveLength(0);

      await seedPhraseVerifier.verifyAccounts(lowerCaseAccounts, seedWords);
    });

    it('should return error with good but different seed words', async () => {
      const createdAccounts = await primaryKeyring.getAccounts();
      expect(createdAccounts).toHaveLength(1);

      await primaryKeyring.serialize();
      const seedWords =
        'debris dizzy just program just float decrease vacant alarm reduce speak stadium';

      await expect(async () => {
        await seedPhraseVerifier.verifyAccounts(createdAccounts, seedWords);
      }).rejects.toThrow('Not identical accounts!');
    });

    it('should return error with undefined existing accounts', async () => {
      const createdAccounts = await primaryKeyring.getAccounts();
      expect(createdAccounts).toHaveLength(1);

      await primaryKeyring.serialize();
      const seedWords =
        'debris dizzy just program just float decrease vacant alarm reduce speak stadium';

      await expect(async () => {
        await seedPhraseVerifier.verifyAccounts(undefined, seedWords);
      }).rejects.toThrow('No created accounts defined.');
    });

    it('should return error with empty accounts array', async () => {
      const createdAccounts = await primaryKeyring.getAccounts();
      expect(createdAccounts).toHaveLength(1);

      await primaryKeyring.serialize();
      const seedWords =
        'debris dizzy just program just float decrease vacant alarm reduce speak stadium';

      await expect(async () => {
        await seedPhraseVerifier.verifyAccounts([], seedWords);
      }).rejects.toThrow('No created accounts defined.');
    });

    it('should be able to verify more than one created account with seed words', async () => {
      await keyringController.addNewAccount(primaryKeyring);
      await keyringController.addNewAccount(primaryKeyring);

      const createdAccounts = await primaryKeyring.getAccounts();
      expect(createdAccounts).toHaveLength(3);

      const serialized = await primaryKeyring.serialize();
      const seedWords = serialized.mnemonic;
      expect(seedWords).not.toHaveLength(0);

      await seedPhraseVerifier.verifyAccounts(createdAccounts, seedWords);
    });
  });
});
