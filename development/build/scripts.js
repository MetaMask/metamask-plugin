const { callbackify } = require('util');
const path = require('path');
const { writeFileSync, readFileSync } = require('fs');
const EventEmitter = require('events');
const gulp = require('gulp');
const watch = require('gulp-watch');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const log = require('fancy-log');
const browserify = require('browserify');
const watchify = require('watchify');
const babelify = require('babelify');
const brfs = require('brfs');
const envify = require('loose-envify/custom');
const sourcemaps = require('gulp-sourcemaps');
const applySourceMap = require('vinyl-sourcemaps-apply');
const pify = require('pify');
const through = require('through2');
const endOfStream = pify(require('end-of-stream'));
const labeledStreamSplicer = require('labeled-stream-splicer').obj;
const wrapInStream = require('pumpify').obj;
const Sqrl = require('squirrelly');
const lavaPack = require('@lavamoat/lavapack');
const terser = require('terser');

const bifyModuleGroups = require('bify-module-groups');

const metamaskrc = require('rc')('metamask', {
  INFURA_PROJECT_ID: process.env.INFURA_PROJECT_ID,
  SEGMENT_HOST: process.env.SEGMENT_HOST,
  SEGMENT_WRITE_KEY: process.env.SEGMENT_WRITE_KEY,
  SEGMENT_LEGACY_WRITE_KEY: process.env.SEGMENT_LEGACY_WRITE_KEY,
  SENTRY_DSN_DEV:
    process.env.SENTRY_DSN_DEV ||
    'https://f59f3dd640d2429d9d0e2445a87ea8e1@sentry.io/273496',
});

const { streamFlatMap } = require('../stream-flat-map.js');
const baseManifest = require('../../app/manifest/_base.json');
const {
  createTask,
  composeParallel,
  composeSeries,
  runInChildProcess,
} = require('./task');

module.exports = createScriptTasks;

function createScriptTasks({ browserPlatforms, livereload }) {
  // internal tasks
  const core = {
    // dev tasks (live reload)
    dev: createTasksForBuildJsExtension({
      taskPrefix: 'scripts:core:dev',
      devMode: true,
    }),
    testDev: createTasksForBuildJsExtension({
      taskPrefix: 'scripts:core:test-live',
      devMode: true,
      testing: true,
    }),
    // built for CI tests
    test: createTasksForBuildJsExtension({
      taskPrefix: 'scripts:core:test',
      testing: true,
    }),
    // production
    prod: createTasksForBuildJsExtension({ taskPrefix: 'scripts:core:prod' }),
  };

  // high level tasks

  const { dev, test, testDev, prod } = core;
  return { dev, test, testDev, prod };

  function createTasksForBuildJsExtension({ taskPrefix, devMode, testing }) {
    const standardEntryPoints = ['background', 'ui', 'phishing-detect'];
    const standardSubtask = createTask(
      `${taskPrefix}:standardEntryPoints`,
      createFactoredBuild({
        entryFiles: standardEntryPoints.map(
          (label) => `./app/scripts/${label}.js`,
        ),
        devMode,
        testing,
        browserPlatforms,
      }),
    );

    // inpage must be built before contentscript
    // because inpage bundle result is included inside contentscript
    const contentscriptSubtask = createTask(
      `${taskPrefix}:contentscript`,
      createTaskForBundleContentscript({ devMode, testing }),
    );

    // this can run whenever
    const disableConsoleSubtask = createTask(
      `${taskPrefix}:disable-console`,
      createTaskForBundleDisableConsole({ devMode }),
    );

    // this can run whenever
    const installSentrySubtask = createTask(
      `${taskPrefix}:sentry`,
      createTaskForBundleSentry({ devMode }),
    );

    // task for initiating browser livereload
    const initiateLiveReload = async () => {
      if (devMode) {
        // trigger live reload when the bundles are updated
        // this is not ideal, but overcomes the limitations:
        // - run from the main process (not child process tasks)
        // - after the first build has completed (thus the timeout)
        // - build tasks never "complete" when run with livereload + child process
        setTimeout(() => {
          watch('./dist/*/*.js', (event) => {
            livereload.changed(event.path);
          });
        }, 75e3);
      }
    };

    // make each bundle run in a separate process
    const allSubtasks = [
      standardSubtask,
      contentscriptSubtask,
      disableConsoleSubtask,
      installSentrySubtask,
    ].map((subtask) => runInChildProcess(subtask));
    // make a parent task that runs each task in a child thread
    return composeParallel(initiateLiveReload, ...allSubtasks);
  }

  function createTaskForBundleDisableConsole({ devMode }) {
    const label = 'disable-console';
    return createNormalBundle({
      label,
      entryFilepath: `./app/scripts/${label}.js`,
      destFilepath: `${label}.js`,
      devMode,
      browserPlatforms,
    });
  }

  function createTaskForBundleSentry({ devMode }) {
    const label = 'sentry-install';
    return createNormalBundle({
      label,
      entryFilepath: `./app/scripts/${label}.js`,
      destFilepath: `${label}.js`,
      devMode,
      browserPlatforms,
    });
  }

  // the "contentscript" bundle contains the "inpage" bundle
  function createTaskForBundleContentscript({ devMode, testing }) {
    const inpage = 'inpage';
    const contentscript = 'contentscript';
    return composeSeries(
      createNormalBundle({
        label: inpage,
        entryFilepath: `./app/scripts/${inpage}.js`,
        destFilepath: `${inpage}.js`,
        devMode,
        testing,
        browserPlatforms,
      }),
      createNormalBundle({
        label: contentscript,
        entryFilepath: `./app/scripts/${contentscript}.js`,
        destFilepath: `${contentscript}.js`,
        devMode,
        testing,
        browserPlatforms,
      }),
    );
  }
}

function createFactoredBuild({
  entryFiles,
  devMode,
  testing,
  browserPlatforms,
}) {
  return async function () {
    // create bundler setup and apply defaults
    const buildConfiguration = createBuildConfiguration();
    buildConfiguration.label = 'primary';
    const { bundlerOpts, events } = buildConfiguration;

    // devMode options
    const reloadOnChange = Boolean(devMode);
    const minify = Boolean(devMode) === false;

    const envVars = getEnvironmentVariables({ devMode, testing });
    setupBundlerDefaults(buildConfiguration, {
      devMode,
      envVars,
      reloadOnChange,
      minify,
    });

    // set bundle entries
    bundlerOpts.entries = [...entryFiles];

    // setup bundle factoring with bify-module-groups plugin
    Object.assign(bundlerOpts, bifyModuleGroups.plugin.args);
    bundlerOpts.plugin = [...bundlerOpts.plugin, [bifyModuleGroups.plugin]];

    // instrument pipeline
    let sizeGroupMap;
    events.on('configurePipeline', ({ pipeline }) => {
      // to be populated by the group-by-size transform
      sizeGroupMap = new Map();
      pipeline.get('groups').unshift(
        // factor modules
        bifyModuleGroups.groupByFactor({
          entryFileToLabel(filepath) {
            return path.parse(filepath).name;
          },
        }),
        // cap files at 2 mb
        bifyModuleGroups.groupBySize({
          sizeLimit: 2e6,
          groupingMap: sizeGroupMap,
        }),
      );
      pipeline.get('vinyl').unshift(
        // convert each module group into a stream with a single vinyl file
        streamFlatMap((moduleGroup) => {
          const filename = `${moduleGroup.label}.js`;
          const childStream = wrapInStream(
            moduleGroup.stream,
            lavaPack({ raw: true, hasExports: true, includePrelude: false }),
            source(filename),
          );
          return childStream;
        }),
        buffer(),
      );
      // setup bundle destination
      browserPlatforms.forEach((platform) => {
        const dest = `./dist/${platform}/`;
        pipeline.get('dest').push(gulp.dest(dest));
      });
    });

    // wait for bundle completion for postprocessing
    events.on('bundleDone', () => {
      const commonSet = sizeGroupMap.get('common');
      // create entry points for each file
      for (const [groupLabel, groupSet] of sizeGroupMap.entries()) {
        // skip "common" group, they are added tp all other groups
        if (groupSet === commonSet) continue;

        switch (groupLabel) {
          case 'ui': {
            renderHtmlFile('popup', groupSet, commonSet, browserPlatforms);
            renderHtmlFile(
              'notification',
              groupSet,
              commonSet,
              browserPlatforms,
            );
            renderHtmlFile('home', groupSet, commonSet, browserPlatforms);
            break;
          }
          case 'phishing-detect': {
            renderHtmlFile('phishing', groupSet, commonSet, browserPlatforms);
            break;
          }
          case 'background': {
            renderHtmlFile('background', groupSet, commonSet, browserPlatforms);
            break;
          }
          default: {
            throw new Error(`buildsys - unknown groupLabel "${groupLabel}"`);
          }
        }
      }
    });

    await bundleIt(buildConfiguration);
  };
}

function createNormalBundle({
  label,
  destFilepath,
  entryFilepath,
  extraEntries = [],
  modulesToExpose,
  devMode,
  testing,
  browserPlatforms,
}) {
  return async function () {
    // create bundler setup and apply defaults
    const buildConfiguration = createBuildConfiguration();
    buildConfiguration.label = label;
    const { bundlerOpts, events } = buildConfiguration;

    // devMode options
    const reloadOnChange = Boolean(devMode);
    const minify = Boolean(devMode) === false;

    const envVars = getEnvironmentVariables({ devMode, testing });
    setupBundlerDefaults(buildConfiguration, {
      devMode,
      envVars,
      reloadOnChange,
      minify,
    });

    // set bundle entries
    bundlerOpts.entries = [...extraEntries];
    if (entryFilepath) {
      bundlerOpts.entries.push(entryFilepath);
    }

    if (modulesToExpose) {
      bundlerOpts.require = bundlerOpts.require.concat(modulesToExpose);
    }

    // instrument pipeline
    events.on('configurePipeline', ({ pipeline }) => {
      // convert bundle stream to gulp vinyl stream
      // and ensure file contents are buffered
      pipeline.get('vinyl').push(source(destFilepath));
      pipeline.get('vinyl').push(buffer());
      // setup bundle destination
      browserPlatforms.forEach((platform) => {
        const dest = `./dist/${platform}/`;
        pipeline.get('dest').push(gulp.dest(dest));
      });
    });

    await bundleIt(buildConfiguration);
  };
}

function createBuildConfiguration() {
  const label = '(unnamed bundle)';
  const events = new EventEmitter();
  const bundlerOpts = {
    entries: [],
    transform: [],
    plugin: [],
    require: [],
    // non-standard bify options
    manualExternal: [],
    manualIgnore: [],
  };
  return { label, bundlerOpts, events };
}

function setupBundlerDefaults(
  buildConfiguration,
  { devMode, envVars, reloadOnChange, minify },
) {
  const { bundlerOpts } = buildConfiguration;

  Object.assign(bundlerOpts, {
    // source transforms
    transform: [
      // transpile top-level code
      babelify,
      // inline `fs.readFileSync` files
      brfs,
    ],
    // use entryFilepath for moduleIds, easier to determine origin file
    fullPaths: devMode,
    // for sourcemaps
    debug: true,
  });

  // ensure react-devtools are not included in non-dev builds
  if (!devMode) {
    bundlerOpts.manualIgnore.push('react-devtools');
  }

  // inject environment variables via node-style `process.env`
  if (envVars) {
    bundlerOpts.transform.push([envify(envVars), { global: true }]);
  }

  // setup reload on change
  if (reloadOnChange) {
    setupReloadOnChange(buildConfiguration);
  }

  if (minify) {
    setupMinification(buildConfiguration);
  }

  // setup source maps
  setupSourcemaps(buildConfiguration, { devMode });
}

function setupReloadOnChange({ bundlerOpts, events }) {
  // add plugin to options
  Object.assign(bundlerOpts, {
    plugin: [...bundlerOpts.plugin, watchify],
    // required by watchify
    cache: {},
    packageCache: {},
  });
  // instrument pipeline
  events.on('configurePipeline', ({ bundleStream }) => {
    // handle build error to avoid breaking build process
    // (eg on syntax error)
    bundleStream.on('error', (err) => {
      gracefulError(err);
    });
  });
}

function setupMinification(buildConfiguration) {
  const minifyOpts = {
    mangle: {
      reserved: ['MetamaskInpageProvider'],
    },
  };
  const { events } = buildConfiguration;
  events.on('configurePipeline', ({ pipeline }) => {
    pipeline.get('minify').push(
      // this is the "gulp-terser-js" wrapper around the latest version of terser
      through.obj(
        callbackify(async (file, _enc) => {
          const input = {
            [file.sourceMap.file]: file.contents.toString(),
          };
          const opts = {
            sourceMap: {
              filename: file.sourceMap.file,
              content: file.sourceMap,
            },
            ...minifyOpts,
          };
          const res = await terser.minify(input, opts);
          file.contents = Buffer.from(res.code);
          applySourceMap(file, res.map);
          return file;
        }),
      ),
    );
  });
}

function setupSourcemaps(buildConfiguration, { devMode }) {
  const { events } = buildConfiguration;
  events.on('configurePipeline', ({ pipeline }) => {
    pipeline.get('sourcemaps:init').push(sourcemaps.init({ loadMaps: true }));
    pipeline
      .get('sourcemaps:write')
      // Use inline source maps for development due to Chrome DevTools bug
      // https://bugs.chromium.org/p/chromium/issues/detail?id=931675
      .push(
        devMode
          ? sourcemaps.write()
          : sourcemaps.write('../sourcemaps', { addComment: false }),
      );
  });
}

async function bundleIt(buildConfiguration) {
  const { label, bundlerOpts, events } = buildConfiguration;
  const bundler = browserify(bundlerOpts);
  // manually apply non-standard options
  bundler.external(bundlerOpts.manualExternal);
  bundler.ignore(bundlerOpts.manualIgnore);
  // output build logs to terminal
  bundler.on('log', log);
  // forward update event (used by watchify)
  bundler.on('update', () => performBundle());

  console.log(`bundle start: "${label}"`);
  await performBundle();
  console.log(`bundle end: "${label}"`);

  async function performBundle() {
    // this pipeline is created for every bundle
    // the labels are all the steps you can hook into
    const pipeline = labeledStreamSplicer([
      'groups',
      [],
      'vinyl',
      [],
      'sourcemaps:init',
      [],
      'minify',
      [],
      'sourcemaps:write',
      [],
      'dest',
      [],
    ]);
    const bundleStream = bundler.bundle();
    // trigger build pipeline instrumentations
    events.emit('configurePipeline', { pipeline, bundleStream });
    // start bundle, send into pipeline
    bundleStream.pipe(pipeline);
    // nothing will consume pipeline, so let it flow
    pipeline.resume();

    await endOfStream(pipeline);

    // call the completion event to handle any post-processing
    events.emit('bundleDone');
  }
}

function getEnvironmentVariables({ devMode, testing }) {
  const environment = getEnvironment({ devMode, testing });
  if (environment === 'production' && !process.env.SENTRY_DSN) {
    throw new Error('Missing SENTRY_DSN environment variable');
  }
  return {
    METAMASK_DEBUG: devMode,
    METAMASK_ENVIRONMENT: environment,
    METAMASK_VERSION: baseManifest.version,
    NODE_ENV: devMode ? 'development' : 'production',
    IN_TEST: testing ? 'true' : false,
    PUBNUB_SUB_KEY: process.env.PUBNUB_SUB_KEY || '',
    PUBNUB_PUB_KEY: process.env.PUBNUB_PUB_KEY || '',
    CONF: devMode ? metamaskrc : {},
    SHOW_EIP_1559_UI:
      process.env.SHOW_EIP_1559_UI === '1' ||
      metamaskrc.SHOW_EIP_1559_UI === '1',
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_DSN_DEV: metamaskrc.SENTRY_DSN_DEV,
    INFURA_PROJECT_ID: testing
      ? '00000000000000000000000000000000'
      : metamaskrc.INFURA_PROJECT_ID,
    SEGMENT_HOST: metamaskrc.SEGMENT_HOST,
    // When we're in the 'production' environment we will use a specific key only set in CI
    // Otherwise we'll use the key from .metamaskrc or from the environment variable. If
    // the value of SEGMENT_WRITE_KEY that we envify is undefined then no events will be tracked
    // in the build. This is intentional so that developers can contribute to MetaMask without
    // inflating event volume.
    SEGMENT_WRITE_KEY:
      environment === 'production'
        ? process.env.SEGMENT_PROD_WRITE_KEY
        : metamaskrc.SEGMENT_WRITE_KEY,
    SEGMENT_LEGACY_WRITE_KEY:
      environment === 'production'
        ? process.env.SEGMENT_PROD_LEGACY_WRITE_KEY
        : metamaskrc.SEGMENT_LEGACY_WRITE_KEY,
  };
}

function getEnvironment({ devMode, testing }) {
  // get environment slug
  if (devMode) {
    return 'development';
  } else if (testing) {
    return 'testing';
  } else if (process.env.CIRCLE_BRANCH === 'master') {
    return 'production';
  } else if (
    /^Version-v(\d+)[.](\d+)[.](\d+)/u.test(process.env.CIRCLE_BRANCH)
  ) {
    return 'release-candidate';
  } else if (process.env.CIRCLE_BRANCH === 'develop') {
    return 'staging';
  } else if (process.env.CIRCLE_PULL_REQUEST) {
    return 'pull-request';
  }
  return 'other';
}

function renderHtmlFile(htmlName, groupSet, commonSet, browserPlatforms) {
  const htmlFilePath = `./app/${htmlName}.html`;
  const htmlTemplate = readFileSync(htmlFilePath, 'utf8');
  const jsBundles = [...commonSet.values(), ...groupSet.values()].map(
    (label) => `./${label}.js`,
  );
  const htmlOutput = Sqrl.render(htmlTemplate, { jsBundles });
  browserPlatforms.forEach((platform) => {
    const dest = `./dist/${platform}/${htmlName}.html`;
    // we dont have a way of creating async events atm
    writeFileSync(dest, htmlOutput);
  });
}

function beep() {
  process.stdout.write('\x07');
}

function gracefulError(err) {
  console.warn(err);
  beep();
}
