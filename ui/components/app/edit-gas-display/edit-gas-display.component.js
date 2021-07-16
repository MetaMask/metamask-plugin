import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import {
  GAS_RECOMMENDATIONS,
  EDIT_GAS_MODES,
} from '../../../../shared/constants/gas';

import Button from '../../ui/button';
import Typography from '../../ui/typography/typography';
import {
  COLORS,
  TYPOGRAPHY,
  FONT_WEIGHT,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';

import InfoTooltip from '../../ui/info-tooltip';
import ErrorMessage from '../../ui/error-message';
import TransactionTotalBanner from '../transaction-total-banner/transaction-total-banner.component';
import RadioGroup from '../../ui/radio-group/radio-group.component';
import AdvancedGasControls from '../advanced-gas-controls/advanced-gas-controls.component';
import ActionableMessage from '../../ui/actionable-message/actionable-message';

import { I18nContext } from '../../../contexts/i18n';

export default function EditGasDisplay({
  mode = EDIT_GAS_MODES.MODIFY_IN_PLACE,
  alwaysShowForm = false,
  showEducationButton = false,
  onEducationClick,
  dappSuggestedGasFee = 0,
  dappOrigin = '',
  defaultEstimateToUse,
  maxPriorityFeePerGas,
  setMaxPriorityFeePerGas,
  maxPriorityFeePerGasFiat,
  maxFeePerGas,
  setMaxFeePerGas,
  maxFeePerGasFiat,
  estimatedMaximumNative,
  isGasEstimatesLoading,
  gasFeeEstimates,
  gasEstimateType,
  gasPrice,
  setGasPrice,
  gasLimit,
  setGasLimit,
  estimateToUse,
  setEstimateToUse,
  estimatedMinimumFiat,
  estimatedMaximumFiat,
  isMaxFeeError,
  isMaxPriorityFeeError,
  isGasTooLow,
  dappSuggestedGasFeeAcknowledged,
  setDappSuggestedGasFeeAcknowledged,
  showAdvancedForm,
  setShowAdvancedForm,
  warning,
  balanceError,
}) {
  const t = useContext(I18nContext);

  const requireDappAcknowledgement = Boolean(
    dappSuggestedGasFee && !dappSuggestedGasFeeAcknowledged,
  );

  const showTopError = balanceError;

  let errorKey;
  if (balanceError) {
    errorKey = 'insufficientFunds';
  }

  return (
    <div className="edit-gas-display">
      <div className="edit-gas-display__content">
        {warning && (
          <div className="edit-gas-display__warning">
            <ActionableMessage
              className="actionable-message--warning"
              message={warning}
            />
          </div>
        )}
        {showTopError && (
          <div className="edit-gas-display__warning">
            <ErrorMessage errorKey={errorKey} />
          </div>
        )}
        {requireDappAcknowledgement && (
          <div className="edit-gas-display__dapp-acknowledgement-warning">
            <ActionableMessage
              className="actionable-message--warning"
              message={t('gasDisplayDappWarning', [dappOrigin])}
              useIcon
            />
          </div>
        )}
        {mode === EDIT_GAS_MODES.SPEED_UP && (
          <div className="edit-gas-display__top-tooltip">
            <Typography
              color={COLORS.BLACK}
              variant={TYPOGRAPHY.H8}
              fontWeight={FONT_WEIGHT.BOLD}
            >
              {t('speedUpTooltipText')}{' '}
              <InfoTooltip
                position="top"
                contentText={t('speedUpExplanation')}
              />
            </Typography>
          </div>
        )}
        <TransactionTotalBanner
          total={estimatedMinimumFiat}
          detail={
            process.env.SHOW_EIP_1559_UI &&
            t('editGasTotalBannerSubtitle', [
              <Typography
                fontWeight={FONT_WEIGHT.BOLD}
                tag="span"
                key="secondary"
              >
                {estimatedMaximumFiat}
              </Typography>,
              <Typography tag="span" key="primary">
                {estimatedMaximumNative}
              </Typography>,
            ])
          }
          timing=""
        />
        {requireDappAcknowledgement && (
          <Button
            className="edit-gas-display__dapp-acknowledgement-button"
            onClick={() => setDappSuggestedGasFeeAcknowledged(true)}
          >
            {t('gasDisplayAcknowledgeDappButtonText')}
          </Button>
        )}
        {isGasTooLow && (
          <div className="edit-gas-display__error">
            <Typography
              color={COLORS.ERROR1}
              variant={TYPOGRAPHY.H7}
              align={TEXT_ALIGN.CENTER}
            >
              {t('editGasTooLow')}
            </Typography>
          </div>
        )}
        {!requireDappAcknowledgement &&
          ![EDIT_GAS_MODES.SPEED_UP, EDIT_GAS_MODES.CANCEL].includes(mode) && (
            <RadioGroup
              name="gas-recommendation"
              options={[
                {
                  value: GAS_RECOMMENDATIONS.LOW,
                  label: t('editGasLow'),
                  recommended: defaultEstimateToUse === GAS_RECOMMENDATIONS.LOW,
                },
                {
                  value: GAS_RECOMMENDATIONS.MEDIUM,
                  label: t('editGasMedium'),
                  recommended:
                    defaultEstimateToUse === GAS_RECOMMENDATIONS.MEDIUM,
                },
                {
                  value: GAS_RECOMMENDATIONS.HIGH,
                  label: t('editGasHigh'),
                  recommended:
                    defaultEstimateToUse === GAS_RECOMMENDATIONS.HIGH,
                },
              ]}
              selectedValue={estimateToUse}
              onChange={setEstimateToUse}
            />
          )}
        {!alwaysShowForm && (
          <button
            className="edit-gas-display__advanced-button"
            onClick={() => setShowAdvancedForm(!showAdvancedForm)}
          >
            {t('advancedOptions')}{' '}
            {showAdvancedForm ? (
              <i className="fa fa-caret-up"></i>
            ) : (
              <i className="fa fa-caret-down"></i>
            )}
          </button>
        )}
        {!requireDappAcknowledgement &&
          (alwaysShowForm || showAdvancedForm) && (
            <AdvancedGasControls
              gasFeeEstimates={gasFeeEstimates}
              gasEstimateType={gasEstimateType}
              estimateToUse={estimateToUse}
              isGasEstimatesLoading={isGasEstimatesLoading}
              gasLimit={gasLimit}
              setGasLimit={setGasLimit}
              maxPriorityFee={maxPriorityFeePerGas}
              setMaxPriorityFee={setMaxPriorityFeePerGas}
              maxFee={maxFeePerGas}
              setMaxFee={setMaxFeePerGas}
              gasPrice={gasPrice}
              setGasPrice={setGasPrice}
              maxPriorityFeeFiat={maxPriorityFeePerGasFiat}
              maxFeeFiat={maxFeePerGasFiat}
              maxPriorityFeeError={
                isMaxPriorityFeeError ? t('editGasMaxPriorityFeeLow') : null
              }
              maxFeeError={isMaxFeeError ? t('editGasMaxFeeLow') : null}
            />
          )}
      </div>
      {!requireDappAcknowledgement && showEducationButton && (
        <div className="edit-gas-display__education">
          <button onClick={onEducationClick}>
            {t('editGasEducationButtonText')}
          </button>
        </div>
      )}
    </div>
  );
}

EditGasDisplay.propTypes = {
  alwaysShowForm: PropTypes.bool,
  mode: PropTypes.oneOf(Object.values(EDIT_GAS_MODES)),
  showEducationButton: PropTypes.bool,
  onEducationClick: PropTypes.func,
  dappSuggestedGasFee: PropTypes.number,
  dappOrigin: PropTypes.string,
  defaultEstimateToUse: PropTypes.oneOf(Object.values(GAS_RECOMMENDATIONS)),
  maxPriorityFeePerGas: PropTypes.string,
  setMaxPriorityFeePerGas: PropTypes.func,
  maxPriorityFeePerGasFiat: PropTypes.string,
  maxFeePerGas: PropTypes.string,
  setMaxFeePerGas: PropTypes.func,
  maxFeePerGasFiat: PropTypes.string,
  estimatedMaximumNative: PropTypes.string,
  isGasEstimatesLoading: PropTypes.boolean,
  gasFeeEstimates: PropTypes.object,
  gasEstimateType: PropTypes.string,
  gasPrice: PropTypes.string,
  setGasPrice: PropTypes.func,
  gasLimit: PropTypes.number,
  setGasLimit: PropTypes.func,
  estimateToUse: PropTypes.string,
  setEstimateToUse: PropTypes.func,
  estimatedMinimumFiat: PropTypes.string,
  estimatedMaximumFiat: PropTypes.string,
  isMaxFeeError: PropTypes.boolean,
  isMaxPriorityFeeError: PropTypes.boolean,
  isGasTooLow: PropTypes.boolean,
  dappSuggestedGasFeeAcknowledged: PropTypes.boolean,
  setDappSuggestedGasFeeAcknowledged: PropTypes.func,
  showAdvancedForm: PropTypes.bool,
  setShowAdvancedForm: PropTypes.func,
  warning: PropTypes.string,
  balanceError: PropTypes.bool,
};
