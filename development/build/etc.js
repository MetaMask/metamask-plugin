const { promises: fs } = require('fs');
const gulp = require('gulp');
const gulpZip = require('gulp-zip');
const del = require('del');
const pify = require('pify');
const pump = pify(require('pump'));
const { version } = require('../../package.json');
const { createTask, composeParallel } = require('./task');

module.exports = createEtcTasks;

function createEtcTasks({
  browserPlatforms,
  livereload,
  isBeta,
  betaVersionsMap,
}) {
  const clean = createTask('clean', async function clean() {
    await del(['./dist/*']);
    await Promise.all(
      browserPlatforms.map(async (platform) => {
        await fs.mkdir(`./dist/${platform}`, { recursive: true });
      }),
    );
  });

  const reload = createTask('reload', function devReload() {
    livereload.listen({ port: 35729 });
  });

  // zip tasks for distribution
  const zip = createTask(
    'zip',
    composeParallel(
      ...browserPlatforms.map((platform) =>
        createZipTask(platform, isBeta ? betaVersionsMap[platform] : undefined),
      ),
    ),
  );

  return { clean, reload, zip };
}

function createZipTask(platform, betaVersion) {
  return async () => {
    let path = `metamask-${platform}-${version}`;
    if (betaVersion) {
      path = `metamask-BETA-${platform}-${betaVersion}`;
    }
    await pump(
      gulp.src(`dist/${platform}/**`),
      gulpZip(`${path}.zip`),
      gulp.dest('builds'),
    );
  };
}
