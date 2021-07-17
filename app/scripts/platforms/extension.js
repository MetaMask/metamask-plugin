import extension from 'extensionizer';
import { getBlockExplorerLink } from '@metamask/etherscan-link';
import { getEnvironmentType, checkForError } from '../lib/util';
import { ENVIRONMENT_TYPE_BACKGROUND } from '../../../shared/constants/app';
import { TRANSACTION_STATUSES } from '../../../shared/constants/transaction';

export default class ExtensionPlatform {
  //
  // Public
  //
  reload() {
    extension.runtime.reload();
  }

  openTab(options) {
    return new Promise((resolve, reject) => {
      extension.tabs.create(options, (newTab) => {
        const error = checkForError();
        if (error) {
          return reject(error);
        }
        return resolve(newTab);
      });
    });
  }

  openWindow(options) {
    return new Promise((resolve, reject) => {
      extension.windows.create(options, (newWindow) => {
        const error = checkForError();
        if (error) {
          return reject(error);
        }
        return resolve(newWindow);
      });
    });
  }

  focusWindow(windowId) {
    return new Promise((resolve, reject) => {
      extension.windows.update(windowId, { focused: true }, () => {
        const error = checkForError();
        if (error) {
          return reject(error);
        }
        return resolve();
      });
    });
  }

  updateWindowPosition(windowId, left, top) {
    return new Promise((resolve, reject) => {
      extension.windows.update(windowId, { left, top }, () => {
        const error = checkForError();
        if (error) {
          return reject(error);
        }
        return resolve();
      });
    });
  }

  getLastFocusedWindow() {
    return new Promise((resolve, reject) => {
      extension.windows.getLastFocused((windowObject) => {
        const error = checkForError();
        if (error) {
          return reject(error);
        }
        return resolve(windowObject);
      });
    });
  }

  closeCurrentWindow() {
    return extension.windows.getCurrent((windowDetails) => {
      return extension.windows.remove(windowDetails.id);
    });
  }

  getVersion() {
    return extension.runtime.getManifest().version;
  }

  openExtensionInBrowser(route = null, queryString = null) {
    let extensionURL = extension.runtime.getURL('home.html');

    if (queryString) {
      extensionURL += `?${queryString}`;
    }

    if (route) {
      extensionURL += `#${route}`;
    }
    this.openTab({ url: extensionURL });
    if (getEnvironmentType() !== ENVIRONMENT_TYPE_BACKGROUND) {
      window.close();
    }
  }

  getPlatformInfo(cb) {
    try {
      extension.runtime.getPlatformInfo((platform) => {
        cb(null, platform);
      });
    } catch (e) {
      cb(e);
      // eslint-disable-next-line no-useless-return
      return;
    }
  }

  showTransactionNotification(txMeta, rpcPrefs) {
    const { status, txReceipt: { status: receiptStatus } = {} } = txMeta;

    if (status === TRANSACTION_STATUSES.CONFIRMED) {
      // There was an on-chain failure
      receiptStatus === '0x0'
        ? this._showFailedTransaction(
            txMeta,
            'Transaction encountered an error.',
          )
        : this._showConfirmedTransaction(txMeta, rpcPrefs);
    } else if (status === TRANSACTION_STATUSES.FAILED) {
      this._showFailedTransaction(txMeta);
    }
  }

  getAllWindows() {
    return new Promise((resolve, reject) => {
      extension.windows.getAll((windows) => {
        const error = checkForError();
        if (error) {
          return reject(error);
        }
        return resolve(windows);
      });
    });
  }

  getActiveTabs() {
    return new Promise((resolve, reject) => {
      extension.tabs.query({ active: true }, (tabs) => {
        const error = checkForError();
        if (error) {
          return reject(error);
        }
        return resolve(tabs);
      });
    });
  }

  currentTab() {
    return new Promise((resolve, reject) => {
      extension.tabs.getCurrent((tab) => {
        const err = checkForError();
        if (err) {
          reject(err);
        } else {
          resolve(tab);
        }
      });
    });
  }

  switchToTab(tabId) {
    return new Promise((resolve, reject) => {
      extension.tabs.update(tabId, { highlighted: true }, (tab) => {
        const err = checkForError();
        if (err) {
          reject(err);
        } else {
          resolve(tab);
        }
      });
    });
  }

  closeTab(tabId) {
    return new Promise((resolve, reject) => {
      extension.tabs.remove(tabId, () => {
        const err = checkForError();
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  _showConfirmedTransaction(txMeta, rpcPrefs) {
    this._subscribeToNotificationClicked();

    const url = getBlockExplorerLink(txMeta, rpcPrefs);
    const nonce = parseInt(txMeta.txParams.nonce, 16);

    const title = 'Confirmed transaction';
    const message = `Transaction ${nonce} confirmed! ${
      url.length ? 'View on Etherscan' : ''
    }`;
    this._showNotification(title, message, url);
  }

  _showFailedTransaction(txMeta, errorMessage) {
    const nonce = parseInt(txMeta.txParams.nonce, 16);
    const title = 'Failed transaction';
    const message = `Transaction ${nonce} failed! ${
      errorMessage || txMeta.err.message
    }`;
    this._showNotification(title, message);
  }

  _showNotification(title, message, url) {
    extension.notifications.create(url, {
      type: 'basic',
      title,
      iconUrl: extension.extension.getURL('../../images/icon-64.png'),
      message,
    });
  }

  _subscribeToNotificationClicked() {
    if (!extension.notifications.onClicked.hasListener(this._viewOnEtherscan)) {
      extension.notifications.onClicked.addListener(this._viewOnEtherscan);
    }
  }

  _viewOnEtherscan(url) {
    if (url.startsWith('https://')) {
      extension.tabs.create({ url });
    }
  }
}
