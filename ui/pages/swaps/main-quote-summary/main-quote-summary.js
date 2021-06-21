import React from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import Tooltip from '../../../components/ui/tooltip';
import UrlIcon from '../../../components/ui/url-icon';
import ExchangeRateDisplay from '../exchange-rate-display';
import { formatSwapsValueForDisplay } from '../swaps.util';
import { calcTokenAmount } from '../../../../shared/modules/token-utils';
import { toPrecisionWithoutTrailingZeros } from '../../../../shared/modules/conversion-util';

function getFontSizesAndLineHeights(fontSizeScore) {
  if (fontSizeScore <= 9) {
    return [60, 48];
  }
  if (fontSizeScore <= 13) {
    return [40, 32];
  }
  return [26, 15];
}

export default function MainQuoteSummary({
  sourceValue,
  sourceSymbol,
  sourceDecimals,
  sourceIconUrl,
  destinationValue,
  destinationSymbol,
  destinationDecimals,
  destinationIconUrl,
}) {
  const sourceAmount = toPrecisionWithoutTrailingZeros(
    calcTokenAmount(sourceValue, sourceDecimals).toString(10),
    12,
  );
  const destinationAmount = calcTokenAmount(
    destinationValue,
    destinationDecimals,
  );

  const amountToDisplay = formatSwapsValueForDisplay(destinationAmount);
  const amountDigitLength = amountToDisplay.match(/\d+/gu).join('').length;
  const [numberFontSize, lineHeight] = getFontSizesAndLineHeights(
    amountDigitLength,
  );
  let ellipsedAmountToDisplay = amountToDisplay;

  if (amountDigitLength > 20) {
    ellipsedAmountToDisplay = `${amountToDisplay.slice(0, 20)}...`;
  }

  return (
    <div className="main-quote-summary">
      <div className="main-quote-summary__details">
        <div className="main-quote-summary__quote-details-top">
          <div className="main-quote-summary__source-row">
            <span
              className="main-quote-summary__source-row-value"
              title={formatSwapsValueForDisplay(sourceAmount)}
            >
              {formatSwapsValueForDisplay(sourceAmount)}
            </span>
            <UrlIcon
              url={sourceIconUrl}
              className="main-quote-summary__icon"
              name={sourceSymbol}
              fallbackClassName="main-quote-summary__icon-fallback"
            />
            <span
              className="main-quote-summary__source-row-symbol"
              title={sourceSymbol}
            >
              {sourceSymbol}
            </span>
          </div>
          <img
            className="main-quote-summary__down-arrow"
            src="images/down-arrow-grey.svg"
          />
          <div className="main-quote-summary__destination-row">
            <UrlIcon
              url={destinationIconUrl}
              className="main-quote-summary__icon"
              name={destinationSymbol}
              fallbackClassName="main-quote-summary__icon-fallback"
            />
            <span className="main-quote-summary__destination-row-symbol">
              {destinationSymbol}
            </span>
          </div>
          <div className="main-quote-summary__quote-large">
            <Tooltip
              interactive
              position="bottom"
              html={amountToDisplay}
              disabled={ellipsedAmountToDisplay === amountToDisplay}
              theme="white"
            >
              <span
                className="main-quote-summary__quote-large-number"
                style={{
                  fontSize: numberFontSize,
                  lineHeight: `${lineHeight}px`,
                }}
              >
                {`${ellipsedAmountToDisplay}`}
              </span>
            </Tooltip>
          </div>
        </div>
        <div className="main-quote-summary__exchange-rate-container">
          <ExchangeRateDisplay
            primaryTokenValue={sourceValue}
            primaryTokenDecimals={sourceDecimals}
            primaryTokenSymbol={sourceSymbol}
            secondaryTokenValue={destinationValue}
            secondaryTokenDecimals={destinationDecimals}
            secondaryTokenSymbol={destinationSymbol}
            arrowColor="#037DD6"
            boldSymbols={false}
            className="main-quote-summary__exchange-rate-display"
          />
        </div>
      </div>
    </div>
  );
}

MainQuoteSummary.propTypes = {
  sourceValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(BigNumber),
  ]).isRequired,
  sourceDecimals: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sourceSymbol: PropTypes.string.isRequired,
  destinationValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(BigNumber),
  ]).isRequired,
  destinationDecimals: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  destinationSymbol: PropTypes.string.isRequired,
  sourceIconUrl: PropTypes.string,
  destinationIconUrl: PropTypes.string,
};
