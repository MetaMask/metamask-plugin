const path = require('path');
const fs = require('fs-extra');
const watch = require('gulp-watch');
const glob = require('fast-glob');

const locales = require('../../app/_locales/index.json');

const { createTask, composeSeries } = require('./task');

module.exports = createStaticAssetTasks;

const copyTargets = [
  {
    src: `./app/_locales/`,
    dest: `_locales`,
  },
  {
    src: `./app/images/`,
    dest: `images`,
  },
  {
    src: `./node_modules/@metamask/contract-metadata/images/`,
    dest: `images/contract`,
  },
  {
    src: `./app/fonts/`,
    dest: `fonts`,
  },
  {
    src: `./app/vendor/`,
    dest: `vendor`,
  },
  {
    src: `./node_modules/@fortawesome/fontawesome-free/webfonts/`,
    dest: `fonts/fontawesome`,
  },
  {
    src: `./ui/app/css/output/`,
    pattern: `*.css`,
    dest: ``,
  },
  {
    src: `./app/`,
    pattern: `*.html`,
    dest: ``,
  },
  {
    src: `./node_modules/globalthis/dist/browser.js`,
    dest: `globalthis.js`,
  },
  {
    src: `./node_modules/ses/dist/lockdown.cjs`,
    dest: `lockdown.js`,
  },
  {
    src: `./app/scripts/`,
    pattern: `runLockdown.js`,
    dest: ``,
  },
];

const languageTags = new Set();
for (const locale of locales) {
  const { code } = locale;
  const tag = code.split('_')[0];
  languageTags.add(tag);
}

for (const tag of languageTags) {
  // use Intl.NumberFormat Norway 'nb' locale data since locale data for Norway 'no' dne
  copyTargets.push({
    src: `./node_modules/@formatjs/intl-numberformat/locale-data/${
      tag === 'no' ? 'nb' : tag
    }.js`,
    dest: `intl/${tag}/number-format-data.js`,
  });
  copyTargets.push({
    src: `./node_modules/@formatjs/intl-relativetimeformat/dist/locale-data/${tag}.json`,
    dest: `intl/${tag}/relative-time-format-data.json`,
  });
}

const copyTargetsDev = [
  ...copyTargets,
  {
    src: './app/scripts/',
    pattern: '/chromereload.js',
    dest: ``,
  },
];

function createStaticAssetTasks({ livereload, browserPlatforms }) {
  const prod = createTask(
    'static:prod',
    composeSeries(
      ...copyTargets.map((target) => {
        return async function copyStaticAssets() {
          await performCopy(target);
        };
      }),
    ),
  );
  const dev = createTask(
    'static:dev',
    composeSeries(
      ...copyTargetsDev.map((target) => {
        return async function copyStaticAssets() {
          await setupLiveCopy(target);
        };
      }),
    ),
  );

  return { dev, prod };

  async function setupLiveCopy(target) {
    const pattern = target.pattern || '/**/*';
    watch(target.src + pattern, (event) => {
      livereload.changed(event.path);
      performCopy(target);
    });
    await performCopy(target);
  }

  async function performCopy(target) {
    await Promise.all(
      browserPlatforms.map(async (platform) => {
        if (target.pattern) {
          await copyGlob(
            target.src,
            `${target.src}${target.pattern}`,
            `./dist/${platform}/${target.dest}`,
          );
        } else {
          await copyGlob(
            target.src,
            `${target.src}`,
            `./dist/${platform}/${target.dest}`,
          );
        }
      }),
    );
  }

  async function copyGlob(baseDir, srcGlob, dest) {
    const sources = await glob(srcGlob, { onlyFiles: false });
    await Promise.all(
      sources.map(async (src) => {
        const relativePath = path.relative(baseDir, src);
        await fs.copy(src, `${dest}${relativePath}`);
      }),
    );
  }
}
