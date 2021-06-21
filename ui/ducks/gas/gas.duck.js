import { cloneDeep } from 'lodash';
import BigNumber from 'bignumber.js';
import {
  getStorageItem,
  setStorageItem,
} from '../../../shared/modules/storage-helpers';
import {
  decGWEIToHexWEI,
  getValueFromWeiHex,
} from '../../helpers/utils/conversions.util';
import { getIsMainnet, getCurrentChainId } from '../../selectors';
import fetchWithCache from '../../../shared/modules/fetch-with-cache';

export const BASIC_ESTIMATE_STATES = {
  LOADING: 'LOADING',
  FAILED: 'FAILED',
  READY: 'READY',
};

export const GAS_SOURCE = {
  METASWAPS: 'MetaSwaps',
  ETHGASPRICE: 'eth_gasprice',
};

// Actions
const BASIC_GAS_ESTIMATE_STATUS = 'metamask/gas/BASIC_GAS_ESTIMATE_STATUS';
const RESET_CUSTOM_DATA = 'metamask/gas/RESET_CUSTOM_DATA';
const SET_BASIC_GAS_ESTIMATE_DATA = 'metamask/gas/SET_BASIC_GAS_ESTIMATE_DATA';
const SET_CUSTOM_GAS_LIMIT = 'metamask/gas/SET_CUSTOM_GAS_LIMIT';
const SET_CUSTOM_GAS_PRICE = 'metamask/gas/SET_CUSTOM_GAS_PRICE';
const SET_ESTIMATE_SOURCE = 'metamask/gas/SET_ESTIMATE_SOURCE';

const initState = {
  customData: {
    price: null,
    limit: null,
  },
  basicEstimates: {
    safeLow: null,
    average: null,
    fast: null,
  },
  basicEstimateStatus: BASIC_ESTIMATE_STATES.LOADING,
  estimateSource: '',
};

// Reducer
export default function reducer(state = initState, action) {
  switch (action.type) {
    case BASIC_GAS_ESTIMATE_STATUS:
      return {
        ...state,
        basicEstimateStatus: action.value,
      };
    case SET_BASIC_GAS_ESTIMATE_DATA:
      return {
        ...state,
        basicEstimates: action.value,
      };
    case SET_CUSTOM_GAS_PRICE:
      return {
        ...state,
        customData: {
          ...state.customData,
          price: action.value,
        },
      };
    case SET_CUSTOM_GAS_LIMIT:
      return {
        ...state,
        customData: {
          ...state.customData,
          limit: action.value,
        },
      };
    case RESET_CUSTOM_DATA:
      return {
        ...state,
        customData: cloneDeep(initState.customData),
      };
    case SET_ESTIMATE_SOURCE:
      return {
        ...state,
        estimateSource: action.value,
      };
    default:
      return state;
  }
}

// Action Creators
export function setBasicEstimateStatus(status) {
  return {
    type: BASIC_GAS_ESTIMATE_STATUS,
    value: status,
  };
}

async function basicGasPriceQuery() {
  const url = `https://api.metaswap.codefi.network/gasPrices`;
  return await fetchWithCache(
    url,
    {
      referrer: url,
      referrerPolicy: 'no-referrer-when-downgrade',
      method: 'GET',
      mode: 'cors',
    },
    { cacheRefreshTime: 75000 },
  );
}

export function fetchBasicGasEstimates() {
  return async (dispatch, getState) => {
    const isMainnet = getIsMainnet(getState());

    dispatch(setBasicEstimateStatus(BASIC_ESTIMATE_STATES.LOADING));
    let basicEstimates;
    try {
      dispatch(setEstimateSource(GAS_SOURCE.ETHGASPRICE));
      if (isMainnet || process.env.IN_TEST) {
        try {
          basicEstimates = await fetchExternalBasicGasEstimates();
          dispatch(setEstimateSource(GAS_SOURCE.METASWAPS));
        } catch (error) {
          basicEstimates = await fetchEthGasPriceEstimates(getState());
        }
      } else {
        basicEstimates = await fetchEthGasPriceEstimates(getState());
      }
      dispatch(setBasicGasEstimateData(basicEstimates));
      dispatch(setBasicEstimateStatus(BASIC_ESTIMATE_STATES.READY));
    } catch (error) {
      dispatch(setBasicEstimateStatus(BASIC_ESTIMATE_STATES.FAILED));
    }

    return basicEstimates;
  };
}

async function fetchExternalBasicGasEstimates() {
  const {
    SafeGasPrice,
    ProposeGasPrice,
    FastGasPrice,
  } = await basicGasPriceQuery();

  const [safeLow, average, fast] = [
    SafeGasPrice,
    ProposeGasPrice,
    FastGasPrice,
  ].map((price) => new BigNumber(price, 10).toNumber());

  const basicEstimates = {
    safeLow,
    average,
    fast,
  };

  return basicEstimates;
}

async function fetchEthGasPriceEstimates(state) {
  const chainId = getCurrentChainId(state);
  const [cachedTimeLastRetrieved, cachedBasicEstimates] = await Promise.all([
    getStorageItem(`${chainId}_BASIC_PRICE_ESTIMATES_LAST_RETRIEVED`),
    getStorageItem(`${chainId}_BASIC_PRICE_ESTIMATES`),
  ]);
  const timeLastRetrieved = cachedTimeLastRetrieved || 0;
  if (cachedBasicEstimates && Date.now() - timeLastRetrieved < 75000) {
    return cachedBasicEstimates;
  }
  const gasPrice = await global.eth.gasPrice();
  const averageGasPriceInDecGWEI = getValueFromWeiHex({
    value: gasPrice.toString(16),
    numberOfDecimals: 4,
    toDenomination: 'GWEI',
  });
  const basicEstimates = {
    average: Number(averageGasPriceInDecGWEI),
  };
  const timeRetrieved = Date.now();

  await Promise.all([
    setStorageItem(`${chainId}_BASIC_PRICE_ESTIMATES`, basicEstimates),
    setStorageItem(
      `${chainId}_BASIC_PRICE_ESTIMATES_LAST_RETRIEVED`,
      timeRetrieved,
    ),
  ]);

  return basicEstimates;
}

export function setCustomGasPriceForRetry(newPrice) {
  return async (dispatch) => {
    if (newPrice === '0x0') {
      const { fast } = await fetchExternalBasicGasEstimates();
      dispatch(setCustomGasPrice(decGWEIToHexWEI(fast)));
    } else {
      dispatch(setCustomGasPrice(newPrice));
    }
  };
}

export function setBasicGasEstimateData(basicGasEstimateData) {
  return {
    type: SET_BASIC_GAS_ESTIMATE_DATA,
    value: basicGasEstimateData,
  };
}

export function setCustomGasPrice(newPrice) {
  return {
    type: SET_CUSTOM_GAS_PRICE,
    value: newPrice,
  };
}

export function setCustomGasLimit(newLimit) {
  return {
    type: SET_CUSTOM_GAS_LIMIT,
    value: newLimit,
  };
}

export function resetCustomData() {
  return { type: RESET_CUSTOM_DATA };
}

export function setEstimateSource(estimateSource) {
  return {
    type: SET_ESTIMATE_SOURCE,
    value: estimateSource,
  };
}
