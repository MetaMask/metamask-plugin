import React, { useContext, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import classnames from 'classnames';
import { uniqBy, isEqual } from 'lodash';
import { useHistory } from 'react-router-dom';
import { getTokenTrackerLink } from '@metamask/etherscan-link';
import { MetaMetricsContext } from '../../../contexts/metametrics.new';
import { useNewMetricEvent } from '../../../hooks/useMetricEvent';
import {
  useTokensToSearch,
  getRenderableTokenData,
} from '../../../hooks/useTokensToSearch';
import { useEqualityCheck } from '../../../hooks/useEqualityCheck';
import { I18nContext } from '../../../contexts/i18n';
import DropdownInputPair from '../dropdown-input-pair';
import DropdownSearchList from '../dropdown-search-list';
import SlippageButtons from '../slippage-buttons';
import { getTokens, getConversionRate } from '../../../ducks/metamask/metamask';
import InfoTooltip from '../../../components/ui/info-tooltip';
import ActionableMessage from '../actionable-message';

import {
  fetchQuotesAndSetQuoteState,
  setSwapsFromToken,
  setSwapToToken,
  getFromToken,
  getToToken,
  getBalanceError,
  getTopAssets,
  getFetchParams,
} from '../../../ducks/swaps/swaps';
import {
  getSwapsDefaultToken,
  getTokenExchangeRates,
  getCurrentCurrency,
  getCurrentChainId,
  getRpcPrefsForCurrentProvider,
} from '../../../selectors';

import { getValueFromWeiHex } from '../../../helpers/utils/conversions.util';
import { usePrevious } from '../../../hooks/usePrevious';
import { useTokenTracker } from '../../../hooks/useTokenTracker';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';
import { useEthFiatAmount } from '../../../hooks/useEthFiatAmount';

import {
  isSwapsDefaultTokenAddress,
  isSwapsDefaultTokenSymbol,
} from '../../../../shared/modules/swaps.utils';
import { SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../../shared/constants/swaps';

import { resetSwapsPostFetchState, removeToken } from '../../../store/actions';
import { fetchTokenPrice, fetchTokenBalance } from '../swaps.util';
import SwapsFooter from '../swaps-footer';
import { calcTokenAmount } from '../../../../shared/modules/token-utils';
import { hexToDecimal } from '../../../../shared/modules/conversion-util';

const fuseSearchKeys = [
  { name: 'name', weight: 0.499 },
  { name: 'symbol', weight: 0.499 },
  { name: 'address', weight: 0.002 },
];

const MAX_ALLOWED_SLIPPAGE = 15;

export default function BuildQuote({
  inputValue,
  onInputChange,
  ethBalance,
  setMaxSlippage,
  maxSlippage,
  selectedAccountAddress,
  isFeatureFlagLoaded,
}) {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const history = useHistory();
  const metaMetricsEvent = useContext(MetaMetricsContext);

  const [fetchedTokenExchangeRate, setFetchedTokenExchangeRate] = useState(
    undefined,
  );
  const [verificationClicked, setVerificationClicked] = useState(false);

  const balanceError = useSelector(getBalanceError);
  const fetchParams = useSelector(getFetchParams);
  const { sourceTokenInfo = {}, destinationTokenInfo = {} } =
    fetchParams?.metaData || {};
  const tokens = useSelector(getTokens);
  const topAssets = useSelector(getTopAssets);
  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken) || destinationTokenInfo;
  const defaultSwapsToken = useSelector(getSwapsDefaultToken);
  const chainId = useSelector(getCurrentChainId);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);

  const tokenConversionRates = useSelector(getTokenExchangeRates, isEqual);
  const conversionRate = useSelector(getConversionRate);
  const currentCurrency = useSelector(getCurrentCurrency);

  const fetchParamsFromToken = isSwapsDefaultTokenSymbol(
    sourceTokenInfo?.symbol,
    chainId,
  )
    ? defaultSwapsToken
    : sourceTokenInfo;

  const { loading, tokensWithBalances } = useTokenTracker(tokens);

  // If the fromToken was set in a call to `onFromSelect` (see below), and that from token has a balance
  // but is not in tokensWithBalances or tokens, then we want to add it to the usersTokens array so that
  // the balance of the token can appear in the from token selection dropdown
  const fromTokenArray =
    !isSwapsDefaultTokenSymbol(fromToken?.symbol, chainId) && fromToken?.balance
      ? [fromToken]
      : [];
  const usersTokens = uniqBy(
    [...tokensWithBalances, ...tokens, ...fromTokenArray],
    'address',
  );
  const memoizedUsersTokens = useEqualityCheck(usersTokens);

  const selectedFromToken = getRenderableTokenData(
    fromToken || fetchParamsFromToken,
    tokenConversionRates,
    conversionRate,
    currentCurrency,
    chainId,
  );

  const tokensToSearch = useTokensToSearch({
    usersTokens: memoizedUsersTokens,
    topTokens: topAssets,
  });
  const selectedToToken =
    tokensToSearch.find(({ address }) => address === toToken?.address) ||
    toToken;
  const toTokenIsNotDefault =
    selectedToToken?.address &&
    !isSwapsDefaultTokenAddress(selectedToToken?.address, chainId);
  const occurances = Number(selectedToToken?.occurances || 0);
  const {
    address: fromTokenAddress,
    symbol: fromTokenSymbol,
    string: fromTokenString,
    decimals: fromTokenDecimals,
    balance: rawFromTokenBalance,
  } = selectedFromToken || {};

  const fromTokenBalance =
    rawFromTokenBalance &&
    calcTokenAmount(rawFromTokenBalance, fromTokenDecimals).toString(10);

  const prevFromTokenBalance = usePrevious(fromTokenBalance);

  const swapFromTokenFiatValue = useTokenFiatAmount(
    fromTokenAddress,
    inputValue || 0,
    fromTokenSymbol,
    {
      showFiat: true,
    },
    true,
  );
  const swapFromEthFiatValue = useEthFiatAmount(
    inputValue || 0,
    { showFiat: true },
    true,
  );
  const swapFromFiatValue = isSwapsDefaultTokenSymbol(fromTokenSymbol, chainId)
    ? swapFromEthFiatValue
    : swapFromTokenFiatValue;

  const onFromSelect = (token) => {
    if (
      token?.address &&
      !swapFromFiatValue &&
      fetchedTokenExchangeRate !== null
    ) {
      fetchTokenPrice(token.address).then((rate) => {
        if (rate !== null && rate !== undefined) {
          setFetchedTokenExchangeRate(rate);
        }
      });
    } else {
      setFetchedTokenExchangeRate(null);
    }
    if (
      token?.address &&
      !memoizedUsersTokens.find(
        (usersToken) => usersToken.address === token.address,
      )
    ) {
      fetchTokenBalance(token.address, selectedAccountAddress).then(
        (fetchedBalance) => {
          if (fetchedBalance?.balance) {
            const balanceAsDecString = fetchedBalance.balance.toString(10);
            const userTokenBalance = calcTokenAmount(
              balanceAsDecString,
              token.decimals,
            );
            dispatch(
              setSwapsFromToken({
                ...token,
                string: userTokenBalance.toString(10),
                balance: balanceAsDecString,
              }),
            );
          }
        },
      );
    }
    dispatch(setSwapsFromToken(token));
    onInputChange(
      token?.address ? inputValue : '',
      token.string,
      token.decimals,
    );
  };

  const blockExplorerTokenLink = getTokenTrackerLink(
    selectedToToken.address,
    chainId,
    null, // no networkId
    null, // no holderAddress
    {
      blockExplorerUrl:
        rpcPrefs.blockExplorerUrl ??
        SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[chainId] ??
        null,
    },
  );

  const blockExplorerLabel = rpcPrefs.blockExplorerUrl
    ? new URL(blockExplorerTokenLink).hostname
    : t('etherscan');

  const blockExplorerLinkClickedEvent = useNewMetricEvent({
    category: 'Swaps',
    event: 'Clicked Block Explorer Link',
    properties: {
      link_type: 'Token Tracker',
      action: 'Swaps Confirmation',
      block_explorer_domain: blockExplorerTokenLink
        ? new URL(blockExplorerTokenLink)?.hostname
        : '',
    },
  });

  const { destinationTokenAddedForSwap } = fetchParams || {};
  const { address: toAddress } = toToken || {};
  const onToSelect = useCallback(
    (token) => {
      if (destinationTokenAddedForSwap && token.address !== toAddress) {
        dispatch(removeToken(toAddress));
      }
      dispatch(setSwapToToken(token));
      setVerificationClicked(false);
    },
    [dispatch, destinationTokenAddedForSwap, toAddress],
  );

  const hideDropdownItemIf = useCallback(
    (item) => item.address === fromTokenAddress,
    [fromTokenAddress],
  );

  const tokensWithBalancesFromToken = tokensWithBalances.find(
    (token) => token.address === fromToken?.address,
  );
  const previousTokensWithBalancesFromToken = usePrevious(
    tokensWithBalancesFromToken,
  );

  useEffect(() => {
    const notDefault = !isSwapsDefaultTokenAddress(
      tokensWithBalancesFromToken?.address,
      chainId,
    );
    const addressesAreTheSame =
      tokensWithBalancesFromToken?.address ===
      previousTokensWithBalancesFromToken?.address;
    const balanceHasChanged =
      tokensWithBalancesFromToken?.balance !==
      previousTokensWithBalancesFromToken?.balance;
    if (notDefault && addressesAreTheSame && balanceHasChanged) {
      dispatch(
        setSwapsFromToken({
          ...fromToken,
          balance: tokensWithBalancesFromToken?.balance,
          string: tokensWithBalancesFromToken?.string,
        }),
      );
    }
  }, [
    dispatch,
    tokensWithBalancesFromToken,
    previousTokensWithBalancesFromToken,
    fromToken,
    chainId,
  ]);

  // If the eth balance changes while on build quote, we update the selected from token
  useEffect(() => {
    if (
      isSwapsDefaultTokenAddress(fromToken?.address, chainId) &&
      fromToken?.balance !== hexToDecimal(ethBalance)
    ) {
      dispatch(
        setSwapsFromToken({
          ...fromToken,
          balance: hexToDecimal(ethBalance),
          string: getValueFromWeiHex({
            value: ethBalance,
            numberOfDecimals: 4,
            toDenomination: 'ETH',
          }),
        }),
      );
    }
  }, [dispatch, fromToken, ethBalance, chainId]);

  useEffect(() => {
    if (prevFromTokenBalance !== fromTokenBalance) {
      onInputChange(inputValue, fromTokenBalance);
    }
  }, [onInputChange, prevFromTokenBalance, inputValue, fromTokenBalance]);

  useEffect(() => {
    dispatch(resetSwapsPostFetchState());
  }, [dispatch]);

  const BlockExplorerLink = () => {
    return (
      <a
        className="build-quote__token-etherscan-link build-quote__underline"
        key="build-quote-etherscan-link"
        onClick={() => {
          blockExplorerLinkClickedEvent();
          global.platform.openTab({
            url: blockExplorerTokenLink,
          });
        }}
        target="_blank"
        rel="noopener noreferrer"
      >
        {blockExplorerLabel}
      </a>
    );
  };

  let tokenVerificationDescription = '';
  if (blockExplorerTokenLink) {
    if (occurances === 1) {
      tokenVerificationDescription = t('verifyThisTokenOn', [
        <BlockExplorerLink key="block-explorer-link" />,
      ]);
    } else if (occurances === 0) {
      tokenVerificationDescription = t('verifyThisUnconfirmedTokenOn', [
        <BlockExplorerLink key="block-explorer-link" />,
      ]);
    }
  }

  return (
    <div className="build-quote">
      <div className="build-quote__content">
        <div className="build-quote__dropdown-input-pair-header">
          <div className="build-quote__input-label">{t('swapSwapFrom')}</div>
          {!isSwapsDefaultTokenSymbol(fromTokenSymbol, chainId) && (
            <div
              className="build-quote__max-button"
              onClick={() =>
                onInputChange(fromTokenBalance || '0', fromTokenBalance)
              }
            >
              {t('max')}
            </div>
          )}
        </div>
        <DropdownInputPair
          onSelect={onFromSelect}
          itemsToSearch={tokensToSearch}
          onInputChange={(value) => {
            onInputChange(value, fromTokenBalance);
          }}
          inputValue={inputValue}
          leftValue={inputValue && swapFromFiatValue}
          selectedItem={selectedFromToken}
          maxListItems={30}
          loading={
            loading &&
            (!tokensToSearch?.length ||
              !topAssets ||
              !Object.keys(topAssets).length)
          }
          selectPlaceHolderText={t('swapSelect')}
          hideItemIf={(item) => item.address === selectedToToken?.address}
          listContainerClassName="build-quote__open-dropdown"
          autoFocus
        />
        <div
          className={classnames('build-quote__balance-message', {
            'build-quote__balance-message--error': balanceError,
          })}
        >
          {!balanceError &&
            fromTokenSymbol &&
            t('swapYourTokenBalance', [
              fromTokenString || '0',
              fromTokenSymbol,
            ])}
          {balanceError && fromTokenSymbol && (
            <div className="build-quite__insufficient-funds">
              <div className="build-quite__insufficient-funds-first">
                {t('swapsNotEnoughForTx', [fromTokenSymbol])}
              </div>
              <div className="build-quite__insufficient-funds-second">
                {t('swapYourTokenBalance', [
                  fromTokenString || '0',
                  fromTokenSymbol,
                ])}
              </div>
            </div>
          )}
        </div>
        <div className="build-quote__swap-arrows-row">
          <button
            className="build-quote__swap-arrows"
            onClick={() => {
              onToSelect(selectedFromToken);
              onFromSelect(selectedToToken);
            }}
          >
            <img
              src="./images/icons/swap2.svg"
              alt={t('swapSwapSwitch')}
              width="12"
              height="16"
            />
          </button>
        </div>
        <div className="build-quote__dropdown-swap-to-header">
          <div className="build-quote__input-label">{t('swapSwapTo')}</div>
        </div>
        <div className="dropdown-input-pair dropdown-input-pair__to">
          <DropdownSearchList
            startingItem={selectedToToken}
            itemsToSearch={tokensToSearch}
            searchPlaceholderText={t('swapSearchForAToken')}
            fuseSearchKeys={fuseSearchKeys}
            selectPlaceHolderText={t('swapSelectAToken')}
            maxListItems={30}
            onSelect={onToSelect}
            loading={
              loading &&
              (!tokensToSearch?.length ||
                !topAssets ||
                !Object.keys(topAssets).length)
            }
            externallySelectedItem={selectedToToken}
            hideItemIf={hideDropdownItemIf}
            listContainerClassName="build-quote__open-to-dropdown"
            hideRightLabels
            defaultToAll
            shouldSearchForImports
          />
        </div>
        {toTokenIsNotDefault &&
          (occurances < 2 ? (
            <ActionableMessage
              type={occurances === 1 ? 'warning' : 'danger'}
              message={
                <div className="build-quote__token-verification-warning-message">
                  <div className="build-quote__bold">
                    {occurances === 1
                      ? t('swapTokenVerificationOnlyOneSource')
                      : t('swapTokenVerificationAddedManually')}
                  </div>
                  <div>{tokenVerificationDescription}</div>
                </div>
              }
              primaryAction={
                verificationClicked
                  ? null
                  : {
                      label: t('continue'),
                      onClick: () => setVerificationClicked(true),
                    }
              }
              withRightButton
              infoTooltipText={
                blockExplorerTokenLink &&
                t('swapVerifyTokenExplanation', [blockExplorerLabel])
              }
            />
          ) : (
            <div className="build-quote__token-message">
              <span
                className="build-quote__bold"
                key="token-verification-bold-text"
              >
                {t('swapTokenVerificationSources', [occurances])}
              </span>
              {blockExplorerTokenLink && (
                <>
                  {t('swapTokenVerificationMessage', [
                    <a
                      className="build-quote__token-etherscan-link"
                      key="build-quote-etherscan-link"
                      onClick={() => {
                        blockExplorerLinkClickedEvent();
                        global.platform.openTab({
                          url: blockExplorerTokenLink,
                        });
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {blockExplorerLabel}
                    </a>,
                  ])}
                  <InfoTooltip
                    position="top"
                    contentText={t('swapVerifyTokenExplanation', [
                      blockExplorerLabel,
                    ])}
                    containerClassName="build-quote__token-tooltip-container"
                    key="token-verification-info-tooltip"
                  />
                </>
              )}
            </div>
          ))}
        <div className="build-quote__slippage-buttons-container">
          <SlippageButtons
            onSelect={(newSlippage) => {
              setMaxSlippage(newSlippage);
            }}
            maxAllowedSlippage={MAX_ALLOWED_SLIPPAGE}
            currentSlippage={maxSlippage}
          />
        </div>
      </div>
      <SwapsFooter
        onSubmit={() => {
          dispatch(
            fetchQuotesAndSetQuoteState(
              history,
              inputValue,
              maxSlippage,
              metaMetricsEvent,
            ),
          );
        }}
        submitText={t('swapReviewSwap')}
        disabled={
          !isFeatureFlagLoaded ||
          !Number(inputValue) ||
          !selectedToToken?.address ||
          Number(maxSlippage) < 0 ||
          Number(maxSlippage) > MAX_ALLOWED_SLIPPAGE ||
          (toTokenIsNotDefault && occurances < 2 && !verificationClicked)
        }
        hideCancel
        showTermsOfService
      />
    </div>
  );
}

BuildQuote.propTypes = {
  maxSlippage: PropTypes.number,
  inputValue: PropTypes.string,
  onInputChange: PropTypes.func,
  ethBalance: PropTypes.string,
  setMaxSlippage: PropTypes.func,
  selectedAccountAddress: PropTypes.string,
  isFeatureFlagLoaded: PropTypes.bool.isRequired,
};
