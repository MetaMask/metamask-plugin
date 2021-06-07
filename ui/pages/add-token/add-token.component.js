import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { getTokenTrackerLink } from '@metamask/etherscan-link';
import { checkExistingAddresses } from '../../helpers/utils/util';
import { tokenInfoGetter } from '../../helpers/utils/token-util';
import { CONFIRM_ADD_TOKEN_ROUTE } from '../../helpers/constants/routes';
import TextField from '../../components/ui/text-field';
import PageContainer from '../../components/ui/page-container';
import { Tabs, Tab } from '../../components/ui/tabs';
import { addHexPrefix } from '../../../app/scripts/lib/util';
import { isValidHexAddress } from '../../../shared/modules/hexstring-utils';
import ActionableMessage from '../swaps/actionable-message';
import Typography from '../../components/ui/typography';
import { TYPOGRAPHY, FONT_WEIGHT } from '../../helpers/constants/design-system';
import Button from '../../components/ui/button';
import TokenSearch from './token-search';
import TokenList from './token-list';

const emptyAddr = '0x0000000000000000000000000000000000000000';

const MIN_DECIMAL_VALUE = 0;
const MAX_DECIMAL_VALUE = 36;

class AddToken extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    history: PropTypes.object,
    setPendingTokens: PropTypes.func,
    pendingTokens: PropTypes.object,
    clearPendingTokens: PropTypes.func,
    tokens: PropTypes.array,
    identities: PropTypes.object,
    showSearchTab: PropTypes.bool.isRequired,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    chainId: PropTypes.string,
    rpcPrefs: PropTypes.object,
  };

  state = {
    customAddress: '',
    customSymbol: '',
    customDecimals: 0,
    searchResults: [],
    selectedTokens: {},
    tokenSelectorError: null,
    customAddressError: null,
    customSymbolError: null,
    customDecimalsError: null,
    forceEditSymbol: false,
    symbolAutoFilled: false,
    decimalAutoFilled: false,
  };

  componentDidMount() {
    this.tokenInfoGetter = tokenInfoGetter();
    const { pendingTokens = {} } = this.props;
    const pendingTokenKeys = Object.keys(pendingTokens);

    if (pendingTokenKeys.length > 0) {
      let selectedTokens = {};
      let customToken = {};

      pendingTokenKeys.forEach((tokenAddress) => {
        const token = pendingTokens[tokenAddress];
        const { isCustom } = token;

        if (isCustom) {
          customToken = { ...token };
        } else {
          selectedTokens = { ...selectedTokens, [tokenAddress]: { ...token } };
        }
      });

      const {
        address: customAddress = '',
        symbol: customSymbol = '',
        decimals: customDecimals = 0,
      } = customToken;

      this.setState({
        selectedTokens,
        customAddress,
        customSymbol,
        customDecimals,
      });
    }
  }

  handleToggleToken(token) {
    const { address } = token;
    const { selectedTokens = {} } = this.state;
    const selectedTokensCopy = { ...selectedTokens };

    if (address in selectedTokensCopy) {
      delete selectedTokensCopy[address];
    } else {
      selectedTokensCopy[address] = token;
    }

    this.setState({
      selectedTokens: selectedTokensCopy,
      tokenSelectorError: null,
    });
  }

  hasError() {
    const {
      tokenSelectorError,
      customAddressError,
      customSymbolError,
      customDecimalsError,
    } = this.state;

    return (
      tokenSelectorError ||
      customAddressError ||
      customSymbolError ||
      customDecimalsError
    );
  }

  hasSelected() {
    const { customAddress = '', selectedTokens = {} } = this.state;
    return customAddress || Object.keys(selectedTokens).length > 0;
  }

  handleNext() {
    if (this.hasError()) {
      return;
    }

    if (!this.hasSelected()) {
      this.setState({ tokenSelectorError: this.context.t('mustSelectOne') });
      return;
    }

    const { setPendingTokens, history } = this.props;
    const {
      customAddress: address,
      customSymbol: symbol,
      customDecimals: decimals,
      selectedTokens,
    } = this.state;

    const customToken = {
      address,
      symbol,
      decimals,
    };

    setPendingTokens({ customToken, selectedTokens });
    history.push(CONFIRM_ADD_TOKEN_ROUTE);
  }

  async attemptToAutoFillTokenParams(address) {
    const { symbol = '', decimals } = await this.tokenInfoGetter(address);

    const symbolAutoFilled = Boolean(symbol);
    const decimalAutoFilled = Boolean(decimals);
    this.setState({ symbolAutoFilled, decimalAutoFilled });
    this.handleCustomSymbolChange(symbol || '');
    this.handleCustomDecimalsChange(decimals);
  }

  handleCustomAddressChange(value) {
    const customAddress = value.trim();
    this.setState({
      customAddress,
      customAddressError: null,
      tokenSelectorError: null,
      symbolAutoFilled: false,
      decimalAutoFilled: false,
    });

    const addressIsValid = isValidHexAddress(customAddress, {
      allowNonPrefixed: false,
    });
    const standardAddress = addHexPrefix(customAddress).toLowerCase();

    switch (true) {
      case !addressIsValid:
        this.setState({
          customAddressError: this.context.t('invalidAddress'),
          customSymbol: '',
          customDecimals: 0,
          customSymbolError: null,
          customDecimalsError: null,
        });

        break;
      case Boolean(this.props.identities[standardAddress]):
        this.setState({
          customAddressError: this.context.t('personalAddressDetected'),
        });

        break;
      case checkExistingAddresses(customAddress, this.props.tokens):
        this.setState({
          customAddressError: this.context.t('tokenAlreadyAdded'),
        });

        break;
      default:
        if (customAddress !== emptyAddr) {
          this.attemptToAutoFillTokenParams(customAddress);
        }
    }
  }

  handleCustomSymbolChange(value) {
    const customSymbol = value.trim();
    const symbolLength = customSymbol.length;
    let customSymbolError = null;

    if (symbolLength <= 0 || symbolLength >= 21) {
      customSymbolError = this.context.t('symbolBetweenZeroTwentyOne');
    }

    this.setState({ customSymbol, customSymbolError });
  }

  handleCustomDecimalsChange(value) {
    let customDecimals;
    let customDecimalsError = null;

    if (value) {
      customDecimals = Number(value.trim());
      customDecimalsError =
        value < MIN_DECIMAL_VALUE || value > MAX_DECIMAL_VALUE
          ? this.context.t('decimalsMustZerotoTen')
          : null;
    } else {
      customDecimals = '';
      customDecimalsError = this.context.t('tokenDecimalFetchFailed');
    }

    this.setState({ customDecimals, customDecimalsError });
  }

  renderCustomTokenForm() {
    const {
      customAddress,
      customSymbol,
      customDecimals,
      customAddressError,
      customSymbolError,
      customDecimalsError,
      forceEditSymbol,
      symbolAutoFilled,
      decimalAutoFilled,
    } = this.state;

    const { chainId, rpcPrefs } = this.props;
    const blockExplorerTokenLink = getTokenTrackerLink(
      customAddress,
      chainId,
      null,
      null,
      { blockExplorerUrl: rpcPrefs?.blockExplorerUrl ?? null },
    );
    const blockExplorerLabel = rpcPrefs?.blockExplorerUrl
      ? new URL(blockExplorerTokenLink).hostname
      : this.context.t('etherscan');

    return (
      <div className="add-token__custom-token-form">
        <TextField
          id="custom-address"
          label={this.context.t('tokenContractAddress')}
          type="text"
          value={customAddress}
          onChange={(e) => this.handleCustomAddressChange(e.target.value)}
          error={customAddressError}
          fullWidth
          autoFocus
          margin="normal"
        />
        <TextField
          id="custom-symbol"
          label={
            <div className="add-token__custom-symbol__label-wrapper">
              <span className="add-token__custom-symbol__label">
                {this.context.t('tokenSymbol')}
              </span>
              {symbolAutoFilled && !forceEditSymbol && (
                <div
                  className="add-token__custom-symbol__edit"
                  onClick={() => this.setState({ forceEditSymbol: true })}
                >
                  {this.context.t('edit')}
                </div>
              )}
            </div>
          }
          type="text"
          value={customSymbol}
          onChange={(e) => this.handleCustomSymbolChange(e.target.value)}
          error={customSymbolError}
          fullWidth
          margin="normal"
          disabled={symbolAutoFilled && !forceEditSymbol}
        />
        <TextField
          id="custom-decimals"
          label={this.context.t('decimal')}
          type="number"
          value={customDecimals}
          onChange={(e) => this.handleCustomDecimalsChange(e.target.value)}
          error={customDecimals ? customDecimalsError : null}
          fullWidth
          margin="normal"
          disabled={decimalAutoFilled}
          min={MIN_DECIMAL_VALUE}
          max={MAX_DECIMAL_VALUE}
        />
        {customDecimals === '' && (
          <ActionableMessage
            message={
              <>
                <Typography
                  variant={TYPOGRAPHY.H7}
                  fontWeight={FONT_WEIGHT.BOLD}
                >
                  {this.context.t('tokenDecimalFetchFailed')}
                </Typography>
                <Typography
                  variant={TYPOGRAPHY.H7}
                  fontWeight={FONT_WEIGHT.NORMAL}
                >
                  {this.context.t('verifyThisTokenDecimalOn', [
                    <Button
                      type="link"
                      key="add-token-verify-token-decimal"
                      className="add-token__link"
                      rel="noopener noreferrer"
                      target="_blank"
                      href={blockExplorerTokenLink}
                    >
                      {blockExplorerLabel}
                    </Button>,
                  ])}
                </Typography>
              </>
            }
            type="warning"
            withRightButton
            className="add-token__decimal-warning"
          />
        )}
      </div>
    );
  }

  renderSearchToken() {
    const { tokenSelectorError, selectedTokens, searchResults } = this.state;

    return (
      <div className="add-token__search-token">
        <TokenSearch
          onSearch={({ results = [] }) =>
            this.setState({ searchResults: results })
          }
          error={tokenSelectorError}
        />
        <div className="add-token__token-list">
          <TokenList
            results={searchResults}
            selectedTokens={selectedTokens}
            onToggleToken={(token) => this.handleToggleToken(token)}
          />
        </div>
      </div>
    );
  }

  renderTabs() {
    const { showSearchTab } = this.props;
    const tabs = [];

    if (showSearchTab) {
      tabs.push(
        <Tab name={this.context.t('search')} key="search-tab">
          {this.renderSearchToken()}
        </Tab>,
      );
    }
    tabs.push(
      <Tab name={this.context.t('customToken')} key="custom-tab">
        {this.renderCustomTokenForm()}
      </Tab>,
    );

    return <Tabs>{tabs}</Tabs>;
  }

  render() {
    const { history, clearPendingTokens, mostRecentOverviewPage } = this.props;

    return (
      <PageContainer
        title={this.context.t('addTokens')}
        tabsComponent={this.renderTabs()}
        onSubmit={() => this.handleNext()}
        disabled={Boolean(this.hasError()) || !this.hasSelected()}
        onCancel={() => {
          clearPendingTokens();
          history.push(mostRecentOverviewPage);
        }}
      />
    );
  }
}

export default AddToken;
