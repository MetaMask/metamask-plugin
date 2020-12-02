import { strict as assert } from 'assert'
import ObservableStore from 'obs-store'
import { ethErrors } from 'eth-json-rpc-errors'
import { normalize as normalizeAddress } from 'eth-sig-util'
import { isValidAddress } from 'ethereumjs-util'
import ethers from 'ethers'
import log from 'loglevel'
import { isPrefixedFormattedHexString } from '../lib/util'
import { LISTED_CONTRACT_ADDRESSES } from '../../../shared/constants/tokens'
import { NETWORK_TYPE_TO_ID_MAP } from './network/enums'

export default class PreferencesController {
  /**
   *
   * @typedef {Object} PreferencesController
   * @param {Object} opts - Overrides the defaults for the initial state of this.store
   * @property {Object} store The stored object containing a users preferences, stored in local storage
   * @property {Array} store.frequentRpcList A list of custom rpcs to provide the user
   * @property {Array} store.tokens The tokens the user wants display in their token lists
   * @property {Object} store.accountTokens The tokens stored per account and then per network type
   * @property {Object} store.assetImages Contains assets objects related to assets added
   * @property {boolean} store.useBlockie The users preference for blockie identicons within the UI
   * @property {boolean} store.useNonceField The users preference for nonce field within the UI
   * @property {Object} store.featureFlags A key-boolean map, where keys refer to features and booleans to whether the
   * user wishes to see that feature.
   *
   * Feature flags can be set by the global function `setPreference(feature, enabled)`, and so should not expose any sensitive behavior.
   * @property {Object} store.knownMethodData Contains all data methods known by the user
   * @property {string} store.currentLocale The preferred language locale key
   * @property {string} store.selectedAddress A hex string that matches the currently selected address in the app
   *
   */
  constructor(opts = {}) {
    const initState = {
      frequentRpcListDetail: [],
      accountTokens: {},
      assetImages: {},
      tokens: [],
      suggestedTokens: {},
      useBlockie: false,
      useNonceField: false,
      usePhishDetect: true,

      // WARNING: Do not use feature flags for security-sensitive things.
      // Feature flag toggling is available in the global namespace
      // for convenient testing of pre-release features, and should never
      // perform sensitive operations.
      featureFlags: {
        showIncomingTransactions: true,
        transactionTime: false,
        speedUpAnyTransaction: false,
      },
      knownMethodData: {},
      firstTimeFlowType: null,
      currentLocale: opts.initLangCode,
      identities: {},
      lostIdentities: {},
      forgottenPassword: false,
      preferences: {
        autoLockTimeLimit: undefined,
        showFiatInTestnets: false,
        useNativeCurrencyAsPrimaryCurrency: true,
      },
      completedOnboarding: false,
      // ENS decentralized website resolution
      ipfsGateway: 'dweb.link',
      ...opts.initState,
    }

    this.network = opts.network
    this.store = new ObservableStore(initState)
    this.store.setMaxListeners(12)
    this.openPopup = opts.openPopup
    this.migrateAddressBookState = opts.migrateAddressBookState
    this._subscribeProviderType()

    global.setPreference = (key, value) => {
      return this.setFeatureFlag(key, value)
    }
  }
  // PUBLIC METHODS

  /**
   * Sets the {@code forgottenPassword} state property
   * @param {boolean} forgottenPassword - whether or not the user has forgotten their password
   */
  setPasswordForgotten(forgottenPassword) {
    this.store.updateState({ forgottenPassword })
  }

  /**
   * Setter for the `useBlockie` property
   *
   * @param {boolean} val - Whether or not the user prefers blockie indicators
   *
   */
  setUseBlockie(val) {
    this.store.updateState({ useBlockie: val })
  }

  /**
   * Setter for the `useNonceField` property
   *
   * @param {boolean} val - Whether or not the user prefers to set nonce
   *
   */
  setUseNonceField(val) {
    this.store.updateState({ useNonceField: val })
  }

  /**
   * Setter for the `usePhishDetect` property
   *
   * @param {boolean} val - Whether or not the user prefers phishing domain protection
   *
   */
  setUsePhishDetect(val) {
    this.store.updateState({ usePhishDetect: val })
  }

  /**
   * Setter for the `firstTimeFlowType` property
   *
   * @param {string} type - Indicates the type of first time flow - create or import - the user wishes to follow
   *
   */
  setFirstTimeFlowType(type) {
    this.store.updateState({ firstTimeFlowType: type })
  }

  getSuggestedTokens() {
    return this.store.getState().suggestedTokens
  }

  getAssetImages() {
    return this.store.getState().assetImages
  }

  /**
   * Add new methodData to state, to avoid requesting this information again through Infura
   *
   * @param {string} fourBytePrefix - Four-byte method signature
   * @param {string} methodData - Corresponding data method
   */
  addKnownMethodData(fourBytePrefix, methodData) {
    const { knownMethodData } = this.store.getState()
    knownMethodData[fourBytePrefix] = methodData
    this.store.updateState({ knownMethodData })
  }

  /**
   * wallet_watchAsset request handler.
   *
   * @param {Object} req - The watchAsset JSON-RPC request object.
   */
  async requestWatchAsset(req) {
    const { type, options } = req.params

    switch (type) {
      case 'ERC20':
        return await this._handleWatchAssetERC20(options)
      default:
        throw ethErrors.rpc.invalidParams(
          `Asset of type "${type}" not supported.`,
        )
    }
  }

  /**
   * Setter for the `currentLocale` property
   *
   * @param {string} key - he preferred language locale key
   *
   */
  setCurrentLocale(key) {
    const textDirection = ['ar', 'dv', 'fa', 'he', 'ku'].includes(key)
      ? 'rtl'
      : 'auto'
    this.store.updateState({
      currentLocale: key,
      textDirection,
    })
    return textDirection
  }

  /**
   * Updates identities to only include specified addresses. Removes identities
   * not included in addresses array
   *
   * @param {string[]} addresses - An array of hex addresses
   *
   */
  setAddresses(addresses) {
    const oldIdentities = this.store.getState().identities
    const oldAccountTokens = this.store.getState().accountTokens

    const identities = addresses.reduce((ids, address, index) => {
      const oldId = oldIdentities[address] || {}
      ids[address] = { name: `Account ${index + 1}`, address, ...oldId }
      return ids
    }, {})
    const accountTokens = addresses.reduce((tokens, address) => {
      const oldTokens = oldAccountTokens[address] || {}
      tokens[address] = oldTokens
      return tokens
    }, {})
    this.store.updateState({ identities, accountTokens })
  }

  /**
   * Removes an address from state
   *
   * @param {string} address - A hex address
   * @returns {string} the address that was removed
   */
  removeAddress(address) {
    const { identities } = this.store.getState()
    const { accountTokens } = this.store.getState()
    if (!identities[address]) {
      throw new Error(`${address} can't be deleted cause it was not found`)
    }
    delete identities[address]
    delete accountTokens[address]
    this.store.updateState({ identities, accountTokens })

    // If the selected account is no longer valid,
    // select an arbitrary other account:
    if (address === this.getSelectedAddress()) {
      const selected = Object.keys(identities)[0]
      this.setSelectedAddress(selected)
    }
    return address
  }

  /**
   * Adds addresses to the identities object without removing identities
   *
   * @param {string[]} addresses - An array of hex addresses
   *
   */
  addAddresses(addresses) {
    const { identities, accountTokens } = this.store.getState()
    addresses.forEach((address) => {
      // skip if already exists
      if (identities[address]) {
        return
      }
      // add missing identity
      const identityCount = Object.keys(identities).length

      accountTokens[address] = {}
      identities[address] = { name: `Account ${identityCount + 1}`, address }
    })
    this.store.updateState({ identities, accountTokens })
  }

  /**
   * Synchronizes identity entries with known accounts.
   * Removes any unknown identities, and returns the resulting selected address.
   *
   * @param {Array<string>} addresses - known to the vault.
   * @returns {Promise<string>} selectedAddress the selected address.
   */
  syncAddresses(addresses) {
    if (!Array.isArray(addresses) || addresses.length === 0) {
      throw new Error('Expected non-empty array of addresses.')
    }

    const { identities, lostIdentities } = this.store.getState()

    const newlyLost = {}
    Object.keys(identities).forEach((identity) => {
      if (!addresses.includes(identity)) {
        newlyLost[identity] = identities[identity]
        delete identities[identity]
      }
    })

    // Identities are no longer present.
    if (Object.keys(newlyLost).length > 0) {
      // store lost accounts
      Object.keys(newlyLost).forEach((key) => {
        lostIdentities[key] = newlyLost[key]
      })
    }

    this.store.updateState({ identities, lostIdentities })
    this.addAddresses(addresses)

    // If the selected account is no longer valid,
    // select an arbitrary other account:
    let selected = this.getSelectedAddress()
    if (!addresses.includes(selected)) {
      selected = addresses[0]
      this.setSelectedAddress(selected)
    }

    return selected
  }

  removeSuggestedTokens() {
    return new Promise((resolve) => {
      this.store.updateState({ suggestedTokens: {} })
      resolve({})
    })
  }

  /**
   * Setter for the `selectedAddress` property
   *
   * @param {string} _address - A new hex address for an account
   * @returns {Promise<void>} Promise resolves with tokens
   *
   */
  setSelectedAddress(_address) {
    const address = normalizeAddress(_address)
    this._updateTokens(address)

    const { identities, tokens } = this.store.getState()
    const selectedIdentity = identities[address]
    if (!selectedIdentity) {
      throw new Error(`Identity for '${address} not found`)
    }

    selectedIdentity.lastSelected = Date.now()
    this.store.updateState({ identities, selectedAddress: address })
    return Promise.resolve(tokens)
  }

  /**
   * Getter for the `selectedAddress` property
   *
   * @returns {string} The hex address for the currently selected account
   *
   */
  getSelectedAddress() {
    return this.store.getState().selectedAddress
  }

  /**
   * Contains data about tokens users add to their account.
   * @typedef {Object} AddedToken
   * @property {string} address - The hex address for the token contract. Will be all lower cased and hex-prefixed.
   * @property {string} symbol - The symbol of the token, usually 3 or 4 capitalized letters
   *  {@link https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md#symbol}
   * @property {boolean} decimals - The number of decimals the token uses.
   *  {@link https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md#decimals}
   */

  /**
   * Adds a new token to the token array, or updates the token if passed an address that already exists.
   * Modifies the existing tokens array from the store. All objects in the tokens array array AddedToken objects.
   * @see AddedToken {@link AddedToken}
   *
   * @param {string} rawAddress - Hex address of the token contract. May or may not be a checksum address.
   * @param {string} symbol - The symbol of the token
   * @param {number} decimals - The number of decimals the token uses.
   * @returns {Promise<array>} Promises the new array of AddedToken objects.
   *
   */
  async addToken(rawAddress, symbol, decimals, image) {
    const address = normalizeAddress(rawAddress)
    const newEntry = { address, symbol, decimals }
    const { tokens } = this.store.getState()
    const assetImages = this.getAssetImages()
    const previousEntry = tokens.find((token) => {
      return token.address === address
    })
    const previousIndex = tokens.indexOf(previousEntry)

    if (previousEntry) {
      tokens[previousIndex] = newEntry
    } else {
      tokens.push(newEntry)
    }
    assetImages[address] = image
    this._updateAccountTokens(tokens, assetImages)
    return Promise.resolve(tokens)
  }

  /**
   * Removes a specified token from the tokens array.
   *
   * @param {string} rawAddress - Hex address of the token contract to remove.
   * @returns {Promise<array>} The new array of AddedToken objects
   *
   */
  removeToken(rawAddress) {
    const { tokens } = this.store.getState()
    const assetImages = this.getAssetImages()
    const updatedTokens = tokens.filter((token) => token.address !== rawAddress)
    delete assetImages[rawAddress]
    this._updateAccountTokens(updatedTokens, assetImages)
    return Promise.resolve(updatedTokens)
  }

  /**
   * A getter for the `tokens` property
   *
   * @returns {Array} The current array of AddedToken objects
   *
   */
  getTokens() {
    return this.store.getState().tokens
  }

  /**
   * Sets a custom label for an account
   * @param {string} account - the account to set a label for
   * @param {string} label - the custom label for the account
   * @returns {Promise<string>}
   */
  setAccountLabel(account, label) {
    if (!account) {
      throw new Error(
        `setAccountLabel requires a valid address, got ${String(account)}`,
      )
    }
    const address = normalizeAddress(account)
    const { identities } = this.store.getState()
    identities[address] = identities[address] || {}
    identities[address].name = label
    this.store.updateState({ identities })
    return Promise.resolve(label)
  }

  /**
   * updates custom RPC details
   *
   * @param {Object} newRpcDetails - Options bag.
   * @param {string} newRpcDetails.rpcUrl - The RPC url to add to frequentRpcList.
   * @param {string} newRpcDetails.chainId - The chainId of the selected network.
   * @param {string} [newRpcDetails.ticker] - Optional ticker symbol of the selected network.
   * @param {string} [newRpcDetails.nickname] - Optional nickname of the selected network.
   * @param {Object} [newRpcDetails.rpcPrefs] - Optional RPC preferences, such as the block explorer URL
   *
   */
  async updateRpc(newRpcDetails) {
    const rpcList = this.getFrequentRpcListDetail()
    const index = rpcList.findIndex((element) => {
      return element.rpcUrl === newRpcDetails.rpcUrl
    })
    if (index > -1) {
      const rpcDetail = rpcList[index]
      const updatedRpc = { ...rpcDetail, ...newRpcDetails }
      if (rpcDetail.chainId !== updatedRpc.chainId) {
        // When the chainId is changed, associated address book entries should
        // also be migrated. The address book entries are keyed by the `network` state,
        // which for custom networks is the chainId with a fallback to the networkId
        // if the chainId is not set.

        let addressBookKey = rpcDetail.chainId
        if (!addressBookKey) {
          // We need to find the networkId to determine what these addresses were keyed by
          const provider = new ethers.providers.JsonRpcProvider(
            rpcDetail.rpcUrl,
          )
          try {
            addressBookKey = await provider.send('net_version')
            assert(typeof addressBookKey === 'string')
          } catch (error) {
            log.debug(error)
            log.warn(
              `Failed to get networkId from ${rpcDetail.rpcUrl}; skipping address book migration`,
            )
          }
        }

        // There is an edge case where two separate RPC endpoints are keyed by the same
        // value. In this case, the contact book entries are duplicated so that they remain
        // on both networks, since we don't know which network each contact is intended for.

        let duplicate = false
        const builtInProviderNetworkIds = Object.values(
          NETWORK_TYPE_TO_ID_MAP,
        ).map((ids) => ids.networkId)
        const otherRpcEntries = rpcList.filter(
          (entry) => entry.rpcUrl !== newRpcDetails.rpcUrl,
        )
        if (
          builtInProviderNetworkIds.includes(addressBookKey) ||
          otherRpcEntries.some((entry) => entry.chainId === addressBookKey)
        ) {
          duplicate = true
        }

        this.migrateAddressBookState(
          addressBookKey,
          updatedRpc.chainId,
          duplicate,
        )
      }
      rpcList[index] = updatedRpc
      this.store.updateState({ frequentRpcListDetail: rpcList })
    } else {
      const { rpcUrl, chainId, ticker, nickname, rpcPrefs = {} } = newRpcDetails
      this.addToFrequentRpcList(rpcUrl, chainId, ticker, nickname, rpcPrefs)
    }
  }

  /**
   * Adds custom RPC url to state.
   *
   * @param {string} rpcUrl - The RPC url to add to frequentRpcList.
   * @param {string} chainId - The chainId of the selected network.
   * @param {string} [ticker] - Ticker symbol of the selected network.
   * @param {string} [nickname] - Nickname of the selected network.
   * @param {Object} [rpcPrefs] - Optional RPC preferences, such as the block explorer URL
   *
   */
  addToFrequentRpcList(
    rpcUrl,
    chainId,
    ticker = 'ETH',
    nickname = '',
    rpcPrefs = {},
  ) {
    const rpcList = this.getFrequentRpcListDetail()

    const index = rpcList.findIndex((element) => {
      return element.rpcUrl === rpcUrl
    })
    if (index !== -1) {
      rpcList.splice(index, 1)
    }

    if (!isPrefixedFormattedHexString(chainId)) {
      throw new Error(`Invalid chainId: "${chainId}"`)
    }

    rpcList.push({ rpcUrl, chainId, ticker, nickname, rpcPrefs })
    this.store.updateState({ frequentRpcListDetail: rpcList })
  }

  /**
   * Removes custom RPC url from state.
   *
   * @param {string} url - The RPC url to remove from frequentRpcList.
   * @returns {Promise<array>} Promise resolving to updated frequentRpcList.
   *
   */
  removeFromFrequentRpcList(url) {
    const rpcList = this.getFrequentRpcListDetail()
    const index = rpcList.findIndex((element) => {
      return element.rpcUrl === url
    })
    if (index !== -1) {
      rpcList.splice(index, 1)
    }
    this.store.updateState({ frequentRpcListDetail: rpcList })
    return Promise.resolve(rpcList)
  }

  /**
   * Getter for the `frequentRpcListDetail` property.
   *
   * @returns {array<array>} An array of rpc urls.
   *
   */
  getFrequentRpcListDetail() {
    return this.store.getState().frequentRpcListDetail
  }

  /**
   * Updates the `featureFlags` property, which is an object. One property within that object will be set to a boolean.
   *
   * @param {string} feature - A key that corresponds to a UI feature.
   * @param {boolean} activated - Indicates whether or not the UI feature should be displayed
   * @returns {Promise<object>} Promises a new object; the updated featureFlags object.
   *
   */
  setFeatureFlag(feature, activated) {
    const currentFeatureFlags = this.store.getState().featureFlags
    const updatedFeatureFlags = {
      ...currentFeatureFlags,
      [feature]: activated,
    }

    this.store.updateState({ featureFlags: updatedFeatureFlags })

    return Promise.resolve(updatedFeatureFlags)
  }

  /**
   * Updates the `preferences` property, which is an object. These are user-controlled features
   * found in the settings page.
   * @param {string} preference - The preference to enable or disable.
   * @param {boolean} value - Indicates whether or not the preference should be enabled or disabled.
   * @returns {Promise<object>} Promises a new object; the updated preferences object.
   */
  setPreference(preference, value) {
    const currentPreferences = this.getPreferences()
    const updatedPreferences = {
      ...currentPreferences,
      [preference]: value,
    }

    this.store.updateState({ preferences: updatedPreferences })
    return Promise.resolve(updatedPreferences)
  }

  /**
   * A getter for the `preferences` property
   * @returns {Object} A key-boolean map of user-selected preferences.
   */
  getPreferences() {
    return this.store.getState().preferences
  }

  /**
   * Sets the completedOnboarding state to true, indicating that the user has completed the
   * onboarding process.
   */
  completeOnboarding() {
    this.store.updateState({ completedOnboarding: true })
    return Promise.resolve(true)
  }

  /**
   * A getter for the `ipfsGateway` property
   * @returns {string} The current IPFS gateway domain
   */
  getIpfsGateway() {
    return this.store.getState().ipfsGateway
  }

  /**
   * A setter for the `ipfsGateway` property
   * @param {string} domain - The new IPFS gateway domain
   * @returns {Promise<string>} A promise of the update IPFS gateway domain
   */
  setIpfsGateway(domain) {
    this.store.updateState({ ipfsGateway: domain })
    return Promise.resolve(domain)
  }

  //
  // PRIVATE METHODS
  //

  /**
   * Subscription to network provider type.
   *
   *
   */
  _subscribeProviderType() {
    this.network.providerStore.subscribe(() => {
      const { tokens } = this._getTokenRelatedStates()
      this.store.updateState({ tokens })
    })
  }

  /**
   * Updates `accountTokens` and `tokens` of current account and network according to it.
   *
   * @param {Array} tokens - Array of tokens to be updated.
   *
   */
  _updateAccountTokens(tokens, assetImages) {
    const {
      accountTokens,
      providerType,
      selectedAddress,
    } = this._getTokenRelatedStates()
    accountTokens[selectedAddress][providerType] = tokens
    this.store.updateState({ accountTokens, tokens, assetImages })
  }

  /**
   * Updates `tokens` of current account and network.
   *
   * @param {string} selectedAddress - Account address to be updated with.
   *
   */
  _updateTokens(selectedAddress) {
    const { tokens } = this._getTokenRelatedStates(selectedAddress)
    this.store.updateState({ tokens })
  }

  /**
   * A getter for `tokens` and `accountTokens` related states.
   *
   * @param {string} [selectedAddress] - A new hex address for an account
   * @returns {Object.<array, object, string, string>} States to interact with tokens in `accountTokens`
   *
   */
  _getTokenRelatedStates(selectedAddress) {
    const { accountTokens } = this.store.getState()
    if (!selectedAddress) {
      // eslint-disable-next-line no-param-reassign
      selectedAddress = this.store.getState().selectedAddress
    }
    const providerType = this.network.providerStore.getState().type
    if (!(selectedAddress in accountTokens)) {
      accountTokens[selectedAddress] = {}
    }
    if (!(providerType in accountTokens[selectedAddress])) {
      accountTokens[selectedAddress][providerType] = []
    }
    const tokens = accountTokens[selectedAddress][providerType]
    return { tokens, accountTokens, providerType, selectedAddress }
  }

  /**
   * Handle the suggestion of an ERC20 asset through `watchAsset`
   * *
   * @param {Object} tokenMetadata - Token metadata
   *
   */
  async _handleWatchAssetERC20(tokenMetadata) {
    this._validateERC20AssetParams(tokenMetadata)

    const address = normalizeAddress(tokenMetadata.address)
    const { symbol, decimals, image } = tokenMetadata
    this._addSuggestedERC20Asset(address, symbol, decimals, image)

    await this.openPopup()
    const tokenAddresses = this.getTokens().filter(
      (token) => token.address === address,
    )
    return tokenAddresses.length > 0
  }

  /**
   * Validates that the passed options for suggested token have all required properties.
   *
   * @param {Object} opts - The options object to validate
   * @throws {string} Throw a custom error indicating that address, symbol and/or decimals
   * doesn't fulfill requirements
   *
   */
  _validateERC20AssetParams({ address, symbol, decimals }) {
    if (!address || !symbol || typeof decimals === 'undefined') {
      throw ethErrors.rpc.invalidParams(
        `Must specify address, symbol, and decimals.`,
      )
    }
    if (typeof symbol !== 'string') {
      throw ethErrors.rpc.invalidParams(`Invalid symbol: not a string.`)
    }
    if (!(symbol.length < 7)) {
      throw ethErrors.rpc.invalidParams(
        `Invalid symbol "${symbol}": longer than 6 characters.`,
      )
    }
    const numDecimals = parseInt(decimals, 10)
    if (isNaN(numDecimals) || numDecimals > 36 || numDecimals < 0) {
      throw ethErrors.rpc.invalidParams(
        `Invalid decimals "${decimals}": must be 0 <= 36.`,
      )
    }
    if (!isValidAddress(address)) {
      throw ethErrors.rpc.invalidParams(`Invalid address "${address}".`)
    }
  }

  _addSuggestedERC20Asset(address, symbol, decimals, image) {
    const newEntry = {
      address,
      symbol,
      decimals,
      image,
      unlisted: !LISTED_CONTRACT_ADDRESSES.includes(address),
    }
    const suggested = this.getSuggestedTokens()
    suggested[address] = newEntry
    this.store.updateState({ suggestedTokens: suggested })
  }
}
