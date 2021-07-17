import { createAsyncThunk, createSlice, current } from '@reduxjs/toolkit';
import abi from 'human-standard-token-abi';
import contractMap from '@metamask/contract-metadata';
import BigNumber from 'bignumber.js';
import { addHexPrefix, toChecksumAddress } from 'ethereumjs-util';
import { debounce } from 'lodash';
import {
  conversionGreaterThan,
  conversionUtil,
  multiplyCurrencies,
  subtractCurrencies,
} from '../../../shared/modules/conversion.utils';
import { GAS_ESTIMATE_TYPES, GAS_LIMITS } from '../../../shared/constants/gas';
import {
  CONTRACT_ADDRESS_ERROR,
  INSUFFICIENT_FUNDS_ERROR,
  INSUFFICIENT_TOKENS_ERROR,
  INVALID_RECIPIENT_ADDRESS_ERROR,
  INVALID_RECIPIENT_ADDRESS_NOT_ETH_NETWORK_ERROR,
  KNOWN_RECIPIENT_ADDRESS_WARNING,
  MIN_GAS_LIMIT_HEX,
  NEGATIVE_ETH_ERROR,
} from '../../pages/send/send.constants';

import {
  addGasBuffer,
  calcGasTotal,
  generateTokenTransferData,
  isBalanceSufficient,
  isTokenBalanceSufficient,
} from '../../pages/send/send.utils';
import {
  getAddressBookEntry,
  getAdvancedInlineGasShown,
  getCurrentChainId,
  getGasPriceInHexWei,
  getIsMainnet,
  getSelectedAddress,
  getTargetAccount,
  getIsNonStandardEthChain,
} from '../../selectors';
import {
  disconnectGasFeeEstimatePoller,
  displayWarning,
  estimateGas,
  getGasFeeEstimatesAndStartPolling,
  hideLoadingIndication,
  showConfTxPage,
  showLoadingIndication,
  updateTokenType,
  updateTransaction,
} from '../../store/actions';
import { setCustomGasLimit } from '../gas/gas.duck';
import {
  QR_CODE_DETECTED,
  SELECTED_ACCOUNT_CHANGED,
  ACCOUNT_CHANGED,
  ADDRESS_BOOK_UPDATED,
  GAS_FEE_ESTIMATES_UPDATED,
} from '../../store/actionConstants';
import {
  calcTokenAmount,
  getTokenAddressParam,
  getTokenValueParam,
} from '../../helpers/utils/token-util';
import {
  checkExistingAddresses,
  isDefaultMetaMaskChain,
  isOriginContractAddress,
  isValidDomainName,
} from '../../helpers/utils/util';
import {
  getGasEstimateType,
  getTokens,
  getUnapprovedTxs,
} from '../metamask/metamask';
import { resetEnsResolution } from '../ens';
import {
  isBurnAddress,
  isValidHexAddress,
} from '../../../shared/modules/hexstring-utils';
import { CHAIN_ID_TO_GAS_LIMIT_BUFFER_MAP } from '../../../shared/constants/network';
import { ETH, GWEI } from '../../helpers/constants/common';
import { TRANSACTION_ENVELOPE_TYPES } from '../../../shared/constants/transaction';

// typedefs
/**
 * @typedef {import('@reduxjs/toolkit').PayloadAction} PayloadAction
 */

const name = 'send';

/**
 * The Stages that the send slice can be in
 * 1. INACTIVE - The send state is idle, and hasn't yet fetched required
 *  data for gasPrice and gasLimit estimations, etc.
 * 2. ADD_RECIPIENT - The user is selecting which address to send an asset to
 * 3. DRAFT - The send form is shown for a transaction yet to be sent to the
 *  Transaction Controller.
 * 4. EDIT - The send form is shown for a transaction already submitted to the
 *  Transaction Controller but not yet confirmed. This happens when a
 *  confirmation is shown for a transaction and the 'edit' button in the header
 *  is clicked.
 */
export const SEND_STAGES = {
  INACTIVE: 'INACTIVE',
  ADD_RECIPIENT: 'ADD_RECIPIENT',
  DRAFT: 'DRAFT',
  EDIT: 'EDIT',
};

/**
 * The status that the send slice can be in is either
 * 1. VALID - the transaction is valid and can be submitted
 * 2. INVALID - the transaction is invalid and cannot be submitted
 *
 * A number of cases would result in an invalid form
 * 1. The recipient is not yet defined
 * 2. The amount + gasTotal is greater than the user's balance when sending
 *  native currency
 * 3. The gasTotal is greater than the user's *native* balance
 * 4. The amount of sent asset is greater than the user's *asset* balance
 * 5. Gas price estimates failed to load entirely
 * 6. The gasLimit is less than 21000 (0x5208)
 */
export const SEND_STATUSES = {
  VALID: 'VALID',
  INVALID: 'INVALID',
};

/**
 * Controls what is displayed in the send-gas-row component.
 * 1. BASIC - Shows the basic estimate slow/avg/fast buttons when on mainnet
 *  and the metaswaps API request is successful.
 * 2. INLINE - Shows inline gasLimit/gasPrice fields when on any other network
 *  or metaswaps API fails and we use eth_gasPrice
 * 3. CUSTOM - Shows GasFeeDisplay component that is a read only display of the
 *  values the user has set in the advanced gas modal (stored in the gas duck
 *  under the customData key).
 */
export const GAS_INPUT_MODES = {
  BASIC: 'BASIC',
  INLINE: 'INLINE',
  CUSTOM: 'CUSTOM',
};

/**
 * The types of assets that a user can send
 * 1. NATIVE - The native asset for the current network, such as ETH
 * 2. TOKEN - An ERC20 token.
 */
export const ASSET_TYPES = {
  NATIVE: 'NATIVE',
  TOKEN: 'TOKEN',
};

/**
 * The modes that the amount field can be set by
 * 1. INPUT - the user provides the amount by typing in the field
 * 2. MAX - The user selects the MAX button and amount is calculated based on
 *  balance - (amount + gasTotal)
 */
export const AMOUNT_MODES = {
  INPUT: 'INPUT',
  MAX: 'MAX',
};

export const RECIPIENT_SEARCH_MODES = {
  MY_ACCOUNTS: 'MY_ACCOUNTS',
  CONTACT_LIST: 'CONTACT_LIST',
};

async function estimateGasLimitForSend({
  selectedAddress,
  value,
  gasPrice,
  sendToken,
  to,
  data,
  isNonStandardEthChain,
  chainId,
  ...options
}) {
  let isSimpleSendOnNonStandardNetwork = false;

  // blockGasLimit may be a falsy, but defined, value when we receive it from
  // state, so we use logical or to fall back to MIN_GAS_LIMIT_HEX. Some
  // network implementations check the gas parameter supplied to
  // eth_estimateGas for validity. For this reason, we set token sends
  // blockGasLimit default to a higher number. Note that the current gasLimit
  // on a BLOCK is 15,000,000 and will be 30,000,000 on mainnet after London.
  // Meanwhile, MIN_GAS_LIMIT_HEX is 0x5208.
  let blockGasLimit = MIN_GAS_LIMIT_HEX;
  if (options.blockGasLimit) {
    blockGasLimit = options.blockGasLimit;
  } else if (sendToken) {
    blockGasLimit = GAS_LIMITS.BASE_TOKEN_ESTIMATE;
  }

  // The parameters below will be sent to our background process to estimate
  // how much gas will be used for a transaction. That background process is
  // located in tx-gas-utils.js in the transaction controller folder.
  const paramsForGasEstimate = { from: selectedAddress, value, gasPrice };

  if (sendToken) {
    if (!to) {
      // if no to address is provided, we cannot generate the token transfer
      // hexData. hexData in a transaction largely dictates how much gas will
      // be consumed by a transaction. We must use our best guess, which is
      // represented in the gas shared constants.
      return GAS_LIMITS.BASE_TOKEN_ESTIMATE;
    }
    paramsForGasEstimate.value = '0x0';
    // We have to generate the erc20 contract call to transfer tokens in
    // order to get a proper estimate for gasLimit.
    paramsForGasEstimate.data = generateTokenTransferData({
      toAddress: to,
      amount: value,
      sendToken,
    });
    paramsForGasEstimate.to = sendToken.address;
  } else {
    if (!data) {
      // eth.getCode will return the compiled smart contract code at the
      // address. If this returns 0x, 0x0 or a nullish value then the address
      // is an externally owned account (NOT a contract account). For these
      // types of transactions the gasLimit will always be 21,000 or 0x5208
      const contractCode = Boolean(to) && (await global.eth.getCode(to));
      // Geth will return '0x', and ganache-core v2.2.1 will return '0x0'
      const contractCodeIsEmpty =
        !contractCode || contractCode === '0x' || contractCode === '0x0';
      if (contractCodeIsEmpty && !isNonStandardEthChain) {
        return GAS_LIMITS.SIMPLE;
      } else if (contractCodeIsEmpty && isNonStandardEthChain) {
        isSimpleSendOnNonStandardNetwork = true;
      }
    }

    paramsForGasEstimate.data = data;

    if (to) {
      paramsForGasEstimate.to = to;
    }

    if (!value || value === '0') {
      // TODO: Figure out what's going on here. According to eth_estimateGas
      // docs this value can be zero, or undefined, yet we are setting it to a
      // value here when the value is undefined or zero. For more context:
      // https://github.com/MetaMask/metamask-extension/pull/6195
      paramsForGasEstimate.value = '0xff';
    }
  }

  if (!isSimpleSendOnNonStandardNetwork) {
    // If we do not yet have a gasLimit, we must call into our background
    // process to get an estimate for gasLimit based on known parameters.

    paramsForGasEstimate.gas = addHexPrefix(
      multiplyCurrencies(blockGasLimit, 0.95, {
        multiplicandBase: 16,
        multiplierBase: 10,
        roundDown: '0',
        toNumericBase: 'hex',
      }),
    );
  }

  // The buffer multipler reduces transaction failures by ensuring that the
  // estimated gas is always sufficient. Without the multiplier, estimates
  // for contract interactions can become inaccurate over time. This is because
  // gas estimation is non-deterministic. The gas required for the exact same
  // transaction call can change based on state of a contract or changes in the
  // contracts environment (blockchain data or contracts it interacts with).
  // Applying the 1.5 buffer has proven to be a useful guard against this non-
  // deterministic behaviour.
  //
  // Gas estimation of simple sends should, however, be deterministic. As such
  // no buffer is needed in those cases.
  let bufferMultiplier = 1.5;
  if (isSimpleSendOnNonStandardNetwork) {
    bufferMultiplier = 1;
  } else if (CHAIN_ID_TO_GAS_LIMIT_BUFFER_MAP[chainId]) {
    bufferMultiplier = CHAIN_ID_TO_GAS_LIMIT_BUFFER_MAP[chainId];
  }

  try {
    // call into the background process that will simulate transaction
    // execution on the node and return an estimate of gasLimit
    const estimatedGasLimit = await estimateGas(paramsForGasEstimate);
    const estimateWithBuffer = addGasBuffer(
      estimatedGasLimit,
      blockGasLimit,
      bufferMultiplier,
    );
    return addHexPrefix(estimateWithBuffer);
  } catch (error) {
    const simulationFailed =
      error.message.includes('Transaction execution error.') ||
      error.message.includes(
        'gas required exceeds allowance or always failing transaction',
      );
    if (simulationFailed) {
      const estimateWithBuffer = addGasBuffer(
        paramsForGasEstimate.gas,
        blockGasLimit,
        1.5,
      );
      return addHexPrefix(estimateWithBuffer);
    }
    throw error;
  }
}

export async function getERC20Balance(token, accountAddress) {
  const contract = global.eth.contract(abi).at(token.address);
  const usersToken = (await contract.balanceOf(accountAddress)) ?? null;
  if (!usersToken) {
    return '0x0';
  }
  const amount = calcTokenAmount(
    usersToken.balance.toString(),
    token.decimals,
  ).toString(16);
  return addHexPrefix(amount);
}

// After modification of specific fields in specific circumstances we must
// recompute the gasLimit estimate to be as accurate as possible. the cases
// that necessitate this logic are listed below:
// 1. when the amount sent changes when sending a token due to the amount being
//    part of the hex encoded data property of the transaction.
// 2. when updating the data property while sending NATIVE currency (ex: ETH)
//    because the data parameter defines function calls that the EVM will have
//    to execute which is where a large chunk of gas is potentially consumed.
// 3. when the recipient changes while sending a token due to the recipient's
//    address being included in the hex encoded data property of the
//    transaction
// 4. when the asset being sent changes due to the contract address and details
//    of the token being included in the hex encoded data property of the
//    transaction. If switching to NATIVE currency (ex: ETH), the gasLimit will
//    change due to hex data being removed (unless supplied by user).
// This method computes the gasLimit estimate which is written to state in an
// action handler in extraReducers.
export const computeEstimatedGasLimit = createAsyncThunk(
  'send/computeEstimatedGasLimit',
  async (_, thunkApi) => {
    const state = thunkApi.getState();
    const { send, metamask } = state;
    const isNonStandardEthChain = getIsNonStandardEthChain(state);
    const chainId = getCurrentChainId(state);
    if (send.stage !== SEND_STAGES.EDIT) {
      const gasLimit = await estimateGasLimitForSend({
        gasPrice: send.gas.gasPrice,
        blockGasLimit: metamask.currentBlockGasLimit,
        selectedAddress: metamask.selectedAddress,
        sendToken: send.asset.details,
        to: send.recipient.address?.toLowerCase(),
        value: send.amount.value,
        data: send.draftTransaction.userInputHexData,
        isNonStandardEthChain,
        chainId,
      });
      await thunkApi.dispatch(setCustomGasLimit(gasLimit));
      return {
        gasLimit,
      };
    }
    return null;
  },
);

/**
 * This method is used to keep the original logic from the gas.duck.js file
 * after receiving a gasPrice from eth_gasPrice. First, the returned gasPrice
 * was converted to GWEI, then it was converted to a Number, then in the send
 * duck (here) we would use getGasPriceInHexWei to get back to hexWei. Now that
 * we receive a GWEI estimate from the controller, we still need to do this
 * weird conversion to get the proper rounding.
 * @param {T} gasPriceEstimate
 * @returns
 */
function getRoundedGasPrice(gasPriceEstimate) {
  const gasPriceInDecGwei = conversionUtil(gasPriceEstimate, {
    numberOfDecimals: 4,
    toDenomination: GWEI,
    fromNumericBase: 'dec',
    toNumericBase: 'dec',
    fromCurrency: ETH,
    fromDenomination: GWEI,
  });
  const gasPriceAsNumber = Number(gasPriceInDecGwei);
  return getGasPriceInHexWei(gasPriceAsNumber);
}

/**
 * Responsible for initializing required state for the send slice.
 * This method is dispatched from the send page in the componentDidMount
 * method. It is also dispatched anytime the network changes to ensure that
 * the slice remains valid with changing token and account balances. To do so
 * it keys into state to get necessary values and computes a starting point for
 * the send slice. It returns the values that might change from this action and
 * those values are written to the slice in the `initializeSendState.fulfilled`
 * action handler.
 */
export const initializeSendState = createAsyncThunk(
  'send/initializeSendState',
  async (_, thunkApi) => {
    const state = thunkApi.getState();
    const isNonStandardEthChain = getIsNonStandardEthChain(state);
    const chainId = getCurrentChainId(state);
    const {
      send: { asset, stage, recipient, amount, draftTransaction },
      metamask,
    } = state;
    // First determine the correct from address. For new sends this is always
    // the currently selected account and switching accounts switches the from
    // address. If editing an existing transaction (by clicking 'edit' on the
    // send page), the fromAddress is always the address from the txParams.
    const fromAddress =
      stage === SEND_STAGES.EDIT
        ? draftTransaction.txParams.from
        : metamask.selectedAddress;
    // We need the account's balance which is calculated from cachedBalances in
    // the getMetaMaskAccounts selector. getTargetAccount consumes this
    // selector and returns the account at the specified address.
    const account = getTargetAccount(state, fromAddress);

    // Default gasPrice to 1 gwei if all estimation fails, this is only used
    // for gasLimit estimation and won't be set directly in state. Instead, we
    // will return the gasFeeEstimates and gasEstimateType so that the reducer
    // can set the appropriate gas fees in state.
    let gasPrice = '0x1';
    let gasEstimatePollToken = null;

    // Instruct the background process that polling for gas prices should begin
    gasEstimatePollToken = await getGasFeeEstimatesAndStartPolling();
    const {
      metamask: { gasFeeEstimates, gasEstimateType },
    } = thunkApi.getState();

    // Because we are only interested in getting a gasLimit estimation we only
    // need to worry about gasPrice. So we use maxFeePerGas as gasPrice if we
    // have a fee market estimation.
    if (gasEstimateType === GAS_ESTIMATE_TYPES.LEGACY) {
      gasPrice = getGasPriceInHexWei(gasFeeEstimates.medium);
    } else if (gasEstimateType === GAS_ESTIMATE_TYPES.ETH_GASPRICE) {
      gasPrice = getRoundedGasPrice(gasFeeEstimates.gasPrice);
    } else if (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
      gasPrice = getGasPriceInHexWei(
        gasFeeEstimates.medium.suggestedMaxFeePerGas,
      );
    }

    // Set a basic gasLimit in the event that other estimation fails
    let gasLimit =
      asset.type === ASSET_TYPES.TOKEN
        ? GAS_LIMITS.BASE_TOKEN_ESTIMATE
        : GAS_LIMITS.SIMPLE;
    if (
      gasEstimateType !== GAS_ESTIMATE_TYPES.NONE &&
      stage !== SEND_STAGES.EDIT &&
      recipient.address
    ) {
      // Run our estimateGasLimit logic to get a more accurate estimation of
      // required gas. If this value isn't nullish, set it as the new gasLimit
      const estimatedGasLimit = await estimateGasLimitForSend({
        gasPrice,
        blockGasLimit: metamask.currentBlockGasLimit,
        selectedAddress: fromAddress,
        sendToken: asset.details,
        to: recipient.address.toLowerCase(),
        value: amount.value,
        data: draftTransaction.userInputHexData,
        isNonStandardEthChain,
        chainId,
      });
      gasLimit = estimatedGasLimit || gasLimit;
    }
    // We have to keep the gas slice in sync with the draft send transaction
    // so that it'll be initialized correctly if the gas modal is opened.
    await thunkApi.dispatch(setCustomGasLimit(gasLimit));
    // We must determine the balance of the asset that the transaction will be
    // sending. This is done by referencing the native balance on the account
    // for native assets, and calling the balanceOf method on the ERC20
    // contract for token sends.
    let { balance } = account;
    if (asset.type === ASSET_TYPES.TOKEN) {
      if (asset.details === null) {
        // If we're sending a token but details have not been provided we must
        // abort and set the send slice into invalid status.
        throw new Error(
          'Send slice initialized as token send without token details',
        );
      }
      balance = await getERC20Balance(asset.details, fromAddress);
    }
    return {
      address: fromAddress,
      nativeBalance: account.balance,
      assetBalance: balance,
      chainId: getCurrentChainId(state),
      tokens: getTokens(state),
      gasFeeEstimates,
      gasEstimateType,
      gasLimit,
      gasTotal: addHexPrefix(calcGasTotal(gasLimit, gasPrice)),
      gasEstimatePollToken,
    };
  },
);

export const initialState = {
  // which stage of the send flow is the user on
  stage: SEND_STAGES.INACTIVE,
  // status of the send slice, either VALID or INVALID
  status: SEND_STATUSES.VALID,
  // Determines type of transaction being sent, defaulted to 0x0 (legacy)
  transactionType: TRANSACTION_ENVELOPE_TYPES.LEGACY,
  account: {
    // from account address, defaults to selected account. will be the account
    // the original transaction was sent from in the case of the EDIT stage
    address: null,
    // balance of the from account
    balance: '0x0',
  },
  gas: {
    // indicate whether the gas estimate is loading
    isGasEstimateLoading: true,
    // String token indentifying a listener for polling on the gasFeeController
    gasEstimatePollToken: null,
    // has the user set custom gas in the custom gas modal
    isCustomGasSet: false,
    // maximum gas needed for tx
    gasLimit: '0x0',
    // price in wei to pay per gas
    gasPrice: '0x0',
    // maximum price in wei to pay per gas
    maxFeePerGas: '0x0',
    // maximum priority fee in wei to pay per gas
    maxPriorityFeePerGas: '0x0',
    // expected price in wei necessary to pay per gas used for a transaction
    // to be included in a reasonable timeframe. Comes from GasFeeController.
    gasPriceEstimate: '0x0',
    // maximum total price in wei to pay
    gasTotal: '0x0',
    // minimum supported gasLimit
    minimumGasLimit: GAS_LIMITS.SIMPLE,
    // error to display for gas fields
    error: null,
  },
  amount: {
    // The mode to use when determining new amounts. For INPUT mode the
    // provided payload is always used. For MAX it is calculated based on avail
    // asset balance
    mode: AMOUNT_MODES.INPUT,
    // Current value of the transaction, how much of the asset are we sending
    value: '0x0',
    // error to display for amount field
    error: null,
  },
  asset: {
    // type can be either NATIVE such as ETH or TOKEN for ERC20 tokens
    type: ASSET_TYPES.NATIVE,
    // the balance the user holds at the from address for this asset
    balance: '0x0',
    // In the case of tokens, the address, decimals and symbol of the token
    // will be included in details
    details: null,
  },
  draftTransaction: {
    // The metamask internal id of the transaction. Only populated in the EDIT
    // stage.
    id: null,
    // The hex encoded data provided by the user who has enabled hex data field
    // in advanced settings
    userInputHexData: null,
    // The txParams that should be submitted to the network once this
    // transaction is confirmed. This object is computed on every write to the
    // slice of fields that would result in the txParams changing
    txParams: {
      to: '',
      from: '',
      data: undefined,
      value: '0x0',
      gas: '0x0',
      gasPrice: '0x0',
      type: TRANSACTION_ENVELOPE_TYPES.LEGACY,
    },
  },
  recipient: {
    // Defines which mode to use for searching for matches in the input field
    mode: RECIPIENT_SEARCH_MODES.CONTACT_LIST,
    // Partial, not yet validated, entry into the address field. Used to share
    // user input amongst the AddRecipient and EnsInput components.
    userInput: '',
    // The address of the recipient
    address: '',
    // The nickname stored in the user's address book for the recipient address
    nickname: '',
    // Error to display on the address field
    error: null,
    // Warning to display on the address field
    warning: null,
  },
};

const slice = createSlice({
  name,
  initialState,
  reducers: {
    /**
     * update current amount.value in state and run post update validation of
     * the amount field and the send state. Recomputes the draftTransaction
     */
    updateSendAmount: (state, action) => {
      state.amount.value = addHexPrefix(action.payload);
      // Once amount has changed, validate the field
      slice.caseReducers.validateAmountField(state);
      if (state.asset.type === ASSET_TYPES.NATIVE) {
        // if sending the native asset the amount being sent will impact the
        // gas field as well because the gas validation takes into
        // consideration the available balance minus amount sent before
        // checking if there is enough left to cover the gas fee.
        slice.caseReducers.validateGasField(state);
      }
      // validate send state
      slice.caseReducers.validateSendState(state);
    },
    /**
     * computes the maximum amount of asset that can be sent and then calls
     * the updateSendAmount action above with the computed value, which will
     * revalidate the field and form and recomputes the draftTransaction
     */
    updateAmountToMax: (state) => {
      let amount = '0x0';
      if (state.asset.type === ASSET_TYPES.TOKEN) {
        const decimals = state.asset.details?.decimals ?? 0;
        const multiplier = Math.pow(10, Number(decimals));

        amount = multiplyCurrencies(state.asset.balance, multiplier, {
          toNumericBase: 'hex',
          multiplicandBase: 16,
          multiplierBase: 10,
        });
      } else {
        amount = subtractCurrencies(
          addHexPrefix(state.asset.balance),
          addHexPrefix(state.gas.gasTotal),
          {
            toNumericBase: 'hex',
            aBase: 16,
            bBase: 16,
          },
        );
      }
      slice.caseReducers.updateSendAmount(state, {
        payload: amount,
      });
      // draftTransaction update happens in updateSendAmount
    },
    /**
     * updates the draftTransaction.userInputHexData state key and then
     * recomputes the draftTransaction if the user is currently sending the
     * native asset. When sending ERC20 assets, this is unnecessary because the
     * hex data used in the transaction will be that for interacting with the
     * ERC20 contract
     */
    updateUserInputHexData: (state, action) => {
      state.draftTransaction.userInputHexData = action.payload;
      if (state.asset.type === ASSET_TYPES.NATIVE) {
        slice.caseReducers.updateDraftTransaction(state);
      }
    },
    /**
     * Initiates the edit transaction flow by setting the stage to 'EDIT' and
     * then pulling the details of the previously submitted transaction from
     * the action payload. It also computes a new draftTransaction that will be
     * used when updating the transaction in the provider
     */
    editTransaction: (state, action) => {
      state.stage = SEND_STAGES.EDIT;
      state.gas.gasLimit = action.payload.gasLimit;
      state.gas.gasPrice = action.payload.gasPrice;
      state.amount.value = action.payload.amount;
      state.gas.error = null;
      state.amount.error = null;
      state.recipient.address = action.payload.address;
      state.recipient.nickname = action.payload.nickname;
      state.draftTransaction.id = action.payload.id;
      state.draftTransaction.txParams.from = action.payload.from;
      slice.caseReducers.updateDraftTransaction(state);
    },
    /**
     * gasTotal is computed based on gasPrice and gasLimit and set in state
     * recomputes the maximum amount if the current amount mode is 'MAX' and
     * sending the native token. ERC20 assets max amount is unaffected by
     * gasTotal so does not need to be recomputed. Finally, validates the gas
     * field and send state, then updates the draft transaction.
     */
    calculateGasTotal: (state) => {
      // use gasPrice as the multiplier if working with a LEGACY transaction
      // otherwise use maxFeePerGas.
      if (state.transactionType === TRANSACTION_ENVELOPE_TYPES.FEE_MARKET) {
        state.gas.gasTotal = addHexPrefix(
          calcGasTotal(state.gas.gasLimit, state.gas.maxFeePerGas),
        );
      } else {
        state.gas.gasTotal = addHexPrefix(
          calcGasTotal(state.gas.gasLimit, state.gas.gasPrice),
        );
      }
      if (
        state.amount.mode === AMOUNT_MODES.MAX &&
        state.asset.type === ASSET_TYPES.NATIVE
      ) {
        slice.caseReducers.updateAmountToMax(state);
      }
      slice.caseReducers.validateAmountField(state);
      slice.caseReducers.validateGasField(state);
      // validate send state
      slice.caseReducers.validateSendState(state);
    },
    /**
     * sets the provided gasLimit in state and then recomputes the gasTotal.
     */
    updateGasLimit: (state, action) => {
      state.gas.gasLimit = addHexPrefix(action.payload);
      slice.caseReducers.calculateGasTotal(state);
    },
    /**
     * Sets the appropriate gas fees in state and determines and sets the
     * appropriate transactionType based on gas fee fields received.
     */
    updateGasFees: (state, action) => {
      if (
        action.payload.transactionType === TRANSACTION_ENVELOPE_TYPES.FEE_MARKET
      ) {
        state.gas.maxFeePerGas = addHexPrefix(action.payload.maxFeePerGas);
        state.gas.maxPriorityFeePerGas = addHexPrefix(
          action.payload.maxPriorityFeePerGas,
        );
        state.transactionType = TRANSACTION_ENVELOPE_TYPES.FEE_MARKET;
      } else {
        // Until we remove the old UI we don't want to update gasPrice if the
        // user has changed the field value. When receiving a new estimate the
        // isAutomaticUpdate property will be on the payload (and set to true).
        // If isAutomaticUpdate is true, then we check if the previous estimate
        // was '0x0' or if the previous gasPrice equals the previous
        // gasEstimate. if either of those cases are true then we update the
        // gasPrice otherwise we skip it because it indicates the user has
        // ejected from the estimates by modifying the field.
        if (
          action.payload.isAutomaticUpdate !== true ||
          state.gas.gasPriceEstimate === '0x0' ||
          state.gas.gasPrice === state.gas.gasPriceEstimate
        ) {
          state.gas.gasPrice = addHexPrefix(action.payload.gasPrice);
        }
        state.transactionType = TRANSACTION_ENVELOPE_TYPES.LEGACY;
      }
      slice.caseReducers.calculateGasTotal(state);
    },
    /**
     * Sets the appropriate gas fees in state after receiving new estimates.
     */
    updateGasFeeEstimates: (state, action) => {
      const { gasFeeEstimates, gasEstimateType } = action.payload;
      let gasPriceEstimate = '0x0';
      switch (gasEstimateType) {
        case GAS_ESTIMATE_TYPES.FEE_MARKET:
          slice.caseReducers.updateGasFees(state, {
            payload: {
              transactionType: TRANSACTION_ENVELOPE_TYPES.FEE_MARKET,
              maxFeePerGas: getGasPriceInHexWei(
                gasFeeEstimates.medium.suggestedMaxFeePerGas,
              ),
              maxPriorityFeePerGas: getGasPriceInHexWei(
                gasFeeEstimates.medium.suggestedMaxPriorityFeePerGas,
              ),
            },
          });
          break;
        case GAS_ESTIMATE_TYPES.LEGACY:
          gasPriceEstimate = getRoundedGasPrice(gasFeeEstimates.medium);
          slice.caseReducers.updateGasFees(state, {
            payload: {
              gasPrice: gasPriceEstimate,
              type: TRANSACTION_ENVELOPE_TYPES.LEGACY,
              isAutomaticUpdate: true,
            },
          });
          break;
        case GAS_ESTIMATE_TYPES.ETH_GASPRICE:
          gasPriceEstimate = getRoundedGasPrice(gasFeeEstimates.gasPrice);
          slice.caseReducers.updateGasFees(state, {
            payload: {
              gasPrice: getRoundedGasPrice(gasFeeEstimates.gasPrice),
              type: TRANSACTION_ENVELOPE_TYPES.LEGACY,
              isAutomaticUpdate: true,
            },
          });
          break;
        case GAS_ESTIMATE_TYPES.NONE:
        default:
          break;
      }
      // Record the latest gasPriceEstimate for future comparisons
      state.gas.gasPriceEstimate = addHexPrefix(gasPriceEstimate);
    },
    /**
     * sets the amount mode to the provided value as long as it is one of the
     * supported modes (MAX|INPUT)
     */
    updateAmountMode: (state, action) => {
      if (Object.values(AMOUNT_MODES).includes(action.payload)) {
        state.amount.mode = action.payload;
      }
    },
    updateAsset: (state, action) => {
      state.asset.type = action.payload.type;
      state.asset.balance = action.payload.balance;
      if (state.asset.type === ASSET_TYPES.TOKEN) {
        state.asset.details = action.payload.details;
      } else {
        // clear the details object when sending native currency
        state.asset.details = null;
        if (state.recipient.error === CONTRACT_ADDRESS_ERROR) {
          // Errors related to sending tokens to their own contract address
          // are no longer valid when sending native currency.
          state.recipient.error = null;
        }

        if (state.recipient.warning === KNOWN_RECIPIENT_ADDRESS_WARNING) {
          // Warning related to sending tokens to a known contract address
          // are no longer valid when sending native currency.
          state.recipient.warning = null;
        }
      }
      // if amount mode is MAX update amount to max of new asset, otherwise set
      // to zero. This will revalidate the send amount field.
      if (state.amount.mode === AMOUNT_MODES.MAX) {
        slice.caseReducers.updateAmountToMax(state);
      } else {
        slice.caseReducers.updateSendAmount(state, { payload: '0x0' });
      }
      // validate send state
      slice.caseReducers.validateSendState(state);
    },
    updateRecipient: (state, action) => {
      state.recipient.error = null;
      state.recipient.userInput = '';
      state.recipient.address = action.payload.address ?? '';
      state.recipient.nickname = action.payload.nickname ?? '';

      if (state.recipient.address === '') {
        // If address is null we are clearing the recipient and must return
        // to the ADD_RECIPIENT stage.
        state.stage = SEND_STAGES.ADD_RECIPIENT;
      } else {
        // if and address is provided and an id exists on the draft transaction,
        // we progress to the EDIT stage, otherwise we progress to the DRAFT
        // stage. We also reset the search mode for recipient search.
        state.stage =
          state.draftTransaction.id === null
            ? SEND_STAGES.DRAFT
            : SEND_STAGES.EDIT;
        state.recipient.mode = RECIPIENT_SEARCH_MODES.CONTACT_LIST;
      }

      // validate send state
      slice.caseReducers.validateSendState(state);
    },
    updateDraftTransaction: (state) => {
      // We keep a copy of txParams in state that could be submitted to the
      // network if the form state is valid.
      if (state.status === SEND_STATUSES.VALID) {
        // We don't/shouldn't modify the from address when editing an
        // existing transaction.
        if (state.stage !== SEND_STAGES.EDIT) {
          state.draftTransaction.txParams.from = state.account.address;
        }

        // gasLimit always needs to be set regardless of the asset being sent
        // or the type of transaction.
        state.draftTransaction.txParams.gas = state.gas.gasLimit;
        switch (state.asset.type) {
          case ASSET_TYPES.TOKEN:
            // When sending a token the to address is the contract address of
            // the token being sent. The value is set to '0x0' and the data
            // is generated from the recipient address, token being sent and
            // amount.
            state.draftTransaction.txParams.to = state.asset.details.address;
            state.draftTransaction.txParams.value = '0x0';
            state.draftTransaction.txParams.data = generateTokenTransferData({
              toAddress: state.recipient.address,
              amount: state.amount.value,
              sendToken: state.asset.details,
            });
            break;
          case ASSET_TYPES.NATIVE:
          default:
            // When sending native currency the to and value fields use the
            // recipient and amount values and the data key is either null or
            // populated with the user input provided in hex field.
            state.draftTransaction.txParams.to = state.recipient.address;
            state.draftTransaction.txParams.value = state.amount.value;
            state.draftTransaction.txParams.data =
              state.draftTransaction.userInputHexData ?? undefined;
        }

        // We need to make sure that we only include the right gas fee fields
        // based on the type of transaction we are sending. We will also set
        // the type param here. We must delete the opposite fields to avoid
        // stale data in txParams.
        switch (state.transactionType) {
          case TRANSACTION_ENVELOPE_TYPES.FEE_MARKET:
            delete state.draftTransaction.txParams.gasPrice;

            state.draftTransaction.txParams.type =
              TRANSACTION_ENVELOPE_TYPES.FEE_MARKET;
            state.draftTransaction.txParams.maxPriorityFeePerGas =
              state.gas.maxPriorityFeePerGas;
            state.draftTransaction.txParams.maxFeePerGas =
              state.gas.maxFeePerGas;
            break;
          case TRANSACTION_ENVELOPE_TYPES.LEGACY:
          default:
            delete state.draftTransaction.txParams.maxFeePerGas;
            delete state.draftTransaction.txParams.maxPriorityFeePerGas;

            state.draftTransaction.txParams.gasPrice = state.gas.gasPrice;
            state.draftTransaction.txParams.type =
              TRANSACTION_ENVELOPE_TYPES.LEGACY;
        }
      }
      console.log(current(state));
    },
    useDefaultGas: (state) => {
      // Show the default gas price/limit fields in the send page
      state.gas.isCustomGasSet = false;
    },
    useCustomGas: (state) => {
      // Show the gas fees set in the custom gas modal (state.gas.customData)
      state.gas.isCustomGasSet = true;
    },
    updateRecipientUserInput: (state, action) => {
      // Update the value in state to match what the user is typing into the
      // input field
      state.recipient.userInput = action.payload;
    },
    validateRecipientUserInput: (state, action) => {
      const { asset, recipient } = state;

      if (
        recipient.mode === RECIPIENT_SEARCH_MODES.MY_ACCOUNTS ||
        recipient.userInput === '' ||
        recipient.userInput === null
      ) {
        recipient.error = null;
        recipient.warning = null;
      } else {
        const isSendingToken = asset.type === ASSET_TYPES.TOKEN;
        const { chainId, tokens } = action.payload;
        if (
          isBurnAddress(recipient.userInput) ||
          (!isValidHexAddress(recipient.userInput, {
            mixedCaseUseChecksum: true,
          }) &&
            !isValidDomainName(recipient.userInput))
        ) {
          recipient.error = isDefaultMetaMaskChain(chainId)
            ? INVALID_RECIPIENT_ADDRESS_ERROR
            : INVALID_RECIPIENT_ADDRESS_NOT_ETH_NETWORK_ERROR;
        } else if (
          isSendingToken &&
          isOriginContractAddress(recipient.userInput, asset.details.address)
        ) {
          recipient.error = CONTRACT_ADDRESS_ERROR;
        } else {
          recipient.error = null;
        }

        if (
          isSendingToken &&
          (toChecksumAddress(recipient.userInput) in contractMap ||
            checkExistingAddresses(recipient.userInput, tokens))
        ) {
          recipient.warning = KNOWN_RECIPIENT_ADDRESS_WARNING;
        } else {
          recipient.warning = null;
        }
      }
    },
    updateRecipientSearchMode: (state, action) => {
      state.recipient.userInput = '';
      state.recipient.mode = action.payload;
    },
    resetSendState: () => initialState,
    validateAmountField: (state) => {
      switch (true) {
        // set error to INSUFFICIENT_FUNDS_ERROR if the account balance is lower
        // than the total price of the transaction inclusive of gas fees.
        case state.asset.type === ASSET_TYPES.NATIVE &&
          !isBalanceSufficient({
            amount: state.amount.value,
            balance: state.asset.balance,
            gasTotal: state.gas.gasTotal ?? '0x0',
          }):
          state.amount.error = INSUFFICIENT_FUNDS_ERROR;
          break;
        // set error to INSUFFICIENT_FUNDS_ERROR if the token balance is lower
        // than the amount of token the user is attempting to send.
        case state.asset.type === ASSET_TYPES.TOKEN &&
          !isTokenBalanceSufficient({
            tokenBalance: state.asset.balance ?? '0x0',
            amount: state.amount.value,
            decimals: state.asset.details.decimals,
          }):
          state.amount.error = INSUFFICIENT_TOKENS_ERROR;
          break;
        // if the amount is negative, set error to NEGATIVE_ETH_ERROR
        // TODO: change this to NEGATIVE_ERROR and remove the currency bias.
        case conversionGreaterThan(
          { value: 0, fromNumericBase: 'dec' },
          { value: state.amount.value, fromNumericBase: 'hex' },
        ):
          state.amount.error = NEGATIVE_ETH_ERROR;
          break;
        // If none of the above are true, set error to null
        default:
          state.amount.error = null;
      }
    },
    validateGasField: (state) => {
      // Checks if the user has enough funds to cover the cost of gas, always
      // uses the native currency and does not take into account the amount
      // being sent. If the user has enough to cover cost of gas but not gas
      // + amount then the error will be displayed on the amount field.
      const insufficientFunds = !isBalanceSufficient({
        amount:
          state.asset.type === ASSET_TYPES.NATIVE ? state.amount.value : '0x0',
        balance: state.account.balance,
        gasTotal: state.gas.gasTotal ?? '0x0',
      });

      state.gas.error = insufficientFunds ? INSUFFICIENT_FUNDS_ERROR : null;
    },
    validateSendState: (state) => {
      switch (true) {
        // 1 + 2. State is invalid when either gas or amount fields have errors
        // 3. State is invalid if asset type is a token and the token details
        //  are unknown.
        // 4. State is invalid if no recipient has been added
        // 5. State is invalid if the send state is uninitialized
        // 6. State is invalid if gas estimates are loading
        // 7. State is invalid if gasLimit is less than the minimumGasLimit
        // 8. State is invalid if the selected asset is a ERC721
        case Boolean(state.amount.error):
        case Boolean(state.gas.error):
        case state.asset.type === ASSET_TYPES.TOKEN &&
          state.asset.details === null:
        case state.stage === SEND_STAGES.ADD_RECIPIENT:
        case state.stage === SEND_STAGES.INACTIVE:
        case state.gas.isGasEstimateLoading:
        case new BigNumber(state.gas.gasLimit, 16).lessThan(
          new BigNumber(state.gas.minimumGasLimit),
        ):
          state.status = SEND_STATUSES.INVALID;
          break;
        case state.asset.type === ASSET_TYPES.TOKEN &&
          state.asset.details.isERC721 === true:
          state.status = SEND_STATUSES.INVALID;
          break;
        default:
          state.status = SEND_STATUSES.VALID;
          // Recompute the draftTransaction object
          slice.caseReducers.updateDraftTransaction(state);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(QR_CODE_DETECTED, (state, action) => {
        // When data is received from the QR Code Scanner we set the recipient
        // as long as a valid address can be pulled from the data. If an
        // address is pulled but it is invalid, we display an error.
        const qrCodeData = action.value;
        if (qrCodeData) {
          if (qrCodeData.type === 'address') {
            const scannedAddress = qrCodeData.values.address.toLowerCase();
            if (
              isValidHexAddress(scannedAddress, { allowNonPrefixed: false })
            ) {
              if (state.recipient.address !== scannedAddress) {
                slice.caseReducers.updateRecipient(state, {
                  payload: { address: scannedAddress },
                });
              }
            } else {
              state.recipient.error = INVALID_RECIPIENT_ADDRESS_ERROR;
            }
          }
        }
      })
      .addCase(SELECTED_ACCOUNT_CHANGED, (state, action) => {
        // If we are on the edit flow the account we are keyed into will be the
        // original 'from' account, which may differ from the selected account
        if (state.stage !== SEND_STAGES.EDIT) {
          // This event occurs when the user selects a new account from the
          // account menu, or the currently active account's balance updates.
          state.account.balance = action.payload.account.balance;
          state.account.address = action.payload.account.address;
          // We need to update the asset balance if the asset is the native
          // network asset. Once we update the balance we recompute error state.
          if (state.asset.type === ASSET_TYPES.NATIVE) {
            state.asset.balance = action.payload.account.balance;
          }
          slice.caseReducers.validateAmountField(state);
          slice.caseReducers.validateGasField(state);
          slice.caseReducers.validateSendState(state);
        }
      })
      .addCase(ACCOUNT_CHANGED, (state, action) => {
        // If we are on the edit flow then we need to watch for changes to the
        // current account.address in state and keep balance updated
        // appropriately
        if (
          state.stage === SEND_STAGES.EDIT &&
          action.payload.account.address === state.account.address
        ) {
          // This event occurs when the user's account details update due to
          // background state changes. If the account that is being updated is
          // the current from account on the edit flow we need to update
          // the balance for the account and revalidate the send state.
          state.account.balance = action.payload.account.balance;
          // We need to update the asset balance if the asset is the native
          // network asset. Once we update the balance we recompute error state.
          if (state.asset.type === ASSET_TYPES.NATIVE) {
            state.asset.balance = action.payload.account.balance;
          }
          slice.caseReducers.validateAmountField(state);
          slice.caseReducers.validateGasField(state);
          slice.caseReducers.validateSendState(state);
        }
      })
      .addCase(ADDRESS_BOOK_UPDATED, (state, action) => {
        // When the address book updates from background state changes we need
        // to check to see if an entry exists for the current address or if the
        // entry changed.
        const { addressBook } = action.payload;
        if (addressBook[state.recipient.address]?.name) {
          state.recipient.nickname = addressBook[state.recipient.address].name;
        }
      })
      .addCase(initializeSendState.pending, (state) => {
        // when we begin initializing state, which can happen when switching
        // chains even after loading the send flow, we set
        // gas.isGasEstimateLoading as initialization will trigger a fetch
        // for gasPrice estimates.
        state.gas.isGasEstimateLoading = true;
      })
      .addCase(initializeSendState.fulfilled, (state, action) => {
        // writes the computed initialized state values into the slice and then
        // calculates slice validity using the caseReducers.
        state.account.address = action.payload.address;
        state.account.balance = action.payload.nativeBalance;
        state.asset.balance = action.payload.assetBalance;
        state.gas.gasLimit = action.payload.gasLimit;
        slice.caseReducers.updateGasFeeEstimates(state, {
          payload: {
            gasFeeEstimates: action.payload.gasFeeEstimates,
            gasEstimateType: action.payload.gasEstimateType,
          },
        });
        state.gas.gasTotal = action.payload.gasTotal;
        state.gas.gasEstimatePollToken = action.payload.gasEstimatePollToken;
        if (action.payload.gasEstimatePollToken) {
          state.gas.isGasEstimateLoading = false;
        }
        if (state.stage !== SEND_STAGES.INACTIVE) {
          slice.caseReducers.validateRecipientUserInput(state, {
            payload: {
              chainId: action.payload.chainId,
              tokens: action.payload.tokens,
            },
          });
        }
        state.stage =
          state.stage === SEND_STAGES.INACTIVE
            ? SEND_STAGES.ADD_RECIPIENT
            : state.stage;
        slice.caseReducers.validateAmountField(state);
        slice.caseReducers.validateGasField(state);
        slice.caseReducers.validateSendState(state);
      })
      .addCase(computeEstimatedGasLimit.pending, (state) => {
        // When we begin to fetch gasLimit we should indicate we are loading
        // a gas estimate.
        state.gas.isGasEstimateLoading = true;
      })
      .addCase(computeEstimatedGasLimit.fulfilled, (state, action) => {
        // When we receive a new gasLimit from the computeEstimatedGasLimit
        // thunk we need to update our gasLimit in the slice. We call into the
        // caseReducer updateGasLimit to tap into the appropriate follow up
        // checks and gasTotal calculation. First set isGasEstimateLoading to
        // false.
        state.gas.isGasEstimateLoading = false;
        if (action.payload?.gasLimit) {
          slice.caseReducers.updateGasLimit(state, {
            payload: action.payload.gasLimit,
          });
        }
      })
      .addCase(GAS_FEE_ESTIMATES_UPDATED, (state, action) => {
        // When the gasFeeController updates its gas fee estimates we need to
        // update and validate state based on those new values
        slice.caseReducers.updateGasFeeEstimates(state, {
          payload: action.payload,
        });
      });
  },
});

const { actions, reducer } = slice;

export default reducer;

const {
  useDefaultGas,
  useCustomGas,
  updateGasLimit,
  validateRecipientUserInput,
  updateRecipientSearchMode,
} = actions;

export { useDefaultGas, useCustomGas, updateGasLimit };

// Action Creators

/**
 * This method is a temporary placeholder to support the old UI in both the
 * gas modal and the send flow. Soon we won't need to modify gasPrice from the
 * send flow based on user input, it'll just be a shallow copy of the current
 * estimate. This method is necessary because the internal structure of this
 * slice has been changed such that it is agnostic to transaction envelope
 * type, and this method calls into the new structure in the appropriate way.
 *
 * @deprecated - don't extend the usage of this temporary method
 * @param {string} gasPrice - new gas price in hex wei
 * @returns {void}
 */
export function updateGasPrice(gasPrice) {
  return (dispatch) => {
    dispatch(
      actions.updateGasFees({
        gasPrice,
        transactionType: TRANSACTION_ENVELOPE_TYPES.LEGACY,
      }),
    );
  };
}

export function resetSendState() {
  return async (dispatch, getState) => {
    const state = getState();
    dispatch(actions.resetSendState());

    if (state[name].gas.gasEstimatePollToken) {
      await disconnectGasFeeEstimatePoller(
        state[name].gas.gasEstimatePollToken,
      );
    }
  };
}
/**
 * Updates the amount the user intends to send and performs side effects.
 * 1. If the current mode is MAX change to INPUT
 * 2. If sending a token, recompute the gasLimit estimate
 * @param {string} amount - hex string representing value
 * @returns {void}
 */
export function updateSendAmount(amount) {
  return async (dispatch, getState) => {
    await dispatch(actions.updateSendAmount(amount));
    const state = getState();
    if (state.send.amount.mode === AMOUNT_MODES.MAX) {
      await dispatch(actions.updateAmountMode(AMOUNT_MODES.INPUT));
    }
    if (state.send.asset.type === ASSET_TYPES.TOKEN) {
      await dispatch(computeEstimatedGasLimit());
    }
  };
}

/**
 * updates the asset to send to one of NATIVE or TOKEN and ensures that the
 * asset balance is set. If sending a TOKEN also updates the asset details
 * object with the appropriate ERC20 details including address, symbol and
 * decimals.
 * @param {Object} payload - action payload
 * @param {string} payload.type - type of asset to send
 * @param {Object} [payload.details] - ERC20 details if sending TOKEN asset
 * @param {string} [payload.details.address] - contract address for ERC20
 * @param {string} [payload.details.decimals] - Number of token decimals
 * @param {string} [payload.details.symbol] - asset symbol to display
 * @returns {void}
 */
export function updateSendAsset({ type, details }) {
  return async (dispatch, getState) => {
    const state = getState();
    let { balance } = state.send.asset;
    if (type === ASSET_TYPES.TOKEN) {
      // if changing to a token, get the balance from the network. The asset
      // overview page and asset list on the wallet overview page contain
      // send buttons that call this method before initialization occurs.
      // When this happens we don't yet have an account.address so default to
      // the currently active account. In addition its possible for the balance
      // check to take a decent amount of time, so we display a loading
      // indication so that that immediate feedback is displayed to the user.
      await dispatch(showLoadingIndication());
      balance = await getERC20Balance(
        details,
        state.send.account.address ?? getSelectedAddress(state),
      );
      if (details && details.isERC721 === undefined) {
        const updatedAssetDetails = await updateTokenType(details.address);
        details.isERC721 = updatedAssetDetails.isERC721;
      }

      await dispatch(hideLoadingIndication());
    } else {
      // if changing to native currency, get it from the account key in send
      // state which is kept in sync when accounts change.
      balance = state.send.account.balance;
    }
    // update the asset in state which will re-run amount and gas validation
    await dispatch(actions.updateAsset({ type, details, balance }));
    await dispatch(computeEstimatedGasLimit());
  };
}

/**
 * This method is for usage when validating user input so that validation
 * is only run after a delay in typing of 300ms. Usage at callsites requires
 * passing in both the dispatch method and the payload to dispatch, which makes
 * it only applicable for use within action creators.
 */
const debouncedValidateRecipientUserInput = debounce((dispatch, payload) => {
  dispatch(validateRecipientUserInput(payload));
}, 300);

/**
 * This method is called to update the user's input into the ENS input field.
 * Once the field is updated, the field will be validated using a debounced
 * version of the validateRecipientUserInput action. This way validation only
 * occurs once the user has stopped typing.
 * @param {string} userInput - the value that the user is typing into the field
 * @returns {void}
 */
export function updateRecipientUserInput(userInput) {
  return async (dispatch, getState) => {
    await dispatch(actions.updateRecipientUserInput(userInput));
    const state = getState();
    const chainId = getCurrentChainId(state);
    const tokens = getTokens(state);
    debouncedValidateRecipientUserInput(dispatch, { chainId, tokens });
  };
}

export function useContactListForRecipientSearch() {
  return (dispatch) => {
    dispatch(updateRecipientSearchMode(RECIPIENT_SEARCH_MODES.CONTACT_LIST));
  };
}

export function useMyAccountsForRecipientSearch() {
  return (dispatch) => {
    dispatch(updateRecipientSearchMode(RECIPIENT_SEARCH_MODES.MY_ACCOUNTS));
  };
}

/**
 * Updates the recipient in state based on the input provided, and then will
 * recompute gas limit when sending a TOKEN asset type. Changing the recipient
 * address results in hex data changing because the recipient address is
 * encoded in the data instead of being in the 'to' field. The to field in a
 * token send will always be the token contract address.
 * @param {Object} recipient - Recipient information
 * @param {string} recipient.address - hex address to send the transaction to
 * @param {string} [recipient.nickname] - Alias for the address to display
 *  to the user
 * @returns {void}
 */
export function updateRecipient({ address, nickname }) {
  return async (dispatch) => {
    await dispatch(actions.updateRecipient({ address, nickname }));
    await dispatch(computeEstimatedGasLimit());
  };
}

/**
 * Clears out the recipient user input, ENS resolution and recipient validation
 * @returns {void}
 */
export function resetRecipientInput() {
  return async (dispatch) => {
    await dispatch(updateRecipientUserInput(''));
    await dispatch(updateRecipient({ address: '', nickname: '' }));
    await dispatch(resetEnsResolution());
    await dispatch(validateRecipientUserInput());
  };
}

/**
 * When a user has enabled hex data field in advanced settings they will be
 * able to supply hex data on a transaction. This method updates the user
 * supplied data. Note, when sending native assets this will result in
 * recomputing estimated gasLimit. When sending a ERC20 asset this is not done
 * because the data sent in the transaction will be determined by the asset,
 * recipient and value, NOT what the user has supplied.
 * @param {string} hexData - hex encoded string representing transaction data
 * @returns {void}
 */
export function updateSendHexData(hexData) {
  return async (dispatch, getState) => {
    await dispatch(actions.updateUserInputHexData(hexData));
    const state = getState();
    if (state.send.asset.type === ASSET_TYPES.NATIVE) {
      await dispatch(computeEstimatedGasLimit());
    }
  };
}

/**
 * Toggles the amount.mode between INPUT and MAX modes.
 * As a result, the amount.value will change to either '0x0' when moving from
 * MAX to INPUT, or to the maximum allowable amount based on current asset when
 * moving from INPUT to MAX.
 * @returns {void}
 */
export function toggleSendMaxMode() {
  return async (dispatch, getState) => {
    const state = getState();
    if (state.send.amount.mode === AMOUNT_MODES.MAX) {
      await dispatch(actions.updateAmountMode(AMOUNT_MODES.INPUT));
      await dispatch(actions.updateSendAmount('0x0'));
    } else {
      await dispatch(actions.updateAmountMode(AMOUNT_MODES.MAX));
      await dispatch(actions.updateAmountToMax());
    }
  };
}

/**
 * Signs a transaction or updates a transaction in state if editing.
 * This method is called when a user clicks the next button in the footer of
 * the send page, signaling that a transaction should be executed. This method
 * will create the transaction in state (by way of the various global provider
 * constructs) which will eventually (and fairly quickly from user perspective)
 * result in a confirmation window being displayed for the transaction.
 * @returns {void}
 */
export function signTransaction() {
  return async (dispatch, getState) => {
    const state = getState();
    const {
      asset,
      stage,
      draftTransaction: { id, txParams },
      recipient: { address },
      amount: { value },
    } = state[name];
    if (stage === SEND_STAGES.EDIT) {
      // When dealing with the edit flow there is already a transaction in
      // state that we must update, this branch is responsible for that logic.
      // We first must grab the previous transaction object from state and then
      // merge in the modified txParams. Once the transaction has been modified
      // we can send that to the background to update the transaction in state.
      const unapprovedTxs = getUnapprovedTxs(state);
      const unapprovedTx = unapprovedTxs[id];
      const editingTx = {
        ...unapprovedTx,
        txParams: Object.assign(unapprovedTx.txParams, txParams),
      };
      dispatch(updateTransaction(editingTx));
    } else if (asset.type === ASSET_TYPES.TOKEN) {
      // When sending a token transaction we have to the token.transfer method
      // on the token contract to construct the transaction. This results in
      // the proper transaction data and properties being set and a new
      // transaction being added to background state. Once the new transaction
      // is added to state a subsequent confirmation will be queued.
      try {
        const token = global.eth.contract(abi).at(asset.details.address);
        token.transfer(address, value, {
          ...txParams,
          to: undefined,
          data: undefined,
        });
        dispatch(showConfTxPage());
        dispatch(hideLoadingIndication());
      } catch (error) {
        dispatch(hideLoadingIndication());
        dispatch(displayWarning(error.message));
      }
    } else {
      // When sending a native asset we use the ethQuery.sendTransaction method
      // which will result in the transaction being added to background state
      // and a subsequent confirmation will be queued.
      global.ethQuery.sendTransaction(txParams, (err) => {
        if (err) {
          dispatch(displayWarning(err.message));
        }
      });
      dispatch(showConfTxPage());
    }
  };
}

export function editTransaction(
  assetType,
  transactionId,
  tokenData,
  assetDetails,
) {
  return async (dispatch, getState) => {
    const state = getState();
    const unapprovedTransactions = getUnapprovedTxs(state);
    const transaction = unapprovedTransactions[transactionId];
    const { txParams } = transaction;
    if (assetType === ASSET_TYPES.NATIVE) {
      const {
        from,
        gas: gasLimit,
        gasPrice,
        to: address,
        value: amount,
      } = txParams;
      const nickname = getAddressBookEntry(state, address)?.name ?? '';
      await dispatch(
        actions.editTransaction({
          id: transactionId,
          gasLimit,
          gasPrice,
          from,
          amount,
          address,
          nickname,
        }),
      );
    } else if (!tokenData || !assetDetails) {
      throw new Error(
        `send/editTransaction dispatched with assetType 'TOKEN' but missing assetData or assetDetails parameter`,
      );
    } else {
      const { from, to: tokenAddress, gas: gasLimit, gasPrice } = txParams;
      const tokenAmountInDec = getTokenValueParam(tokenData);
      const address = getTokenAddressParam(tokenData);
      const nickname = getAddressBookEntry(state, address)?.name ?? '';

      const tokenAmountInHex = addHexPrefix(
        conversionUtil(tokenAmountInDec, {
          fromNumericBase: 'dec',
          toNumericBase: 'hex',
        }),
      );

      await dispatch(
        updateSendAsset({
          type: ASSET_TYPES.TOKEN,
          details: { ...assetDetails, address: tokenAddress },
        }),
      );

      await dispatch(
        actions.editTransaction({
          id: transactionId,
          gasLimit,
          gasPrice,
          from,
          amount: tokenAmountInHex,
          address,
          nickname,
        }),
      );
    }
  };
}

// Selectors

// Gas selectors
export function getGasLimit(state) {
  return state[name].gas.gasLimit;
}

export function getGasPrice(state) {
  return state[name].gas.gasPrice;
}

export function getGasTotal(state) {
  return state[name].gas.gasTotal;
}

export function gasFeeIsInError(state) {
  return Boolean(state[name].gas.error);
}

export function getMinimumGasLimitForSend(state) {
  return state[name].gas.minimumGasLimit;
}

export function getGasInputMode(state) {
  const isMainnet = getIsMainnet(state);
  const gasEstimateType = getGasEstimateType(state);
  const showAdvancedGasFields = getAdvancedInlineGasShown(state);
  if (state[name].gas.isCustomGasSet) {
    return GAS_INPUT_MODES.CUSTOM;
  }
  if ((!isMainnet && !process.env.IN_TEST) || showAdvancedGasFields) {
    return GAS_INPUT_MODES.INLINE;
  }

  // We get eth_gasPrice estimation if the legacy API fails but we need to
  // instruct the UI to render the INLINE inputs in this case, only on
  // mainnet or IN_TEST.
  if (
    (isMainnet || process.env.IN_TEST) &&
    gasEstimateType === GAS_ESTIMATE_TYPES.ETH_GASPRICE
  ) {
    return GAS_INPUT_MODES.INLINE;
  }
  return GAS_INPUT_MODES.BASIC;
}

// Asset Selectors

export function getSendAsset(state) {
  return state[name].asset;
}

export function getSendAssetAddress(state) {
  return getSendAsset(state)?.details?.address;
}

export function getIsAssetSendable(state) {
  if (state[name].asset.type === ASSET_TYPES.NATIVE) {
    return true;
  }
  return state[name].asset.details.isERC721 === false;
}

// Amount Selectors
export function getSendAmount(state) {
  return state[name].amount.value;
}

export function getIsBalanceInsufficient(state) {
  return state[name].gas.error === INSUFFICIENT_FUNDS_ERROR;
}
export function getSendMaxModeState(state) {
  return state[name].amount.mode === AMOUNT_MODES.MAX;
}

export function getSendHexData(state) {
  return state[name].draftTransaction.userInputHexData;
}

export function sendAmountIsInError(state) {
  return Boolean(state[name].amount.error);
}

// Recipient Selectors

export function getSendTo(state) {
  return state[name].recipient.address;
}

export function getIsUsingMyAccountForRecipientSearch(state) {
  return state[name].recipient.mode === RECIPIENT_SEARCH_MODES.MY_ACCOUNTS;
}

export function getRecipientUserInput(state) {
  return state[name].recipient.userInput;
}

export function getRecipient(state) {
  return state[name].recipient;
}

// Overall validity and stage selectors

export function getSendErrors(state) {
  return {
    gasFee: state.send.gas.error,
    amount: state.send.amount.error,
  };
}

export function isSendStateInitialized(state) {
  return state[name].stage !== SEND_STAGES.INACTIVE;
}

export function isSendFormInvalid(state) {
  return state[name].status === SEND_STATUSES.INVALID;
}

export function getSendStage(state) {
  return state[name].stage;
}
