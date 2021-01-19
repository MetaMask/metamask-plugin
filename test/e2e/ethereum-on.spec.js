const assert = require('assert')
const webdriver = require('selenium-webdriver')

const { By, until } = webdriver
const { regularDelayMs, largeDelayMs } = require('./helpers')
const { buildWebDriver } = require('./webdriver')
const Ganache = require('@cfxjs/fullnode')
const enLocaleMessages = require('../../app/_locales/en/messages.json')
const { decode } = require('conflux-address-js')
const { bufferToHex } = require('cfx-util')

const ganacheServer = new Ganache()

describe('MetaMask', function() {
  let driver
  let publicBase32Address

  this.timeout(0)
  this.bail(true)

  before(async function() {
    await ganacheServer.start({
      accounts: [
        {
          secretKey:
            '0x57ED903454DEC7321ABB1729A7A3BB0F39B617109F610A74F9B402AAEF955333',
          balance: 25000000000000000000,
        },
      ],
    })
    const result = await buildWebDriver()
    driver = result.driver
  })

  afterEach(async function() {
    if (process.env.SELENIUM_BROWSER === 'chrome') {
      const errors = await driver.checkBrowserForConsoleErrors(driver)
      if (errors.length) {
        const errorReports = errors.map(err => err.message)
        const errorMessage = `Errors found in browser console:\n${errorReports.join(
          '\n'
        )}`
        console.error(new Error(errorMessage))
      }
    }
    if (this.currentTest.state === 'failed') {
      await driver.verboseReportOnFailure(driver, this.currentTest)
    }
  })

  after(async function() {
    await ganacheServer.quit()
    await driver.quit()
  })

  describe('Going through the first time flow, but skipping the seed phrase challenge', function() {
    it('clicks the continue button on the welcome screen', async function() {
      await driver.delay(regularDelayMs)
      await driver.findElement(By.css('.welcome-page__header'))
      await driver.clickElement(
        By.xpath(
          `//button[contains(text(), '${enLocaleMessages.getStarted.message}')]`
        )
      )
      await driver.delay(largeDelayMs)
    })

    it('clicks the "Create New Wallet" option', async function() {
      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Create a Wallet')]`)
      )
      await driver.delay(largeDelayMs)
    })

    it('clicks the "No thanks" option on the metametrics opt-in screen', async function() {
      await driver.clickElement(By.css('.btn-default'))
      await driver.delay(largeDelayMs)
    })

    it('accepts a secure password', async function() {
      const passwordBox = await driver.findElement(
        By.css('.first-time-flow__form #create-password')
      )
      const passwordBoxConfirm = await driver.findElement(
        By.css('.first-time-flow__form #confirm-password')
      )

      await passwordBox.sendKeys('correct horse battery staple')
      await passwordBoxConfirm.sendKeys('correct horse battery staple')

      await driver.clickElement(By.css('.first-time-flow__checkbox'))
      await driver.clickElement(By.css('.first-time-flow__form button'))
      await driver.delay(largeDelayMs)
    })

    it('skips the seed phrase challenge', async function() {
      await driver.clickElement(
        By.xpath(
          `//button[contains(text(), '${enLocaleMessages.remindMeLater.message}')]`
        )
      )
      await driver.delay(regularDelayMs)

      await driver.clickElement(By.css('.account-details__details-button'))
      await driver.delay(regularDelayMs)
    })

    it('gets the current accounts address', async function() {
      const addressInput = await driver.findElement(By.css('.qr-ellip-address'))
      publicBase32Address = await addressInput.getAttribute('value')
      const accountModal = await driver.findElement(By.css('span .modal'))

      await driver.clickElement(By.css('.account-modal-close'))

      await driver.wait(until.stalenessOf(accountModal))
      await driver.delay(regularDelayMs)
    })
  })

  describe('provider listening for events', function() {
    let extension
    let popup
    let dapp

    it('connects to the dapp', async function() {
      await driver.openNewPage('http://127.0.0.1:8080/')
      await driver.delay(regularDelayMs)

      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Connect')]`)
      )

      await driver.delay(regularDelayMs)

      await driver.waitUntilXWindowHandles(3)
      const windowHandles = await driver.getAllWindowHandles()

      extension = windowHandles[0]
      dapp = await driver.switchToWindowWithTitle(
        'E2E Test Dapp',
        windowHandles
      )
      popup = windowHandles.find(
        handle => handle !== extension && handle !== dapp
      )

      await driver.switchToWindow(popup)

      await driver.delay(regularDelayMs)

      await driver.clickElement(
        By.css('.permissions-connect-choose-account__account')
      )

      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Submit')]`)
      )

      await driver.waitUntilXWindowHandles(2)
      await driver.switchToWindow(dapp)
      await driver.delay(regularDelayMs)
    })

    it('has the ganache network id within the dapp', async function() {
      const networkDiv = await driver.findElement(By.css('#network'))
      await driver.delay(regularDelayMs)
      assert.equal(await networkDiv.getText(), '2999')
    })

    it('changes the network', async function() {
      await driver.switchToWindow(extension)

      await driver.clickElement(By.css('.network-name'))
      await driver.delay(regularDelayMs)

      await driver.clickElement(
        By.xpath(`//span[contains(text(), 'Conflux Test Network')]`)
      )
      await driver.delay(largeDelayMs)
    })

    it('sets the network div within the dapp', async function() {
      await driver.switchToWindow(dapp)
      await driver.delay(largeDelayMs * 3)
      const networkDiv = await driver.findElement(By.css('#network'))
      await driver.wait(until.elementTextContains(networkDiv, '1'))
      assert.equal(await networkDiv.getText(), '1')
    })

    it('sets the chainId div within the dapp', async function() {
      await driver.switchToWindow(dapp)
      await driver.delay(largeDelayMs * 3)
      const networkDiv = await driver.findElement(By.css('#chainId'))
      await driver.wait(until.elementTextContains(networkDiv, '0x1'))
      assert.equal(await networkDiv.getText(), '0x1')
    })

    it('sets the account div within the dapp', async function() {
      await driver.switchToWindow(dapp)
      const accountsDiv = await driver.findElement(By.css('#accounts'))
      assert.equal(
        await accountsDiv.getText(),
        bufferToHex(decode(publicBase32Address).hexAddress)
      )
    })
  })
})
