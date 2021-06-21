import React, { useState } from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import classnames from 'classnames';
import { formatSwapsValueForDisplay } from '../swaps.util';
import { calcTokenAmount } from '../../../../shared/modules/token-utils';

export default function ExchangeRateDisplay({
  primaryTokenValue,
  primaryTokenDecimals = 18,
  primaryTokenSymbol,
  secondaryTokenValue,
  secondaryTokenDecimals = 18,
  secondaryTokenSymbol,
  arrowColor = 'black',
  boldSymbols = true,
  className,
}) {
  const [showPrimaryToSecondary, setShowPrimaryToSecondary] = useState(true);
  const [rotating, setRotating] = useState(false);

  const primaryTokenAmount = calcTokenAmount(
    primaryTokenValue,
    primaryTokenDecimals,
  );
  const secondaryTokenAmount = calcTokenAmount(
    secondaryTokenValue,
    secondaryTokenDecimals,
  );

  const conversionRateFromPrimaryToSecondary = new BigNumber(
    secondaryTokenAmount,
  )
    .div(primaryTokenAmount)
    .round(9)
    .toString(10);
  const conversionRateFromSecondaryToPrimary = new BigNumber(primaryTokenAmount)
    .div(secondaryTokenAmount)
    .round(9)
    .toString(10);

  const baseSymbol = showPrimaryToSecondary
    ? primaryTokenSymbol
    : secondaryTokenSymbol;
  const ratiodSymbol = showPrimaryToSecondary
    ? secondaryTokenSymbol
    : primaryTokenSymbol;

  const rate = showPrimaryToSecondary
    ? conversionRateFromPrimaryToSecondary
    : conversionRateFromSecondaryToPrimary;
  let rateToDisplay;
  let comparisonSymbol = '=';

  if (new BigNumber(rate, 10).lt('0.00000001', 10)) {
    rateToDisplay = '0.000000001';
    comparisonSymbol = '<';
  } else if (new BigNumber(rate, 10).lt('0.000001', 10)) {
    rateToDisplay = rate;
  } else {
    rateToDisplay = formatSwapsValueForDisplay(rate);
  }

  return (
    <div className={classnames('exchange-rate-display', className)}>
      <span>1</span>
      <span
        className={classnames({ 'exchange-rate-display__bold': boldSymbols })}
      >
        {baseSymbol}
      </span>
      <span>{comparisonSymbol}</span>
      <span>{rateToDisplay}</span>
      <span
        className={classnames({ 'exchange-rate-display__bold': boldSymbols })}
      >
        {ratiodSymbol}
      </span>
      <div
        className={classnames('exchange-rate-display__switch-arrows', {
          'exchange-rate-display__switch-arrows-rotate': rotating,
        })}
        onClick={() => {
          setShowPrimaryToSecondary(!showPrimaryToSecondary);
          setRotating(true);
        }}
        onAnimationEnd={() => setRotating(false)}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 13 13"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.15294 4.38514H9.99223L8.50853 5.86884C8.30421 6.07297 8.30421 6.40418 8.50853 6.60869C8.61069 6.71085 8.74443 6.76203 8.87836 6.76203C9.01229 6.76203 9.14603 6.71085 9.24819 6.60869L11.6249 4.23219C11.649 4.20803 11.6707 4.1814 11.6899 4.15305C11.6947 4.14563 11.6981 4.13726 11.7025 4.12965C11.7154 4.10815 11.7282 4.08646 11.7381 4.06325C11.7426 4.05222 11.7447 4.04043 11.7487 4.0292C11.7558 4.00827 11.7636 3.98754 11.7681 3.96547C11.775 3.93161 11.7786 3.89717 11.7786 3.86198C11.7786 3.82678 11.775 3.79235 11.7681 3.75849C11.7638 3.73642 11.756 3.71568 11.7487 3.69476C11.7447 3.68353 11.7428 3.67174 11.7381 3.6607C11.7282 3.63749 11.7156 3.616 11.7025 3.59431C11.6981 3.5867 11.6947 3.57833 11.6899 3.57091C11.6707 3.54256 11.649 3.51593 11.6249 3.49177L9.24876 1.11564C9.04444 0.911322 8.71342 0.911322 8.50891 1.11564C8.30459 1.31977 8.30459 1.65098 8.50891 1.85549L9.99223 3.339H4.15294C2.22978 3.339 0.665039 4.90374 0.665039 6.8269C0.665039 7.11588 0.899227 7.35007 1.1882 7.35007C1.47718 7.35007 1.71137 7.11588 1.71137 6.8269C1.71137 5.48037 2.80659 4.38514 4.15294 4.38514ZM12.2066 6.57445C11.9177 6.57445 11.6835 6.80864 11.6835 7.09762C11.6835 8.44396 10.5883 9.53919 9.24191 9.53919H3.40262L4.88632 8.05549C5.09064 7.85136 5.09064 7.52014 4.88632 7.31563C4.682 7.11112 4.35098 7.11131 4.14647 7.31563L1.76977 9.69233C1.74561 9.71649 1.72393 9.74312 1.70471 9.77147C1.70015 9.7787 1.69691 9.78669 1.69273 9.79392C1.6796 9.81561 1.66647 9.83748 1.65677 9.86126C1.6524 9.87211 1.6503 9.88371 1.64631 9.89475C1.63927 9.91586 1.63128 9.93679 1.62671 9.95905C1.61986 9.99291 1.61625 10.0273 1.61625 10.0625C1.61625 10.0977 1.61986 10.1322 1.62671 10.166C1.63109 10.1883 1.63908 10.2092 1.64631 10.2303C1.6503 10.2414 1.65221 10.253 1.65677 10.2638C1.66666 10.2874 1.6796 10.3093 1.69273 10.3312C1.69691 10.3384 1.70015 10.3464 1.70471 10.3536C1.72393 10.382 1.74561 10.4086 1.76977 10.4328L4.14609 12.8091C4.24825 12.9112 4.38199 12.9624 4.51592 12.9624C4.64985 12.9624 4.78359 12.9112 4.88575 12.8091C5.09007 12.6049 5.09007 12.2737 4.88575 12.0692L3.40243 10.5857H9.24172C11.1649 10.5857 12.7296 9.02097 12.7296 7.09781C12.7298 6.80864 12.4956 6.57445 12.2066 6.57445Z"
            fill={arrowColor}
          />
        </svg>
      </div>
    </div>
  );
}

ExchangeRateDisplay.propTypes = {
  primaryTokenValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(BigNumber),
  ]).isRequired,
  primaryTokenDecimals: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  primaryTokenSymbol: PropTypes.string.isRequired,
  secondaryTokenValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(BigNumber),
  ]).isRequired,
  secondaryTokenDecimals: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  secondaryTokenSymbol: PropTypes.string.isRequired,
  className: PropTypes.string,
  arrowColor: PropTypes.string,
  boldSymbols: PropTypes.bool,
};
