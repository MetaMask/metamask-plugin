import copyToClipboard from 'copy-to-clipboard';
import log from 'loglevel';
import { clone } from 'lodash';
import React from 'react';
import { render } from 'react-dom';
import { getEnvironmentType } from '../app/scripts/lib/util';
import { ALERT_TYPES } from '../shared/constants/alerts';
import { SENTRY_STATE } from '../app/scripts/lib/setupSentry';
import { ENVIRONMENT_TYPE_POPUP } from '../shared/constants/app';
import Root from './app/pages';
import * as actions from './app/store/actions';
import configureStore from './app/store/store';
import txHelper from './lib/tx-helper';
import {
  fetchLocale,
  loadFormatLocaleData,
} from './app/helpers/utils/i18n-helper';
import switchDirection from './app/helpers/utils/switch-direction';
import {
  getPermittedAccountsForCurrentTab,
  getSelectedAddress,
} from './app/selectors';
import { ALERT_STATE } from './app/ducks/alerts';
import {
  getUnconnectedAccountAlertEnabledness,
  getUnconnectedAccountAlertShown,
} from './app/ducks/metamask/metamask';

log.setLevel(global.METAMASK_DEBUG ? 'debug' : 'warn');

export default function launchMetamaskUi(opts, cb) {
  const { backgroundConnection } = opts;
  actions._setBackgroundConnection(backgroundConnection);
  // check if we are unlocked first
  backgroundConnection.getState(function (err, metamaskState) {
    if (err) {
      cb(err);
      return;
    }
    startApp(metamaskState, backgroundConnection, opts).then((store) => {
      setupDebuggingHelpers(store);
      cb(null, store);
    });
  });
}

async function startApp(metamaskState, backgroundConnection, opts) {
  // parse opts
  if (!metamaskState.featureFlags) {
    metamaskState.featureFlags = {};
  }

  const currentLocaleMessages = metamaskState.currentLocale
    ? await fetchLocale(metamaskState.currentLocale)
    : {};
  const enLocaleMessages = await fetchLocale('en');

  await loadFormatLocaleData('en');
  if (metamaskState.currentLocale) {
    await loadFormatLocaleData(metamaskState.currentLocale);
  }

  if (metamaskState.textDirection === 'rtl') {
    await switchDirection('rtl');
  }

  const draftInitialState = {
    activeTab: opts.activeTab,

    // metamaskState represents the cross-tab state
    metamask: metamaskState,

    // appState represents the current tab's popup state
    appState: {},

    localeMessages: {
      current: currentLocaleMessages,
      en: enLocaleMessages,
    },
  };

  if (getEnvironmentType() === ENVIRONMENT_TYPE_POPUP) {
    const { origin } = draftInitialState.activeTab;
    const permittedAccountsForCurrentTab = getPermittedAccountsForCurrentTab(
      draftInitialState,
    );
    const selectedAddress = getSelectedAddress(draftInitialState);
    const unconnectedAccountAlertShownOrigins = getUnconnectedAccountAlertShown(
      draftInitialState,
    );
    const unconnectedAccountAlertIsEnabled = getUnconnectedAccountAlertEnabledness(
      draftInitialState,
    );

    if (
      origin &&
      unconnectedAccountAlertIsEnabled &&
      !unconnectedAccountAlertShownOrigins[origin] &&
      permittedAccountsForCurrentTab.length > 0 &&
      !permittedAccountsForCurrentTab.includes(selectedAddress)
    ) {
      draftInitialState[ALERT_TYPES.unconnectedAccount] = {
        state: ALERT_STATE.OPEN,
      };
      actions.setUnconnectedAccountAlertShown(origin);
    }
  }

  const store = configureStore(draftInitialState);

  // if unconfirmed txs, start on txConf page
  const unapprovedTxsAll = txHelper(
    metamaskState.unapprovedTxs,
    metamaskState.unapprovedMsgs,
    metamaskState.unapprovedPersonalMsgs,
    metamaskState.unapprovedDecryptMsgs,
    metamaskState.unapprovedEncryptionPublicKeyMsgs,
    metamaskState.unapprovedTypedMessages,
    metamaskState.network,
    metamaskState.provider.chainId,
  );
  const numberOfUnapprovedTx = unapprovedTxsAll.length;
  if (numberOfUnapprovedTx > 0) {
    store.dispatch(
      actions.showConfTxPage({
        id: unapprovedTxsAll[0].id,
      }),
    );
  }

  backgroundConnection.on('update', function (state) {
    store.dispatch(actions.updateMetamaskState(state));
  });

  // global metamask api - used by tooling
  global.metamask = {
    updateCurrentLocale: (code) => {
      store.dispatch(actions.updateCurrentLocale(code));
    },
    setProviderType: (type) => {
      store.dispatch(actions.setProviderType(type));
    },
    setFeatureFlag: (key, value) => {
      store.dispatch(actions.setFeatureFlag(key, value));
    },
  };

  // start app
  render(<Root store={store} />, opts.container);

  return store;
}

/**
 * Return a "masked" copy of the given object.
 *
 * The returned object includes only the properties present in the mask. The
 * mask is an object that mirrors the structure of the given object, except
 * the only values are `true` or a sub-mask. `true` implies the property
 * should be included, and a sub-mask implies the property should be further
 * masked according to that sub-mask.
 *
 * @param {Object} object - The object to mask
 * @param {Object<Object|boolean>} mask - The mask to apply to the object
 */
function maskObject(object, mask) {
  return Object.keys(object).reduce((state, key) => {
    if (mask[key] === true) {
      state[key] = object[key];
    } else if (mask[key]) {
      state[key] = maskObject(object[key], mask[key]);
    }
    return state;
  }, {});
}

function setupDebuggingHelpers(store) {
  window.getCleanAppState = function () {
    const state = clone(store.getState());
    state.version = global.platform.getVersion();
    state.browser = window.navigator.userAgent;
    return state;
  };
  window.getSentryState = function () {
    const fullState = store.getState();
    const debugState = maskObject(fullState, SENTRY_STATE);
    return {
      browser: window.navigator.userAgent,
      store: debugState,
      version: global.platform.getVersion(),
    };
  };
}

window.logStateString = function (cb) {
  const state = window.getCleanAppState();
  global.platform.getPlatformInfo((err, platform) => {
    if (err) {
      cb(err);
      return;
    }
    state.platform = platform;
    const stateString = JSON.stringify(state, null, 2);
    cb(null, stateString);
  });
};

window.logState = function (toClipboard) {
  return window.logStateString((err, result) => {
    if (err) {
      console.error(err.message);
    } else if (toClipboard) {
      copyToClipboard(result);
      console.log('State log copied');
    } else {
      console.log(result);
    }
  });
};
