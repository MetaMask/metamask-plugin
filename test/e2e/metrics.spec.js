const { strict: assert } = require('assert');
const waitUntilCalled = require('../lib/wait-until-called');
const { withFixtures, tinyDelayMs } = require('./helpers');

/**
 * WARNING: These tests must be run using a build created with `yarn build:test:metrics`, so that it has
 * the correct Segment host and write keys set. Otherwise this test will fail.
 */
describe('Segment metrics', function () {
  this.timeout(0);

  it('should send first three Page metric events upon fullscreen page load', async function () {
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
        fixtures: 'metrics-enabled',
        ganacheOptions,
        title: this.test.title,
        mockSegment: true,
      },
      async ({ driver, segmentStub }) => {
        const threeSegmentEventsReceived = waitUntilCalled(segmentStub, null, {
          callCount: 3,
        });
        await driver.delay(tinyDelayMs);
        await driver.navigate();

        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await threeSegmentEventsReceived();

        assert.ok(segmentStub.called, 'Segment should receive metrics');

        const firstSegmentEvent = segmentStub.getCall(0).args[0];
        assert.equal(firstSegmentEvent.name, 'Home');
        assert.equal(firstSegmentEvent.context.page.path, '/');

        const secondSegmentEvent = segmentStub.getCall(1).args[0];
        assert.equal(secondSegmentEvent.name, 'Unlock Page');
        assert.equal(secondSegmentEvent.context.page.path, '/unlock');

        const thirdSegmentEvent = segmentStub.getCall(2).args[0];
        assert.equal(thirdSegmentEvent.name, 'Home');
        assert.equal(thirdSegmentEvent.context.page.path, '/');
      },
    );
  });
});
