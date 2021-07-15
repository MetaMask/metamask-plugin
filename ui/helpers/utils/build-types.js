import betaJson from '../../../app/build-types/beta/beta-mascot.json';

const assetList = {
  main: {
    metafoxLogoHorizontalDark: '/images/logo/metamask-logo-horizontal.svg',
    // Will use default provided by the @metamask/logo library
    foxMeshJson: undefined,
  },
  beta: {
    metafoxLogoHorizontalDark: '/images/logo/metamask-logo-horizontal-dark.svg',
    foxMeshJson: betaJson,
  },
};

export function isBeta() {
  return process.env.METAMASK_BUILD_TYPE === 'beta';
}

// Returns a specific version of an asset based on
// the current metamask version (i.e. main, beta, etc.)
export function getBuildSpecificAsset(assetName) {
  const buildType = process.env.METAMASK_BUILD_TYPE;
  if (!assetList[buildType] || !assetList[buildType][assetName]) {
    console.warn(
      `Cannot find asset for build ${buildType}: ${assetName}, returning main build asset`,
    );
    return assetList.main[assetName];
  }
  return assetList[buildType][assetName];
}
