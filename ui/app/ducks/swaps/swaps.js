import { createSlice } from '@reduxjs/toolkit'
import BigNumber from 'bignumber.js'

import {
  addToken,
  addUnapprovedTransaction,
  fetchAndSetQuotes,
  forceUpdateMetamaskState,
  resetSwapsPostFetchState,
  setBackgoundSwapRouteState,
  setInitialGasEstimate,
  setSwapsErrorKey,
  setShowAwaitingSwapScreen,
  setApproveTxId,
  setTradeTxId,
  stopPollingForQuotes,
  updateAndApproveTx,
  updateTransaction,
} from '../../store/actions'
import { AWAITING_SWAP_ROUTE, BUILD_QUOTE_ROUTE, LOADING_QUOTES_ROUTE } from '../../helpers/constants/routes'
import { fetchTradesInfo } from '../../pages/swaps/swaps.util'
import { calcGasTotal } from '../../pages/send/send.utils'
import { decimalToHex, getValueFromWeiHex, hexMax } from '../../helpers/utils/conversions.util'
import { constructTxParams } from '../../helpers/utils/util'
import {
  getAveragePriceEstimateInHexWEI,
  getCurrentNetworkId,
  getCustomNetworkId,
  getSelectedAccount,
  getTokenExchangeRates,
} from '../../selectors'
import {
  ERROR_FETCHING_QUOTES,
  QUOTES_NOT_AVAILABLE_ERROR,
  ETH_SWAPS_TOKEN_OBJECT,
} from '../../helpers/constants/swaps'

const initialState = {
  aggregatorMetadata: null,
  approveTxId: null,
  balanceError: false,
  fetchingQuotes: false,
  fromToken: null,
  quotesFetchStartTime: null,
  submittingSwap: false,
  topAssets: {},
  toToken: null,
}

const slice = createSlice({
  name: 'swaps',
  initialState,
  reducers: {
    clearSwapsState: () => initialState,
    navigatedBackToBuildQuote: (state) => {
      state.approveTxId = null
      state.balanceError = false
      state.fetchingQuotes = false
      state.submittingSwap = false
    },
    retriedGetQuotes: (state) => {
      state.approveTxId = null
      state.balanceError = false
      state.fetchingQuotes = false
      state.submittingSwap = false
    },
    setAggregatorMetadata: (state, action) => {
      state.aggregatorMetadata = action.payload
    },
    setBalanceError: (state, action) => {
      state.balanceError = action.payload
    },
    setFetchingQuotes: (state, action) => {
      state.fetchingQuotes = action.payload
    },
    setFromToken: (state, action) => {
      state.fromToken = action.payload
    },
    setQuotesFetchStartTime: (state, action) => {
      state.quotesFetchStartTime = action.payload
    },
    setSubmittingSwap: (state, action) => {
      state.submittingSwap = action.payload
    },
    setTopAssets: (state, action) => {
      state.topAssets = action.payload
    },
    setToToken: (state, action) => {
      state.toToken = action.payload
    },
  },
})

const { actions, reducer } = slice

export default reducer

// Selectors

export const getAggregatorMetadata = (state) => state.swaps.aggregatorMetadata

export const getApproveTxId = (state) => state.swaps.approveTxId

export const getBalanceError = (state) => state.swaps.balanceError

export const getFetchingQuotes = (state) => state.swaps.fetchingQuotes

export const getFromToken = (state) => state.swaps.fromToken

export const getSubmittingSwap = (state) => state.swaps.submittingSwap

export const getTopAssets = (state) => state.swaps.topAssets

export const getToToken = (state) => state.swaps.toToken

// Background selectors

const getSwapsState = (state) => state.metamask.swapsState

export const getBackgoundSwapRouteState = (state) => state.metamask.swapsState.routeState

export const getCustomSwapsGas = (state) => state.metamask.swapsState.customMaxGas

export const getCustomSwapsGasPrice = (state) => state.metamask.swapsState.customGasPrice

export const getFetchParams = (state) => state.metamask.swapsState.fetchParams

export const getMaxMode = (state) => state.metamask.swapsState.maxMode

export const getQuotes = (state) => state.metamask.swapsState.quotes

export const getQuotesLastFetched = (state) => state.metamask.swapsState.quotesLastFetched

export const getSelectedQuote = (state) => {
  const { selectedAggId, quotes } = getSwapsState(state)
  return quotes[selectedAggId]
}

export const getSwapsErrorKey = (state) => getSwapsState(state)?.errorKey

export const getSwapsTokens = (state) => state.metamask.swapsState.tokens

export const getSwapsWelcomeMessageSeenStatus = (state) => state.metamask.swapsWelcomeMessageHasBeenShown

export const getTopQuote = (state) => {
  const { topAggId, quotes } = getSwapsState(state)
  return quotes[topAggId]
}

export const getTradeTxId = (state) => state.metamask.swapsState.tradeTxId

export const getTradeTxParams = (state) => state.metamask.swapsState.tradeTxParams

export const getUsedQuote = (state) => getSelectedQuote(state) || getTopQuote(state)

// Compound selectors

export const getDestinationTokenInfo = (state) => getFetchParams(state)?.metaData?.destinationTokenInfo

export const getSwapsTradeTxParams = (state) => {
  const { selectedAggId, topAggId, quotes } = getSwapsState(state)
  const usedQuote = selectedAggId ? quotes[selectedAggId] : quotes[topAggId]
  if (!usedQuote) {
    return null
  }
  const { trade } = usedQuote
  const gas = getCustomSwapsGas(state) || trade.gas
  const gasPrice = getCustomSwapsGasPrice(state) || trade.gasPrice
  return { ...trade, gas, gasPrice }
}

export const getApproveTxParams = (state) => {
  const { approvalNeeded } = getSelectedQuote(state) || getTopQuote(state) || {}

  if (!approvalNeeded) {
    return null
  }
  const data = getSwapsState(state)?.customApproveTxData || approvalNeeded.data

  const gasPrice = getCustomSwapsGasPrice(state) || approvalNeeded.gasPrice
  return { ...approvalNeeded, gasPrice, data }
}

// Actions / action-creators

const {
  clearSwapsState,
  navigatedBackToBuildQuote,
  retriedGetQuotes,
  setAggregatorMetadata,
  setBalanceError,
  setFetchingQuotes,
  setFromToken,
  setQuotesFetchStartTime,
  setSubmittingSwap,
  setTopAssets,
  setToToken,
} = actions

export {
  clearSwapsState,
  setAggregatorMetadata,
  setBalanceError,
  setFetchingQuotes,
  setFromToken as setSwapsFromToken,
  setQuotesFetchStartTime as setSwapQuotesFetchStartTime,
  setSubmittingSwap,
  setTopAssets,
  setToToken as setSwapToToken,
}

export const navigateBackToBuildQuote = (history) => {
  return async (dispatch) => {
    // TODO: Ensure any fetch in progress is cancelled
    await dispatch(resetSwapsPostFetchState())
    dispatch(navigatedBackToBuildQuote())

    history.push(BUILD_QUOTE_ROUTE)
  }
}

export const prepareForRetryGetQuotes = () => {
  return async (dispatch) => {
    // TODO: Ensure any fetch in progress is cancelled
    await dispatch(resetSwapsPostFetchState())
    dispatch(retriedGetQuotes())
  }
}

export const fetchQuotesAndSetQuoteState = (history, inputValue, maxSlippage) => {
  return async (dispatch, getState) => {
    const state = getState()
    const fetchParams = getFetchParams(state)
    const selectedAccount = getSelectedAccount(state)
    const fetchParamsFromToken = fetchParams?.metaData?.sourceTokenInfo?.symbol === 'ETH' ?
      {
        ...ETH_SWAPS_TOKEN_OBJECT,
        string: getValueFromWeiHex({ value: selectedAccount.balance, numberOfDecimals: 4, toDenomination: 'ETH' }),
        balance: selectedAccount.balance,
      } :
      fetchParams?.metaData?.sourceTokenInfo
    const selectedFromToken = getFromToken(state) || fetchParamsFromToken || {}
    const selectedToToken = getToToken(state) || fetchParams?.metaData?.destinationTokenInfo || {}
    const {
      address: fromTokenAddress,
      symbol: fromTokenSymbol,
      decimals: fromTokenDecimals,
      iconUrl: fromTokenIconUrl,
      balance: fromTokenBalance,
    } = selectedFromToken
    const {
      address: toTokenAddress,
      symbol: toTokenSymbol,
      decimals: toTokenDecimals,
      iconUrl: toTokenIconUrl,
    } = selectedToToken
    await dispatch(setBackgoundSwapRouteState('loading'))
    history.push(LOADING_QUOTES_ROUTE)
    dispatch(setFetchingQuotes(true))

    const contractExchangeRates = getTokenExchangeRates(state)

    let destinationTokenAddedForSwap = false
    if (toTokenSymbol !== 'ETH' && !contractExchangeRates[toTokenAddress]) {
      destinationTokenAddedForSwap = true
      await dispatch(addToken(toTokenAddress, toTokenSymbol, toTokenDecimals, toTokenIconUrl, true))
    }
    if (fromTokenSymbol !== 'ETH' && !contractExchangeRates[fromTokenAddress] && fromTokenBalance && (new BigNumber(fromTokenBalance, 16)).gt(0)) {
      dispatch(addToken(fromTokenAddress, fromTokenSymbol, fromTokenDecimals, fromTokenIconUrl, true))
    }

    const swapsTokens = getSwapsTokens(state)

    const sourceTokenInfo = swapsTokens?.find(({ address }) => address === fromTokenAddress) || selectedFromToken
    const destinationTokenInfo = swapsTokens?.find(({ address }) => address === toTokenAddress) || selectedToToken

    dispatch(setFromToken(selectedFromToken))

    const maxMode = getMaxMode(state)

    let revisedValue
    if (maxMode && sourceTokenInfo.symbol === 'ETH') {
      const customConvertGasPrice = getCustomSwapsGasPrice(state)
      const tradeTxParams = getTradeTxParams(state)
      const averageGasEstimate = getAveragePriceEstimateInHexWEI(state)
      const usedGasPrice = customConvertGasPrice || tradeTxParams?.gasPrice || averageGasEstimate

      const totalGasLimitForCalculation = (new BigNumber(800000, 10)).plus(100000, 10).toString(16)
      const gasTotalInWeiHex = calcGasTotal(totalGasLimitForCalculation, usedGasPrice)
      revisedValue = (new BigNumber(selectedAccount.balance, 16)).minus(gasTotalInWeiHex, 16).div('1000000000000000000').toString(10)
    }

    try {
      const fetchStartTime = Date.now()
      dispatch(setQuotesFetchStartTime(fetchStartTime))
      const customNetworkId = getCustomNetworkId(state)
      const balanceError = getBalanceError(state)
      const [fetchedQuotes, selectedAggId] = await dispatch(fetchAndSetQuotes(
        {
          slippage: maxSlippage,
          sourceToken: fromTokenAddress,
          destinationToken: toTokenAddress,
          value: revisedValue || inputValue,
          fromAddress: selectedAccount.address,
          // TODO: what is going on here...
          isCustomNetwork: Boolean(customNetworkId) || true,
          destinationTokenAddedForSwap,
          balanceError,
          sourceDecimals: fromTokenDecimals,
        },
        {
          sourceTokenInfo,
          destinationTokenInfo,
        },
      ))
      if (Object.values(fetchedQuotes)?.length === 0) {
        dispatch(setSwapsErrorKey(QUOTES_NOT_AVAILABLE_ERROR))
      } else {
        const newSelectedQuote = fetchedQuotes[selectedAggId]
        dispatch(setInitialGasEstimate(selectedAggId, newSelectedQuote.maxGas))
      }
    } catch (e) {
      dispatch(setSwapsErrorKey(ERROR_FETCHING_QUOTES))
    }

    dispatch(setFetchingQuotes(false))
  }
}

export const signAndSendTransactions = (history) => {
  return async (dispatch, getState) => {
    const state = getState()
    const fetchParams = getFetchParams(state)
    const { metaData, value: swapTokenValue, slippage } = fetchParams
    const { sourceTokenInfo = {}, destinationTokenInfo = {} } = metaData
    history.push(AWAITING_SWAP_ROUTE)

    dispatch(stopPollingForQuotes())
    dispatch(setSubmittingSwap(true))

    const usedQuote = getUsedQuote(state)
    let usedTradeTxParams = usedQuote.trade

    const estimatedGasLimit = new BigNumber(usedQuote?.gasEstimate || decimalToHex(usedQuote?.averageGas || 0), 16)
    const estimatedGasLimitWithMultiplier = estimatedGasLimit.times(1.4, 10).round(0).toString(16)
    const maxGasLimit = hexMax((`0x${decimalToHex(usedQuote?.maxGas || 0)}`), estimatedGasLimitWithMultiplier)
    usedTradeTxParams.gas = maxGasLimit

    const customConvertGasPrice = getCustomSwapsGasPrice(state)
    const tradeTxParams = getTradeTxParams(state)
    const averageGasEstimate = getAveragePriceEstimateInHexWEI(state)
    const usedGasPrice = customConvertGasPrice || tradeTxParams?.gasPrice || averageGasEstimate

    const totalGasLimitForCalculation = (new BigNumber(usedTradeTxParams.gas, 16)).plus(usedQuote.approvalNeeded?.gas || '0x0', 16).toString(16)
    const gasTotalInWeiHex = calcGasTotal(totalGasLimitForCalculation, usedGasPrice)

    const maxMode = getMaxMode(state)
    const selectedAccount = getSelectedAccount(state)
    if (maxMode && sourceTokenInfo.symbol === 'ETH') {
      const ethBalance = selectedAccount.balance
      const networkId = getCurrentNetworkId(state)
      const customNetworkId = getCustomNetworkId(state)
      const revisedTradeValue = (new BigNumber(ethBalance, 16)).minus(gasTotalInWeiHex, 16).toString(10)
      const [revisedQuote] = await fetchTradesInfo({
        sourceToken: sourceTokenInfo.address,
        destinationToken: destinationTokenInfo.address,
        slippage,
        value: revisedTradeValue,
        exchangeList: usedQuote.aggregator,
        fromAddress: selectedAccount.address,
        timeout: 10000,
        networkId,
        // TODO: what is going on here...
        isCustomNetwork: Boolean(customNetworkId) || true,
        sourceDecimals: 18,
      })
      const tradeForGasEstimate = { ...revisedQuote.trade }
      delete tradeForGasEstimate.gas
      usedTradeTxParams = constructTxParams({
        ...revisedQuote.trade,
        gas: decimalToHex(usedTradeTxParams.gas),
        amount: decimalToHex(revisedQuote.trade.value),
        gasPrice: tradeTxParams.gasPrice,
      })
    }

    const approveTxParams = getApproveTxParams(state)
    if (approveTxParams) {
      const approveTxMeta = await dispatch(addUnapprovedTransaction({ ...approveTxParams, amount: '0x0' }, 'metamask'))
      dispatch(setApproveTxId(approveTxMeta.id))
      const finalApproveTxMeta = await (dispatch(updateTransaction({
        ...approveTxMeta,
        sourceTokenSymbol: sourceTokenInfo.symbol,
      }, true)))
      await dispatch(updateAndApproveTx(finalApproveTxMeta, true))
    }

    const tradeTxMeta = await dispatch(addUnapprovedTransaction(usedTradeTxParams, 'metamask'))
    dispatch(setTradeTxId(tradeTxMeta.id))
    const finalTradeTxMeta = await (dispatch(updateTransaction({
      ...tradeTxMeta,
      sourceTokenSymbol: sourceTokenInfo.symbol,
      destinationTokenSymbol: destinationTokenInfo.symbol,
      swapTokenValue,
    }, true)))
    await dispatch(updateAndApproveTx(finalTradeTxMeta, true))

    await forceUpdateMetamaskState(dispatch)
    dispatch(setShowAwaitingSwapScreen(true))
    dispatch(setSubmittingSwap(false))
  }
}
