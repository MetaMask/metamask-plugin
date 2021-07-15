const { promises: fs } = require('fs');
const path = require('path');
const { merge, cloneDeep } = require('lodash');

const baseManifest = require('../../app/manifest/_base.json');
const { version } = require('../../package.json');
const betaManifestModifications = require('../../app/manifest/_beta_modifications.json');

const { createTask, composeSeries } = require('./task');

module.exports = createManifestTasks;

function createManifestTasks({
  browserPlatforms,
  isBeta = false,
  betaVersionsMap = {},
}) {
  // merge base manifest with per-platform manifests
  const prepPlatforms = async () => {
    return Promise.all(
      browserPlatforms.map(async (platform) => {
        const platformModifications = await readJson(
          path.join(
            __dirname,
            '..',
            '..',
            'app',
            'manifest',
            `${platform}.json`,
          ),
        );
        const result = merge(
          cloneDeep(baseManifest),
          platformModifications,
          isBeta
            ? getBetaModifications(platform, betaVersionsMap)
            : { version },
        );
        const dir = path.join('.', 'dist', platform);
        await fs.mkdir(dir, { recursive: true });
        await writeJson(result, path.join(dir, 'manifest.json'));
      }),
    );
  };

  // dev: add perms
  const envDev = createTaskForModifyManifestForEnvironment((manifest) => {
    manifest.permissions = [...manifest.permissions, 'webRequestBlocking'];
  });

  // testDev: add perms
  const envTestDev = createTaskForModifyManifestForEnvironment((manifest) => {
    manifest.permissions = [
      ...manifest.permissions,
      'webRequestBlocking',
      'http://localhost/*',
    ];
  });

  // test: add permissions
  const envTest = createTaskForModifyManifestForEnvironment((manifest) => {
    manifest.permissions = [
      ...manifest.permissions,
      'webRequestBlocking',
      'http://localhost/*',
    ];
  });

  // high level manifest tasks
  const dev = createTask('manifest:dev', composeSeries(prepPlatforms, envDev));

  const testDev = createTask(
    'manifest:testDev',
    composeSeries(prepPlatforms, envTestDev),
  );

  const test = createTask(
    'manifest:test',
    composeSeries(prepPlatforms, envTest),
  );

  const prod = createTask('manifest:prod', prepPlatforms);

  return { prod, dev, testDev, test };

  // helper for modifying each platform's manifest.json in place
  function createTaskForModifyManifestForEnvironment(transformFn) {
    return () => {
      return Promise.all(
        browserPlatforms.map(async (platform) => {
          const manifestPath = path.join(
            '.',
            'dist',
            platform,
            'manifest.json',
          );
          const manifest = await readJson(manifestPath);
          transformFn(manifest);
          await writeJson(manifest, manifestPath);
        }),
      );
    };
  }
}

// helper for reading and deserializing json from fs
async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

// helper for serializing and writing json to fs
async function writeJson(obj, file) {
  return fs.writeFile(file, JSON.stringify(obj, null, 2));
}

function getBetaModifications(platform, betaVersionsMap) {
  const betaVersion = betaVersionsMap[platform];

  return {
    ...betaManifestModifications,
    version: betaVersion,
    ...(platform === 'firefox' ? {} : { version_name: 'beta' }),
  };
}
