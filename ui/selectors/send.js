import abi from 'human-standard-token-abi';
import { calcGasTotal } from '../../shared/modules/gas-utils';
import {
  getSelectedAccount,
  getTargetAccount,
  getAveragePriceEstimateInHexWEI,
} from '.';

export function getGasLimit(state) {
  return state.send.gasLimit || '0';
}

export function getGasPrice(state) {
  return state.send.gasPrice || getAveragePriceEstimateInHexWEI(state);
}

export function getGasTotal(state) {
  return calcGasTotal(getGasLimit(state), getGasPrice(state));
}

export function getPrimaryCurrency(state) {
  const sendToken = getSendToken(state);
  return sendToken?.symbol;
}

export function getSendToken(state) {
  return state.send.token;
}

export function getSendTokenAddress(state) {
  return getSendToken(state)?.address;
}

export function getSendTokenContract(state) {
  const sendTokenAddress = getSendTokenAddress(state);
  return sendTokenAddress
    ? global.eth.contract(abi).at(sendTokenAddress)
    : null;
}

export function getSendAmount(state) {
  return state.send.amount;
}

export function getSendHexData(state) {
  return state.send.data;
}

export function getSendEditingTransactionId(state) {
  return state.send.editingTransactionId;
}

export function getSendErrors(state) {
  return state.send.errors;
}

export function sendAmountIsInError(state) {
  return Boolean(state.send.errors.amount);
}

export function getSendFrom(state) {
  return state.send.from;
}

export function getSendFromBalance(state) {
  const fromAccount = getSendFromObject(state);
  return fromAccount.balance;
}

export function getSendFromObject(state) {
  const fromAddress = getSendFrom(state);
  return fromAddress
    ? getTargetAccount(state, fromAddress)
    : getSelectedAccount(state);
}

export function getSendMaxModeState(state) {
  return state.send.maxModeOn;
}

export function getSendTo(state) {
  return state.send.to;
}

export function getSendToNickname(state) {
  return state.send.toNickname;
}

export function getTokenBalance(state) {
  return state.send.tokenBalance;
}

export function getSendEnsResolution(state) {
  return state.send.ensResolution;
}

export function getSendEnsResolutionError(state) {
  return state.send.ensResolutionError;
}

export function getQrCodeData(state) {
  return state.appState.qrCodeData;
}

export function getGasLoadingError(state) {
  return state.send.errors.gasLoading;
}

export function gasFeeIsInError(state) {
  return Boolean(state.send.errors.gasFee);
}

export function getGasButtonGroupShown(state) {
  return state.send.gasButtonGroupShown;
}

export function getTitleKey(state) {
  const isEditing = Boolean(getSendEditingTransactionId(state));
  const isToken = Boolean(getSendToken(state));

  if (!getSendTo(state)) {
    return 'addRecipient';
  }

  if (isEditing) {
    return 'edit';
  } else if (isToken) {
    return 'sendTokens';
  }
  return 'send';
}

export function isSendFormInError(state) {
  return Object.values(getSendErrors(state)).some((n) => n);
}
