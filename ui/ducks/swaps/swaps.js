import { createSlice } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';
import log from 'loglevel';

import { captureMessage } from '@sentry/browser';

import {
  addToken,
  addUnapprovedTransaction,
  fetchAndSetQuotes,
  forceUpdateMetamaskState,
  resetSwapsPostFetchState,
  setBackgroundSwapRouteState,
  setInitialGasEstimate,
  setSwapsErrorKey,
  setSwapsTxGasPrice,
  setApproveTxId,
  setTradeTxId,
  stopPollingForQuotes,
  updateAndApproveTx,
  updateTransaction,
  resetBackgroundSwapsState,
  setSwapsLiveness,
  setSelectedQuoteAggId,
  setSwapsTxGasLimit,
  cancelTx,
} from '../../store/actions';
import {
  AWAITING_SIGNATURES_ROUTE,
  AWAITING_SWAP_ROUTE,
  BUILD_QUOTE_ROUTE,
  LOADING_QUOTES_ROUTE,
  SWAPS_ERROR_ROUTE,
  SWAPS_MAINTENANCE_ROUTE,
} from '../../helpers/constants/routes';
import {
  fetchSwapsGasPrices,
  isContractAddressValid,
} from '../../pages/swaps/swaps.util';
import {
  getValueFromWeiHex,
  decGWEIToHexWEI,
  hexWEIToDecGWEI,
} from '../../helpers/utils/conversions.util';
import {
  conversionLessThan,
  decimalToHex,
} from '../../../shared/modules/conversion-util';
import {
  getSelectedAccount,
  getTokenExchangeRates,
  getUSDConversionRate,
  getSwapsDefaultToken,
  getCurrentChainId,
  isHardwareWallet,
  getHardwareWalletType,
} from '../../selectors';
import {
  ERROR_FETCHING_QUOTES,
  QUOTES_NOT_AVAILABLE_ERROR,
  CONTRACT_DATA_DISABLED_ERROR,
  SWAP_FAILED_ERROR,
  SWAPS_FETCH_ORDER_CONFLICT,
} from '../../../shared/constants/swaps';
import { TRANSACTION_TYPES } from '../../../shared/constants/transaction';
import { calcGasTotal } from '../../../shared/modules/gas-utils';
import { calcTokenAmount } from '../../../shared/modules/token-utils';
import { fetchSwapsFeatureLiveness } from '../../../shared/modules/swaps.utils';

const GAS_PRICES_LOADING_STATES = {
  INITIAL: 'INITIAL',
  LOADING: 'LOADING',
  FAILED: 'FAILED',
  COMPLETED: 'COMPLETED',
};

export const FALLBACK_GAS_MULTIPLIER = 1.5;

const initialState = {
  aggregatorMetadata: null,
  approveTxId: null,
  tradeTxId: null,
  balanceError: false,
  fetchingQuotes: false,
  fromToken: null,
  quotesFetchStartTime: null,
  topAssets: {},
  toToken: null,
  customGas: {
    price: null,
    limit: null,
    loading: GAS_PRICES_LOADING_STATES.INITIAL,
    priceEstimates: {},
    fallBackPrice: null,
  },
};

const slice = createSlice({
  name: 'swaps',
  initialState,
  reducers: {
    clearSwapsState: () => initialState,
    navigatedBackToBuildQuote: (state) => {
      state.approveTxId = null;
      state.tradeTxId = null;
      state.balanceError = false;
      state.fetchingQuotes = false;
      state.customGas.limit = null;
      state.customGas.price = null;
    },
    retriedGetQuotes: (state) => {
      state.approveTxId = null;
      state.balanceError = false;
      state.fetchingQuotes = false;
    },
    setAggregatorMetadata: (state, action) => {
      state.aggregatorMetadata = action.payload;
    },
    setBalanceError: (state, action) => {
      state.balanceError = action.payload;
    },
    setFetchingQuotes: (state, action) => {
      state.fetchingQuotes = action.payload;
    },
    setFromToken: (state, action) => {
      state.fromToken = action.payload;
    },
    setQuotesFetchStartTime: (state, action) => {
      state.quotesFetchStartTime = action.payload;
    },
    setTopAssets: (state, action) => {
      state.topAssets = action.payload;
    },
    setToToken: (state, action) => {
      state.toToken = action.payload;
    },
    swapCustomGasModalClosed: (state) => {
      state.customGas.price = null;
      state.customGas.limit = null;
    },
    swapCustomGasModalPriceEdited: (state, action) => {
      state.customGas.price = action.payload;
    },
    swapCustomGasModalLimitEdited: (state, action) => {
      state.customGas.limit = action.payload;
    },
    swapGasPriceEstimatesFetchStarted: (state) => {
      state.customGas.loading = GAS_PRICES_LOADING_STATES.LOADING;
    },
    swapGasPriceEstimatesFetchFailed: (state) => {
      state.customGas.loading = GAS_PRICES_LOADING_STATES.FAILED;
    },
    swapGasPriceEstimatesFetchCompleted: (state, action) => {
      state.customGas.priceEstimates = action.payload.priceEstimates;
      state.customGas.loading = GAS_PRICES_LOADING_STATES.COMPLETED;
    },
    retrievedFallbackSwapsGasPrice: (state, action) => {
      state.customGas.fallBackPrice = action.payload;
    },
  },
});

const { actions, reducer } = slice;

export default reducer;

// Selectors

export const getAggregatorMetadata = (state) => state.swaps.aggregatorMetadata;

export const getBalanceError = (state) => state.swaps.balanceError;

export const getFromToken = (state) => state.swaps.fromToken;

export const getTopAssets = (state) => state.swaps.topAssets;

export const getToToken = (state) => state.swaps.toToken;

export const getFetchingQuotes = (state) => state.swaps.fetchingQuotes;

export const getQuotesFetchStartTime = (state) =>
  state.swaps.quotesFetchStartTime;

export const getSwapsCustomizationModalPrice = (state) =>
  state.swaps.customGas.price;

export const getSwapsCustomizationModalLimit = (state) =>
  state.swaps.customGas.limit;

export const swapGasPriceEstimateIsLoading = (state) =>
  state.swaps.customGas.loading === GAS_PRICES_LOADING_STATES.LOADING;

export const swapGasEstimateLoadingHasFailed = (state) =>
  state.swaps.customGas.loading === GAS_PRICES_LOADING_STATES.INITIAL;

export const getSwapGasPriceEstimateData = (state) =>
  state.swaps.customGas.priceEstimates;

export const getSwapsFallbackGasPrice = (state) =>
  state.swaps.customGas.fallBackPrice;

export function shouldShowCustomPriceTooLowWarning(state) {
  const { average } = getSwapGasPriceEstimateData(state);

  const customGasPrice = getSwapsCustomizationModalPrice(state);

  if (!customGasPrice || average === undefined) {
    return false;
  }

  const customPriceRisksSwapFailure = conversionLessThan(
    {
      value: customGasPrice,
      fromNumericBase: 'hex',
      fromDenomination: 'WEI',
      toDenomination: 'GWEI',
    },
    { value: average, fromNumericBase: 'dec' },
  );

  return customPriceRisksSwapFailure;
}

// Background selectors

const getSwapsState = (state) => state.metamask.swapsState;

export const getSwapsFeatureLiveness = (state) =>
  state.metamask.swapsState.swapsFeatureIsLive;

export const getSwapsQuoteRefreshTime = (state) =>
  state.metamask.swapsState.swapsQuoteRefreshTime;

export const getBackgroundSwapRouteState = (state) =>
  state.metamask.swapsState.routeState;

export const getCustomSwapsGas = (state) =>
  state.metamask.swapsState.customMaxGas;

export const getCustomSwapsGasPrice = (state) =>
  state.metamask.swapsState.customGasPrice;

export const getFetchParams = (state) => state.metamask.swapsState.fetchParams;

export const getQuotes = (state) => state.metamask.swapsState.quotes;

export const getQuotesLastFetched = (state) =>
  state.metamask.swapsState.quotesLastFetched;

export const getSelectedQuote = (state) => {
  const { selectedAggId, quotes } = getSwapsState(state);
  return quotes[selectedAggId];
};

export const getSwapsErrorKey = (state) => getSwapsState(state)?.errorKey;

export const getShowQuoteLoadingScreen = (state) =>
  state.swaps.showQuoteLoadingScreen;

export const getSwapsTokens = (state) => state.metamask.swapsState.tokens;

export const getSwapsWelcomeMessageSeenStatus = (state) =>
  state.metamask.swapsWelcomeMessageHasBeenShown;

export const getTopQuote = (state) => {
  const { topAggId, quotes } = getSwapsState(state);
  return quotes[topAggId];
};

export const getApproveTxId = (state) => state.metamask.swapsState.approveTxId;

export const getTradeTxId = (state) => state.metamask.swapsState.tradeTxId;

export const getUsedQuote = (state) =>
  getSelectedQuote(state) || getTopQuote(state);

// Compound selectors

export const getDestinationTokenInfo = (state) =>
  getFetchParams(state)?.metaData?.destinationTokenInfo;

export const getUsedSwapsGasPrice = (state) =>
  getCustomSwapsGasPrice(state) || getSwapsFallbackGasPrice(state);

export const getApproveTxParams = (state) => {
  const { approvalNeeded } =
    getSelectedQuote(state) || getTopQuote(state) || {};

  if (!approvalNeeded) {
    return null;
  }
  const data = getSwapsState(state)?.customApproveTxData || approvalNeeded.data;

  const gasPrice = getUsedSwapsGasPrice(state);
  return { ...approvalNeeded, gasPrice, data };
};

// Actions / action-creators

const {
  clearSwapsState,
  navigatedBackToBuildQuote,
  retriedGetQuotes,
  swapGasPriceEstimatesFetchCompleted,
  swapGasPriceEstimatesFetchStarted,
  swapGasPriceEstimatesFetchFailed,
  setAggregatorMetadata,
  setBalanceError,
  setFetchingQuotes,
  setFromToken,
  setQuotesFetchStartTime,
  setTopAssets,
  setToToken,
  swapCustomGasModalPriceEdited,
  swapCustomGasModalLimitEdited,
  retrievedFallbackSwapsGasPrice,
  swapCustomGasModalClosed,
} = actions;

export {
  clearSwapsState,
  setAggregatorMetadata,
  setBalanceError,
  setFetchingQuotes,
  setFromToken as setSwapsFromToken,
  setQuotesFetchStartTime as setSwapQuotesFetchStartTime,
  setTopAssets,
  setToToken as setSwapToToken,
  swapCustomGasModalPriceEdited,
  swapCustomGasModalLimitEdited,
  swapCustomGasModalClosed,
};

export const navigateBackToBuildQuote = (history) => {
  return async (dispatch) => {
    // TODO: Ensure any fetch in progress is cancelled
    await dispatch(setBackgroundSwapRouteState(''));
    dispatch(navigatedBackToBuildQuote());
    history.push(BUILD_QUOTE_ROUTE);
  };
};

export const prepareForRetryGetQuotes = () => {
  return async (dispatch) => {
    // TODO: Ensure any fetch in progress is cancelled
    await dispatch(resetSwapsPostFetchState());
    dispatch(retriedGetQuotes());
  };
};

export const prepareToLeaveSwaps = () => {
  return async (dispatch) => {
    dispatch(clearSwapsState());
    await dispatch(resetBackgroundSwapsState());
  };
};

export const swapsQuoteSelected = (aggId) => {
  return (dispatch) => {
    dispatch(swapCustomGasModalLimitEdited(null));
    dispatch(setSelectedQuoteAggId(aggId));
    dispatch(setSwapsTxGasLimit(''));
  };
};

export const fetchAndSetSwapsGasPriceInfo = () => {
  return async (dispatch) => {
    const basicEstimates = await dispatch(fetchMetaSwapsGasPriceEstimates());

    if (basicEstimates?.fast) {
      dispatch(setSwapsTxGasPrice(decGWEIToHexWEI(basicEstimates.fast)));
    }
  };
};

export const fetchSwapsLiveness = () => {
  return async (dispatch, getState) => {
    let swapsFeatureIsLive = false;
    try {
      swapsFeatureIsLive = await fetchSwapsFeatureLiveness(
        getCurrentChainId(getState()),
      );
    } catch (error) {
      log.error('Failed to fetch Swaps liveness, defaulting to false.', error);
    }
    await dispatch(setSwapsLiveness(swapsFeatureIsLive));
    return swapsFeatureIsLive;
  };
};

export const fetchQuotesAndSetQuoteState = (
  history,
  inputValue,
  maxSlippage,
  metaMetricsEvent,
) => {
  return async (dispatch, getState) => {
    const state = getState();
    const chainId = getCurrentChainId(state);
    let swapsFeatureIsLive = false;
    try {
      swapsFeatureIsLive = await fetchSwapsFeatureLiveness(chainId);
    } catch (error) {
      log.error('Failed to fetch Swaps liveness, defaulting to false.', error);
    }
    await dispatch(setSwapsLiveness(swapsFeatureIsLive));

    if (!swapsFeatureIsLive) {
      await history.push(SWAPS_MAINTENANCE_ROUTE);
      return;
    }

    const fetchParams = getFetchParams(state);
    const selectedAccount = getSelectedAccount(state);
    const balanceError = getBalanceError(state);
    const swapsDefaultToken = getSwapsDefaultToken(state);
    const fetchParamsFromToken =
      fetchParams?.metaData?.sourceTokenInfo?.symbol ===
      swapsDefaultToken.symbol
        ? swapsDefaultToken
        : fetchParams?.metaData?.sourceTokenInfo;
    const selectedFromToken = getFromToken(state) || fetchParamsFromToken || {};
    const selectedToToken =
      getToToken(state) || fetchParams?.metaData?.destinationTokenInfo || {};
    const {
      address: fromTokenAddress,
      symbol: fromTokenSymbol,
      decimals: fromTokenDecimals,
      iconUrl: fromTokenIconUrl,
      balance: fromTokenBalance,
    } = selectedFromToken;
    const {
      address: toTokenAddress,
      symbol: toTokenSymbol,
      decimals: toTokenDecimals,
      iconUrl: toTokenIconUrl,
    } = selectedToToken;
    await dispatch(setBackgroundSwapRouteState('loading'));
    history.push(LOADING_QUOTES_ROUTE);
    dispatch(setFetchingQuotes(true));

    const contractExchangeRates = getTokenExchangeRates(state);

    let destinationTokenAddedForSwap = false;
    if (
      toTokenAddress &&
      toTokenSymbol !== swapsDefaultToken.symbol &&
      contractExchangeRates[toTokenAddress] === undefined
    ) {
      destinationTokenAddedForSwap = true;
      await dispatch(
        addToken(
          toTokenAddress,
          toTokenSymbol,
          toTokenDecimals,
          toTokenIconUrl,
          true,
        ),
      );
    }
    if (
      fromTokenAddress &&
      fromTokenSymbol !== swapsDefaultToken.symbol &&
      !contractExchangeRates[fromTokenAddress] &&
      fromTokenBalance &&
      new BigNumber(fromTokenBalance, 16).gt(0)
    ) {
      dispatch(
        addToken(
          fromTokenAddress,
          fromTokenSymbol,
          fromTokenDecimals,
          fromTokenIconUrl,
          true,
        ),
      );
    }

    const swapsTokens = getSwapsTokens(state);

    const sourceTokenInfo =
      swapsTokens?.find(({ address }) => address === fromTokenAddress) ||
      selectedFromToken;
    const destinationTokenInfo =
      swapsTokens?.find(({ address }) => address === toTokenAddress) ||
      selectedToToken;

    dispatch(setFromToken(selectedFromToken));

    const hardwareWalletUsed = isHardwareWallet(state);
    const hardwareWalletType = getHardwareWalletType(state);
    metaMetricsEvent({
      event: 'Quotes Requested',
      category: 'swaps',
      sensitiveProperties: {
        token_from: fromTokenSymbol,
        token_from_amount: String(inputValue),
        token_to: toTokenSymbol,
        request_type: balanceError ? 'Quote' : 'Order',
        slippage: maxSlippage,
        custom_slippage: maxSlippage !== 2,
        is_hardware_wallet: hardwareWalletUsed,
        hardware_wallet_type: hardwareWalletType,
        anonymizedData: true,
      },
    });

    try {
      const fetchStartTime = Date.now();
      dispatch(setQuotesFetchStartTime(fetchStartTime));

      const fetchAndSetQuotesPromise = dispatch(
        fetchAndSetQuotes(
          {
            slippage: maxSlippage,
            sourceToken: fromTokenAddress,
            destinationToken: toTokenAddress,
            value: inputValue,
            fromAddress: selectedAccount.address,
            destinationTokenAddedForSwap,
            balanceError,
            sourceDecimals: fromTokenDecimals,
          },
          {
            sourceTokenInfo,
            destinationTokenInfo,
            accountBalance: selectedAccount.balance,
            chainId,
          },
        ),
      );

      const gasPriceFetchPromise = dispatch(fetchAndSetSwapsGasPriceInfo());

      const [[fetchedQuotes, selectedAggId]] = await Promise.all([
        fetchAndSetQuotesPromise,
        gasPriceFetchPromise,
      ]);

      if (Object.values(fetchedQuotes)?.length === 0) {
        metaMetricsEvent({
          event: 'No Quotes Available',
          category: 'swaps',
          sensitiveProperties: {
            token_from: fromTokenSymbol,
            token_from_amount: String(inputValue),
            token_to: toTokenSymbol,
            request_type: balanceError ? 'Quote' : 'Order',
            slippage: maxSlippage,
            custom_slippage: maxSlippage !== 2,
            is_hardware_wallet: hardwareWalletUsed,
            hardware_wallet_type: hardwareWalletType,
          },
        });
        dispatch(setSwapsErrorKey(QUOTES_NOT_AVAILABLE_ERROR));
      } else {
        const newSelectedQuote = fetchedQuotes[selectedAggId];

        metaMetricsEvent({
          event: 'Quotes Received',
          category: 'swaps',
          sensitiveProperties: {
            token_from: fromTokenSymbol,
            token_from_amount: String(inputValue),
            token_to: toTokenSymbol,
            token_to_amount: calcTokenAmount(
              newSelectedQuote.destinationAmount,
              newSelectedQuote.decimals || 18,
            ),
            request_type: balanceError ? 'Quote' : 'Order',
            slippage: maxSlippage,
            custom_slippage: maxSlippage !== 2,
            response_time: Date.now() - fetchStartTime,
            best_quote_source: newSelectedQuote.aggregator,
            available_quotes: Object.values(fetchedQuotes)?.length,
            is_hardware_wallet: hardwareWalletUsed,
            hardware_wallet_type: hardwareWalletType,
            anonymizedData: true,
          },
        });

        dispatch(setInitialGasEstimate(selectedAggId));
      }
    } catch (e) {
      // A newer swap request is running, so simply bail and let the newer request respond
      if (e.message === SWAPS_FETCH_ORDER_CONFLICT) {
        log.debug(`Swap fetch order conflict detected; ignoring older request`);
        return;
      }
      // TODO: Check for any errors we should expect to occur in production, and report others to Sentry
      log.error(`Error fetching quotes: `, e);

      dispatch(setSwapsErrorKey(ERROR_FETCHING_QUOTES));
    }

    dispatch(setFetchingQuotes(false));
  };
};

export const signAndSendTransactions = (history, metaMetricsEvent) => {
  return async (dispatch, getState) => {
    const state = getState();
    const chainId = getCurrentChainId(state);
    const hardwareWalletUsed = isHardwareWallet(state);
    let swapsFeatureIsLive = false;
    try {
      swapsFeatureIsLive = await fetchSwapsFeatureLiveness(chainId);
    } catch (error) {
      log.error('Failed to fetch Swaps liveness, defaulting to false.', error);
    }
    await dispatch(setSwapsLiveness(swapsFeatureIsLive));

    if (!swapsFeatureIsLive) {
      await history.push(SWAPS_MAINTENANCE_ROUTE);
      return;
    }

    const customSwapsGas = getCustomSwapsGas(state);
    const fetchParams = getFetchParams(state);
    const { metaData, value: swapTokenValue, slippage } = fetchParams;
    const { sourceTokenInfo = {}, destinationTokenInfo = {} } = metaData;
    await dispatch(setBackgroundSwapRouteState('awaiting'));
    await dispatch(stopPollingForQuotes());

    if (!hardwareWalletUsed) {
      history.push(AWAITING_SWAP_ROUTE);
    }

    const { fast: fastGasEstimate } = getSwapGasPriceEstimateData(state);

    const usedQuote = getUsedQuote(state);
    const usedTradeTxParams = usedQuote.trade;

    const estimatedGasLimit = new BigNumber(
      usedQuote?.gasEstimate || `0x0`,
      16,
    );
    const estimatedGasLimitWithMultiplier = estimatedGasLimit
      .times(usedQuote?.gasMultiplier || FALLBACK_GAS_MULTIPLIER, 10)
      .round(0)
      .toString(16);
    const maxGasLimit =
      customSwapsGas ||
      (usedQuote?.gasEstimate
        ? estimatedGasLimitWithMultiplier
        : `0x${decimalToHex(usedQuote?.maxGas || 0)}`);

    const usedGasPrice = getUsedSwapsGasPrice(state);
    usedTradeTxParams.gas = maxGasLimit;
    usedTradeTxParams.gasPrice = usedGasPrice;

    const usdConversionRate = getUSDConversionRate(state);
    const destinationValue = calcTokenAmount(
      usedQuote.destinationAmount,
      destinationTokenInfo.decimals || 18,
    ).toPrecision(8);
    const usedGasLimitEstimate =
      usedQuote?.gasEstimateWithRefund ||
      `0x${decimalToHex(usedQuote?.averageGas || 0)}`;
    const totalGasLimitEstimate = new BigNumber(usedGasLimitEstimate, 16)
      .plus(usedQuote.approvalNeeded?.gas || '0x0', 16)
      .toString(16);
    const gasEstimateTotalInUSD = getValueFromWeiHex({
      value: calcGasTotal(totalGasLimitEstimate, usedGasPrice),
      toCurrency: 'usd',
      conversionRate: usdConversionRate,
      numberOfDecimals: 6,
    });

    const swapMetaData = {
      token_from: sourceTokenInfo.symbol,
      token_from_amount: String(swapTokenValue),
      token_to: destinationTokenInfo.symbol,
      token_to_amount: destinationValue,
      slippage,
      custom_slippage: slippage !== 2,
      best_quote_source: getTopQuote(state)?.aggregator,
      available_quotes: getQuotes(state)?.length,
      other_quote_selected:
        usedQuote.aggregator !== getTopQuote(state)?.aggregator,
      other_quote_selected_source:
        usedQuote.aggregator === getTopQuote(state)?.aggregator
          ? ''
          : usedQuote.aggregator,
      gas_fees: gasEstimateTotalInUSD,
      estimated_gas: estimatedGasLimit.toString(10),
      suggested_gas_price: fastGasEstimate,
      used_gas_price: hexWEIToDecGWEI(usedGasPrice),
      average_savings: usedQuote.savings?.total,
      performance_savings: usedQuote.savings?.performance,
      fee_savings: usedQuote.savings?.fee,
      median_metamask_fee: usedQuote.savings?.medianMetaMaskFee,
      is_hardware_wallet: hardwareWalletUsed,
      hardware_wallet_type: getHardwareWalletType(state),
    };

    metaMetricsEvent({
      event: 'Swap Started',
      category: 'swaps',
      sensitiveProperties: swapMetaData,
    });

    if (!isContractAddressValid(usedTradeTxParams.to, swapMetaData, chainId)) {
      captureMessage('Invalid contract address', {
        extra: {
          token_from: swapMetaData.token_from,
          token_to: swapMetaData.token_to,
          contract_address: usedTradeTxParams.to,
        },
      });
      await dispatch(setSwapsErrorKey(SWAP_FAILED_ERROR));
      history.push(SWAPS_ERROR_ROUTE);
      return;
    }

    let finalApproveTxMeta;
    const approveTxParams = getApproveTxParams(state);

    // For hardware wallets we go to the Awaiting Signatures page first and only after a user
    // completes 1 or 2 confirmations, we redirect to the Awaiting Swap page.
    if (hardwareWalletUsed) {
      history.push(AWAITING_SIGNATURES_ROUTE);
    }

    if (approveTxParams) {
      const approveTxMeta = await dispatch(
        addUnapprovedTransaction(
          { ...approveTxParams, amount: '0x0' },
          'metamask',
        ),
      );
      await dispatch(setApproveTxId(approveTxMeta.id));
      finalApproveTxMeta = await dispatch(
        updateTransaction(
          {
            ...approveTxMeta,
            type: TRANSACTION_TYPES.SWAP_APPROVAL,
            sourceTokenSymbol: sourceTokenInfo.symbol,
          },
          true,
        ),
      );
      try {
        await dispatch(updateAndApproveTx(finalApproveTxMeta, true));
      } catch (e) {
        await dispatch(setSwapsErrorKey(SWAP_FAILED_ERROR));
        history.push(SWAPS_ERROR_ROUTE);
        return;
      }
    }

    const tradeTxMeta = await dispatch(
      addUnapprovedTransaction(usedTradeTxParams, 'metamask'),
    );
    dispatch(setTradeTxId(tradeTxMeta.id));

    // The simulationFails property is added during the transaction controllers
    // addUnapprovedTransaction call if the estimateGas call fails. In cases
    // when no approval is required, this indicates that the swap will likely
    // fail. There was an earlier estimateGas call made by the swaps controller,
    // but it is possible that external conditions have change since then, and
    // a previously succeeding estimate gas call could now fail. By checking for
    // the `simulationFails` property here, we can reduce the number of swap
    // transactions that get published to the blockchain only to fail and thereby
    // waste the user's funds on gas.
    if (!approveTxParams && tradeTxMeta.simulationFails) {
      await dispatch(cancelTx(tradeTxMeta, false));
      await dispatch(setSwapsErrorKey(SWAP_FAILED_ERROR));
      history.push(SWAPS_ERROR_ROUTE);
      return;
    }
    const finalTradeTxMeta = await dispatch(
      updateTransaction(
        {
          ...tradeTxMeta,
          sourceTokenSymbol: sourceTokenInfo.symbol,
          destinationTokenSymbol: destinationTokenInfo.symbol,
          type: TRANSACTION_TYPES.SWAP,
          destinationTokenDecimals: destinationTokenInfo.decimals,
          destinationTokenAddress: destinationTokenInfo.address,
          swapMetaData,
          swapTokenValue,
          approvalTxId: finalApproveTxMeta?.id,
        },
        true,
      ),
    );
    try {
      await dispatch(updateAndApproveTx(finalTradeTxMeta, true));
    } catch (e) {
      const errorKey = e.message.includes('EthAppPleaseEnableContractData')
        ? CONTRACT_DATA_DISABLED_ERROR
        : SWAP_FAILED_ERROR;
      await dispatch(setSwapsErrorKey(errorKey));
      history.push(SWAPS_ERROR_ROUTE);
      return;
    }

    // Only after a user confirms swapping on a hardware wallet (second `updateAndApproveTx` call above),
    // we redirect to the Awaiting Swap page.
    if (hardwareWalletUsed) {
      history.push(AWAITING_SWAP_ROUTE);
    }

    await forceUpdateMetamaskState(dispatch);
  };
};

export function fetchMetaSwapsGasPriceEstimates() {
  return async (dispatch, getState) => {
    const state = getState();
    const chainId = getCurrentChainId(state);

    dispatch(swapGasPriceEstimatesFetchStarted());

    let priceEstimates;
    try {
      priceEstimates = await fetchSwapsGasPrices(chainId);
    } catch (e) {
      log.warn('Fetching swaps gas prices failed:', e);

      if (!e.message?.match(/NetworkError|Fetch failed with status:/u)) {
        throw e;
      }

      dispatch(swapGasPriceEstimatesFetchFailed());

      try {
        const gasPrice = await global.ethQuery.gasPrice();
        const gasPriceInDecGWEI = hexWEIToDecGWEI(gasPrice.toString(10));

        dispatch(retrievedFallbackSwapsGasPrice(gasPriceInDecGWEI));
        return null;
      } catch (networkGasPriceError) {
        console.error(
          `Failed to retrieve fallback gas price: `,
          networkGasPriceError,
        );
        return null;
      }
    }

    dispatch(
      swapGasPriceEstimatesFetchCompleted({
        priceEstimates,
      }),
    );
    return priceEstimates;
  };
}
