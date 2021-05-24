#!/usr/bin/env node

const path = require('path');
const { promises: fs, constants: fsConstants } = require('fs');
const ttest = require('ttest');
const { withFixtures, tinyDelayMs } = require('./helpers');
const { PAGES } = require('./webdriver/driver');

const DEFAULT_NUM_SAMPLES = 20;
const ALL_PAGES = Object.values(PAGES);

async function measurePage(pageName) {
  let metrics;
  await withFixtures({ fixtures: 'imported-account' }, async ({ driver }) => {
    await driver.delay(tinyDelayMs);
    await driver.navigate();
    await driver.fill('#password', 'correct horse battery staple');
    await driver.press('#password', driver.Key.ENTER);
    await driver.findElement('.selected-account__name');
    await driver.navigate(pageName);
    await driver.delay(1000);
    metrics = await driver.collectMetrics();
  });
  return metrics;
}

function calculateResult(calc) {
  return (result) => {
    const calculatedResult = {};
    for (const key of Object.keys(result)) {
      calculatedResult[key] = calc(result[key]);
    }
    return calculatedResult;
  };
}
const calculateSum = (array) => array.reduce((sum, val) => sum + val);
const calculateAverage = (array) => calculateSum(array) / array.length;
const minResult = calculateResult((array) => Math.min(...array));
const maxResult = calculateResult((array) => Math.max(...array));
const averageResult = calculateResult((array) => calculateAverage(array));
const standardDeviationResult = calculateResult((array) => {
  const average = calculateAverage(array);
  const squareDiffs = array.map((value) => Math.pow(value - average, 2));
  return Math.sqrt(calculateAverage(squareDiffs));
});
// 95% margin of error calculated using Student's t-distribution
const calculateMarginOfError = (array) =>
  ttest(array).confidence()[1] - calculateAverage(array);
const marginOfErrorResult = calculateResult((array) =>
  calculateMarginOfError(array),
);

async function profilePageLoad(pages, numSamples) {
  const results = {};
  for (const pageName of pages) {
    const runResults = [];
    for (let i = 0; i < numSamples; i += 1) {
      runResults.push(await measurePage(pageName));
    }

    if (runResults.some((result) => result.navigation.lenth > 1)) {
      throw new Error(`Multiple navigations not supported`);
    } else if (
      runResults.some((result) => result.navigation[0].type !== 'navigate')
    ) {
      throw new Error(
        `Navigation type ${
          runResults.find((result) => result.navigation[0].type !== 'navigate')
            .navigation[0].type
        } not supported`,
      );
    }

    const result = {
      firstPaint: runResults.map((metrics) => metrics.paint['first-paint']),
      domContentLoaded: runResults.map(
        (metrics) =>
          metrics.navigation[0] && metrics.navigation[0].domContentLoaded,
      ),
      load: runResults.map(
        (metrics) => metrics.navigation[0] && metrics.navigation[0].load,
      ),
      domInteractive: runResults.map(
        (metrics) =>
          metrics.navigation[0] && metrics.navigation[0].domInteractive,
      ),
    };

    results[pageName] = {
      min: minResult(result),
      max: maxResult(result),
      average: averageResult(result),
      standardDeviation: standardDeviationResult(result),
      marginOfError: marginOfErrorResult(result),
    };
  }
  return results;
}

async function isWritable(directory) {
  try {
    await fs.access(directory, fsConstants.W_OK);
    return true;
  } catch (error) {
    if (error.code !== 'EACCES') {
      throw error;
    }
    return false;
  }
}

async function getFirstParentDirectoryThatExists(directory) {
  let nextDirectory = directory;
  for (;;) {
    try {
      await fs.access(nextDirectory, fsConstants.F_OK);
      return nextDirectory;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      } else if (nextDirectory === path.dirname(nextDirectory)) {
        throw new Error('Failed to find parent directory that exists');
      }
      nextDirectory = path.dirname(nextDirectory);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);

  let pages = ['home'];
  let numSamples = DEFAULT_NUM_SAMPLES;
  let outputPath;
  let outputDirectory;
  let existingParentDirectory;

  while (args.length) {
    if (/^(--pages|-p)$/u.test(args[0])) {
      if (args[1] === undefined) {
        throw new Error('Missing pages argument');
      }
      pages = args[1].split(',');
      for (const page of pages) {
        if (!ALL_PAGES.includes(page)) {
          throw new Error(`Invalid page: '${page}`);
        }
      }
      args.splice(0, 2);
    } else if (/^(--samples|-s)$/u.test(args[0])) {
      if (args[1] === undefined) {
        throw new Error('Missing number of samples');
      }
      numSamples = parseInt(args[1], 10);
      if (isNaN(numSamples)) {
        throw new Error(`Invalid 'samples' argument given: '${args[1]}'`);
      }
      args.splice(0, 2);
    } else if (/^(--out|-o)$/u.test(args[0])) {
      if (args[1] === undefined) {
        throw new Error('Missing output filename');
      }
      outputPath = path.resolve(args[1]);
      outputDirectory = path.dirname(outputPath);
      existingParentDirectory = await getFirstParentDirectoryThatExists(
        outputDirectory,
      );
      if (!(await isWritable(existingParentDirectory))) {
        throw new Error(`Specified directory is not writable: '${args[1]}'`);
      }
      args.splice(0, 2);
    } else {
      throw new Error(`Unrecognized argument: '${args[0]}'`);
    }
  }

  const results = await profilePageLoad(pages, numSamples);

  if (outputPath) {
    if (outputDirectory !== existingParentDirectory) {
      await fs.mkdir(outputDirectory, { recursive: true });
    }
    await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
  } else {
    console.log(JSON.stringify(results, null, 2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
