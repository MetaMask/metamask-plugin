import assert from 'assert';
import extension from 'extensionizer';
import { stripHexPrefix } from 'ethereumjs-util';
import BN from 'bn.js';
import { memoize } from 'lodash';

import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_BACKGROUND,
  PLATFORM_FIREFOX,
  PLATFORM_OPERA,
  PLATFORM_CHROME,
  PLATFORM_EDGE,
  PLATFORM_BRAVE,
} from '../../../shared/constants/app';

/**
 * @see {@link getEnvironmentType}
 */
const getEnvironmentTypeMemo = memoize((url) => {
  const parsedUrl = new URL(url);
  if (parsedUrl.pathname === '/popup.html') {
    return ENVIRONMENT_TYPE_POPUP;
  } else if (['/home.html', '/phishing.html'].includes(parsedUrl.pathname)) {
    return ENVIRONMENT_TYPE_FULLSCREEN;
  } else if (parsedUrl.pathname === '/notification.html') {
    return ENVIRONMENT_TYPE_NOTIFICATION;
  }
  return ENVIRONMENT_TYPE_BACKGROUND;
});

/**
 * Returns the window type for the application
 *
 *  - `popup` refers to the extension opened through the browser app icon (in top right corner in chrome and firefox)
 *  - `fullscreen` refers to the main browser window
 *  - `notification` refers to the popup that appears in its own window when taking action outside of metamask
 *  - `background` refers to the background page
 *
 * NOTE: This should only be called on internal URLs.
 *
 * @param {string} [url] - the URL of the window
 * @returns {string} the environment ENUM
 */
const getEnvironmentType = (url = window.location.href) =>
  getEnvironmentTypeMemo(url);

/**
 * Returns the platform (browser) where the extension is running.
 *
 * @returns {string} the platform ENUM
 *
 */
const getPlatform = (_) => {
  const ua = window.navigator.userAgent;
  if (ua.search('Firefox') === -1) {
    if (window && window.chrome && window.chrome.ipcRenderer) {
      return PLATFORM_BRAVE;
    }
    if (ua.search('Edge') !== -1) {
      return PLATFORM_EDGE;
    }
    if (ua.search('OPR') !== -1) {
      return PLATFORM_OPERA;
    }
    return PLATFORM_CHROME;
  }
  return PLATFORM_FIREFOX;
};

/**
 * Checks whether a given balance of ETH, represented as a hex string, is sufficient to pay a value plus a gas fee
 *
 * @param {Object} txParams - Contains data about a transaction
 * @param {string} txParams.gas - The gas for a transaction
 * @param {string} txParams.gasPrice - The price per gas for the transaction
 * @param {string} txParams.value - The value of ETH to send
 * @param {string} hexBalance - A balance of ETH represented as a hex string
 * @returns {boolean} Whether the balance is greater than or equal to the value plus the value of gas times gasPrice
 *
 */
function sufficientBalance(txParams, hexBalance) {
  // validate hexBalance is a hex string
  assert.equal(
    typeof hexBalance,
    'string',
    'sufficientBalance - hexBalance is not a hex string',
  );
  assert.equal(
    hexBalance.slice(0, 2),
    '0x',
    'sufficientBalance - hexBalance is not a hex string',
  );

  const balance = hexToBn(hexBalance);
  const value = hexToBn(txParams.value);
  const gasLimit = hexToBn(txParams.gas);
  const gasPrice = hexToBn(txParams.gasPrice);

  const maxCost = value.add(gasLimit.mul(gasPrice));
  return balance.gte(maxCost);
}

/**
 * Converts a hex string to a BN object
 *
 * @param {string} inputHex - A number represented as a hex string
 * @returns {Object} A BN object
 *
 */
function hexToBn(inputHex) {
  return new BN(stripHexPrefix(inputHex), 16);
}

/**
 * Used to multiply a BN by a fraction
 *
 * @param {BN} targetBN - The number to multiply by a fraction
 * @param {number|string} numerator - The numerator of the fraction multiplier
 * @param {number|string} denominator - The denominator of the fraction multiplier
 * @returns {BN} The product of the multiplication
 *
 */
function BnMultiplyByFraction(targetBN, numerator, denominator) {
  const numBN = new BN(numerator);
  const denomBN = new BN(denominator);
  return targetBN.mul(numBN).div(denomBN);
}

/**
 * Returns an Error if extension.runtime.lastError is present
 * this is a workaround for the non-standard error object that's used
 * @returns {Error|undefined}
 */
function checkForError() {
  const { lastError } = extension.runtime;
  if (!lastError) {
    return undefined;
  }
  // if it quacks like an Error, its an Error
  if (lastError.stack && lastError.message) {
    return lastError;
  }
  // repair incomplete error object (eg chromium v77)
  return new Error(lastError.message);
}

/**
 * Prefixes a hex string with '0x' or '-0x' and returns it. Idempotent.
 *
 * @param {string} str - The string to prefix.
 * @returns {string} The prefixed string.
 */
const addHexPrefix = (str) => {
  if (typeof str !== 'string' || str.match(/^-?0x/u)) {
    return str;
  }

  if (str.match(/^-?0X/u)) {
    return str.replace('0X', '0x');
  }

  if (str.startsWith('-')) {
    return str.replace('-', '-0x');
  }

  return `0x${str}`;
};

/**
 * Converts a BN object to a hex string with a '0x' prefix
 *
 * @param {BN} inputBn - The BN to convert to a hex string
 * @returns {string} - A '0x' prefixed hex string
 *
 */
function bnToHex(inputBn) {
  return addHexPrefix(inputBn.toString(16));
}

/**
 * Excerpts a string with <keep> chars
 * @param  {string} text    Text to be shortened
 * @param  {int} keep       How many chars to keep
 * @return {string}         Excerpted or full string
 */
function excerpts(text, keep) {
  const kept = keep || 256;
  if (text && text.length > kept) {
    return `${text.slice(0, kept - 1)}...`;
  }
  return text;
}

export {
  getPlatform,
  getEnvironmentType,
  sufficientBalance,
  hexToBn,
  BnMultiplyByFraction,
  checkForError,
  addHexPrefix,
  bnToHex,
  excerpts,
};
