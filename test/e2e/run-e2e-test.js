const { promises: fs } = require('fs');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { runInShell } = require('../../development/lib/run-command');
const { exitWithError } = require('../../development/lib/exit-with-error');
const { retry } = require('../../development/lib/retry');

async function main() {
  const { argv } = yargs(hideBin(process.argv))
    .usage(
      '$0 [options] <e2e-test-path>',
      'Run a single E2E test, with a variable number of retries.',
      (_yargs) =>
        _yargs
          .option('browser', {
            default: process.env.SELENIUM_BROWSER,
            description: `Set the browser used; either 'chrome' or 'firefox'.`,
            type: 'string',
            choices: ['chrome', 'firefox'],
          })
          .option('retries', {
            default: 0,
            description:
              'Set how many times the test should be retried upon failure.',
            type: 'number',
          })
          .positional('e2e-test-path', {
            describe: 'The path for the E2E test to run.',
            type: 'string',
            normalize: true,
          }),
    )
    .strict()
    .help('help');

  const { browser, e2eTestPath, retries } = argv;

  if (!browser) {
    exitWithError(
      `"The browser must be set, via the '--browser' flag or the SELENIUM_BROWSER environment variable`,
    );
    return;
  } else if (browser !== process.env.SELENIUM_BROWSER) {
    process.env.SELENIUM_BROWSER = browser;
  }

  try {
    const stat = await fs.stat(e2eTestPath);
    if (!stat.isFile()) {
      exitWithError('Test path must be a file');
      return;
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      exitWithError('Test path specified does not exist');
      return;
    } else if (error.code === 'EACCES') {
      exitWithError(
        'Access to test path is forbidden by file access permissions',
      );
      return;
    }
    throw error;
  }

  let command = 'yarn';
  const args = ['mocha', '--no-timeouts', e2eTestPath];

  // Run test with virtual display on CI
  if (process.env.CI === 'true') {
    command = 'xvfb-run';
    args.unshift(...['-e', '/dev/stderr', '-a', 'yarn']);
  }

  await retry(retries, async () => {
    await runInShell(command, args);
  });
}

main().catch((error) => {
  exitWithError(error);
});
