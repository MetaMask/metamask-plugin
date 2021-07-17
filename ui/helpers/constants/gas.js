export const GAS_FORM_ERRORS = {
  GAS_LIMIT_OUT_OF_BOUNDS: 'editGasLimitOutOfBounds',
  MAX_PRIORITY_FEE_TOO_LOW: 'editGasMaxPriorityFeeLow',
  MAX_FEE_TOO_LOW: 'editGasMaxFeeLow',
  MAX_PRIORITY_FEE_ZERO: 'editGasMaxPriorityFeeZeroError',
  MAX_PRIORITY_FEE_HIGH_WARNING: 'editGasMaxPriorityFeeHigh',
  MAX_FEE_HIGH_WARNING: 'editGasMaxFeeHigh',
};

export function getGasFormErrorText(type, t) {
  switch (type) {
    case GAS_FORM_ERRORS.GAS_LIMIT_OUT_OF_BOUNDS:
      return t('editGasLimitOutOfBounds');
    case GAS_FORM_ERRORS.MAX_PRIORITY_FEE_TOO_LOW:
      return t('editGasMaxPriorityFeeLow');
    case GAS_FORM_ERRORS.MAX_FEE_TOO_LOW:
      return t('editGasMaxFeeLow');
    case GAS_FORM_ERRORS.MAX_PRIORITY_FEE_ZERO:
      return t('editGasMaxPriorityFeeZeroError');
    case GAS_FORM_ERRORS.MAX_PRIORITY_FEE_HIGH_WARNING:
      return t('editGasMaxPriorityFeeHigh');
    case GAS_FORM_ERRORS.MAX_FEE_HIGH_WARNING:
      return t('editGasMaxFeeHigh');
    default:
      return '';
  }
}
