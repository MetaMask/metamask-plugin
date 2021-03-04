// cross-browser connection to extension i18n API
import React from 'react';
import log from 'loglevel';
import * as Sentry from '@sentry/browser';

import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';

const fetchWithTimeout = getFetchWithTimeout(30000);

const warned = {};
const missingMessageErrors = {};
const missingSubstitutionErrors = {};

/**
 * Returns a localized message for the given key
 * @param {string} localeCode - The code for the current locale
 * @param {Object} localeMessages - The map of messages for the current locale
 * @param {string} key - The message key
 * @param {string[]} substitutions - A list of message substitution replacements
 * @returns {null|string} The localized message
 */
export const getMessage = (localeCode, localeMessages, key, substitutions) => {
  if (!localeMessages) {
    return null;
  }
  if (!localeMessages[key]) {
    if (localeCode === 'en') {
      if (!missingMessageErrors[key]) {
        missingMessageErrors[key] = new Error(
          `Unable to find value of key "${key}" for locale "${localeCode}"`,
        );
        Sentry.captureException(missingMessageErrors[key]);
        log.error(missingMessageErrors[key]);
        if (process.env.IN_TEST === 'true') {
          throw missingMessageErrors[key];
        }
      }
    } else if (!warned[localeCode] || !warned[localeCode][key]) {
      if (!warned[localeCode]) {
        warned[localeCode] = {};
      }
      warned[localeCode][key] = true;
      log.warn(
        `Translator - Unable to find value of key "${key}" for locale "${localeCode}"`,
      );
    }
    return null;
  }
  const entry = localeMessages[key];
  let phrase = entry.message;

  const hasSubstitutions = Boolean(substitutions && substitutions.length);
  const hasReactSubstitutions =
    hasSubstitutions &&
    substitutions.some(
      (element) =>
        element !== null &&
        (typeof element === 'function' || typeof element === 'object'),
    );

  // perform substitutions
  if (hasSubstitutions) {
    const parts = phrase.split(/(\$\d)/gu);

    const substitutedParts = parts.map((part) => {
      const subMatch = part.match(/\$(\d)/u);
      if (!subMatch) {
        return part;
      }
      const substituteIndex = Number(subMatch[1]) - 1;
      if (
        (substitutions[substituteIndex] === null ||
          substitutions[substituteIndex] === undefined) &&
        !missingSubstitutionErrors[localeCode]?.[key]
      ) {
        if (!missingSubstitutionErrors[localeCode]) {
          missingSubstitutionErrors[localeCode] = {};
        }
        missingSubstitutionErrors[localeCode][key] = true;
        const error = new Error(
          `Insufficient number of substitutions for key "${key}" with locale "${localeCode}"`,
        );
        log.error(error);
        Sentry.captureException(error);
      }
      return substitutions[substituteIndex];
    });

    phrase = hasReactSubstitutions ? (
      <span> {substitutedParts} </span>
    ) : (
      substitutedParts.join('')
    );
  }

  return phrase;
};

export async function fetchLocale(localeCode) {
  try {
    const response = await fetchWithTimeout(
      `./_locales/${localeCode}/messages.json`,
    );
    return await response.json();
  } catch (error) {
    log.error(`failed to fetch ${localeCode} locale because of ${error}`);
    return {};
  }
}

const numberFormatLocaleData = new Set();

async function loadNumberFormatLocaleData(localeCode) {
  const languageTag = localeCode.split('_')[0];
  if (
    Intl.NumberFormat &&
    typeof Intl.NumberFormat.__addLocaleData === 'function' &&
    !numberFormatLocaleData.has(languageTag)
  ) {
    // eslint-disable-next-line import/no-dynamic-require,node/global-require
    require(`./intl/${languageTag}/number-format-data`);
    numberFormatLocaleData.add(languageTag);
  }
}

const relativeTimeFormatLocaleData = new Set();

async function loadRelativeTimeFormatLocaleData(localeCode) {
  const languageTag = localeCode.split('_')[0];
  if (
    Intl.RelativeTimeFormat &&
    typeof Intl.RelativeTimeFormat.__addLocaleData === 'function' &&
    !relativeTimeFormatLocaleData.has(languageTag)
  ) {
    const localeData = await fetchRelativeTimeFormatData(languageTag);
    Intl.RelativeTimeFormat.__addLocaleData(localeData);
    relativeTimeFormatLocaleData.add(languageTag);
  }
}

async function fetchRelativeTimeFormatData(languageTag) {
  const response = await fetchWithTimeout(
    `./intl/${languageTag}/relative-time-format-data.json`,
  );
  return await response.json();
}

export async function loadFormatLocaleData(localeCode) {
  await loadNumberFormatLocaleData(localeCode);
  await loadRelativeTimeFormatLocaleData(localeCode);
}
