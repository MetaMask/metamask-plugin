#!/usr/bin/env node
const { promises: fs } = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const VERSION = require('../dist/chrome/manifest.json').version; // eslint-disable-line import/no-unresolved

start().catch(console.error);

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

async function start() {
  const { GITHUB_COMMENT_TOKEN, CIRCLE_PULL_REQUEST } = process.env;
  console.log('CIRCLE_PULL_REQUEST', CIRCLE_PULL_REQUEST);
  const { CIRCLE_SHA1 } = process.env;
  console.log('CIRCLE_SHA1', CIRCLE_SHA1);
  const { CIRCLE_BUILD_NUM } = process.env;
  console.log('CIRCLE_BUILD_NUM', CIRCLE_BUILD_NUM);

  if (!CIRCLE_PULL_REQUEST) {
    console.warn(`No pull request detected for commit "${CIRCLE_SHA1}"`);
    return;
  }

  const CIRCLE_PR_NUMBER = CIRCLE_PULL_REQUEST.split('/').pop();
  const SHORT_SHA1 = CIRCLE_SHA1.slice(0, 7);
  const BUILD_LINK_BASE = `https://${CIRCLE_BUILD_NUM}-42009758-gh.circle-artifacts.com/0`;

  // build the github comment content

  // links to extension builds
  const platforms = ['chrome', 'firefox', 'opera'];
  const buildLinks = platforms
    .map((platform) => {
      const url = `${BUILD_LINK_BASE}/builds/metamask-${platform}-${VERSION}.zip`;
      return `<a href="${url}">${platform}</a>`;
    })
    .join(', ');

  // links to bundle browser builds
  const bundles = [
    'background',
    'ui',
    'inpage',
    'contentscript',
    'ui-libs',
    'bg-libs',
    'phishing-detect',
  ];
  const bundleLinks = bundles
    .map((bundle) => {
      const url = `${BUILD_LINK_BASE}/build-artifacts/source-map-explorer/${bundle}.html`;
      return `<a href="${url}">${bundle}</a>`;
    })
    .join(', ');

  const storybookUrl = `${BUILD_LINK_BASE}/storybook/index.html`;
  const storybookLink = `<a href="${storybookUrl}">Storybook</a>`;

  // links to bundle browser builds
  const depVizUrl = `${BUILD_LINK_BASE}/build-artifacts/build-viz/index.html`;
  const depVizLink = `<a href="${depVizUrl}">Build System</a>`;

  // link to artifacts
  const allArtifactsUrl = `https://circleci.com/gh/MetaMask/metamask-extension/${CIRCLE_BUILD_NUM}#artifacts/containers/0`;

  const contentRows = [
    `builds: ${buildLinks}`,
    `bundle viz: ${bundleLinks}`,
    `build viz: ${depVizLink}`,
    `storybook: ${storybookLink}`,
    `<a href="${allArtifactsUrl}">all artifacts</a>`,
  ];
  const hiddenContent = `<ul>${contentRows
    .map((row) => `<li>${row}</li>`)
    .join('\n')}</ul>`;
  const exposedContent = `Builds ready [${SHORT_SHA1}]`;
  const artifactsBody = `<details><summary>${exposedContent}</summary>${hiddenContent}</details>`;

  const benchmarkResults = {};
  for (const platform of platforms) {
    const benchmarkPath = path.resolve(
      __dirname,
      '..',
      path.join('test-artifacts', platform, 'benchmark', 'pageload.json'),
    );
    try {
      const data = await fs.readFile(benchmarkPath, 'utf8');
      const benchmark = JSON.parse(data);
      benchmarkResults[platform] = benchmark;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`No benchmark data found for ${platform}; skipping`);
      } else {
        console.error(
          `Error encountered processing benchmark data for '${platform}': '${error}'`,
        );
      }
    }
  }

  const summaryPlatform = 'chrome';
  const summaryPage = 'home';
  let commentBody;
  if (benchmarkResults[summaryPlatform]) {
    try {
      const summaryPageLoad = Math.round(
        parseFloat(benchmarkResults[summaryPlatform][summaryPage].average.load),
      );
      const summaryPageLoadMarginOfError = Math.round(
        parseFloat(
          benchmarkResults[summaryPlatform][summaryPage].marginOfError.load,
        ),
      );
      const benchmarkSummary = `Page Load Metrics (${summaryPageLoad} ± ${summaryPageLoadMarginOfError} ms)`;

      const allPlatforms = new Set();
      const allPages = new Set();
      const allMetrics = new Set();
      const allMeasures = new Set();
      for (const platform of Object.keys(benchmarkResults)) {
        allPlatforms.add(platform);
        const platformBenchmark = benchmarkResults[platform];
        const pages = Object.keys(platformBenchmark);
        for (const page of pages) {
          allPages.add(page);
          const pageBenchmark = platformBenchmark[page];
          const measures = Object.keys(pageBenchmark);
          for (const measure of measures) {
            allMeasures.add(measure);
            const measureBenchmark = pageBenchmark[measure];
            const metrics = Object.keys(measureBenchmark);
            for (const metric of metrics) {
              allMetrics.add(metric);
            }
          }
        }
      }

      const tableRows = [];
      for (const platform of allPlatforms) {
        const pageRows = [];
        for (const page of allPages) {
          const metricRows = [];
          for (const metric of allMetrics) {
            let metricData = `<td>${metric}</td>`;
            for (const measure of allMeasures) {
              metricData += `<td align="right">${Math.round(
                parseFloat(benchmarkResults[platform][page][measure][metric]),
              )}</td>`;
            }
            metricRows.push(metricData);
          }
          metricRows[0] = `<td rowspan="${
            allMetrics.size
          }">${capitalizeFirstLetter(page)}</td>${metricRows[0]}`;
          pageRows.push(...metricRows);
        }
        pageRows[0] = `<td rowspan="${
          allPages.size * allMetrics.size
        }">${capitalizeFirstLetter(platform)}</td>${pageRows[0]}`;
        for (const row of pageRows) {
          tableRows.push(`<tr>${row}</tr>`);
        }
      }

      const benchmarkTableHeaders = ['Platform', 'Page', 'Metric'];
      for (const measure of allMeasures) {
        benchmarkTableHeaders.push(`${capitalizeFirstLetter(measure)} (ms)`);
      }
      const benchmarkTableHeader = `<thead><tr>${benchmarkTableHeaders
        .map((header) => `<th>${header}</th>`)
        .join('')}</tr></thead>`;
      const benchmarkTableBody = `<tbody>${tableRows.join('')}</tbody>`;
      const benchmarkTable = `<table>${benchmarkTableHeader}${benchmarkTableBody}</table>`;
      const benchmarkBody = `<details><summary>${benchmarkSummary}</summary>${benchmarkTable}</details>`;
      commentBody = `${artifactsBody}${benchmarkBody}`;
    } catch (error) {
      console.error(`Error constructing benchmark results: '${error}'`);
      commentBody = artifactsBody;
    }
  } else {
    console.log(`No results for ${summaryPlatform} found; skipping benchmark`);
    commentBody = artifactsBody;
  }

  const JSON_PAYLOAD = JSON.stringify({ body: commentBody });
  const POST_COMMENT_URI = `https://api.github.com/repos/metamask/metamask-extension/issues/${CIRCLE_PR_NUMBER}/comments`;
  console.log(`Announcement:\n${commentBody}`);
  console.log(`Posting to: ${POST_COMMENT_URI}`);

  const response = await fetch(POST_COMMENT_URI, {
    method: 'POST',
    body: JSON_PAYLOAD,
    headers: {
      'User-Agent': 'metamaskbot',
      'Authorization': `token ${GITHUB_COMMENT_TOKEN}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Post comment failed with status '${response.statusText}'`);
  }
}
