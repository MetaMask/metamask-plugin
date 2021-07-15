// Returns an object with browser as key and next version of beta
// as the value.  Ex: { firefox: '9.6.0.beta0', chrome: '9.6.0.1' }
function getNextBetaVersionMap(currentVersion, platforms) {
  // `yarn beta 3` would create version 9.x.x.3
  const [, premajor = '0'] = process.argv.slice(2);
  const [major, minor] = currentVersion.split('.');

  return platforms.reduce((platformMap, platform) => {
    platformMap[platform] = [
      // Keeps the current major
      major,
      // Bump the minor version
      Number(minor) + 1,
      // This isn't typically used
      0,
      // The beta number
      `${platform === 'firefox' ? 'beta' : ''}${premajor}`,
    ].join('.');
    return platformMap;
  }, {});
}

module.exports = {
  getNextBetaVersionMap,
};
