import assert from 'assert'
import { cloneDeep } from 'lodash'
import KeyringController from 'eth-opts-keyring-controller'
import firstTimeState from '../../../app/scripts/first-time-state'
import seedPhraseVerifier from '../../../app/scripts/lib/seed-phrase-verifier'
import mockEncryptor from '../../lib/mock-encryptor'

describe('SeedPhraseVerifier', function () {

  describe('verifyAccounts', function () {

    const password = 'passw0rd1'
    const hdKeyTree = 'HD Key Tree'

    let keyringController
    let primaryKeyring

    beforeEach(async function () {
      keyringController = new KeyringController({
        initState: cloneDeep(firstTimeState),
        encryptor: mockEncryptor,
      })

      assert(keyringController)

      await keyringController.createNewVaultAndKeychain(password)
      primaryKeyring = keyringController.getKeyringsByType(hdKeyTree)[0]
    })

    it('should be able to verify created account with seed words', async function () {

      const createdAccounts = await primaryKeyring.getAccounts()
      assert.equal(createdAccounts.length, 1)

      const serialized = await primaryKeyring.serialize()
      const seedWords = serialized.mnemonic
      assert.notEqual(seedWords.length, 0)

      await seedPhraseVerifier.verifyAccounts(createdAccounts, seedWords)
    })

    it('should be able to verify created account (upper case) with seed words', async function () {

      const createdAccounts = await primaryKeyring.getAccounts()
      assert.equal(createdAccounts.length, 1)

      const upperCaseAccounts = [createdAccounts[0].toUpperCase()]

      const serialized = await primaryKeyring.serialize()
      const seedWords = serialized.mnemonic
      assert.notEqual(seedWords.length, 0)

      await seedPhraseVerifier.verifyAccounts(upperCaseAccounts, seedWords)
    })

    it('should be able to verify created account (lower case) with seed words', async function () {

      const createdAccounts = await primaryKeyring.getAccounts()
      assert.equal(createdAccounts.length, 1)
      const lowerCaseAccounts = [createdAccounts[0].toLowerCase()]

      const serialized = await primaryKeyring.serialize()
      const seedWords = serialized.mnemonic
      assert.notEqual(seedWords.length, 0)

      await seedPhraseVerifier.verifyAccounts(lowerCaseAccounts, seedWords)
    })

    it('should return error with good but different seed words', async function () {

      const createdAccounts = await primaryKeyring.getAccounts()
      assert.equal(createdAccounts.length, 1)

      await primaryKeyring.serialize()
      const seedWords = 'debris dizzy just program just float decrease vacant alarm reduce speak stadium'

      try {
        await seedPhraseVerifier.verifyAccounts(createdAccounts, seedWords)
        assert.fail('Should reject')
      } catch (err) {
        assert.ok(err.message.indexOf('Not identical accounts!') >= 0, 'Wrong error message')
      }
    })

    it('should return error with undefined existing accounts', async function () {

      const createdAccounts = await primaryKeyring.getAccounts()
      assert.equal(createdAccounts.length, 1)

      await primaryKeyring.serialize()
      const seedWords = 'debris dizzy just program just float decrease vacant alarm reduce speak stadium'

      try {
        await seedPhraseVerifier.verifyAccounts(undefined, seedWords)
        assert.fail('Should reject')
      } catch (err) {
        assert.equal(err.message, 'No created accounts defined.')
      }
    })

    it('should return error with empty accounts array', async function () {

      const createdAccounts = await primaryKeyring.getAccounts()
      assert.equal(createdAccounts.length, 1)

      await primaryKeyring.serialize()
      const seedWords = 'debris dizzy just program just float decrease vacant alarm reduce speak stadium'

      try {
        await seedPhraseVerifier.verifyAccounts([], seedWords)
        assert.fail('Should reject')
      } catch (err) {
        assert.equal(err.message, 'No created accounts defined.')
      }
    })

    it('should be able to verify more than one created account with seed words', async function () {

      await keyringController.addNewAccount(primaryKeyring)
      await keyringController.addNewAccount(primaryKeyring)

      const createdAccounts = await primaryKeyring.getAccounts()
      assert.equal(createdAccounts.length, 3)

      const serialized = await primaryKeyring.serialize()
      const seedWords = serialized.mnemonic
      assert.notEqual(seedWords.length, 0)

      await seedPhraseVerifier.verifyAccounts(createdAccounts, seedWords)
    })
  })
})
