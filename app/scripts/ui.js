// polyfills
import 'abortcontroller-polyfill/dist/polyfill-patch-fetch';
import '@formatjs/intl-relativetimeformat/polyfill';
import '@formatjs/intl-numberformat/polyfill';

import { EventEmitter } from 'events';
import PortStream from 'extension-port-stream';
import extension from 'extensionizer';

import Dnode from 'dnode';
import Eth from 'ethjs';
import EthQuery from 'eth-query';
import StreamProvider from 'web3-stream-provider';
import log from 'loglevel';
import launchMetaMaskUi from '../../ui';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
} from '../../shared/constants/app';
import ExtensionPlatform from './platforms/extension';
import { setupMultiplex } from './lib/stream-utils';
import { getEnvironmentType } from './lib/util';

start().catch(log.error);

async function start() {
  // create platform global
  global.platform = new ExtensionPlatform();

  // identify window type (popup, notification)
  const windowType = getEnvironmentType();

  // setup stream to background
  const extensionPort = extension.runtime.connect({ name: windowType });
  const connectionStream = new PortStream(extensionPort);

  const activeTab = await queryCurrentActiveTab(windowType);
  initializeUiWithTab(activeTab);

  function displayCriticalError(container, err) {
    container.innerHTML =
      '<div class="critical-error">The MetaMask app failed to load: please open and close MetaMask again to restart.</div>';
    container.style.height = '80px';
    log.error(err.stack);
    throw err;
  }

  function initializeUiWithTab(tab) {
    const container = document.getElementById('app-content');
    initializeUi(tab, container, connectionStream, (err, store) => {
      if (err) {
        displayCriticalError(container, err);
        return;
      }

      const state = store.getState();
      const { metamask: { completedOnboarding } = {} } = state;

      if (!completedOnboarding && windowType !== ENVIRONMENT_TYPE_FULLSCREEN) {
        global.platform.openExtensionInBrowser();
      }
    });
  }
}

async function queryCurrentActiveTab(windowType) {
  return new Promise((resolve) => {
    // At the time of writing we only have the `activeTab` permission which means
    // that this query will only succeed in the popup context (i.e. after a "browserAction")
    if (windowType !== ENVIRONMENT_TYPE_POPUP) {
      resolve({});
      return;
    }

    extension.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const [activeTab] = tabs;
      const { id, title, url } = activeTab;
      const { origin, protocol } = url ? new URL(url) : {};

      if (!origin || origin === 'null') {
        resolve({});
        return;
      }

      resolve({ id, title, origin, protocol, url });
    });
  });
}

function initializeUi(activeTab, container, connectionStream, cb) {
  connectToAccountManager(connectionStream, (err, backgroundConnection) => {
    if (err) {
      cb(err);
      return;
    }

    launchMetaMaskUi(
      {
        activeTab,
        container,
        backgroundConnection,
      },
      cb,
    );
  });
}

/**
 * Establishes a connection to the background and a Web3 provider
 *
 * @param {PortDuplexStream} connectionStream - PortStream instance establishing a background connection
 * @param {Function} cb - Called when controller connection is established
 */
function connectToAccountManager(connectionStream, cb) {
  const mx = setupMultiplex(connectionStream);
  setupControllerConnection(mx.createStream('controller'), cb);
  setupWeb3Connection(mx.createStream('provider'));
}

/**
 * Establishes a streamed connection to a Web3 provider
 *
 * @param {PortDuplexStream} connectionStream - PortStream instance establishing a background connection
 */
function setupWeb3Connection(connectionStream) {
  const providerStream = new StreamProvider();
  providerStream.pipe(connectionStream).pipe(providerStream);
  connectionStream.on('error', console.error.bind(console));
  providerStream.on('error', console.error.bind(console));
  global.ethereumProvider = providerStream;
  global.ethQuery = new EthQuery(providerStream);
  global.eth = new Eth(providerStream);
}

/**
 * Establishes a streamed connection to the background account manager
 *
 * @param {PortDuplexStream} connectionStream - PortStream instance establishing a background connection
 * @param {Function} cb - Called when the remote account manager connection is established
 */
function setupControllerConnection(connectionStream, cb) {
  const eventEmitter = new EventEmitter();
  // the "weak: false" option is for nodejs only (eg unit tests)
  // it is a workaround for node v12 support
  const backgroundDnode = Dnode(
    {
      sendUpdate(state) {
        eventEmitter.emit('update', state);
      },
    },
    { weak: false },
  );
  connectionStream.pipe(backgroundDnode).pipe(connectionStream);
  backgroundDnode.once('remote', function (backgroundConnection) {
    backgroundConnection.on = eventEmitter.on.bind(eventEmitter);
    cb(null, backgroundConnection);
  });
}
