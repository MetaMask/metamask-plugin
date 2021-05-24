const { strict: assert } = require('assert');
const { withFixtures, regularDelayMs, xxLargeDelayMs } = require('../helpers');

describe('MetaMask', function () {
  it('provider should inform dapp when switching networks', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: 25000000000000000000,
        },
      ],
    };
    await withFixtures(
      {
        dapp: true,
        fixtures: 'connected-state',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.openNewPage('http://127.0.0.1:8080/');
        const networkDiv = await driver.findElement('#network');
        const chainIdDiv = await driver.findElement('#chainId');
        await driver.delay(xxLargeDelayMs);
        assert.equal(await networkDiv.getText(), '1337');
        assert.equal(await chainIdDiv.getText(), '0x539');

        const windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindow(windowHandles[0]);

        await driver.clickElement('.network-display');
        await driver.clickElement({ text: 'Ropsten', tag: 'span' });
        await driver.delay(regularDelayMs);

        await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);
        const switchedNetworkDiv = await driver.findElement('#network');
        const switchedChainIdDiv = await driver.findElement('#chainId');
        const accountsDiv = await driver.findElement('#accounts');

        assert.equal(await switchedNetworkDiv.getText(), '3');
        assert.equal(await switchedChainIdDiv.getText(), '0x3');
        assert.equal(
          await accountsDiv.getText(),
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        );
      },
    );
  });
});
