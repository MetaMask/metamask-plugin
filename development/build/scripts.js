const EventEmitter = require('events');
const path = require('path');
const gulp = require('gulp');
const watch = require('gulp-watch');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const log = require('fancy-log');
const lavamoat = require('lavamoat-browserify');
const watchify = require('watchify');
const browserify = require('browserify');
const envify = require('loose-envify/custom');
const sourcemaps = require('gulp-sourcemaps');
const terser = require('gulp-terser-js');
const babelify = require('babelify');
const brfs = require('brfs');
const pify = require('pify');
const endOfStream = pify(require('end-of-stream'));
const labeledStreamSplicer = require('labeled-stream-splicer').obj;

const metamaskrc = require('rc')('metamask', {
  INFURA_PROJECT_ID: process.env.INFURA_PROJECT_ID,
  SEGMENT_HOST: process.env.SEGMENT_HOST,
  SEGMENT_WRITE_KEY: process.env.SEGMENT_WRITE_KEY,
  SEGMENT_LEGACY_WRITE_KEY: process.env.SEGMENT_LEGACY_WRITE_KEY,
  SENTRY_DSN_DEV:
    process.env.SENTRY_DSN_DEV ||
    'https://f59f3dd640d2429d9d0e2445a87ea8e1@sentry.io/273496',
});

const { version } = require('../../package.json');

const packageJSON = require('../../package.json');
const {
  createTask,
  composeParallel,
  composeSeries,
  runInChildProcess,
} = require('./task');

module.exports = createScriptTasks;

const dependencies = Object.keys(
  (packageJSON && packageJSON.dependencies) || {},
);
const materialUIDependencies = ['@material-ui/core'];
const reactDepenendencies = dependencies.filter((dep) => dep.match(/react/u));

const externalDependenciesMap = {
  background: ['3box'],
  ui: [...materialUIDependencies, ...reactDepenendencies],
};

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
  const deps = {
    background: createTasksForBuildJsDeps({
      label: 'bg-libs',
      key: 'background',
    }),
    ui: createTasksForBuildJsDeps({ label: 'ui-libs', key: 'ui' }),
  };

  // high level tasks

  const prod = composeParallel(deps.background, deps.ui, core.prod);

  const { dev, testDev } = core;

  const test = composeParallel(deps.background, deps.ui, core.test);

  return { prod, dev, testDev, test };

  function createTasksForBuildJsDeps({ key, label }) {
    return createTask(
      `scripts:deps:${key}`,
      createNormalBundle({
        label,
        destFilepath: `${label}.js`,
        modulesToExpose: externalDependenciesMap[key],
        devMode: false,
        browserPlatforms,
      }),
    );
  }

  function createTasksForBuildJsExtension({ taskPrefix, devMode, testing }) {
    const standardBundles = [
      'background',
      'ui',
      'phishing-detect',
      'initSentry',
    ];

    const standardSubtasks = standardBundles.map((label) => {
      let extraEntries;
      if (devMode && label === 'ui') {
        extraEntries = ['./development/require-react-devtools.js'];
      }
      return createTask(
        `${taskPrefix}:${label}`,
        createBundleTaskForBuildJsExtensionNormal({
          label,
          devMode,
          testing,
          extraEntries,
        }),
      );
    });

    // inpage must be built before contentscript
    // because inpage bundle result is included inside contentscript
    const contentscriptSubtask = createTask(
      `${taskPrefix}:contentscript`,
      createTaskForBuildJsExtensionContentscript({ devMode, testing }),
    );

    // this can run whenever
    const disableConsoleSubtask = createTask(
      `${taskPrefix}:disable-console`,
      createTaskForBuildJsExtensionDisableConsole({ devMode }),
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
      ...standardSubtasks,
      contentscriptSubtask,
      disableConsoleSubtask,
    ].map((subtask) => runInChildProcess(subtask));
    // const allSubtasks = [...standardSubtasks, contentscriptSubtask].map(subtask => (subtask))
    // make a parent task that runs each task in a child thread
    return composeParallel(initiateLiveReload, ...allSubtasks);
  }

  function createBundleTaskForBuildJsExtensionNormal({
    label,
    devMode,
    testing,
    extraEntries,
  }) {
    return createNormalBundle({
      label,
      entryFilepath: `./app/scripts/${label}.js`,
      destFilepath: `${label}.js`,
      extraEntries,
      externalDependencies: devMode
        ? undefined
        : externalDependenciesMap[label],
      devMode,
      testing,
      browserPlatforms,
    });
  }

  function createTaskForBuildJsExtensionDisableConsole({ devMode }) {
    const label = 'disable-console';
    return createNormalBundle({
      label,
      entryFilepath: `./app/scripts/${label}.js`,
      destFilepath: `${label}.js`,
      devMode,
      browserPlatforms,
    });
  }

  function createTaskForBuildJsExtensionContentscript({ devMode, testing }) {
    const inpage = 'inpage';
    const contentscript = 'contentscript';
    return composeSeries(
      createNormalBundle({
        label: inpage,
        entryFilepath: `./app/scripts/${inpage}.js`,
        destFilepath: `${inpage}.js`,
        externalDependencies: devMode
          ? undefined
          : externalDependenciesMap[inpage],
        devMode,
        testing,
        browserPlatforms,
      }),
      createNormalBundle({
        label: contentscript,
        entryFilepath: `./app/scripts/${contentscript}.js`,
        destFilepath: `${contentscript}.js`,
        externalDependencies: devMode
          ? undefined
          : externalDependenciesMap[contentscript],
        devMode,
        testing,
        browserPlatforms,
      }),
    );
  }
}

function createNormalBundle({
  label,
  destFilepath,
  entryFilepath,
  extraEntries = [],
  modulesToExpose,
  externalDependencies,
  devMode,
  testing,
  browserPlatforms,
}) {
  return async function () {
    // create bundler setup and apply defaults
    const buildConfiguration = createBuildConfiguration();
    const { bundlerOpts, events } = buildConfiguration;

    const envVars = getEnvironmentVariables({ devMode, testing });
    setupBundlerDefaults(buildConfiguration, {
      devMode,
      envVars,
    });

    const lavamoatTargets = ['background'];

    if (lavamoatTargets.includes(label)) {
      Object.assign(bundlerOpts, lavamoat.args);
    }

    const lavamoatOpts = {
      policy: path.resolve(__dirname, '../../lavamoat/browserify/policy.json'),
      policyOverride: path.resolve(
        __dirname,
        '../../lavamoat/browserify/policy-override.json',
      ),
      writeAutoPolicy: process.env.WRITE_AUTO_POLICY,
    };

    // apply lavamoat protections to UI
    if (lavamoatTargets.includes(label)) {
      bundlerOpts.plugin.push([lavamoat, lavamoatOpts]);
    }

    // set bundle entries
    bundlerOpts.entries = [...extraEntries];
    if (entryFilepath) {
      bundlerOpts.entries.push(entryFilepath);
    }

    if (modulesToExpose) {
      bundlerOpts.require = bundlerOpts.require.concat(modulesToExpose);
    }

    if (externalDependencies) {
      // there doesnt seem to be a standard bify option for this
      // so we'll put it here but manually call it after bundle
      bundlerOpts.manualExternal = bundlerOpts.manualExternal.concat(
        externalDependencies,
      );
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
  const events = new EventEmitter();
  const bundlerOpts = {
    entries: [],
    transform: [],
    plugin: [],
    require: [],
    // not a standard bify option
    manualExternal: [],
  };
  return { bundlerOpts, events };
}

function setupBundlerDefaults(buildConfiguration, { devMode, envVars }) {
  const { bundlerOpts } = buildConfiguration;
  // devMode options
  const reloadOnChange = Boolean(devMode);
  const minify = Boolean(devMode) === false;

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
  const { events } = buildConfiguration;
  events.on('configurePipeline', ({ pipeline }) => {
    pipeline.get('minify').push(
      terser({
        mangle: {
          reserved: ['MetamaskInpageProvider'],
        },
        sourceMap: {
          content: true,
        },
      }),
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
  const { bundlerOpts, events } = buildConfiguration;
  const bundler = browserify(bundlerOpts);
  // manually apply non-standard option
  bundler.external(bundlerOpts.manualExternal);
  // output build logs to terminal
  bundler.on('log', log);
  // forward update event (used by watchify)
  bundler.on('update', () => performBundle());
  await performBundle();

  async function performBundle() {
    // this pipeline is created for every bundle
    // the labels are all the steps you can hook into
    const pipeline = labeledStreamSplicer([
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
    METAMASK_VERSION: version,
    NODE_ENV: devMode ? 'development' : 'production',
    IN_TEST: testing ? 'true' : false,
    PUBNUB_SUB_KEY: process.env.PUBNUB_SUB_KEY || '',
    PUBNUB_PUB_KEY: process.env.PUBNUB_PUB_KEY || '',
    CONF: devMode ? metamaskrc : {},
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

function beep() {
  process.stdout.write('\x07');
}

function gracefulError(err) {
  console.warn(err);
  beep();
}
