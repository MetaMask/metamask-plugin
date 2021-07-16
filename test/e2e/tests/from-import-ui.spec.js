const { strict: assert } = require('assert');
const { withFixtures, regularDelayMs } = require('../helpers');
const enLocaleMessages = require('../../../app/_locales/en/messages.json');

describe('Metamask Import UI', function () {
  it('Importing wallet using Secret Recovery Phrase', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
          balance: 25000000000000000000,
        },
      ],
    };
    const testSeedPhrase =
      'forum vessel pink push lonely enact gentle tail admit parrot grunt dress';
    const testAddress = '0x0Cc5261AB8cE458dc977078A3623E2BaDD27afD3';

    await withFixtures(
      {
        fixtures: 'onboarding',
        ganacheOptions,
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();

        // clicks the continue button on the welcome screen
        await driver.findElement('.welcome-page__header');
        await driver.clickElement({
          text: enLocaleMessages.getStarted.message,
          tag: 'button',
        });

        // clicks the "Import Wallet" option
        await driver.clickElement({ text: 'Import wallet', tag: 'button' });

        // clicks the "No thanks" option on the metametrics opt-in screen
        await driver.clickElement('.btn-default');

        // Import Secret Recovery Phrase
        await driver.fill(
          'input[placeholder="Paste Secret Recovery Phrase from clipboard"]',
          testSeedPhrase,
        );

        await driver.fill('#password', 'correct horse battery staple');
        await driver.fill('#confirm-password', 'correct horse battery staple');

        await driver.clickElement('.first-time-flow__terms');

        await driver.clickElement({ text: 'Import', tag: 'button' });

        // clicks through the success screen
        await driver.findElement({ text: 'Congratulations', tag: 'div' });
        await driver.clickElement({
          text: enLocaleMessages.endOfFlowMessage10.message,
          tag: 'button',
        });

        // close the what's new popup
        const popover = await driver.findElement('.popover-container');
        await driver.clickElement('[data-testid="popover-close"]');
        await popover.waitForElementState('hidden');

        // Show account information
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement(
          '[data-testid="account-options-menu__account-details"]',
        );
        await driver.findVisibleElement('.qr-code__wrapper');
        // shows a QR code for the account
        const detailsModal = await driver.findVisibleElement('span .modal');
        // shows the correct account address
        const [address] = await driver.findElements('.readonly-input__input');
        assert.equal(await address.getAttribute('value'), testAddress);

        await driver.clickElement('.account-modal__close');
        await detailsModal.waitForElementState('hidden');

        // logs out of the account
        await driver.clickElement('.account-menu__icon .identicon');
        const lockButton = await driver.findClickableElement(
          '.account-menu__lock-button',
        );
        assert.equal(await lockButton.getText(), 'Lock');
        await lockButton.click();

        // accepts the account password after lock
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Create a new account
        // switches to locakhost
        await driver.clickElement('.network-display');
        await driver.clickElement({ text: 'Localhost', tag: 'span' });

        // choose Create Account from the account menu
        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Create Account', tag: 'div' });

        // set account name
        await driver.fill('.new-account-create-form input', '2nd account');
        await driver.delay(regularDelayMs);
        await driver.clickElement({ text: 'Create', tag: 'button' });

        // should show the correct account name
        const accountName = await driver.findElement('.selected-account__name');
        assert.equal(await accountName.getText(), '2nd account');

        // Switch back to original account
        // chooses the original account from the account menu
        await driver.clickElement('.account-menu__icon');
        await driver.clickElement('.account-menu__name');

        // Send ETH from inside MetaMask
        // starts a send transaction
        await driver.clickElement('[data-testid="eth-overview-send"]');
        await driver.fill(
          'input[placeholder="Search, public address (0x), or ENS"]',
          '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        );
        await driver.fill('.unit-input__input', '1');

        // Set the gas limit
        await driver.clickElement('.advanced-gas-options-btn');

        // wait for gas modal to be visible
        const gasModal = await driver.findVisibleElement('span .modal');
        await driver.clickElement({ text: 'Save', tag: 'button' });
        // wait for gas modal to be removed from DOM
        await gasModal.waitForElementState('hidden');

        // Continue to next screen
        await driver.clickElement({ text: 'Next', tag: 'button' });

        // confirms the transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // finds the transaction in the transactions list
        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .transaction-list-item',
          );
          return confirmedTxes.length === 1;
        }, 10000);

        const txValues = await driver.findElements(
          '.transaction-list-item__primary-currency',
        );
        assert.equal(txValues.length, 1);
        assert.ok(/-1\s*ETH/u.test(await txValues[0].getText()));
      },
    );
  });

  it('Import Account using private key', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
          balance: 25000000000000000000,
        },
      ],
    };
    const testPrivateKey1 =
      '14abe6f4aab7f9f626fe981c864d0adeb5685f289ac9270c27b8fd790b4235d6';
    const testPrivateKey2 =
      'F4EC2590A0C10DE95FBF4547845178910E40F5035320C516A18C117DE02B5669';

    await withFixtures(
      {
        fixtures: 'import-ui',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Imports an account with private key
        // choose Create Account from the account menu
        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Import Account', tag: 'div' });

        // enter private key',
        await driver.fill('#private-key-box', testPrivateKey1);
        await driver.clickElement({ text: 'Import', tag: 'button' });

        // should show the correct account name
        const importedAccountName = await driver.findElement(
          '.selected-account__name',
        );
        assert.equal(await importedAccountName.getText(), 'Account 4');

        // should show the imported label
        await driver.clickElement('.account-menu__icon');
        // confirm 4th account is account 4, as expected
        const accountMenuItemSelector = '.account-menu__account:nth-child(4)';
        const fourthAccountName = await driver.findElement(
          `${accountMenuItemSelector} .account-menu__name`,
        );
        assert.equal(await fourthAccountName.getText(), 'Account 4');
        // confirm label is present on the same menu item
        const importedLabel = await driver.findElement(
          `${accountMenuItemSelector} .keyring-label`,
        );
        assert.equal(await importedLabel.getText(), 'IMPORTED');

        // Imports and removes an account
        // choose Create Account from the account menu
        await driver.clickElement({ text: 'Import Account', tag: 'div' });
        // enter private key
        await driver.fill('#private-key-box', testPrivateKey2);
        await driver.clickElement({ text: 'Import', tag: 'button' });

        // should see new account in account menu
        const importedAccount2Name = await driver.findElement(
          '.selected-account__name',
        );
        assert.equal(await importedAccount2Name.getText(), 'Account 5');
        await driver.clickElement('.account-menu__icon');
        const accountListItems = await driver.findElements(
          '.account-menu__account',
        );
        assert.equal(accountListItems.length, 5);

        await driver.clickPoint('.account-menu__icon', 0, 0);

        // should open the remove account modal
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement(
          '[data-testid="account-options-menu__remove-account"]',
        );
        await driver.findElement('.confirm-remove-account__account');

        // should remove the account
        await driver.clickElement({ text: 'Remove', tag: 'button' });

        const currentActiveAccountName = await driver.findElement(
          '.selected-account__name',
        );
        assert.equal(await currentActiveAccountName.getText(), 'Account 1');
        await driver.delay(regularDelayMs);
        await driver.clickElement('.account-menu__icon');

        const accountListItemsAfterRemoval = await driver.findElements(
          '.account-menu__account',
        );
        assert.equal(accountListItemsAfterRemoval.length, 4);
      },
    );
  });
  it('Connects to a Hardware wallet', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
          balance: 25000000000000000000,
        },
      ],
    };

    await withFixtures(
      {
        fixtures: 'import-ui',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // choose Connect Hardware Wallet from the account menu
        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({
          text: 'Connect Hardware Wallet',
          tag: 'div',
        });
        await driver.delay(regularDelayMs);

        // should open the TREZOR Connect popup
        await driver.clickElement('.hw-connect__btn:nth-of-type(2)');
        await driver.clickElement({ text: 'Continue', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        const allWindows = await driver.getAllWindowHandles();
        assert.equal(allWindows.length, 2);
      },
    );
  });
});
