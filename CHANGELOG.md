# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [9.8.0]
### Fixed
- [#11361](https://github.com/MetaMask/metamask-extension/pull/11361): Ensures custom network balance displays correctly when no ticker symbol is provided, and ensure ticker symbol displays correctly after all network switches.
- [#10965](https://github.com/MetaMask/metamask-extension/pull/10965): Fixed bug that resulted in sends to some contracts being disabled on custom networks.

### Added
- [#11435](https://github.com/MetaMask/metamask-extension/pull/11435): Add gas limit buffers for optimism network

### Changed
- [#11210](https://github.com/MetaMask/metamask-extension/pull/11210): Disable sending ERC-721 assets (NFTs)
- [#11418](https://github.com/MetaMask/metamask-extension/pull/11418): Use network gas estimate for gas limits of simple sends on custom networks

## [9.7.1]
### Fixed
- [#11426](https://github.com/MetaMask/metamask-extension/pull/11426): Fixed bug that broke transaction speed up and cancel, when attempting those actions immediately after opening MetaMask

## [9.7.0]
### Added
- [#11021](https://github.com/MetaMask/metamask-extension/pull/11021): Add periodic reminder modal for backing up recovery phrase
- [#11179](https://github.com/MetaMask/metamask-extension/pull/11179): Add warning to the custom network form when attempting to add a custom network that already exists

### Changed
- [#11200](https://github.com/MetaMask/metamask-extension/pull/11200): Swaps: Shows custom tokens added from main assets tab
- [#11111](https://github.com/MetaMask/metamask-extension/pull/11111): Removing low gas price warning in advanced tab on test networks
- [#11145](https://github.com/MetaMask/metamask-extension/pull/11145): Swaps: Improving price difference notifications and warnings
- [#11124](https://github.com/MetaMask/metamask-extension/pull/11124): Swaps: Allowing for continual new swap submissions without flow reset
- [#11278](https://github.com/MetaMask/metamask-extension/pull/11278): Updated contract-metadata version to 1.26.0

### Fixed
- [#11017](https://github.com/MetaMask/metamask-extension/pull/11017): Fixes custom RPC block explorer links
- [#11257](https://github.com/MetaMask/metamask-extension/pull/11257): Fixes incorrect network currency label in encryption public key requests

## [9.6.1]
### Fixed
- [#11309](https://github.com/MetaMask/metamask-extension/pull/11309): Fixed signTypeData parameter validation issue

## [9.6.0]
### Added
- [#10905](https://github.com/MetaMask/metamask-extension/pull/10905): Implemented basic switchEthereumChain feature
- [#10967](https://github.com/MetaMask/metamask-extension/pull/10967): Add setting to dismiss seed phrase backup reminder
- [#11131](https://github.com/MetaMask/metamask-extension/pull/11131): What's New: Adding notification for updated seed phrase wording
- [#11083](https://github.com/MetaMask/metamask-extension/pull/11083): Adding BSC Swaps notification when a user is on BSC Mainnet
- [#11088](https://github.com/MetaMask/metamask-extension/pull/11088): Swaps: Add specific error content if Contract data are not enabled on Ledger
- [#11064](https://github.com/MetaMask/metamask-extension/pull/11064): Supporting EIP-712 signing for Ledger accounts
- [#10717](https://github.com/MetaMask/metamask-extension/pull/10717): Adding recovery phrase video to onboarding process

### Changed
- [#11007](https://github.com/MetaMask/metamask-extension/pull/11007): Hide basic tab in advanced gas modal when on testnets.
- [#10994](https://github.com/MetaMask/metamask-extension/pull/10994): Replacing the text "Seed Phrase" with "Secret Recovery Phrase" throughout the application.
- [#10987](https://github.com/MetaMask/metamask-extension/pull/10987): Swaps: Improve hardware wallet UX
- [#10936](https://github.com/MetaMask/metamask-extension/pull/10936): Swaps: Allow 0% slippage, show a warning for 0 < slippage <= 1, disallows Reviews when negative slippage occurs.
- [#10946](https://github.com/MetaMask/metamask-extension/pull/10946): Send user to activity view after transaction is complete
- [#10767](https://github.com/MetaMask/metamask-extension/pull/10767): Improving error handling when gas prices are unavailable.
- [#11118](https://github.com/MetaMask/metamask-extension/pull/11118): Removing support survey notification from What's New
- [#11115](https://github.com/MetaMask/metamask-extension/pull/11115): Hide basic tab in advanced gas modal for speedup and cancel when on testnets
- [#11030](https://github.com/MetaMask/metamask-extension/pull/11030): Return a specific error (code 4902) for switchEthereumChain requests for chains that aren't already in the user's wallet.
- [#11093](https://github.com/MetaMask/metamask-extension/pull/11093): Update all uses of "Seed Phrase" to "Secret Recovery Phrase" 

### Fixed
- [#11025](https://github.com/MetaMask/metamask-extension/pull/11025): Fixed redirection to the build quotes page from the swaps page when failure has occured
- [#11015](https://github.com/MetaMask/metamask-extension/pull/11015): Prevent an undefined gas price from breaking the transaction list
- [#11013](https://github.com/MetaMask/metamask-extension/pull/11013): Prevent signature request component from canceling hardware wallet signing
- [#10982](https://github.com/MetaMask/metamask-extension/pull/10982): Re-validating chain id when rpc url changes [custom network form]
- [#10988](https://github.com/MetaMask/metamask-extension/pull/10988): Allowing for scroll overflow when swaps content is too tall
- [#10971](https://github.com/MetaMask/metamask-extension/pull/10971): Removing gray background from contact address input
- [#10952](https://github.com/MetaMask/metamask-extension/pull/10952): Prevent lag in external monitors when using Mac + Chrome
- [#11127](https://github.com/MetaMask/metamask-extension/pull/11127): Fixes token removal when cancelling a swaps quote
- [#10956](https://github.com/MetaMask/metamask-extension/pull/10956): Fixes intermittent token display rounding error, better handling network errors for token fetches.
- [#11097](https://github.com/MetaMask/metamask-extension/pull/11097): Fixes account search results ordering
- [#11031](https://github.com/MetaMask/metamask-extension/pull/11031): Fixes error behavior of addEthereumChain

## [9.5.9]
### Added
- Re-added "Add Ledger Live Support" ([#10293](https://github.com/MetaMask/metamask-extension/pull/10293)), which was reverted in the previous version

### Fixed
- [#11225](https://github.com/MetaMask/metamask-extension/pull/11225) - Fix persistent display of chrome ledger What's New popup message 

## [9.5.8]
### Added
- Re-added "Add Ledger Live Support" ([#10293](https://github.com/MetaMask/metamask-extension/pull/10293)), which was reverted in the previous version

### Fixed
- [#11207](https://github.com/MetaMask/metamask-extension/pull/11207) - Fix error causing crashes on some locales on v9.5.6 

## [9.5.7]
### Fixed
- Revert "Add Ledger Live Support" ([#10293](https://github.com/MetaMask/metamask-extension/pull/10293)), which introduced a UI crash for some locales

## [9.5.6]
### Added
- [#10293](https://github.com/MetaMask/metamask-extension/pull/10293): Add Ledger Live Support

## [9.5.5]
### Fixed
- [#11159](https://github.com/MetaMask/metamask-extension/pull/11159): Fixes crash after entering invalid data in to the Hex Data field when sending a transaction

## [9.5.4]
### Fixed
- [#11153](https://github.com/MetaMask/metamask-extension/pull/11153): Prevent UI crash when the transaction being retried or canceled is missing.

## [9.5.3]
### Fixed
- Fixes bug that made MetaMask unusable and displayed 'Minified React error #130' on certain networks and accounts ([#11103](https://github.com/MetaMask/metamask-extension/pull/11103))
- Prevent big number error when attempting to view transaction list ([#11015](https://github.com/MetaMask/metamask-extension/pull/11015))

## [9.5.2]
### Fixed
- Fixing address entry error when sending a transaction on a custom network ([#11071](https://github.com/MetaMask/metamask-extension/pull/11071))

## [9.5.1]
### Fixed
- Fixed icon on approval screen ([#11048](https://github.com/MetaMask/metamask-extension/pull/11048))
- Fixed broken app state for some users with Chinese, Portugese or Spanish browser language settings. ([#11036](https://github.com/MetaMask/metamask-extension/pull/11036))

## [9.5.0] - 2021-04-28
### Added
- Adding popup display to show new MetaMask notifications ([#10583](https://github.com/MetaMask/metamask-extension/pull/10583))
- Add menu with "View on Etherscan" and "Account details" links to ETH asset page ([#10938](https://github.com/MetaMask/metamask-extension/pull/10938))
- Add view account details menu item to token page menu ([#10932](https://github.com/MetaMask/metamask-extension/pull/10932))
- Adding new links to contact MetaMask support ([#10895](https://github.com/MetaMask/metamask-extension/pull/10895))
- Adding option to set Custom Nonce to Confirm Approve Page ([#10595](https://github.com/MetaMask/metamask-extension/pull/10595))
- Adding recovery phrase video to onboarding process ([#10717](https://github.com/MetaMask/metamask-extension/pull/10717))
- add trezor HD path for ledger wallets ([#10616](https://github.com/MetaMask/metamask-extension/pull/10616))

### Changed
- Use custom token icons in the send flow token dropdown ([#10939](https://github.com/MetaMask/metamask-extension/pull/10939))
- Remove "My Wallet Account" section in Settings > Contact ([#10680](https://github.com/MetaMask/metamask-extension/pull/10680))
- Harden contract address validation for token swaps ([#10912](https://github.com/MetaMask/metamask-extension/pull/10912))
- Show the custom network name in swaps network fee tooltip ([#10882](https://github.com/MetaMask/metamask-extension/pull/10882))
- Only check whether the swaps feature is live after entering the feature ([#10859](https://github.com/MetaMask/metamask-extension/pull/10859))
- Update swaps metadata every 5 minutes as opposed to an hour ([#10871](https://github.com/MetaMask/metamask-extension/pull/10871))
- Increase default slippage from 2% to 3% in swaps and show Advanced Options by default ([#10842](https://github.com/MetaMask/metamask-extension/pull/10842))
- Prevent tokens without addresses from being added to token list ([#10593](https://github.com/MetaMask/metamask-extension/pull/10593))
- Add New Zealand Dollar to currency options ([#10746](https://github.com/MetaMask/metamask-extension/pull/10746))
- Allow 11 characters in symbol for custom RPCs ([#10670](https://github.com/MetaMask/metamask-extension/pull/10670))
- Hide the suggested token pane when not on Mainnet or test network ([#10702](https://github.com/MetaMask/metamask-extension/pull/10702))
- Prevents autocomplete text from displaying in the Add Token input ([#10700](https://github.com/MetaMask/metamask-extension/pull/10700))
- Removing hard references to 12 word seed phrases in copy ([#10704](https://github.com/MetaMask/metamask-extension/pull/10704))
- Add MetaMask to list of BIP44 HD path examples ([#10703](https://github.com/MetaMask/metamask-extension/pull/10703))
- Change 'Send ETH' title to 'Send' in the send flow ([#10651](https://github.com/MetaMask/metamask-extension/pull/10651))
- Don't render faucet row in deposit modal for custom chains ([#10674](https://github.com/MetaMask/metamask-extension/pull/10674))

### Fixed
- Prevent overflow of hostname on confirmation page ([#10935](https://github.com/MetaMask/metamask-extension/pull/10935))
- Fixing ENS input entry in send flow ([#10923](https://github.com/MetaMask/metamask-extension/pull/10923))
- Fix mismatchedChain typo in custom network approval screen ([#10723](https://github.com/MetaMask/metamask-extension/pull/10723))
- Excluding sourcemaps comment in production builds ([#10695](https://github.com/MetaMask/metamask-extension/pull/10695))
- Prevent network dropdown label highlighting ([#10643](https://github.com/MetaMask/metamask-extension/pull/10643))
- Ensure swaps detail height doesn't create jump in vertical height ([#10644](https://github.com/MetaMask/metamask-extension/pull/10644))
- Position the 3dot menu in the same spot on asset screen and home screen ([#10642](https://github.com/MetaMask/metamask-extension/pull/10642))
- Ensure MetaMask works correctly when on a custom network that shares a chain id with a default Infura network ([#10594](https://github.com/MetaMask/metamask-extension/pull/10594))
- Fixed bug that prevented speeding up cancelled transactions ([#10579](https://github.com/MetaMask/metamask-extension/pull/10579))
- Fixes hidden token bug when zero balance preference is on ([#10630](https://github.com/MetaMask/metamask-extension/pull/10630))
- Removing double click bug from delete custom network modal ([#10628](https://github.com/MetaMask/metamask-extension/pull/10628))

## [9.4.0] - 2021-04-15
### Added
- Notify users when MetaMask is unable to connect to the blockchain host ([#10883](https://github.com/MetaMask/metamask-extension/pull/10883))

## [9.3.0] - 2021-04-02
### Added
- Swaps support for the Binance network ([#10721](https://github.com/MetaMask/metamask-extension/pull/10721))
- Swaps support for forked Mainnet on localhost ([#10658](https://github.com/MetaMask/metamask-extension/pull/10658))

### Fixed
- Display BNB token image for default currency on BSC network home screen ([#10777](https://github.com/MetaMask/metamask-extension/pull/10777))
- Fix: ETH now only appears once in the swaps "to" and "from" dropdowns. ([#10650](https://github.com/MetaMask/metamask-extension/pull/10650))

## [9.2.1] - 2021-03-26
### Fixed
- Prevent UI crash when a 'wallet_requestPermissions" confirmation is queued behind a "wallet_addEthereumChain" confirmation ([#10692](https://github.com/MetaMask/metamask-extension/pull/10692))
- Fix infinite spinner when request for token symbol fails while attempting an approve transaction ([#10712](https://github.com/MetaMask/metamask-extension/pull/10712))

## [9.2.0] - 2021-03-15
### Added
- Add a warning when sending a token to its own contract address ([#10546](https://github.com/MetaMask/metamask-extension/pull/10546))
- Adding warnings for excessive custom gas input ([#10582](https://github.com/MetaMask/metamask-extension/pull/10582))
- Add support for multiple Ledger & Trezor hardware accounts ([#10505](https://github.com/MetaMask/metamask-extension/pull/10505))
- Add setting to hide zero balance tokens ([#10486](https://github.com/MetaMask/metamask-extension/pull/10486))

### Changed
- Update references to MetaMask support ([#10563](https://github.com/MetaMask/metamask-extension/pull/10563))
- Update Italian translation ([#10126](https://github.com/MetaMask/metamask-extension/pull/10126))

### Fixed
- Fix mobile sync of ERC20 tokens ([#10591](https://github.com/MetaMask/metamask-extension/pull/10591))
- Fix activity title text truncation ([#10601](https://github.com/MetaMask/metamask-extension/pull/10601))
- Remove 'Ethereum' from custom RPC endpoint warning ([#10598](https://github.com/MetaMask/metamask-extension/pull/10598))
- Show loading screen while fetching token data for approve screen ([#10606](https://github.com/MetaMask/metamask-extension/pull/10606))
- Show correct block explorer for custom RPC endpoints for built-in networks ([#10587](https://github.com/MetaMask/metamask-extension/pull/10587))

## [9.1.1] - 2021-03-03
### Fixed
- Fix ENS resolution related crashes when switching networks on send screen ([#10560](https://github.com/MetaMask/metamask-extension/pull/10560))
- Fix crash when speeding up an attempt to cancel a transaction on custom networks ([#10561](https://github.com/MetaMask/metamask-extension/pull/10561))

## [9.1.0] - 2021-02-01
### Uncategorized
- Update Japanese translations. ([#10265](https://github.com/MetaMask/metamask-extension/pull/10265))
- Update Chinese(Simplified) translations. ([#9388](https://github.com/MetaMask/metamask-extension/pull/9388))
- Update Vietnamese translations. ([#10270](https://github.com/MetaMask/metamask-extension/pull/10270))
- Update Spanish and Spanish(Latin American and Carribean) translations. ([#10258](https://github.com/MetaMask/metamask-extension/pull/10258))
- Update Russian translations. ([#10268](https://github.com/MetaMask/metamask-extension/pull/10268))
- Update Tagalog localized messages. ([#10269](https://github.com/MetaMask/metamask-extension/pull/10269))
- Fix 'imported' translation use case for Dutch. ([#10448](https://github.com/MetaMask/metamask-extension/pull/10448))
- Use translated transaction category for confirmations. ([#10391](https://github.com/MetaMask/metamask-extension/pull/10391))
- Cancel unapproved confirmations on network change ([#10357](https://github.com/MetaMask/metamask-extension/pull/10357))
- Use native currency in asset row. ([#10413](https://github.com/MetaMask/metamask-extension/pull/10413))
- Fix color indicator size on connected site indicator. ([#10421](https://github.com/MetaMask/metamask-extension/pull/10421))
- Fix multiple notification window prompts. ([#10423](https://github.com/MetaMask/metamask-extension/pull/10423))
- Fix icons on token options menu. ([#10424](https://github.com/MetaMask/metamask-extension/pull/10424))
- Fix token fiat conversion rates when switching from certain custom networks. ([#10414](https://github.com/MetaMask/metamask-extension/pull/10414))
- Disable BUY button from home screen when not on Ethereum Mainnet. ([#10453](https://github.com/MetaMask/metamask-extension/pull/10453))
- Fixes gas selection check mark on the notification view. ([#10465](https://github.com/MetaMask/metamask-extension/pull/10465))
- Fix confirm page header with from/to addresses in fullscreen for tx confirmations. ([#10467](https://github.com/MetaMask/metamask-extension/pull/10467))
- Hide links to etherscan when no block explorer is specified for a custom network for notifications. ([#10455](https://github.com/MetaMask/metamask-extension/pull/10455))
- Fix swap insufficient balance error message. ([#10456](https://github.com/MetaMask/metamask-extension/pull/10456))
- Fix encypt/decrypt tx queueing. ([#10350](https://github.com/MetaMask/metamask-extension/pull/10350))
- Improve autofocus in the add network form. ([#10473](https://github.com/MetaMask/metamask-extension/pull/10473))
- Use eth_gasprice for tx gas price estimation on non-Mainnet networks. ([#10444](https://github.com/MetaMask/metamask-extension/pull/10444))
- Fix accountsChanged event not triggering when manually connecting. ([#10477](https://github.com/MetaMask/metamask-extension/pull/10477))
- Fix navigation from jumping vertically when clicking into token. ([#10471](https://github.com/MetaMask/metamask-extension/pull/10471))
- Add custom network RPC method. ([#9724](https://github.com/MetaMask/metamask-extension/pull/9724))
- Eliminate artificial delay in swaps loading screen after request loading is complete. ([#10496](https://github.com/MetaMask/metamask-extension/pull/10496))
- Ensure that swap approve tx and swap tx always have the same gas price. ([#10501](https://github.com/MetaMask/metamask-extension/pull/10501))
- Fixes signTypedData message overflow. ([#10485](https://github.com/MetaMask/metamask-extension/pull/10485))
- Update swaps failure message to include a support link. ([#10525](https://github.com/MetaMask/metamask-extension/pull/10525))
- Accommodate for 0 sources verifying swap token ([#10521](https://github.com/MetaMask/metamask-extension/pull/10521))
- Show warnings on Add Recipient page of Send flow ([#10530](https://github.com/MetaMask/metamask-extension/pull/10530))
- Warn users when an ENS name contains 'confusable' characters ([#9187](https://github.com/MetaMask/metamask-extension/pull/9187))
- Fixes ENS IPFS resolution on custom networks with the chainID of 1. ([#10507](https://github.com/MetaMask/metamask-extension/pull/10507))

## [9.0.5] - 2021-02-09
### Uncategorized
- Allow editing transaction amount after clicking max ([#10278](https://github.com/MetaMask/metamask-extension/pull/10278))
- Standardize size, shape and color of network color indicators ([#10214](https://github.com/MetaMask/metamask-extension/pull/10214))
- Use network primary currency instead of always defaulting to ETH in the confirm approve screen ([#10298](https://github.com/MetaMask/metamask-extension/pull/10298))
- Add origin to signature request confirmation page ([#10300](https://github.com/MetaMask/metamask-extension/pull/10300))
- Add origin to transaction confirmation ([#10296](https://github.com/MetaMask/metamask-extension/pull/10296))
- Update `ko` localized messages ([#10266](https://github.com/MetaMask/metamask-extension/pull/10266))
- Update `id` localized messages ([#10263](https://github.com/MetaMask/metamask-extension/pull/10263))
- Require click of "Continue" button to interact with swap screen if there is a price impact warning for present swap ([#10347](https://github.com/MetaMask/metamask-extension/pull/10347))
- Change copy of submit button on swaps screen ([#10373](https://github.com/MetaMask/metamask-extension/pull/10373))
- Swaps token sources/verification messaging update ([#10346](https://github.com/MetaMask/metamask-extension/pull/10346))
- Stop showing the window.web3 in-app popup if the dapp is just using web3.currentProvider ([#10378](https://github.com/MetaMask/metamask-extension/pull/10378))
- Throw error when attempting to get an encryption key via eth_getEncryptionPublicKey when connected to Ledger HW ([#10326](https://github.com/MetaMask/metamask-extension/pull/10326))
- Make action buttons on message components in swaps flow accessible ([#10386](https://github.com/MetaMask/metamask-extension/pull/10386))

## [9.0.4] - 2021-01-27
### Uncategorized
- Update @metamask/contract-metadata from v1.21.0 to 1.22.0 ([#10285](https://github.com/MetaMask/metamask-extension/pull/10285))
- Update `hi` localized messages ([#10264](https://github.com/MetaMask/metamask-extension/pull/10264))
- Move fox to bottom of 'About' page ([#10174](https://github.com/MetaMask/metamask-extension/pull/10174))
- Fix hardware account selection ([#10198](https://github.com/MetaMask/metamask-extension/pull/10198))
- Add a timeout to all network requests ([#10101](https://github.com/MetaMask/metamask-extension/pull/10101))
- Fix displayed balance of tokens with 0 decimals in swaps flow ([#10212](https://github.com/MetaMask/metamask-extension/pull/10212))
- Prevent accidentally submitting a swap twice ([#10162](https://github.com/MetaMask/metamask-extension/pull/10162))
- Improve chain ID validation ([#10224](https://github.com/MetaMask/metamask-extension/pull/10224))
- Increase minimum Firefox version to v68 ([#10195](https://github.com/MetaMask/metamask-extension/pull/10195))
- Update TrezorConnect to v8 ([#10192](https://github.com/MetaMask/metamask-extension/pull/10192))
- Fix back button on swaps loading page ([#10166](https://github.com/MetaMask/metamask-extension/pull/10166))
- Do not publish swaps transaction if the estimateGas call made when adding the transaction fails. ([#9947](https://github.com/MetaMask/metamask-extension/pull/9947))

## [9.0.3] - 2021-01-22
### Uncategorized
- Fix site metadata handling ([#10243](https://github.com/MetaMask/metamask-extension/pull/10243))
- Fix decrypt message confirmation UI crash ([#10252](https://github.com/MetaMask/metamask-extension/pull/10252))

## [9.0.2] - 2021-01-20
### Uncategorized
- zh_TW: 乙太 -> 以太 ([#10191](https://github.com/MetaMask/metamask-extension/pull/10191))
- zh_TW: Translate buy, assets, activity ([#10207](https://github.com/MetaMask/metamask-extension/pull/10207))
- Restore provider 'data' event ([#10219](https://github.com/MetaMask/metamask-extension/pull/10219))

## [9.0.1] - 2021-01-13
### Uncategorized
- Improved detection of contract methods with array parameters ([#10169](https://github.com/MetaMask/metamask-extension/pull/10169))
- Only warn of injected web3 usage once per page ([#10178](https://github.com/MetaMask/metamask-extension/pull/10178))
- Restore support for @metamask/inpage provider@"< 8.0.0" ([#10179](https://github.com/MetaMask/metamask-extension/pull/10179))
- Fix UI crash when domain metadata is missing on public encryption key confirmation page ([#10180](https://github.com/MetaMask/metamask-extension/pull/10180))

## [9.0.0] - 2021-01-12
### Uncategorized
- Remove window.web3 injection ([#9156](https://github.com/MetaMask/metamask-extension/pull/9156))
- Add web3 shim usage notification ([#10039](https://github.com/MetaMask/metamask-extension/pull/10039))
- Implement breaking window.ethereum API changes ([#8640](https://github.com/MetaMask/metamask-extension/pull/8640))
- Fix `eth_chainId` return values for Infura networks ([#8629](https://github.com/MetaMask/metamask-extension/pull/8629))
- Increase Chrome minimum version to v63 ([#10019](https://github.com/MetaMask/metamask-extension/pull/10019))
- Fix error where a swap only completed the token approval transaction ([#10135](https://github.com/MetaMask/metamask-extension/pull/10135))
- Remove unnecessary swaps footer space when in dropdown mode ([#10100](https://github.com/MetaMask/metamask-extension/pull/10100))
- Redesign view quote screens ([#9905](https://github.com/MetaMask/metamask-extension/pull/9905))
- Prevent hidden tokens from reappearing ([#9320](https://github.com/MetaMask/metamask-extension/pull/9320))
- Use consistent font size for modal top right Close links ([#10000](https://github.com/MetaMask/metamask-extension/pull/10000))
- Improve home screen notification appearance ([#10046](https://github.com/MetaMask/metamask-extension/pull/10046))
- Always roll back to the previously selected network when unable to connect to a newly selected network ([#10093](https://github.com/MetaMask/metamask-extension/pull/10093))
- Fix network settings Kovan block explorer link ([#10117](https://github.com/MetaMask/metamask-extension/pull/10117))
- Prevent malformed next nonce warning ([#10143](https://github.com/MetaMask/metamask-extension/pull/10143))
- Update @metamask/contract-metadata from v1.20.0 to 1.21.0 ([#10142](https://github.com/MetaMask/metamask-extension/pull/10142))
- Fix French "Block Explorer URL" translations ([#10160](https://github.com/MetaMask/metamask-extension/pull/10160))
- Automatically detect tokens on custom Mainnet RPC endpoints ([#10157](https://github.com/MetaMask/metamask-extension/pull/10157))
- Improve zh_CN translation ([#9772](https://github.com/MetaMask/metamask-extension/pull/9772))
- Fix bug where swaps button was disabled on Mainnet if the user hadn't switched networks in a long time ([#10170](https://github.com/MetaMask/metamask-extension/pull/10170))

## [8.1.11] - 2021-01-07
### Uncategorized
- Disable swaps when the current network's chainId does not match the mainnet chain ID, instead of disabling based on network ID ([#10155](https://github.com/MetaMask/metamask-extension/pull/10155))

## [8.1.10] - 2021-01-04
### Uncategorized
- Set last provider when switching to a customRPC ([#10084](https://github.com/MetaMask/metamask-extension/pull/10084))
- Update `@metamask/controllers` to v5.1.0 ([#10096](https://github.com/MetaMask/metamask-extension/pull/10096))
- Prevent stuck loading screen in some situations ([#10103](https://github.com/MetaMask/metamask-extension/pull/10103))
- Bump @metamask/contract-metadata from 1.19.0 to 1.20.0 ([#10104](https://github.com/MetaMask/metamask-extension/pull/10104))
- Fix frozen loading screen on Firefox when strict Enhanced Tracking Protection is enabled ([#10110](https://github.com/MetaMask/metamask-extension/pull/10110))

## [8.1.9] - 2020-12-15
### Uncategorized
- Fix contentscript injection failure on Firefox 56 ([#10034](https://github.com/MetaMask/metamask-extension/pull/10034))
- Fix token validation in Send flow ([#10045](https://github.com/MetaMask/metamask-extension/pull/10045))
- Display boolean values when signing typed data ([#10048](https://github.com/MetaMask/metamask-extension/pull/10048))
- Add eth_getProof ([#10070](https://github.com/MetaMask/metamask-extension/pull/10070))
- Improve swaps maximum gas estimation ([#10043](https://github.com/MetaMask/metamask-extension/pull/10043))
- Fetch swap quote refresh time from API ([#10069](https://github.com/MetaMask/metamask-extension/pull/10069))
- Disable console in contentscript to reduce noise ([#10040](https://github.com/MetaMask/metamask-extension/pull/10040))

## [8.1.8] - 2020-12-09
### Uncategorized
- Improve transaction params validation ([#9992](https://github.com/MetaMask/metamask-extension/pull/9992))
- Don't allow more than 15% slippage ([#9991](https://github.com/MetaMask/metamask-extension/pull/9991))
- Prevent unwanted 'no quotes available' message when going back to build quote screen while having insufficient funds ([#9994](https://github.com/MetaMask/metamask-extension/pull/9994))
- Fix missing contacts upon restart ([#9999](https://github.com/MetaMask/metamask-extension/pull/9999))

## [8.1.7] - 2020-12-09
### Uncategorized
- Revert SES lockdown

## [8.1.6] - 2020-12-04
### Uncategorized
- Fix QR code scans interpretting payment requests as token addresses ([#9916](https://github.com/MetaMask/metamask-extension/pull/9916))
- Add alt text for images in list items ([#9847](https://github.com/MetaMask/metamask-extension/pull/9847))
- Ensure watchAsset returns errors for invalid token symbols ([#9960](https://github.com/MetaMask/metamask-extension/pull/9960))
- Adds tokens from v1.19.0 of metamask/contract-metadata to add token lists ([#9968](https://github.com/MetaMask/metamask-extension/pull/9968))
- Etherscan links support Goerli network ([#9970](https://github.com/MetaMask/metamask-extension/pull/9970))
- Show price impact warnings on swaps quote screen ([#9899](https://github.com/MetaMask/metamask-extension/pull/9899))
- Replace use of ethgasstation ([#9867](https://github.com/MetaMask/metamask-extension/pull/9867))
- Show correct gas estimates when users don't have sufficient balance for contract transaction ([#9984](https://github.com/MetaMask/metamask-extension/pull/9984))
- Add 48x48 MetaMask icon for use by browsers ([#9993](https://github.com/MetaMask/metamask-extension/pull/9993))

## [8.1.5] - 2020-11-19
### Uncategorized
- Show send text upon hover in main asset list ([#9871](https://github.com/MetaMask/metamask-extension/pull/9871))
- Make edit icon and account name in account details modal focusable ([#9855](https://github.com/MetaMask/metamask-extension/pull/9855))
- Provide alternative text for images where appropriate ([#9853](https://github.com/MetaMask/metamask-extension/pull/9853))
- Remove CoinSwitch from the Deposit modal ([#9869](https://github.com/MetaMask/metamask-extension/pull/9869))
- Move add contact button in fullscreen/expanded view of settings lower to expose the close button. ([#9883](https://github.com/MetaMask/metamask-extension/pull/9883))
- Add token verification message to swaps build quote screen ([#9891](https://github.com/MetaMask/metamask-extension/pull/9891))
- Show failed token balance updates ([#9896](https://github.com/MetaMask/metamask-extension/pull/9896))
- Update asset page etherscan link to the address-filtered token page on Etherscan ([#9909](https://github.com/MetaMask/metamask-extension/pull/9909))
- Revert "Show a 'send eth' button on home screen in full screen mode" ([#9910](https://github.com/MetaMask/metamask-extension/pull/9910))
- Ensure "Known contract address" warning is shown on send screen even when changing asset ([#9907](https://github.com/MetaMask/metamask-extension/pull/9907))
- Fix display of Ledger connection error ([#9911](https://github.com/MetaMask/metamask-extension/pull/9911))
- Fix missing icon in asset page dropdown and in advanced gas modal button group ([#9918](https://github.com/MetaMask/metamask-extension/pull/9918))

## [8.1.4] - 2020-11-16
### Uncategorized
- Allow speeding up of underpriced transactions ([#9687](https://github.com/MetaMask/metamask-extension/pull/9687))
- normalize UI component font styles ([#9694](https://github.com/MetaMask/metamask-extension/pull/9694))
- normalize app component font styles ([#9695](https://github.com/MetaMask/metamask-extension/pull/9695))
- normalize deprecated itcss font styles ([#9696](https://github.com/MetaMask/metamask-extension/pull/9696))
- normalize page font styles ([#9697](https://github.com/MetaMask/metamask-extension/pull/9697))
- Standardize network settings page ([#9740](https://github.com/MetaMask/metamask-extension/pull/9740))
- Make swap arrows accessible, make swaps advanced options accessible ([#9750](https://github.com/MetaMask/metamask-extension/pull/9750))
- Use 1px borders on inputs and buttons ([#9766](https://github.com/MetaMask/metamask-extension/pull/9766))
- Remove border radius from transfer button ([#9767](https://github.com/MetaMask/metamask-extension/pull/9767))
- Update custom RPC network dropdown icons ([#9764](https://github.com/MetaMask/metamask-extension/pull/9764))
- Add confirmation for network dropdown delete action ([#9763](https://github.com/MetaMask/metamask-extension/pull/9763))
- Use `chainId` for incoming transactions controller ([#9583](https://github.com/MetaMask/metamask-extension/pull/9583))
- Autofocus input, improve accessibility of restore page ([#9748](https://github.com/MetaMask/metamask-extension/pull/9748))
- Shorten unit input width and use ellipses for overflow ([#9778](https://github.com/MetaMask/metamask-extension/pull/9778))
- Make the login screen's Restore and Import links accessible ([#9746](https://github.com/MetaMask/metamask-extension/pull/9746))
- Display decimal chain ID in network form ([#9780](https://github.com/MetaMask/metamask-extension/pull/9780))
- Use MetaSwap API for gas price estimation in swaps ([#9599](https://github.com/MetaMask/metamask-extension/pull/9599))
- Make all UI tabs accessible via keyboard ([#9518](https://github.com/MetaMask/metamask-extension/pull/9518))
- Always allow overwriting invalid custom RPC chain ID ([#9808](https://github.com/MetaMask/metamask-extension/pull/9808))
- Fix send header cancel button alignment ([#9812](https://github.com/MetaMask/metamask-extension/pull/9812))
- Do not check popupIsOpen on Vivaldi ([#9271](https://github.com/MetaMask/metamask-extension/pull/9271))
- Fix UI crash when dapp submits negative gas price ([#9306](https://github.com/MetaMask/metamask-extension/pull/9306))
- Add sort and search to AddRecipient accounts list ([#9257](https://github.com/MetaMask/metamask-extension/pull/9257))
- Move `externally_connectable` from base to Chrome manifest ([#9824](https://github.com/MetaMask/metamask-extension/pull/9824))
- Add support for custom network RPC URL with basic auth ([#9815](https://github.com/MetaMask/metamask-extension/pull/9815))
- Make QR code button focusable ([#9822](https://github.com/MetaMask/metamask-extension/pull/9822))
- Warn instead of throw on duplicate web3 ([#9832](https://github.com/MetaMask/metamask-extension/pull/9832))
- @metamask/controllers@4.0.0 ([#9838](https://github.com/MetaMask/metamask-extension/pull/9838))
- Prevent user from getting stuck on opt in page ([#9856](https://github.com/MetaMask/metamask-extension/pull/9856))
- Show a 'send eth' button on home screen in full screen mode ([#9845](https://github.com/MetaMask/metamask-extension/pull/9845))
- Show send text upon hover in main asset list ([#9871](https://github.com/MetaMask/metamask-extension/pull/9871))
- Properly detect U2F errors in hardware wallet ([#9880](https://github.com/MetaMask/metamask-extension/pull/9880))

## [8.1.3] - 2020-10-29
### Uncategorized
- Prevent excessive overflow from swap dropdowns ([#9642](https://github.com/MetaMask/metamask-extension/pull/9642))
- Fix sorting Quote Source column of quote sort list ([#9658](https://github.com/MetaMask/metamask-extension/pull/9658))
- Fix adding contact with QR code ([#9667](https://github.com/MetaMask/metamask-extension/pull/9667))
- Fix ENS resolution of `.eth` URLs with query strings ([#9674](https://github.com/MetaMask/metamask-extension/pull/9674))
- Bump @metamask/inpage-provider from 6.1.0 to 6.3.0 ([#9691](https://github.com/MetaMask/metamask-extension/pull/9691))
- Provide image sizing so there's no jump when opening the swaps token search ([#9700](https://github.com/MetaMask/metamask-extension/pull/9700))
- Add ses lockdown to build system ([#9568](https://github.com/MetaMask/metamask-extension/pull/9568))
- Prevent memory leak from selected account copy tooltip ([#9705](https://github.com/MetaMask/metamask-extension/pull/9705))
- Prevent old fetches from polluting the swap state ([#9671](https://github.com/MetaMask/metamask-extension/pull/9671))
- Keyboard navigation for swaps dropdowns ([#9702](https://github.com/MetaMask/metamask-extension/pull/9702))
- Switch from Matomo to Segment ([#9646](https://github.com/MetaMask/metamask-extension/pull/9646))
- Fix fetching swaps when initial network not Mainnet ([#9745](https://github.com/MetaMask/metamask-extension/pull/9745))
- Include aggregator fee as part of displayed network fees ([#9621](https://github.com/MetaMask/metamask-extension/pull/9621))
- Bump eth-contract-metadata from 1.16.0 to 1.17.0 ([#9736](https://github.com/MetaMask/metamask-extension/pull/9736))
- Fix "+-" prefix on swap token amount ([#9743](https://github.com/MetaMask/metamask-extension/pull/9743))
- Focus on wallet address in buy workflow ([#9715](https://github.com/MetaMask/metamask-extension/pull/9715))

## [8.1.2] - 2020-10-20
### Uncategorized
- Ensure QR code scanner works ([#9608](https://github.com/MetaMask/metamask-extension/pull/9608))
- Help users avoid insufficient gas prices in swaps ([#9624](https://github.com/MetaMask/metamask-extension/pull/9624))
- Update swaps network fee tooltip ([#9614](https://github.com/MetaMask/metamask-extension/pull/9614))
- Prevent reducing the gas limit for swaps ([#9623](https://github.com/MetaMask/metamask-extension/pull/9623))
- Fix UI crash when trying to render estimated time remaining of non-submitted transaction ([#9630](https://github.com/MetaMask/metamask-extension/pull/9630))
- Update View Quote page to better represent the MetaMask fee ([#9633](https://github.com/MetaMask/metamask-extension/pull/9633))

## [8.1.1] - 2020-10-15
### Uncategorized
- Prevent build quote crash when swapping from non-tracked token with balance ([#9586](https://github.com/MetaMask/metamask-extension/pull/9586))
- Remove commitment to maintain a public metrics dashboard ([#9592](https://github.com/MetaMask/metamask-extension/pull/9592))
- Fix TypeError when `signTypedData` throws ([#9596](https://github.com/MetaMask/metamask-extension/pull/9596))
- Fix Firefox overflow on transaction items with long amounts ([#9591](https://github.com/MetaMask/metamask-extension/pull/9591))
- Update text content of invalid custom network alert ([#9601](https://github.com/MetaMask/metamask-extension/pull/9601))
- Ensure proper hover display for accounts in main menu ([#9575](https://github.com/MetaMask/metamask-extension/pull/9575))
- Autofocus the appropriate text fields in the Create/Import/Hardware screen ([#9576](https://github.com/MetaMask/metamask-extension/pull/9576))
- AutoFocus the from input on swaps screen ([#9581](https://github.com/MetaMask/metamask-extension/pull/9581))
- Prevent swap button from being focused when disabled ([#9602](https://github.com/MetaMask/metamask-extension/pull/9602))
- Ensure swaps customize gas modal values are set correctly ([#9609](https://github.com/MetaMask/metamask-extension/pull/9609))

## [8.1.0] - 2020-10-13
### Uncategorized
- Ensure address book entries are shared between networks with the same chain ID ([#9565](https://github.com/MetaMask/metamask-extension/pull/9565))
- Fix `eth_signTypedData_v4` chain ID validation for non-default networks ([#9552](https://github.com/MetaMask/metamask-extension/pull/9552))
- Allow the "Localhost 8545" network to be edited, and require a chain ID to be specified for it ([#9551](https://github.com/MetaMask/metamask-extension/pull/9551))
- Validate custom network chain IDs against endpoint `eth_chainId` return values ([#9491](https://github.com/MetaMask/metamask-extension/pull/9491))
- Require chain IDs to be specified for custom networks ([#9487](https://github.com/MetaMask/metamask-extension/pull/9487))
- Add MetaMask Swaps 🌻 ([#9482](https://github.com/MetaMask/metamask-extension/pull/9482))
- Fix data backup feature ([#9422](https://github.com/MetaMask/metamask-extension/pull/9422))
- Improve gas input UI by using tooltip instead of a modal to communicate gas data ([#9434](https://github.com/MetaMask/metamask-extension/pull/9434))
- Improve visual style and layout of the basic tab of the customize gas modal ([#9433](https://github.com/MetaMask/metamask-extension/pull/9433))
- Fix UI bug in token approval confirmation notifications ([#9415](https://github.com/MetaMask/metamask-extension/pull/9415))
- Update Wyre purchase URL ([#9414](https://github.com/MetaMask/metamask-extension/pull/9414))
- Rename 'Ethereum Main Network' in network selector to 'Etherum Mainnet' ([#9411](https://github.com/MetaMask/metamask-extension/pull/9411))
- Fix info tooltip on the alert settings screen when used in firefox ([#9409](https://github.com/MetaMask/metamask-extension/pull/9409))
- Fix UI bug in customize gas modal: shwo left border when the first button is selected ([#9406](https://github.com/MetaMask/metamask-extension/pull/9406))
- Correctly save new Contact Book addressed after editing them in 'Settings > Contact' ([#9395](https://github.com/MetaMask/metamask-extension/pull/9395))
- Improve Italian translations ([#9293](https://github.com/MetaMask/metamask-extension/pull/9293))
- Ensure the extension can be unlocked without network/internet access ([#9295](https://github.com/MetaMask/metamask-extension/pull/9295))
- Add messages to Ledger connection process ([#9344](https://github.com/MetaMask/metamask-extension/pull/9344))
- Hide seedphrase by default when restoring vault, and provide option for it to be shown ([#9329](https://github.com/MetaMask/metamask-extension/pull/9329))
- Ensure names of token symbols are shown when token amounts in the token list are long ([#9333](https://github.com/MetaMask/metamask-extension/pull/9333))
- Warn users when sending tokens to the token address ([#9321](https://github.com/MetaMask/metamask-extension/pull/9321))
- Fix bug that caused the accounts list to be empty after entering an incorrect password when attempting to export private key ([#9288](https://github.com/MetaMask/metamask-extension/pull/9288))
- Improve/fix error text for when ENS names are not found, on mainnet ([#9314](https://github.com/MetaMask/metamask-extension/pull/9314))
- Improve 'Contact Us' copy in settings ([#9307](https://github.com/MetaMask/metamask-extension/pull/9307))
- Fix capitalization of copy on MetaMetrics opt-in page ([#9283](https://github.com/MetaMask/metamask-extension/pull/9283))
- Add lock icon to default networks in the Settings network page, to indicate they are not editable ([#9269](https://github.com/MetaMask/metamask-extension/pull/9269))
- Hide gas price/speed estimate button, and link to advanced gas modal, in send flow on non-main network ([#9189](https://github.com/MetaMask/metamask-extension/pull/9189))
- Improve visual styling of back button in account modal ([#9184](https://github.com/MetaMask/metamask-extension/pull/9184))
- Fix vertical align of the network name in network dropdown button ([#9152](https://github.com/MetaMask/metamask-extension/pull/9152))
- Use new Euclid font throughout MetaMask ([#9073](https://github.com/MetaMask/metamask-extension/pull/9073))

## [8.0.10] - 2020-09-16
### Uncategorized
- Update default phishing list ([#9423](https://github.com/MetaMask/metamask-extension/pull/9423))
- Fix fetching a new phishing list on Firefox ([#9416](https://github.com/MetaMask/metamask-extension/pull/9416))

## [8.0.9] - 2020-08-19
### Uncategorized
- Move transaction confirmation footer buttons to scrollable area ([#9228](https://github.com/MetaMask/metamask-extension/pull/9228))
- Handle non-String web3 property access ([#9256](https://github.com/MetaMask/metamask-extension/pull/9256))
- Use @metamask/controllers@2.0.5 ([#9266](https://github.com/MetaMask/metamask-extension/pull/9266))
- Hide ETH Gas Station estimates on non-main network ([#9189](https://github.com/MetaMask/metamask-extension/pull/9189))

## [8.0.8] - 2020-08-14
### Uncategorized
- Fix Etherscan redirect on notification click ([#9211](https://github.com/MetaMask/metamask-extension/pull/9211))
- Reduce volume of web3 usage metrics ([#9237](https://github.com/MetaMask/metamask-extension/pull/9237))
- Permit all-caps addresses ([#9227](https://github.com/MetaMask/metamask-extension/pull/9227))

## [8.0.7] - 2020-08-10
### Uncategorized
- Change title of "Reveal Seed Words" page to "Reveal Seed Phrase" ([#9065](https://github.com/MetaMask/metamask-extension/pull/9065))
- Add tooltip to copy button for contacts and seed phrase ([#8974](https://github.com/MetaMask/metamask-extension/pull/8974))
- Fix broken UI upon failed password validation ([#9063](https://github.com/MetaMask/metamask-extension/pull/9063))
- Fix shifted popup notification when browser is in fullscreen on macOS ([#9075](https://github.com/MetaMask/metamask-extension/pull/9075))
- Support longer text in network dropdown ([#9085](https://github.com/MetaMask/metamask-extension/pull/9085))
- Fix onboarding bug where user can be asked to verify seed phrase twice ([#8873](https://github.com/MetaMask/metamask-extension/pull/8873))
- Replace "Email us" button with "Contact us" button ([#9104](https://github.com/MetaMask/metamask-extension/pull/9104))
- Fix bug where `accountsChanged` events stop after a dapp connection is closed. ([#9137](https://github.com/MetaMask/metamask-extension/pull/9137))
- Fix network name alignment ([#9152](https://github.com/MetaMask/metamask-extension/pull/9152))
- Add web3 usage metrics and prepare for web3 removal ([#9144](https://github.com/MetaMask/metamask-extension/pull/9144))

## [8.0.6] - 2020-07-23
### Uncategorized
- Hide "delete" button when editing contact of wallet account ([#9030](https://github.com/MetaMask/metamask-extension/pull/9030))
- Fix crash upon removing contact ([#9031](https://github.com/MetaMask/metamask-extension/pull/9031))
- Do not show spend limit for approvals ([#9032](https://github.com/MetaMask/metamask-extension/pull/9032))
- Update @metamask/inpage-provider@6.1.0 ([#9046](https://github.com/MetaMask/metamask-extension/pull/9046))
- Skip attempts to resolve 0x contract prefix ([#9048](https://github.com/MetaMask/metamask-extension/pull/9048))
- Use content-hash@2.5.2 ([#9051](https://github.com/MetaMask/metamask-extension/pull/9051))
- Display at least one significant digit of small non-zero token balances ([#9056](https://github.com/MetaMask/metamask-extension/pull/9056))

## [8.0.5] - 2020-07-17
### Uncategorized
- Fix display of incoming transactions ([#8942](https://github.com/MetaMask/metamask-extension/pull/8942))
- Fix `web3_clientVersion` method ([#8998](https://github.com/MetaMask/metamask-extension/pull/8998))
- @metamask/inpage-provider@6.0.1 ([#9003](https://github.com/MetaMask/metamask-extension/pull/9003))
- Hide loading indication after `personal_sign` ([#9006](https://github.com/MetaMask/metamask-extension/pull/9006))
- Display pending notifications after connect flow ([#9011](https://github.com/MetaMask/metamask-extension/pull/9011))
- Skip render when home page is closing or redirecting ([#9012](https://github.com/MetaMask/metamask-extension/pull/9012))
- Limit number of transactions passed outside of TransactionController ([#9010](https://github.com/MetaMask/metamask-extension/pull/9010))
- Clear AccountTracker accounts and CachedBalances on createNewVaultAndRestore ([#9023](https://github.com/MetaMask/metamask-extension/pull/9023))
- Catch gas estimate errors ([#9025](https://github.com/MetaMask/metamask-extension/pull/9025))
- Clear transactions on createNewVaultAndRestore ([#9026](https://github.com/MetaMask/metamask-extension/pull/9026))

## [8.0.4] - 2020-07-08
### Uncategorized
- Fix transaction activity on custom networks ([#8934](https://github.com/MetaMask/metamask-extension/pull/8934))
- Fix account tracker optimization ([#8936](https://github.com/MetaMask/metamask-extension/pull/8936))

## [8.0.3] - 2020-07-06
### Uncategorized
- Restore missing 'data' provider event, and fix 'notification' event ([#8921](https://github.com/MetaMask/metamask-extension/pull/8921))
- Normalize the 'from' parameter for `eth_sendTransaction` ([#8923](https://github.com/MetaMask/metamask-extension/pull/8923))
- Fix handling of multiple `eth_requestAccount` messages from the same domain ([#8924](https://github.com/MetaMask/metamask-extension/pull/8924))
- Update Italian translations ([#8917](https://github.com/MetaMask/metamask-extension/pull/8917))

## [8.0.2] - 2020-07-03
### Uncategorized
- Tolerate missing or falsey substitutions ([#8907](https://github.com/MetaMask/metamask-extension/pull/8907))
- Fix activity log inline buttons ([#8908](https://github.com/MetaMask/metamask-extension/pull/8908))
- Prevent confirming blank suggested token ([#8909](https://github.com/MetaMask/metamask-extension/pull/8909))
- Handle suggested token resolved elsewhere ([#8910](https://github.com/MetaMask/metamask-extension/pull/8910))
- Fix Kovan chain ID constant ([#8913](https://github.com/MetaMask/metamask-extension/pull/8913))

## [8.0.1] - 2020-07-02
### Uncategorized
- Fx overflow behaviour of add token list ([#8874](https://github.com/MetaMask/metamask-extension/pull/8874))
- Show `origin` in connect flow rather than site name ([#8885](https://github.com/MetaMask/metamask-extension/pull/8885))
- Allow setting a custom nonce of zero ([#8883](https://github.com/MetaMask/metamask-extension/pull/8883))
- Fix language code format mismatch ([#8889](https://github.com/MetaMask/metamask-extension/pull/8889))
- Prevent showing connected accounts without origin ([#8891](https://github.com/MetaMask/metamask-extension/pull/8891))
- Prevent manually connecting to extension UI ([#8893](https://github.com/MetaMask/metamask-extension/pull/8893))
- Allow localized messages to not use substitutions ([#8895](https://github.com/MetaMask/metamask-extension/pull/8895))
- Update eth-keyring-controller to fix erasure of imported/hardware account names ([#8897](https://github.com/MetaMask/metamask-extension/pull/8897))
- Include relative time polyfill locale data ([#8896](https://github.com/MetaMask/metamask-extension/pull/8896))
- Replace percentage opacity value ([#8898](https://github.com/MetaMask/metamask-extension/pull/8898))

## [8.0.0] - 2020-07-01
### Uncategorized
- Add permission system ([#7004](https://github.com/MetaMask/metamask-extension/pull/7004))
- Search accounts by name ([#7261](https://github.com/MetaMask/metamask-extension/pull/7261))
- Buffer 3 blocks before dropping a transaction ([#7483](https://github.com/MetaMask/metamask-extension/pull/7483))
- Handle one specific permissions request per tab ([#7620](https://github.com/MetaMask/metamask-extension/pull/7620))
- Add description to Reset Account in settings ([#7686](https://github.com/MetaMask/metamask-extension/pull/7686))
- Allow custom IPFS gateway and use more secure default gateway ([#7362](https://github.com/MetaMask/metamask-extension/pull/7362))
- Adjust colour of Reset Account button to reflect danger ([#7696](https://github.com/MetaMask/metamask-extension/pull/7696))
- Support new onboarding library ([#7602](https://github.com/MetaMask/metamask-extension/pull/7602))
- Update custom token symbol length restriction message ([#7672](https://github.com/MetaMask/metamask-extension/pull/7672))
- Handle 'Enter' keypress on restore from seed screen ([#7747](https://github.com/MetaMask/metamask-extension/pull/7747))
- Remove padding around advanced gas info icon ([#7810](https://github.com/MetaMask/metamask-extension/pull/7810))
- Force background state update after removing an account ([#7840](https://github.com/MetaMask/metamask-extension/pull/7840))
- Change "Log In/Out" terminology to "Unlock/Lock" ([#7853](https://github.com/MetaMask/metamask-extension/pull/7853))
- Add mechanism to randomize seed phrase filename ([#7863](https://github.com/MetaMask/metamask-extension/pull/7863))
- Sort seed phrase confirmation buttons alphabetically ([#7933](https://github.com/MetaMask/metamask-extension/pull/7933))
- Add support for 24 word seed phrases ([#7987](https://github.com/MetaMask/metamask-extension/pull/7987))
- Use contact name instead of address during send flow ([#7971](https://github.com/MetaMask/metamask-extension/pull/7971))
- Add title attribute to transaction title ([#8050](https://github.com/MetaMask/metamask-extension/pull/8050))
- Implement encrypt/decrypt feature ([#7831](https://github.com/MetaMask/metamask-extension/pull/7831))
- Add setting for disabling Eth Phishing Detection ([#8125](https://github.com/MetaMask/metamask-extension/pull/8125))
- Prevent external domains from submitting more than one perm request at a time ([#8148](https://github.com/MetaMask/metamask-extension/pull/8148))
- Wait for extension unlock before processing eth_requestAccounts ([#8149](https://github.com/MetaMask/metamask-extension/pull/8149))
- Add Idle Timeout for Sync with mobile ([#8201](https://github.com/MetaMask/metamask-extension/pull/8201))
- Update Italian translation ([#8247](https://github.com/MetaMask/metamask-extension/pull/8247))
- Make seed phrase import case-insensitive ([#8246](https://github.com/MetaMask/metamask-extension/pull/8246))
- Convert Connected Sites page to modal ([#8254](https://github.com/MetaMask/metamask-extension/pull/8254))
- Update token cell to show inline stale balance warning ([#8259](https://github.com/MetaMask/metamask-extension/pull/8259))
- Move asset list to home tab on small screens ([#8264](https://github.com/MetaMask/metamask-extension/pull/8264))
- Connected status indicator ([#8270](https://github.com/MetaMask/metamask-extension/pull/8270))
- Allow selecting multiple accounts during connect flow ([#8078](https://github.com/MetaMask/metamask-extension/pull/8078))
- Focus the notification popup if it's already open ([#8318](https://github.com/MetaMask/metamask-extension/pull/8318))
- Position notification relative to last focused window ([#8356](https://github.com/MetaMask/metamask-extension/pull/8356))
- Close notification UI if no unapproved confirmations ([#8358](https://github.com/MetaMask/metamask-extension/pull/8358))
- Add popup explaining connection indicator to existing users ([#8293](https://github.com/MetaMask/metamask-extension/pull/8293))
- Correctly detect changes to background state ([#8435](https://github.com/MetaMask/metamask-extension/pull/8435))
- Disable import button for empty string/file ([#7912](https://github.com/MetaMask/metamask-extension/pull/7912))
- Make seed phrase import case-insensitive ([#8246](https://github.com/MetaMask/metamask-extension/pull/8246))
- Alert user upon switching to unconnected account ([#8312](https://github.com/MetaMask/metamask-extension/pull/8312))
- Only updating pending transactions upon block update ([#8445](https://github.com/MetaMask/metamask-extension/pull/8445))
- Fix firefox popup location ([#8467](https://github.com/MetaMask/metamask-extension/pull/8467))
- Prevent race condition where transaction value set in UI is overwritten ([#8486](https://github.com/MetaMask/metamask-extension/pull/8486))
- Fix default gas race condition ([#8490](https://github.com/MetaMask/metamask-extension/pull/8490))
- Update tokens after importing account ([#8491](https://github.com/MetaMask/metamask-extension/pull/8491))
- Enable disconnecting a single account or all accounts ([#8496](https://github.com/MetaMask/metamask-extension/pull/8496))
- Add support for IPFS address resolution ([#8502](https://github.com/MetaMask/metamask-extension/pull/8502))
- Add version dimension to metrics event ([#8419](https://github.com/MetaMask/metamask-extension/pull/8419))
- Open notification UI when eth_requestAccounts waits for unlock ([#8508](https://github.com/MetaMask/metamask-extension/pull/8508))
- Prevent negative values on gas inputs ([#8533](https://github.com/MetaMask/metamask-extension/pull/8533))
- Allow disabling alerts ([#8550](https://github.com/MetaMask/metamask-extension/pull/8550))
- Synchronously update transaction status ([#8563](https://github.com/MetaMask/metamask-extension/pull/8563))
- Improve Spanish localized message ([#8567](https://github.com/MetaMask/metamask-extension/pull/8567))
- Add switch to connected account alert ([#8532](https://github.com/MetaMask/metamask-extension/pull/8532))
- Stop polling for recent blocks on custom networks when UI is closed ([#8575](https://github.com/MetaMask/metamask-extension/pull/8575))
- Fix Matomo dimension IDs ([#8579](https://github.com/MetaMask/metamask-extension/pull/8579))
- Handle trailing / in block explorer URLs ([#8592](https://github.com/MetaMask/metamask-extension/pull/8592))
- Add Connected Accounts modal ([#8313](https://github.com/MetaMask/metamask-extension/pull/8313))
- Sticky position the tabs at the top ([#8609](https://github.com/MetaMask/metamask-extension/pull/8609))
- Define global `web3` as non-enumerable ([#8634](https://github.com/MetaMask/metamask-extension/pull/8634))
- warn user when sending from different account ([#8601](https://github.com/MetaMask/metamask-extension/pull/8601))
- Persist home tab state ([#8612](https://github.com/MetaMask/metamask-extension/pull/8612))
- Implement new transaction list design ([#8564](https://github.com/MetaMask/metamask-extension/pull/8564))
- Restrict the size of the permissions metadata store ([#8596](https://github.com/MetaMask/metamask-extension/pull/8596))
- Update account options menu design ([#8654](https://github.com/MetaMask/metamask-extension/pull/8654))
- Implement new fullscreen design ([#8657](https://github.com/MetaMask/metamask-extension/pull/8657))
- Show hostname in the disconnect confirmation ([#8663](https://github.com/MetaMask/metamask-extension/pull/8663))
- Make address display wider in Account Details ([#8665](https://github.com/MetaMask/metamask-extension/pull/8665))
- Fix token `decimal` type ([#8670](https://github.com/MetaMask/metamask-extension/pull/8670))
- Limit Dapp permissions to primary account ([#8653](https://github.com/MetaMask/metamask-extension/pull/8653))
- Manually connect via the full connect flow ([#8666](https://github.com/MetaMask/metamask-extension/pull/8666))
- Add metrics events for Wyre and CoinSwitch ([#8677](https://github.com/MetaMask/metamask-extension/pull/8677))
- Fix connect hardware styling ([#8680](https://github.com/MetaMask/metamask-extension/pull/8680))
- Fix create account form styling ([#8689](https://github.com/MetaMask/metamask-extension/pull/8689))
- Fix tab content disappearing during scrolling on macOS Firefox ([#8702](https://github.com/MetaMask/metamask-extension/pull/8702))
- Implement asset page ([#8696](https://github.com/MetaMask/metamask-extension/pull/8696))
- Add nonce to transaction details ([#8716](https://github.com/MetaMask/metamask-extension/pull/8716))
- Use URL origin instead of hostname for permission domains ([#8717](https://github.com/MetaMask/metamask-extension/pull/8717))
- Fix account menu entry for imported accounts ([#8747](https://github.com/MetaMask/metamask-extension/pull/8747))
- Permissions: Do not display HTTP/HTTPS URL schemes for unique hosts ([#8768](https://github.com/MetaMask/metamask-extension/pull/8768))
- Hide seed phrase during Account Import ([#8730](https://github.com/MetaMask/metamask-extension/pull/8730))
- Rename 'History' tab to 'Activity' ([#8785](https://github.com/MetaMask/metamask-extension/pull/8785))
- use UI button for add token functionality ([#8781](https://github.com/MetaMask/metamask-extension/pull/8781))
- Show fiat amounts inline on token transfers ([#8786](https://github.com/MetaMask/metamask-extension/pull/8786))
- Warn users to only add custom networks that they trust ([#8789](https://github.com/MetaMask/metamask-extension/pull/8789))
- Consolidate connected account alerts ([#8802](https://github.com/MetaMask/metamask-extension/pull/8802))
- Remove all user- and translator-facing instances of 'dapp' ([#8810](https://github.com/MetaMask/metamask-extension/pull/8810))
- Update method data when cached method data is empty ([#8836](https://github.com/MetaMask/metamask-extension/pull/8836))
- Improve error handling when signature requested without a keyholder address ([#8833](https://github.com/MetaMask/metamask-extension/pull/8833))
- Stop upper-casing exported private key ([#8850](https://github.com/MetaMask/metamask-extension/pull/8850))
- Include imported accounts in mobile sync ([#8631](https://github.com/MetaMask/metamask-extension/pull/8631))

## [7.7.9] - 2020-05-04
### Uncategorized
- Fix popup not opening ([#8446](https://github.com/MetaMask/metamask-extension/pull/8446))
- Skip adding history entry for empty txMeta diffs ([#8449](https://github.com/MetaMask/metamask-extension/pull/8449))
- Delete Dai/Sai migration notification ([#8447](https://github.com/MetaMask/metamask-extension/pull/8447))
- Update deposit copy for Wyre ([#8460](https://github.com/MetaMask/metamask-extension/pull/8460))
- Snapshot txMeta without cloning history ([#8458](https://github.com/MetaMask/metamask-extension/pull/8458))
- Fix method registry initialization ([#8459](https://github.com/MetaMask/metamask-extension/pull/8459))
- Add Dai/Sai to currency display ([#8455](https://github.com/MetaMask/metamask-extension/pull/8455))
- Prevent network switch upon close of network timeout overlay ([#8461](https://github.com/MetaMask/metamask-extension/pull/8461))
- Add INR currency option ([#8457](https://github.com/MetaMask/metamask-extension/pull/8457))
- Fix display of Kovan and Rinkeby chain IDs ([#8462](https://github.com/MetaMask/metamask-extension/pull/8462))
- Use ethereum-ens-network-map for network support ([#8465](https://github.com/MetaMask/metamask-extension/pull/8465))
- Update deprecated Etherscam link ([#8463](https://github.com/MetaMask/metamask-extension/pull/8463))
- Only update pending transactions upon block update ([#8474](https://github.com/MetaMask/metamask-extension/pull/8474))
- Update eth-contract-metadata ([#8476](https://github.com/MetaMask/metamask-extension/pull/8476))
- Fix Tohen Typo ([#8509](https://github.com/MetaMask/metamask-extension/pull/8509))

## [7.7.8] - 2020-03-13
### Uncategorized
- Handle and set gas estimation when max mode is clicked ([#8176](https://github.com/MetaMask/metamask-extension/pull/8176))
- Use specified gas limit when speeding up a transaction ([#8178](https://github.com/MetaMask/metamask-extension/pull/8178))

## [7.7.7] - 2020-03-04
### Uncategorized
- Remove invalid Ledger accounts ([#8162](https://github.com/MetaMask/metamask-extension/pull/8162))
- Fix account index check ([#8163](https://github.com/MetaMask/metamask-extension/pull/8163))

## [7.7.6] - 2020-03-03
### Uncategorized
- Prevent signing from incorrect Ledger account ([#8154](https://github.com/MetaMask/metamask-extension/pull/8154))

## [7.7.5] - 2020-02-18
### Uncategorized
- Inline the source text not the binary encoding for inpage script ([#8053](https://github.com/MetaMask/metamask-extension/pull/8053))
- Add warning to watchAsset API when editing a known token ([#8049](https://github.com/MetaMask/metamask-extension/pull/8049))
- Update Wyre ETH purchase url ([#8051](https://github.com/MetaMask/metamask-extension/pull/8051))
- Attempt ENS resolution on any valid domain name ([#8059](https://github.com/MetaMask/metamask-extension/pull/8059))

## [7.7.4] - 2020-01-31
### Uncategorized
- Update data on Approve screen after updating custom spend limit ([#7918](https://github.com/MetaMask/metamask-extension/pull/7918))
- Allow editing max spend limit ([#7919](https://github.com/MetaMask/metamask-extension/pull/7919))
- Validate custom spend limit ([#7920](https://github.com/MetaMask/metamask-extension/pull/7920))
- Only resolve ENS on mainnet ([#7944](https://github.com/MetaMask/metamask-extension/pull/7944))
- Update ENS registry addresses ([#7954](https://github.com/MetaMask/metamask-extension/pull/7954))

## [7.7.3] - 2020-01-27
### Uncategorized
- Update GABA dependency version ([#7894](https://github.com/MetaMask/metamask-extension/pull/7894))
- Use eth-contract-metadata@1.12.1 ([#7901](https://github.com/MetaMask/metamask-extension/pull/7901))
- Fixing broken JSON import help link ([#7910](https://github.com/MetaMask/metamask-extension/pull/7910))

## [7.7.2] - 2020-01-13
### Uncategorized
- Fix gas estimate for tokens ([#7753](https://github.com/MetaMask/metamask-extension/pull/7753))
- Fix transaction order on transaction confirmation screen ([#7473](https://github.com/MetaMask/metamask-extension/pull/7473))

## [7.7.1] - 2019-12-09
### Uncategorized
- Fix text overlap when expanding transaction ([#7488](https://github.com/MetaMask/metamask-extension/pull/7488))
- Update gas when asset is changed on send screen ([#7491](https://github.com/MetaMask/metamask-extension/pull/7491))
- Remove unused onClick prop from Dropdown component ([#7500](https://github.com/MetaMask/metamask-extension/pull/7500))
- Fix chainId for non standard networks ([#7502](https://github.com/MetaMask/metamask-extension/pull/7502))
- Fixing hardware connect error display ([#7519](https://github.com/MetaMask/metamask-extension/pull/7519))
- Fix accessibility of first-time-flow terms checkboxes ([#7501](https://github.com/MetaMask/metamask-extension/pull/7501))
- Prevent Maker migration dismissal timeout state from being overwritten ([#7579](https://github.com/MetaMask/metamask-extension/pull/7579))
- Persist Maker migration dismissal timeout ([#7581](https://github.com/MetaMask/metamask-extension/pull/7581))
- Ensure transactions are shown in the order they are received ([#7484](https://github.com/MetaMask/metamask-extension/pull/7484))
- Process URL fragment for ens-ipfs redirects ([#7604](https://github.com/MetaMask/metamask-extension/pull/7604))
- Fix typo that resulted in degrated account menu performance ([#7628](https://github.com/MetaMask/metamask-extension/pull/7628))
- Use localized messages for NotificationModal buttons ([#7558](https://github.com/MetaMask/metamask-extension/pull/7558))

## [7.7.0] - 2019-12-03 [WITHDRAWN]
### Uncategorized
- Connect distinct accounts per site ([#7004](https://github.com/MetaMask/metamask-extension/pull/7004))
- Fixed link on root README.md ([#7480](https://github.com/MetaMask/metamask-extension/pull/7480))
- Update Wyre ETH purchase url ([#7482](https://github.com/MetaMask/metamask-extension/pull/7482))
- Ensure transactions are shown in the order they are received ([#7484](https://github.com/MetaMask/metamask-extension/pull/7484))
- Update gas when token is changed on the send screen ([#7491](https://github.com/MetaMask/metamask-extension/pull/7491))
- Fix accessibility of first-time-flow terms checkboxes ([#7501](https://github.com/MetaMask/metamask-extension/pull/7501))
- Fix chainId for non standard networks ([#7502](https://github.com/MetaMask/metamask-extension/pull/7502))
- Fix timing of DAI migration notifications after dismissal ([#7579](https://github.com/MetaMask/metamask-extension/pull/7579))
- Fixing hardware connect error display ([#7519](https://github.com/MetaMask/metamask-extension/pull/7519))
- Use localized messages for NotificationModal buttons ([#7558](https://github.com/MetaMask/metamask-extension/pull/7558))
- Fix text overlap when expanding transaction ([#7488](https://github.com/MetaMask/metamask-extension/pull/7488))

## [7.6.1] - 2019-11-19
### Uncategorized
- Add 'Remind Me Later' to the Maker notification ([#7475](https://github.com/MetaMask/metamask-extension/pull/7475))
- Add additional rpcUrl verification ([#7436](https://github.com/MetaMask/metamask-extension/pull/7436))
- Show transaction fee units on approve screen ([#7468](https://github.com/MetaMask/metamask-extension/pull/7468))

## [7.6.0] - 2019-11-18
### Uncategorized
- Add migration notification for users with non-zero Sai ([#7450](https://github.com/MetaMask/metamask-extension/pull/7450))
- Import styles for showing multiple notifications ([#7461](https://github.com/MetaMask/metamask-extension/pull/7461))
- Add button disabled when password is empty ([#7451](https://github.com/MetaMask/metamask-extension/pull/7451))

## [7.5.3] - 2019-11-15
### Uncategorized
- lock eth-contract-metadata ([#7412](https://github.com/MetaMask/metamask-extension/pull/7412))
- Add eslint import plugin to help detect unresolved paths ([#7416](https://github.com/MetaMask/metamask-extension/pull/7416))
- Ensure SignatureRequestOriginal 'beforeunload' handler is bound ([#7414](https://github.com/MetaMask/metamask-extension/pull/7414))
- Update badge colour ([#7430](https://github.com/MetaMask/metamask-extension/pull/7430))
- Utilize the full size of icon space ([#7408](https://github.com/MetaMask/metamask-extension/pull/7408))
- Add all icons to manifest ([#7431](https://github.com/MetaMask/metamask-extension/pull/7431))
- Ensure Etherscan result is valid before reading it ([#7426](https://github.com/MetaMask/metamask-extension/pull/7426))
- Update 512px icon ([#7434](https://github.com/MetaMask/metamask-extension/pull/7434))
- Fix sourcemaps for Sentry ([#7410](https://github.com/MetaMask/metamask-extension/pull/7410))
- Adds and end to end test for typed signature requests ([#7420](https://github.com/MetaMask/metamask-extension/pull/7420))
- Add metricsEvent to contextTypes ([#7439](https://github.com/MetaMask/metamask-extension/pull/7439))
- Added webRequest.RequestFilter to filter main_frame .eth requests ([#7419](https://github.com/MetaMask/metamask-extension/pull/7419))

## [7.5.2] - 2019-11-14
### Uncategorized
- Ensure SignatureRequestOriginal 'beforeunload' handler is bound ([#7414](https://github.com/MetaMask/metamask-extension/pull/7414))

## [7.5.1] - 2019-11-13
### Uncategorized
- Fix regression for signed types data screens ([#7402](https://github.com/MetaMask/metamask-extension/pull/7402))
- Update json-rpc-engine ([#7390](https://github.com/MetaMask/metamask-extension/pull/7390))
- Reject connection request on window close ([#7401](https://github.com/MetaMask/metamask-extension/pull/7401))

## [7.5.0] - 2019-11-12
### Uncategorized
- ignore known transactions on first broadcast and continue with normal flow ([#7328](https://github.com/MetaMask/metamask-extension/pull/7328))
- eth_getTransactionByHash will now check metamask's local history for pending transactions ([#7327](https://github.com/MetaMask/metamask-extension/pull/7327))
- Cleanup beforeunload handler after transaction is resolved ([#7333](https://github.com/MetaMask/metamask-extension/pull/7333))
- Add support for ZeroNet ([#7038](https://github.com/MetaMask/metamask-extension/pull/7038))
- Add web3 deprecation warning ([#7334](https://github.com/MetaMask/metamask-extension/pull/7334))
- Add Estimated time to pending tx ([#6924](https://github.com/MetaMask/metamask-extension/pull/6924))
- ENS Reverse Resolution support ([#7177](https://github.com/MetaMask/metamask-extension/pull/7177))
- New signature request v3 UI ([#6891](https://github.com/MetaMask/metamask-extension/pull/6891))
- fix width in first time flow button ([#7348](https://github.com/MetaMask/metamask-extension/pull/7348))
- Redesign approve screen ([#7271](https://github.com/MetaMask/metamask-extension/pull/7271))
- fix account menu width ([#7354](https://github.com/MetaMask/metamask-extension/pull/7354))
- Set default advanced tab gas limit ([#7379](https://github.com/MetaMask/metamask-extension/pull/7379))
- Fix advanced tab gas chart ([#7380](https://github.com/MetaMask/metamask-extension/pull/7380))
- Hide accounts dropdown scrollbars on Firefox ([#7374](https://github.com/MetaMask/metamask-extension/pull/7374))
- Update to gaba@1.8.0 ([#7357](https://github.com/MetaMask/metamask-extension/pull/7357))
- Add onbeforeunload and have it call onCancel ([#7335](https://github.com/MetaMask/metamask-extension/pull/7335))

## [7.4.0] - 2019-11-04
### Uncategorized
- Use `AdvancedGasInputs` in `AdvancedTabContent` ([#7186](https://github.com/MetaMask/metamask-extension/pull/7186))
- Move signTypedData signing out to keyrings ([#7304](https://github.com/MetaMask/metamask-extension/pull/7304))
- correct the zh-TW translation ([#7306](https://github.com/MetaMask/metamask-extension/pull/7306))
- Freeze Promise global on boot ([#7309](https://github.com/MetaMask/metamask-extension/pull/7309))
- Add "Retry" option for failed transactions ([#7296](https://github.com/MetaMask/metamask-extension/pull/7296))
- Fix transaction list item status spacing issue ([#7319](https://github.com/MetaMask/metamask-extension/pull/7319))
- Add hostname and extensionId to site metadata ([#7218](https://github.com/MetaMask/metamask-extension/pull/7218))
- Fix contact deletion ([#7324](https://github.com/MetaMask/metamask-extension/pull/7324))
- Fix edit contact details ([#7326](https://github.com/MetaMask/metamask-extension/pull/7326))
- Update eth-json-rpc-filters to fix memory leak ([#7325](https://github.com/MetaMask/metamask-extension/pull/7325))
- Add web3 deprecation warning ([#7334](https://github.com/MetaMask/metamask-extension/pull/7334))

## [7.3.1] - 2019-10-22
### Uncategorized
- Turn off full screen vs popup a/b test ([#7298](https://github.com/MetaMask/metamask-extension/pull/7298))

## [7.3.0] - 2019-10-21
### Uncategorized
- 3box integration ([#6972](https://github.com/MetaMask/metamask-extension/pull/6972))
- Add fixes for German translations ([#7168](https://github.com/MetaMask/metamask-extension/pull/7168))
- Remove the disk store ([#7170](https://github.com/MetaMask/metamask-extension/pull/7170))
- Performance: Delivery optimized images ([#7176](https://github.com/MetaMask/metamask-extension/pull/7176))
- add goerli to incoming tx ([#7189](https://github.com/MetaMask/metamask-extension/pull/7189))
- Remove unused locale messages ([#7190](https://github.com/MetaMask/metamask-extension/pull/7190))
- Fix RPC error messages ([#7173](https://github.com/MetaMask/metamask-extension/pull/7173))
- address book entries by chainId ([#7205](https://github.com/MetaMask/metamask-extension/pull/7205))
- obs-store/local-store should upgrade webextension error to real error ([#7207](https://github.com/MetaMask/metamask-extension/pull/7207))
- Add a/b test for full screen transaction confirmations ([#7162](https://github.com/MetaMask/metamask-extension/pull/7162))
- Add advanced setting to enable editing nonce on confirmation screens ([#7089](https://github.com/MetaMask/metamask-extension/pull/7089))
- Update ETH logo, update deposit Ether logo height and width ([#7239](https://github.com/MetaMask/metamask-extension/pull/7239))
- Use translated string for state log ([#7255](https://github.com/MetaMask/metamask-extension/pull/7255))
- fix issue of xyz ens not resolving ([#7266](https://github.com/MetaMask/metamask-extension/pull/7266))
- Prevent Logout Timer that's longer than a week. ([#7253](https://github.com/MetaMask/metamask-extension/pull/7253))
- Lessen the length of ENS validation to 3 ([#7285](https://github.com/MetaMask/metamask-extension/pull/7285))
- Fix phishing detect script ([#7287](https://github.com/MetaMask/metamask-extension/pull/7287))

## [7.2.3] - 2019-10-08
### Uncategorized
- Fix gas limit when sending tx without data to a contract ([#7252](https://github.com/MetaMask/metamask-extension/pull/7252))
- Do not transate on seed phrases ([#7260](https://github.com/MetaMask/metamask-extension/pull/7260))
- Ensure correct tx category when sending to contracts without tx data ([#7252](https://github.com/MetaMask/metamask-extension/pull/7252))

## [7.2.2] - 2019-09-25
### Uncategorized
- Update minimum Firefox verison to 56.0 ([#7213](https://github.com/MetaMask/metamask-extension/pull/7213))

## [7.2.1] - 2019-09-17
### Uncategorized
- Add `appName` message to each locale ([#7180](https://github.com/MetaMask/metamask-extension/pull/7180))

## [7.2.0] - 2019-09-17
### Uncategorized
- Update localization from Transifex Brave ([#7099](https://github.com/MetaMask/metamask-extension/pull/7099))
- Fix validation of empty block explorer url's in custom network form ([#7137](https://github.com/MetaMask/metamask-extension/pull/7137))
- Support for eth_signTypedData_v4 ([#7128](https://github.com/MetaMask/metamask-extension/pull/7128))
- Adds `chaindIdChanged` event to the ethereum provider ([#7110](https://github.com/MetaMask/metamask-extension/pull/7110))
- Improve browser performance issues caused by missing locale errors ([#7091](https://github.com/MetaMask/metamask-extension/pull/7091))
- Prevent ineffectual speed ups of pending transactions that don't have the lowest nonce ([#7085](https://github.com/MetaMask/metamask-extension/pull/7085))
- Set minimum Firefox version to v56.2 to support Waterfox ([#7156](https://github.com/MetaMask/metamask-extension/pull/7156))
- Add polyfill for AbortController ([#7157](https://github.com/MetaMask/metamask-extension/pull/7157))
- Replace `undefined` selectedAddress with `null` ([#7161](https://github.com/MetaMask/metamask-extension/pull/7161))
- Fix recipient field of approve screen ([#7171](https://github.com/MetaMask/metamask-extension/pull/7171))

## [7.1.1] - 2019-09-03
### Uncategorized
- Remove blockscale, replace with ethgasstation ([#7059](https://github.com/MetaMask/metamask-extension/pull/7059))
- Remove Babel 6 from internal dependencies ([#7037](https://github.com/MetaMask/metamask-extension/pull/7037))
- Allow dismissing privacy mode notification from popup ([#7093](https://github.com/MetaMask/metamask-extension/pull/7093))
- Add breadcrumb spacing on Contacts page ([#7087](https://github.com/MetaMask/metamask-extension/pull/7087))
- Fix confirm token transaction amount display ([#7081](https://github.com/MetaMask/metamask-extension/pull/7081))
- Fix BigNumber conversion error ([#7088](https://github.com/MetaMask/metamask-extension/pull/7088))
- Right-to-left CSS ([#7072](https://github.com/MetaMask/metamask-extension/pull/7072))
- Persian translation ([#6878](https://github.com/MetaMask/metamask-extension/pull/6878))
- Added missed phrases to RU locale ([#7012](https://github.com/MetaMask/metamask-extension/pull/7012))

## [7.1.0] - 2019-08-26
### Uncategorized
- Filter non-ERC-20 assets during mobile sync ([#7035](https://github.com/MetaMask/metamask-extension/pull/7035))
- Using translated string for end of flow messaging ([#7021](https://github.com/MetaMask/metamask-extension/pull/7021))
- Rename Contacts List settings tab to Contacts ([#7018](https://github.com/MetaMask/metamask-extension/pull/7018))
- Connections settings tab ([#7013](https://github.com/MetaMask/metamask-extension/pull/7013))
- Fetch & display received transactions ([#6996](https://github.com/MetaMask/metamask-extension/pull/6996))
- Remove reload from Share Address button ([#6991](https://github.com/MetaMask/metamask-extension/pull/6991))
- Address book fixes ([#6978](https://github.com/MetaMask/metamask-extension/pull/6978))
- Show recipient alias in confirm header if exists ([#6944](https://github.com/MetaMask/metamask-extension/pull/6944))
- Add support for eth_signTypedData_v4 ([#6930](https://github.com/MetaMask/metamask-extension/pull/6930))
- Update Italian translation ([#7046](https://github.com/MetaMask/metamask-extension/pull/7046))
- Add warning about reload on network change ([#7047](https://github.com/MetaMask/metamask-extension/pull/7047))

## [7.0.1] - 2019-08-08
### Uncategorized
- Ensure seed phrase backup notification only shows up for new users ([#6975](https://github.com/MetaMask/metamask-extension/pull/6975))

## [7.0.0] - 2019-08-07
### Uncategorized
- Capitalized speed up label to match rest of UI ([#6828](https://github.com/MetaMask/metamask-extension/pull/6828))
- Allows skipping of seed phrase challenge during onboarding, and completing it at a later time ([#6874](https://github.com/MetaMask/metamask-extension/pull/6928))
- Prevent opening of asset dropdown if no tokens in account ([#6900](https://github.com/MetaMask/metamask-extension/pull/6900))
- Set privacy mode as default ([#6904](https://github.com/MetaMask/metamask-extension/pull/6904))
- Adds Address Book feature ([#6914](https://github.com/MetaMask/metamask-extension/pull/6914))
- Disable Copy Tx ID and block explorer link for transactions without hash ([#6928](https://github.com/MetaMask/metamask-extension/pull/6928))
- Fix mobile sync ([#6967](https://github.com/MetaMask/metamask-extension/pull/6967))

## [6.7.3] - 2019-07-19
### Uncategorized
- Fix bug with resubmitting unsigned transactions. ([#6888](https://github.com/MetaMask/metamask-extension/pull/6888))

## [6.7.2] - 2019-07-03
### Uncategorized
- Normalize and Validate txParams in TransactionStateManager.addTx too ([#6713](https://github.com/MetaMask/metamask-extension/pull/6713))
- Update to Node.js v10 ([#6759](https://github.com/MetaMask/metamask-extension/pull/6759))
- Fixes #6694 ([#6694](https://github.com/MetaMask/metamask-extension/pull/6694))
- Add tests for ImportWithSeedPhrase#parseSeedPhrase ([#6743](https://github.com/MetaMask/metamask-extension/pull/6743))
- Fixes #6740 ([#6740](https://github.com/MetaMask/metamask-extension/pull/6740))
- Fixes #6741 ([#6741](https://github.com/MetaMask/metamask-extension/pull/6741))
- Fixes #6760, correct PropTypes for nextRoute ([#6761](https://github.com/MetaMask/metamask-extension/pull/6761))
- Use inline source maps in development ([#6754](https://github.com/MetaMask/metamask-extension/pull/6754))
- Document hotfix protocol ([#6589](https://github.com/MetaMask/metamask-extension/pull/6589))
- Add codeowner for package-lock-old.json package-lock.json package.json packagelock-old.json files ([#6738](https://github.com/MetaMask/metamask-extension/pull/6738))
- Add loading view to notification.html ([#6648](https://github.com/MetaMask/metamask-extension/pull/6648))
- Add brave as a platform type for MetaMask ([#6731](https://github.com/MetaMask/metamask-extension/pull/6731))

## [6.7.1] - 2019-07-28
### Uncategorized
- Fix display of token amount on confirm transaction screen ([#6764](https://github.com/MetaMask/metamask-extension/pull/6764))

## [6.7.0] - 2019-07-26
### Uncategorized
- Improve contract method data fetching ([#6623](https://github.com/MetaMask/metamask-extension/pull/6623))
- Adds 4byte registry fallback to getMethodData() ([#6551](https://github.com/MetaMask/metamask-extension/pull/6551))
- Add delete to custom RPC form ([#6718](https://github.com/MetaMask/metamask-extension/pull/6718))
- Fix styles on 'import account' page, update help link ([#6700](https://github.com/MetaMask/metamask-extension/pull/6700))
- Wrap smaller custom block explorer url text ([#6714](https://github.com/MetaMask/metamask-extension/pull/6714))
- Pin ethereumjs-tx ([#6706](https://github.com/MetaMask/metamask-extension/pull/6706))
- Fix styles on 'import account' page, update help link ([#6700](https://github.com/MetaMask/metamask-extension/pull/6700))
- Started adding visual documentation of MetaMask plugin components with the account menu component first ([#6775](https://github.com/MetaMask/metamask-extension/pull/6775))

## [6.6.2] - 2019-07-17
### Uncategorized
- Update dependencies, re-enable npm audit CI job ([#6690](https://github.com/MetaMask/metamask-extension/pull/6690))
- Fix styles on 'import account' page, update help link ([#6700](https://github.com/MetaMask/metamask-extension/pull/6700))

## [6.6.1] - 2019-06-06
### Uncategorized
- Revert "Improve ENS Address Input" to fix bugs on input field on non-main networks. ([#6691](https://github.com/MetaMask/metamask-extension/pull/6691))

## [6.6.0] - 2019-06-04
### Uncategorized
- Enable Ledger hardware wallet support on Firefox ([#6659](https://github.com/MetaMask/metamask-extension/pull/6659))
- bugfix: reject enable promise on user rejection ([#6671](https://github.com/MetaMask/metamask-extension/pull/6671))
- Ensures that transactions cannot be confirmed if gas limit is below 21000. ([#6625](https://github.com/MetaMask/metamask-extension/pull/6625))
- Fix grammatical error in i18n endOfFlowMessage6 ([#6633](https://github.com/MetaMask/metamask-extension/pull/6633))

## [6.5.3] - 2019-05-16
### Uncategorized
- bugfix: show extension window if locked regardless of approval ([#6619](https://github.com/MetaMask/metamask-extension/pull/6619))
- Transactions/pending - check nonce against the network and mark as dropped if not included in a block ([#6388](https://github.com/MetaMask/metamask-extension/pull/6388))
- Improve ENS Address Input ([#6606](https://github.com/MetaMask/metamask-extension/pull/6606))
- Adds e2e test for removing imported accounts. ([#6615](https://github.com/MetaMask/metamask-extension/pull/6615))

## [6.5.2] - 2019-05-15
### Uncategorized
- Hardware Wallet Fix ([#6613](https://github.com/MetaMask/metamask-extension/pull/6613))

## [6.5.1] - 2019-05-14
### Uncategorized
- Fix bug where approve method would show a warning. #6602
- Fix wording of autoLogoutTimeLimitDescription ([#6593](https://github.com/MetaMask/metamask-extension/pull/6593))

## [6.5.0] - 2019-05-13
### Uncategorized
- feature: integrate gaba/PhishingController ([#6568](https://github.com/MetaMask/metamask-extension/pull/6568))
- Redesign custom RPC form ([#6490](https://github.com/MetaMask/metamask-extension/pull/6490))
- Adds auto logout with customizable time frame ([#6558](https://github.com/MetaMask/metamask-extension/pull/6558))
- Fixes ability to send to token contract addresses ([#6578](https://github.com/MetaMask/metamask-extension/pull/6578))
- Adds drag and drop functionality to seed phrase entry. ([#6557](https://github.com/MetaMask/metamask-extension/pull/6557))
- Include token checksum address in prices lookup for token rates ([#6526](https://github.com/MetaMask/metamask-extension/pull/6526))
- Add subheader to all settings subviews ([#6502](https://github.com/MetaMask/metamask-extension/pull/6502))
- Improve confirm screen loading performance by fixing home screen rendering bug ([#6501](https://github.com/MetaMask/metamask-extension/pull/6501))

## [6.4.1] - 2019-04-26
### Uncategorized
- Revert "Adds 4byte registry fallback to getMethodData()" to fix stalling bug. ([#6521](https://github.com/MetaMask/metamask-extension/pull/6521))

## [6.4.0] - 2019-04-18
### Uncategorized
- Move send to pages/ ([#6445](https://github.com/MetaMask/metamask-extension/pull/6445))
- update publishing.md with dev diagram ([#6470](https://github.com/MetaMask/metamask-extension/pull/6470))
- Update to eth-method-registry@1.2.0 ([#6403](https://github.com/MetaMask/metamask-extension/pull/6403))
- Fix switcher height when Custom RPC is selected or loading ([#6468](https://github.com/MetaMask/metamask-extension/pull/6468))
- feature: add Goerli support ([#6459](https://github.com/MetaMask/metamask-extension/pull/6459))
- Fixes #6321 & #6421 - Add Localhost 8545 for network dropdown names ([#6444](https://github.com/MetaMask/metamask-extension/pull/6444))
- Bump eth-contract-metadata ([#6454](https://github.com/MetaMask/metamask-extension/pull/6454))
- Remove unneeded array cloning in getSendToAccounts selector ([#6448](https://github.com/MetaMask/metamask-extension/pull/6448))
- repeated getSelectedAddress() func send.selectors.js removed ([#6056](https://github.com/MetaMask/metamask-extension/pull/6056))
- Added Chrome limited site access solution doc ([#6422](https://github.com/MetaMask/metamask-extension/pull/6422))
- feature: switch token pricing to CoinGecko API ([#6424](https://github.com/MetaMask/metamask-extension/pull/6424))
- Don't inject web3 on sharefile.com ([#6428](https://github.com/MetaMask/metamask-extension/pull/6428))
- Metrics updates ([#6417](https://github.com/MetaMask/metamask-extension/pull/6417))
- Fix links to MetamaskInpageProvider in porting_to_new_environment.md ([#6420](https://github.com/MetaMask/metamask-extension/pull/6420))
- Remove broken image walkthrough from metamaskbot comment ([#6362](https://github.com/MetaMask/metamask-extension/pull/6362))
- metamask-controller - use improved provider-as-middleware utility ([#6401](https://github.com/MetaMask/metamask-extension/pull/6401))
- remove user actions controller ([#6406](https://github.com/MetaMask/metamask-extension/pull/6406))
- doc - publishing - typo fix ([#6399](https://github.com/MetaMask/metamask-extension/pull/6399))
- pin eth-contract-metadata to last commit hash ([#6396](https://github.com/MetaMask/metamask-extension/pull/6396))
- Change coinbase to wyre ([#6397](https://github.com/MetaMask/metamask-extension/pull/6397))
- bump ledger and trezor keyring ([#6395](https://github.com/MetaMask/metamask-extension/pull/6395))
- Fix display of gas chart on Ethereum networks ([#6389](https://github.com/MetaMask/metamask-extension/pull/6389))
- Remove NoticeController ([#6382](https://github.com/MetaMask/metamask-extension/pull/6382))

## [6.3.2] - 2019-04-08
### Uncategorized
- Fix display of gas chart on ethereum networks ([#6389](https://github.com/MetaMask/metamask-extension/pull/6389))
- Fixes for signing methods for ledger and trezor devices ([#6395](https://github.com/MetaMask/metamask-extension/pull/6395))
- Fix Wyre link ([#6397](https://github.com/MetaMask/metamask-extension/pull/6397))

## [6.3.1] - 2019-03-29
### Uncategorized
- Open restore vault in full screen when clicked from popup ([#6353](https://github.com/MetaMask/metamask-extension/pull/6353))
- Prevents duplicates of account addresses from showing in send screen "To" dropdown ([#6372](https://github.com/MetaMask/metamask-extension/pull/6372))
- Ensures users are placed on correct confirm screens even when registry service fails ([#6374](https://github.com/MetaMask/metamask-extension/pull/6374))

## [6.3.0] - 2019-03-26
### Uncategorized
- Gas chart hidden on custom networks ([#6300](https://github.com/MetaMask/metamask-extension/pull/6300))
- Fix gas fee in the submitted step of the transaction details activity log ([#6301](https://github.com/MetaMask/metamask-extension/pull/6301))
- Replaces the coinbase link in the deposit modal with one for wyre ([#6302](https://github.com/MetaMask/metamask-extension/pull/6302))
- Centre the notification in the current window ([#6307](https://github.com/MetaMask/metamask-extension/pull/6307))
- Fixes popups not showing when screen size is odd ([#6312](https://github.com/MetaMask/metamask-extension/pull/6312))
- Fix oversized loading overlay on gas customization modal. ([#6326](https://github.com/MetaMask/metamask-extension/pull/6326))
- Stop reloading dapps on network change allowing dapps to decide if it should refresh or not ([#6330](https://github.com/MetaMask/metamask-extension/pull/6330))
- Enable mobile sync ([#6332](https://github.com/MetaMask/metamask-extension/pull/6332))
- Redesign of the settings screen ([#6333](https://github.com/MetaMask/metamask-extension/pull/6333))
- Cancel transactions and signature requests on the closing of notification windows ([#6340](https://github.com/MetaMask/metamask-extension/pull/6340))
- Disable transaction "Cancel" button when balance is insufficient ([#6341](https://github.com/MetaMask/metamask-extension/pull/6341))
- Enable privacy mode by default for first time users ([#6347](https://github.com/MetaMask/metamask-extension/pull/6347))

## [6.2.2] - 2019-03-12
### Uncategorized
- Centre all notification popups ([#6271](https://github.com/MetaMask/metamask-extension/pull/6271))
- Improve Korean translations ([#6268](https://github.com/MetaMask/metamask-extension/pull/6268))
- Nonmultiple notifications for batch txs ([#6279](https://github.com/MetaMask/metamask-extension/pull/6279))
- No longer check network when validating checksum addresses ([#6280](https://github.com/MetaMask/metamask-extension/pull/6280))

## [6.2.1] - 2019-03-11

## [6.2.0] - 2019-03-05
### Uncategorized
- Improves design and UX of onboarding flow ([#6192](https://github.com/MetaMask/metamask-extension/pull/6192))
- Fixes gas estimation when sending to contracts ([#6195](https://github.com/MetaMask/metamask-extension/pull/6195))
- Fixes display of notification windows when metamask is active in a tab ([#6223](https://github.com/MetaMask/metamask-extension/pull/6223))
- Adds MetaMetrics usage analytics system ([#6171](https://github.com/MetaMask/metamask-extension/pull/6171))

## [6.1.0] - 2019-02-20
### Uncategorized
- Change "Token Address" to "Token Contract Address" ([#6182](https://github.com/MetaMask/metamask-extension/pull/6182))
- Fixes #6176 ([#6177](https://github.com/MetaMask/metamask-extension/pull/6177))
- Add Copy Tx ID button to transaction-list-item-details ([#6146](https://github.com/MetaMask/metamask-extension/pull/6146))
- Checksum address before slicing it for the confirm screen ([#6133](https://github.com/MetaMask/metamask-extension/pull/6133))
- Add button to force edit token symbol when adding custom token ([#6147](https://github.com/MetaMask/metamask-extension/pull/6147))
- Fix incorrectly showing checksums on non-ETH blockchains ([#6124](https://github.com/MetaMask/metamask-extension/pull/6124): recent-blocks - dont listen for block when on infura providers -[#5973] (https://github.com/MetaMask/metamask-extension/pull/5973))

## [6.0.1] - 2019-02-12
### Uncategorized
- Fix advanced gas controls on the confirm screen ([#6139](https://github.com/MetaMask/metamask-extension/pull/6139))
- Trim whitespace from seed phrase during import ([#6134](https://github.com/MetaMask/metamask-extension/pull/6134))
- Update Italian translation ([#6119](https://github.com/MetaMask/metamask-extension/pull/6119))
- Improved Traditional Chinese translation ([#6125](https://github.com/MetaMask/metamask-extension/pull/6125))

## [6.0.0] - 2019-02-11
### Uncategorized
- Migrate all users to the new UI ([#6082](https://github.com/MetaMask/metamask-extension/pull/6082))
- Add setting for inputting gas price with a text field for advanced users. ([#6114](https://github.com/MetaMask/metamask-extension/pull/6114))
- Add Swap feature to CurrencyInput ([#6091](https://github.com/MetaMask/metamask-extension/pull/6091))
- Change gas labels to Slow/Average/Fast ([#6090](https://github.com/MetaMask/metamask-extension/pull/6090))
- Extract advanced gas input controls to their own component ([#6112](https://github.com/MetaMask/metamask-extension/pull/6112))
- Update design of phishing warning screen ([#5929](https://github.com/MetaMask/metamask-extension/pull/5929))
- Add class to sign footer button ([#6120](https://github.com/MetaMask/metamask-extension/pull/6120))
- Fix locale codes contains underscore never being preferred ([#6116](https://github.com/MetaMask/metamask-extension/pull/6116))

## [5.3.5] - 2019-02-04
### Uncategorized
- Privacy mode fixes ([#6084](https://github.com/MetaMask/metamask-extension/pull/6087))

## [5.3.4] - 2019-01-31
### Uncategorized
- fix - migration 30 ([#6079](https://github.com/MetaMask/metamask-extension/pull/6079))

## [5.3.3] - 2019-01-30
### Uncategorized
- Update privacy notice ([#6006](https://github.com/MetaMask/metamask-extension/pull/6006))
- Improved Spanish translations ([#6072](https://github.com/MetaMask/metamask-extension/pull/6072))
- Add visual indicator when displaying a cached balance. ([#5854](https://github.com/MetaMask/metamask-extension/pull/5854))
- Fix bug that interferred with using multiple custom networks. ([#6044](https://github.com/MetaMask/metamask-extension/pull/6044))

## [5.3.2] - 2019-01-28
### Uncategorized
- Order shapeshift transactions by time within the transactions list ([#6021](https://github.com/MetaMask/metamask-extension/pull/6021))
- Add and use cached method signatures to reduce provider requests ([#6052](https://github.com/MetaMask/metamask-extension/pull/6052))
- Refactor BalanceComponent to jsx ([#6048](https://github.com/MetaMask/metamask-extension/pull/6048))
- Prevent invalid chainIds when adding custom rpcs ([#6026](https://github.com/MetaMask/metamask-extension/pull/6026))
- Fix grammar error in Current Conversion ([#6029](https://github.com/MetaMask/metamask-extension/pull/6029))
- Disable account dropdown on signing screens ([#6024](https://github.com/MetaMask/metamask-extension/pull/6024))

## [5.3.1] - 2019-01-16
### Uncategorized
- Update Slovenian translation ([#5966](https://github.com/MetaMask/metamask-extension/pull/5966))
- Set auto conversion off for token/eth conversion ([#6005](https://github.com/MetaMask/metamask-extension/pull/6005))
- Fix confirm screen for sending ether tx with hex data ([#6008](https://github.com/MetaMask/metamask-extension/pull/6008))
- Refine app description ([#5999](https://github.com/MetaMask/metamask-extension/pull/5999))
- Harden Drizzle test runner script ([#5997](https://github.com/MetaMask/metamask-extension/pull/5997))
- Fix bug where MetaMask user calls non-standard ERC20 methods such as `mint`, `tokenData` will be `undefined` and an uncaught error will break the UI ([#5995](https://github.com/MetaMask/metamask-extension/pull/5995))
- Fixed a word in french translation ([#5970](https://github.com/MetaMask/metamask-extension/pull/5970))
- Fix Component#componentDidUpdate usage ([#5977](https://github.com/MetaMask/metamask-extension/pull/5977))
- Add scrolling button to account list ([#5992](https://github.com/MetaMask/metamask-extension/pull/5992))
- fix typo in phishing.html title ([#5989](https://github.com/MetaMask/metamask-extension/pull/5989))

## [5.3.0] - 2019-01-02
### Uncategorized
- Fix etherscan links on notifications ([#5978](https://github.com/MetaMask/metamask-extension/pull/5978))
- Fix drizzle tests ([#5980](https://github.com/MetaMask/metamask-extension/pull/5980))
- Prevent users from changing the From field in the send screen ([#5922](https://github.com/MetaMask/metamask-extension/pull/5922))
- Fix displayed time and date in the activity log. Remove vreme library, add luxon library. ([#5932](https://github.com/MetaMask/metamask-extension/pull/5932))
- transactions - throw an error if a transaction is generated while the network is loading ([#5924](https://github.com/MetaMask/metamask-extension/pull/5924))
- Add loading network screen ([#5893](https://github.com/MetaMask/metamask-extension/pull/5893))

## [5.2.2] - 2018-12-13
### Uncategorized
- Fix speed up button not showing for transactions with the lowest nonce ([#5925](https://github.com/MetaMask/metamask-extension/pull/5925))
- Update the Phishing Warning notice text to not use inline URLs ([#5923](https://github.com/MetaMask/metamask-extension/pull/5923))
- Fix some styling and translations in the gas customization modal ([#5919](https://github.com/MetaMask/metamask-extension/pull/5919))

## [5.2.1] - 2018-12-12
### Uncategorized
- bugfix: Ensures that advanced tab gas limit reflects tx gas limit ([#5917](https://github.com/MetaMask/metamask-extension/pull/5917))

## [5.2.0] - 2018-12-11
### Uncategorized
- Implements new gas customization features for sending, confirming and speeding up transactions ([#5704](https://github.com/MetaMask/metamask-extension/pull/5704))
- Groups transactions - speed up, cancel and original - by nonce in the transaction history list ([#5886](https://github.com/MetaMask/metamask-extension/pull/5886))
- bugfix: eliminates infinite spinner issues caused by switching quickly from a loading network that ultimately fails to resolve ([#5892](https://github.com/MetaMask/metamask-extension/pull/5892))
- bugfix: provider crashes caused caching issues in `json-rpc-engine`. ([#5902](https://github.com/MetaMask/metamask-extension/pull/5902))
  - Fixed in (https://github.com/MetaMask/json-rpc-engine/commit/6de511afbd03ccef4550ea43ff4010b7d7a84039)

## [5.1.0] - 2018-12-03
### Uncategorized
- Fixed an infinite spinner bug. ([#5860](https://github.com/MetaMask/metamask-extension/pull/5860))
- Update phishing warning copy ([#5875](https://github.com/MetaMask/metamask-extension/pull/5875))
- bugfix: normalize contract addresss when fetching exchange rates ([#5863](https://github.com/MetaMask/metamask-extension/pull/5863))
- Use selector for state.metamask.accounts in all cases. ([#5843](https://github.com/MetaMask/metamask-extension/pull/5843))

## [5.0.4] - 2018-11-29
### Uncategorized
- Formats 32-length byte strings passed to personal_sign as hex, rather than UTF8. ([#5878](https://github.com/MetaMask/metamask-extension/pull/5878))
- transactions/tx-gas-utils - add the acctual response for eth_getCode for NO_CONTRACT_ERROR's && add a debug object to simulationFailed ([#5840](https://github.com/MetaMask/metamask-extension/pull/5840))
- Soften accusatory language on phishing warning ([#5848](https://github.com/MetaMask/metamask-extension/pull/5848))
- Open full-screen UI on install ([#5835](https://github.com/MetaMask/metamask-extension/pull/5835))
- Locked versions for some dependencies to avoid possible issues from event-stream hack.
- Hide app-header when provider request pending ([#5831](https://github.com/MetaMask/metamask-extension/pull/5831))
- transactions - autofill gasPrice for retry attempts with either the recomened gasprice or a %10 bump ([#5786](https://github.com/MetaMask/metamask-extension/pull/5786))
- transactions - ensure err is defined when setting tx failed ([#5801](https://github.com/MetaMask/metamask-extension/pull/5801))
- Consider HW Wallets for signTypedMessage ([#5792](https://github.com/MetaMask/metamask-extension/pull/5792))
- Show disabled cursor in .network-disabled state ([#5829](https://github.com/MetaMask/metamask-extension/pull/5829))
- Trim whitespace from seed phrase during import ([#5827](https://github.com/MetaMask/metamask-extension/pull/5827))
- Show Connect Requests count in extension badge ([#5832](https://github.com/MetaMask/metamask-extension/pull/5832))
- Increase Token Symbol length to twelve ([#5816](https://github.com/MetaMask/metamask-extension/pull/5816))
- With the EIP 1102 updates, MetaMask _does_ now open itself when visiting some websites. Changed the wording here to clarify that MetaMask will not open itself to ask you for your seed phrase. ([#5819](https://github.com/MetaMask/metamask-extension/pull/5819))
- Bump Node version to 8.13 ([#5810](https://github.com/MetaMask/metamask-extension/pull/5810))
- Add Firefox and Brave support for Trezor ([#5797](https://github.com/MetaMask/metamask-extension/pull/5797))
- Fix usage of setState in ConfirmTransactionBase#handleSubmit ([#5799](https://github.com/MetaMask/metamask-extension/pull/5799))
- Show byte count for hex data on confirm screen ([#5798](https://github.com/MetaMask/metamask-extension/pull/5798))
- Default to the new UI for first time users ([#5334](https://github.com/MetaMask/metamask-extension/pull/5334))
- Bump eth-ledger-bridge-keyring ([#5791](https://github.com/MetaMask/metamask-extension/pull/5791))

## [5.0.3] - 2018-11-20
### Uncategorized
- Bundle some ui dependencies separately to limit the build size of ui.js ([#5547](https://github.com/MetaMask/metamask-extension/pull/5547))
- Resubmit approved transactions on new block, to fix bug where an error can stick transactions in this state.
- Fixed a bug that could cause an error when sending the max number of tokens.

## [5.0.2] - 2018-11-10
### Uncategorized
- Fixed bug that caused accounts to update slowly to sites. #5717
- Fixed bug that could lead to some sites crashing. #5709

## [5.0.1] - 2018-11-07
### Uncategorized
- Fixed bug in privacy mode that made it not work correctly on Firefox.

## [5.0.0] - 2018-11-06
### Uncategorized
- Implements EIP 1102 as a user-activated "Privacy Mode".

## [4.17.1] - 2018-11-03
### Uncategorized
- Revert chain ID lookup change which introduced a bug which caused problems when connecting to mainnet via Infura's RESTful API.

## [4.17.0] - 2018-11-01
### Uncategorized
- Fix bug where data lookups like balances would get stale data (stopped block-tracker bug)
- Transaction Details now show entry for onchain failure
- Localize language names in translation select list ([#5559](https://github.com/MetaMask/metamask-extension/pull/5559))
- Fix bug when eth.getCode() called with no contract ([#5283](https://github.com/MetaMask/metamask-extension/pull/5283))
- Feature: improve Hatian Creole translations ([#5563](https://github.com/MetaMask/metamask-extension/pull/5563#pullrequestreview-166769174))
- Feature: improve Slovenian translations
- Add support for alternate `wallet_watchAsset` rpc method name
- Attempt chain ID lookup via `eth_chainId` before `net_version`
- Fix account display width for large currency values

## [4.16.0] - 2018-10-17
### Uncategorized
- Feature: Add toggle for primary currency (eth/fiat)
- Feature: add tooltip for view etherscan tx
- Feature: add Polish translations
- Feature: improve Korean translations
- Feature: improve Italian translations
- Bug Fix: Fix bug with "pending" block reference
- Bug Fix: Force AccountTracker to update balances on network change
- Bug Fix: Fix document extension check when injecting web3
- Bug Fix: Fix some support links

## [4.15.0] - 2018-10-11
### Uncategorized
- A rollback release, equivalent to `v4.11.1` to be deployed in the case that `v4.14.0` is found to have bugs.

## [4.14.0] - 2018-10-11
### Uncategorized
- Update transaction statuses when switching networks.
- 100% coverage in French locale, fixed the procedure to verify proposed locale. ([#5470](https://github.com/MetaMask/metamask-extension/pull/5470))
- Added rudimentary support for the subscription API to support web3 1.0 and Truffle's Drizzle.
- Update Italian translation. ([#5502](https://github.com/MetaMask/metamask-extension/pull/5502))

## [4.13.0] - 2018-10-04
### Uncategorized
- A rollback release, equivalent to `v4.11.1` to be deployed in the case that `v4.12.0` is found to have bugs.

## [4.12.0] - 2018-09-27
### Uncategorized
- Reintroduces changes from 4.10.0

## [4.11.1] - 2018-09-25
### Uncategorized
- Adds Ledger support.

## [4.11.0] - 2018-09-24
### Uncategorized
- Identical to 4.9.3. A rollback version to give time to fix bugs in the 4.10.x branch.

## [4.10.0] - 2018-09-18
### Uncategorized
- Implement EIP-712: Sign typed data, but continue to support v1. ([#4803](https://github.com/MetaMask/metamask-extension/pull/4803))
- Restore multiple consecutive accounts with balances. ([#4898](https://github.com/MetaMask/metamask-extension/pull/4898))
- New BlockTracker and Json-Rpc-Engine based Provider. ([#4279](https://github.com/MetaMask/metamask-extension/pull/4279))
- Add Ledger hardware wallet support. ([#5050](https://github.com/MetaMask/metamask-extension/pull/5050))
- Refactor and Redesign Transaction List. ([#4919](https://github.com/MetaMask/metamask-extension/pull/4919))
- Add Transaction Details to the Transaction List view. ([#5182](https://github.com/MetaMask/metamask-extension/pull/5182))
- Clear old seed words when importing new seed words. ([#5229](https://github.com/MetaMask/metamask-extension/pull/5229))
- Improve click area for adjustment arrows buttons. ([#5264](https://github.com/MetaMask/metamask-extension/pull/5264))
- Add new metamask_watchAsset method. ([#4606](https://github.com/MetaMask/metamask-extension/pull/4606))
- Fix bug where Ropsten loading message is shown when connecting to Kovan. ([#5189](https://github.com/MetaMask/metamask-extension/pull/5189))
- Add mock EIP-1102 support ([#5256](https://github.com/MetaMask/metamask-extension/pull/5256))

## [4.9.3] - 2018-08-16
### Uncategorized
- QR code scan for recipient addresses. ([#4897](https://github.com/MetaMask/metamask-extension/pull/4897))
- Add a download seed phrase link. ([#4961](https://github.com/MetaMask/metamask-extension/pull/4961))
- Fix bug where gas was not updating properly. ([#5060](https://github.com/MetaMask/metamask-extension/pull/5060))

## [4.9.2] - 2018-08-10
### Uncategorized
- Fix bug in migration #28 ([#5020](https://github.com/MetaMask/metamask-extension/pull/5020))

## [4.9.1] - 2018-08-09
### Uncategorized
- Allow to have tokens per account and network. ([#4884](https://github.com/MetaMask/metamask-extension/pull/4884))
- Continue to use original signedTypedData. ([#4989](https://github.com/MetaMask/metamask-extension/pull/4989))
- Fix ENS resolution issues. ([#5010](https://github.com/MetaMask/metamask-extension/pull/5010))
- Show error while allowing confirmation of tx where simulation fails. ([#5000](https://github.com/MetaMask/metamask-extension/pull/5000))
- Shows retry button on dApp initialized transactions. ([#4995](https://github.com/MetaMask/metamask-extension/pull/4995))

## [4.9.0] - 2018-08-07
### Uncategorized
- Show retry button on the latest tx of the earliest nonce. ([#4926](https://github.com/MetaMask/metamask-extension/pull/4926))
- Suggest using the new user interface. ([#4888](https://github.com/MetaMask/metamask-extension/pull/4888))
- Prevent sending multiple transasctions on multiple confirm clicks. ([#4947](https://github.com/MetaMask/metamask-extension/pull/4947))
- Add new tokens auto detection. ([#4844](https://github.com/MetaMask/metamask-extension/pull/4844))
- Remove rejected transactions from transaction history. ([#4667](https://github.com/MetaMask/metamask-extension/pull/4667))
- Add Trezor Support. ([#4625](https://github.com/MetaMask/metamask-extension/pull/4625))
- Allow to remove accounts ([#4625](https://github.com/MetaMask/metamask-extension/pull/4625/commits/523cf9ad33d88719520ae5e7293329d133b64d4d))
- Add hex data input to send screen. ([#4814](https://github.com/MetaMask/metamask-extension/pull/4814))
- Redesign of the Confirm Transaction Screen. ([#4691](https://github.com/MetaMask/metamask-extension/pull/4691))
- Now shows notifications when transactions are completed. ([#4840](https://github.com/MetaMask/metamask-extension/pull/4840))
- Allow the use of HTTP prefix for custom rpc urls. ([#4855](https://github.com/MetaMask/metamask-extension/pull/4855))
- network.js: convert rpc protocol to lower case. ([#4855](https://github.com/MetaMask/metamask-extension/pull/4855))
- Restore multiple consecutive accounts with balances. ([#4898](https://github.com/MetaMask/metamask-extension/pull/4898))

## [4.8.0] - 2018-06-18
### Uncategorized
- Attempting to import an empty private key will now show a clear error. ([#4513](https://github.com/MetaMask/metamask-extension/pull/4513))
- Fix bug where metamask data would stop being written to disk after prolonged use. ([#4570](https://github.com/MetaMask/metamask-extension/pull/4570))
- Fix bug where account reset did not work with custom RPC providers. ([#4523](https://github.com/MetaMask/metamask-extension/pull/4523))
- Fix for Brave i18n getAcceptLanguages. ([#4524](https://github.com/MetaMask/metamask-extension/pull/4524))
- Fix bug where nonce mutex was never released. ([#4557](https://github.com/MetaMask/metamask-extension/pull/4557))
- Add phishing notice. ([#4566](https://github.com/MetaMask/metamask-extension/pull/4566))
- Allow Copying Token Addresses and link to Token on Etherscan. ([#4591](https://github.com/MetaMask/metamask-extension/pull/4591))

## [4.7.4] - 2018-06-05
### Uncategorized
- Add diagnostic reporting for users with multiple HD keyrings
- Throw explicit error when selected account is unset

## [4.7.3] - 2018-06-04
### Uncategorized
- Hide token now uses new modal
- Indicate the current selected account on the popup account view
- Reduce height of notice container in onboarding
- Fixes issue where old nicknames were kept around causing errors

## [4.7.2] - 2018-06-03
### Uncategorized
- Fix bug preventing users from logging in. Internally accounts and identities were out of sync.
- Fix support links to point to new support system (Zendesk)
- Fix bug in migration #26 ( moving account nicknames to preferences )
- Clears account nicknames on restore from seedPhrase

## [4.7.1] - 2018-06-01
### Uncategorized
- Fix bug where errors were not returned to Dapps.

## [4.7.0] - 2018-05-30
### Uncategorized
- Fix Brave support
- Adds error messages when passwords don't match in onboarding flow.
- Adds modal notification if a retry in the process of being confirmed is dropped.
- New unlock screen design.
- Design improvements to the add token screen.
- Fix inconsistencies in confirm screen between extension and browser window modes.
- Fix scrolling in deposit ether modal.
- Fix styling of app spinner.
- Font weight changed from 300 to 400.
- New reveal screen design.
- Styling improvements to labels in first time flow and signature request headers.
- Allow other extensions to make access our ethereum provider API ([#3997](https://github.com/MetaMask/metamask-extension/pull/3997))

## [4.6.1] - 2018-04-30
### Uncategorized
- Fix bug where sending a transaction resulted in an infinite spinner
- Allow transactions with a 0 gwei gas price
- Handle encoding errors in ERC20 symbol + digits
- Fix ShapeShift forms (new + old ui)
- Fix sourcemaps

## [4.6.0] - 2018-04-26
### Uncategorized
- Correctly format currency conversion for locally selected preferred currency.
- Improved performance of 3D fox logo.
- Fetch token prices based on contract address, not symbol
- Fix bug that prevents setting language locale in settings.
- Show checksum addresses throughout the UI
- Allow transactions with a 0 gwei gas price
- Made provider RPC errors contain useful messages

## [4.5.5] - 2018-04-06
### Uncategorized
- Graceful handling of unknown keys in txParams
- Fixes buggy handling of historical transactions with unknown keys in txParams
- Fix link for 'Learn More' in the Add Token Screen to open to a new tab.
- Fix Download State Logs button [#3791](https://github.com/MetaMask/metamask-extension/issues/3791)
- Enhanced migration error handling + reporting

## [4.5.4] - 2018-04-05 [WITHDRAWN]
### Uncategorized
- Graceful handling of unknown keys in txParams
- Fix link for 'Learn More' in the Add Token Screen to open to a new tab.
- Fix Download State Logs button [#3791](https://github.com/MetaMask/metamask-extension/issues/3791)
- Fix migration error reporting

## [4.5.3] - 2018-04-04
### Uncategorized
- Fix bug where checksum address are messing with balance issue [#3843](https://github.com/MetaMask/metamask-extension/issues/3843)
- new ui: fix the confirm transaction screen

## [4.5.2] - 2018-04-04
### Uncategorized
- Fix overly strict validation where transactions were rejected with hex encoded "chainId"

## [4.5.1] - 2018-04-03
### Uncategorized
- Fix default network (should be mainnet not Rinkeby)
- Fix Sentry automated error reporting endpoint

## [4.5.0] - 2018-04-02
### Uncategorized
- (beta ui) Internationalization: Select your preferred language in the settings screen
- Internationalization: various locale improvements
- Fix bug where the "Reset account" feature would not clear the network cache.
- Increase maximum gas limit, to allow very gas heavy transactions, since block gas limits have been stable.

## [4.4.0] - 2018-03-27
### Uncategorized
- Internationalization: Taiwanese, Thai, Slovenian
- Fixes bug where MetaMask would not open once its storage grew too large.
- Updates design of new-ui Add Token screen
- New-ui can send to ens addresses
- Update new-ui button styles
- Signed-type-data notification handles long messages
- Popup extension in new-ui uses new on-boarding designs
- Buy ether step of new-ui on-boarding uses new buy ether modal designs

## [4.3.0] - 2018-03-21
### Uncategorized
- (beta) Add internationalization support! Includes translations for 13 (!!) new languages: French, Spanish, Italian, German, Dutch, Portuguese, Japanese, Korean, Vietnamese, Mandarin, Hindi, Tagalog, and Russian! Select "Try Beta" in the menu to take them for a spin. Read more about the community effort [here](https://medium.com/gitcoin/metamask-internationalizes-via-gitcoin-bf1390c0301c)
- No longer uses nonces specified by the dapp
- Will now throw an error if the `to` field in txParams is not valid.
- Will strip null values from the `to` field.
- (beta) No longer shows token confirmation screen when performing a non-send
- (beta) Fixes bug where tx data was nullified when repricing a tx
- Fix flashing Login screen after logging in or restoring from seed phrase.
- Increase tap areas for menu buttons on mobile
- Change all fonts in new-ui onboarding to Roboto, size 400
- Add a welcome screen to new-ui onboarding flow
- Make new-ui create password screen responsive
- Hide network dropdown before account is initialized
- Fix bug that could prevent MetaMask from saving the latest vault.

## [4.2.0] - 2018-03-06
### Uncategorized
- Replace "Loose" wording to "Imported".
- Replace "Unlock" wording with "Log In".
- Add Imported Account disclaimer.
- Allow adding custom tokens to classic ui when balance is 0
- Allow editing of symbol and decimal info when adding custom token in new-ui
- NewUI shapeshift form can select all coins (not just BTC)
- Add most of Microsoft Edge support.

## [4.1.3] - 2018-03-02
### Uncategorized
- Ensure MetaMask's inpage provider is named MetamaskInpageProvider to keep some sites from breaking.
- Add retry transaction button back into classic ui.
- Add network dropdown styles to support long custom RPC urls

## [4.1.2] - 2018-02-28
### Uncategorized
- Actually includes all the fixes mentioned in 4.1.1 (sorry)

## [4.1.1] - 2018-02-28
### Uncategorized
- Fix "Add Token" screen referencing missing token logo urls
- Prevent user from switching network during signature request
- Fix misleading language "Contract Published" -> "Contract Deployment"
- Fix cancel button on "Buy Eth" screen
- Improve new-ui onboarding flow style

## [4.1.0] - 2018-02-27
### Uncategorized
- Report failed txs to Sentry with more specific message
- Fix internal feature flags being sometimes undefined
- Standardized license to MIT

## [4.0.0] - 2018-02-22
### Uncategorized
- Introduce new MetaMask user interface.

## [3.14.2] - 2018-02-27
### Uncategorized
- Fix bug where log subscriptions would break when switching network.
- Fix bug where storage values were cached across blocks.
- Add MetaMask light client [testing container](https://github.com/MetaMask/mesh-testing)

## [3.14.1] - 2018-02-01
### Uncategorized
- Further fix scrolling for Firefox.

## [3.14.0] - 2018-02-01
### Uncategorized
- Removed unneeded data from storage
- Add a "reset account" feature to Settings
- Add warning for importing some kinds of files.
- Scrollable Setting view for Firefox.

## [3.13.8] - 2018-01-29
### Uncategorized
- Fix provider for Kovan network.
- Bump limit for EventEmitter listeners before warning.
- Display Error when empty string is entered as a token address.

## [3.13.7] - 2018-01-22
### Uncategorized
- Add ability to bypass gas estimation loading indicator.
- Forward failed transactions to Sentry error reporting service
- Re-add changes from 3.13.5

## [3.13.6] - 2017-01-18
### Uncategorized
- Roll back changes to 3.13.4 to fix some issues with the new Infura REST provider.

## [3.13.5] - 2018-01-16
### Uncategorized
- Estimating gas limit for simple ether sends now faster & cheaper, by avoiding VM usage on recipients with no code.
- Add an extra px to address for Firefox clipping.
- Fix Firefox scrollbar.
- Open metamask popup for transaction confirmation before gas estimation finishes and add a loading screen over transaction confirmation.
- Fix bug that prevented eth_signTypedData from signing bytes.
- Further improve gas price estimation.

## [3.13.4] - 2018-01-09
### Uncategorized
- Remove recipient field if application initializes a tx with an empty string, or 0x, and tx data. Throw an error with the same condition, but without tx data.
- Improve gas price suggestion to be closer to the lowest that will be accepted.
- Throw an error if a application tries to submit a tx whose value is a decimal, and inform that it should be in wei.
- Fix bug that prevented updating custom token details.
- No longer mark long-pending transactions as failed, since we now have button to retry with higher gas.
- Fix rounding error when specifying an ether amount that has too much precision.
- Fix bug where incorrectly inputting seed phrase would prevent any future attempts from succeeding.

## [3.13.3] - 2017-12-14
### Uncategorized
- Show tokens that are held that have no balance.
- Reduce load on Infura by using a new block polling endpoint.

## [3.13.2] - 2017-12-09
### Uncategorized
- Reduce new block polling interval to 8000 ms, to ease server load.

## [3.13.1] - 2017-12-07
### Uncategorized
- Allow Dapps to specify a transaction nonce, allowing dapps to propose resubmit and force-cancel transactions.

## [3.13.0] - 2017-12-07
### Uncategorized
- Allow resubmitting transactions that are taking long to complete.

## [3.12.1] - 2017-11-29
### Uncategorized
- Fix bug where a user could be shown two different seed phrases.
- Detect when multiple web3 extensions are active, and provide useful error.
- Adds notice about seed phrase backup.

## [3.12.0] - 2017-10-26
### Uncategorized
- Add support for alternative ENS TLDs (Ethereum Name Service Top-Level Domains).
- Lower minimum gas price to 0.1 GWEI.
- Remove web3 injection message from production (thanks to @ChainsawBaby)
- Add additional debugging info to our state logs, specifically OS version and browser version.

## [3.11.2] - 2017-10-21
### Uncategorized
- Fix bug where reject button would sometimes not work.
- Fixed bug where sometimes MetaMask's connection to a page would be unreliable.

## [3.11.1] - 2017-10-20
### Uncategorized
- Fix bug where log filters were not populated correctly
- Fix bug where web3 API was sometimes injected after the page loaded.
- Fix bug where first account was sometimes not selected correctly after creating or restoring a vault.
- Fix bug where imported accounts could not use new eth_signTypedData method.

## [3.11.0] - 2017-10-11
### Uncategorized
- Add support for new eth_signTypedData method per EIP 712.
- Fix bug where some transactions would be shown as pending forever, even after successfully mined.
- Fix bug where a transaction might be shown as pending forever if another tx with the same nonce was mined.
- Fix link to support article on token addresses.

## [3.10.9] - 2017-10-05
### Uncategorized
- Only rebrodcast transactions for a day not a days worth of blocks
- Remove Slack link from info page, since it is a big phishing target.
- Stop computing balance based on pending transactions, to avoid edge case where users are unable to send transactions.

## [3.10.8] - 2017-09-30
### Uncategorized
- Fixed usage of new currency fetching API.

## [3.10.7] - 2017-09-29
### Uncategorized
- Fixed bug where sometimes the current account was not correctly set and exposed to web apps.
- Added AUD, HKD, SGD, IDR, PHP to currency conversion list

## [3.10.6] - 2017-09-27
### Uncategorized
- Fix bug where newly created accounts were not selected.
- Fix bug where selected account was not persisted between lockings.

## [3.10.5] - 2017-09-27
### Uncategorized
- Fix block gas limit estimation.

## [3.10.4] - 2017-09-27
### Uncategorized
- Fix bug that could mis-render token balances when very small. (Not actually included in 3.9.9)
- Fix memory leak warning.
- Fix bug where new event filters would not include historical events.

## [3.10.3] - 2017-09-21
### Uncategorized
- Fix bug where metamask-dapp connections are lost on rpc error
- Fix bug that would sometimes display transactions as failed that could be successfully mined.

## [3.10.2] - 2017-09-19
### Uncategorized
- rollback to 3.10.0 due to bug

## [3.10.1] - 2017-09-18
### Uncategorized
- Add ability to export private keys as a file.
- Add ability to export seed words as a file.
- Changed state logs to a file download than a clipboard copy.
- Add specific error for failed recipient address checksum.
- Fixed a long standing memory leak associated with filters installed by dapps
- Fix link to support center.
- Fixed tooltip icon locations to avoid overflow.
- Warn users when a dapp proposes a high gas limit (90% of blockGasLimit or higher
- Sort currencies by currency name (thanks to strelok1: https://github.com/strelok1).

## [3.10.0] - 2017-09-11
### Uncategorized
- Readded loose keyring label back into the account list.
- Remove cryptonator from chrome permissions.
- Add info on token contract addresses.
- Add validation preventing users from inputting their own addresses as token tracking addresses.
- Added button to reject all transactions (thanks to davidp94! https://github.com/davidp94)

## [3.9.13] - 2017-09-08
### Uncategorized
- Changed the way we initialize the inpage provider to fix a bug affecting some developers.

## [3.9.12] - 2017-09-06
### Uncategorized
- Fix bug that prevented Web3 1.0 compatibility
- Make eth_sign deprecation warning less noisy
- Add useful link to eth_sign deprecation warning.
- Fix bug with network version serialization over synchronous RPC
- Add MetaMask version to state logs.
- Add the total amount of tokens when multiple tokens are added under the token list
- Use HTTPS links for Etherscan.
- Update Support center link to new one with HTTPS.
- Make web3 deprecation notice more useful by linking to a descriptive article.

## [3.9.11] - 2017-08-24
### Uncategorized
- Fix nonce calculation bug that would sometimes generate very wrong nonces.
- Give up resubmitting a transaction after 3500 blocks.

## [3.9.10] - 2017-08-23
### Uncategorized
- Improve nonce calculation, to prevent bug where people are unable to send transactions reliably.
- Remove link to eth-tx-viz from identicons in tx history.

## [3.9.9] - 2017-08-18
### Uncategorized
- Fix bug where some transaction submission errors would show an empty screen.
- Fix bug that could mis-render token balances when very small.
- Fix formatting of eth_sign "Sign Message" view.
- Add deprecation warning to eth_sign "Sign Message" view.

## [3.9.8] - 2017-08-16
### Uncategorized
- Reenable token list.
- Remove default tokens.

## [3.9.7] - 2017-08-15
### Uncategorized
- hotfix - disable token list
- Added a deprecation warning for web3 https://github.com/ethereum/mist/releases/tag/v0.9.0

## [3.9.6] - 2017-08-10
### Uncategorized
- Replace account screen with an account drop-down menu.
- Replace account buttons with a new account-specific drop-down menu.

## [3.9.5] - 2017-08-04
### Uncategorized
- Improved phishing detection configuration update rate

## [3.9.4] - 2017-08-04
### Uncategorized
- Fixed bug that prevented transactions from being rejected.

## [3.9.3] - 2017-08-03
### Uncategorized
- Add support for EGO ujo token
- Continuously update blacklist for known phishing sites in background.
- Automatically detect suspicious URLs too similar to common phishing targets, and blacklist them.

## [3.9.2] - 2017-07-26
### Uncategorized
- Fix bugs that could sometimes result in failed transactions after switching networks.
- Include stack traces in txMeta's to better understand the life cycle of transactions
- Enhance blacklister functionality to include levenshtein logic. (credit to @sogoiii and @409H for their help!)

## [3.9.1] - 2017-07-19
### Uncategorized
- No longer automatically request 1 ropsten ether for the first account in a new vault.
- Now redirects from known malicious sites faster.
- Added a link to our new support page to the help screen.
- Fixed bug where a new transaction would be shown over the current transaction, creating a possible timing attack against user confirmation.
- Fixed bug in nonce tracker where an incorrect nonce would be calculated.
- Lowered minimum gas price to 1 Gwei.

## [3.9.0] - 2017-07-12
### Uncategorized
- Now detects and blocks known phishing sites.

## [3.8.6] - 2017-07-11
### Uncategorized
- Make transaction resubmission more resilient.
- No longer validate nonce client-side in retry loop.
- Fix bug where insufficient balance error was sometimes shown on successful transactions.

## [3.8.5] - 2017-07-08
### Uncategorized
- Fix transaction resubmit logic to fail slightly less eagerly.

## [3.8.4] - 2017-07-07
### Uncategorized
- Improve transaction resubmit logic to fail more eagerly when a user would expect it to.

## [3.8.3] - 2017-07-06
### Uncategorized
- Re-enable default token list.
- Add origin header to dapp-bound requests to allow providers to throttle sites.
- Fix bug that could sometimes resubmit a transaction that had been stalled due to low balance after balance was restored.

## [3.8.2] - 2017-07-03
### Uncategorized
- No longer show network loading indication on config screen, to allow selecting custom RPCs.
- Visually indicate that network spinner is a menu.
- Indicate what network is being searched for when disconnected.

## [3.8.1] - 2017-06-30
### Uncategorized
- Temporarily disabled loading popular tokens by default to improve performance.
- Remove SEND token button until a better token sending form can be built, due to some precision issues.
- Fix precision bug in token balances.
- Cache token symbol and precisions to reduce network load.
- Transpile some newer JavaScript, restores compatibility with some older browsers.

## [3.8.0] - 2017-06-28
### Uncategorized
- No longer stop rebroadcasting transactions
- Add list of popular tokens held to the account detail view.
- Add ability to add Tokens to token list.
- Add a warning to JSON file import.
- Add "send" link to token list, which goes to TokenFactory.
- Fix bug where slowly mined txs would sometimes be incorrectly marked as failed.
- Fix bug where badge count did not reflect personal_sign pending messages.
- Seed word confirmation wording is now scarier.
- Fix error for invalid seed words.
- Prevent users from submitting two duplicate transactions by disabling submit.
- Allow Dapps to specify gas price as hex string.
- Add button for copying state logs to clipboard.

## [3.7.8] - 2017-06-12
### Uncategorized
- Add an `ethereum:` prefix to the QR code address
- The default network on installation is now MainNet
- Fix currency API URL from cryptonator.
- Update gasLimit params with every new block seen.
- Fix ENS resolver symbol UI.

## [3.7.7] - 2017-06-08
### Uncategorized
- Fix bug where metamask would show old data after computer being asleep or disconnected from the internet.

## [3.7.6] - 2017-06-05
### Uncategorized
- Fix bug that prevented publishing contracts.

## [3.7.5] - 2017-06-05
### Uncategorized
- Prevent users from sending to the `0x0` address.
- Provide useful errors when entering bad characters in ENS name.
- Add ability to copy addresses from transaction confirmation view.

## [3.7.4] - 2017-06-02
### Uncategorized
- Fix bug with inflight cache that caused some block lookups to return bad values (affected OasisDex).
- Fixed bug with gas limit calculation that would sometimes create unsubmittable gas limits.

## [3.7.3] - 2017-06-01
### Uncategorized
- Rebuilt to fix cache clearing bug.

## [3.7.2] - 2017-05-31
### Uncategorized
- Now when switching networks sites that use web3 will reload
- Now when switching networks the extension does not restart
- Cleanup decimal bugs in our gas inputs.
- Fix bug where submit button was enabled for invalid gas inputs.
- Now enforce 95% of block's gasLimit to protect users.
- Removing provider-engine from the inpage provider. This fixes some error handling inconsistencies introduced in 3.7.0.
- Added "inflight cache", which prevents identical requests from clogging up the network, dramatically improving ENS performance.
- Fixed bug where filter subscriptions would sometimes fail to unsubscribe.
- Some contracts will now display logos instead of jazzicons.
- Some contracts will now have names displayed in the confirmation view.

## [3.7.0] - 2017-05-23
### Uncategorized
- Add Transaction Number (nonce) to transaction list.
- Label the pending tx icon with a tooltip.
- Fix bug where website filters would pile up and not deallocate when leaving a site.
- Continually resubmit pending txs for a period of time to ensure successful broadcast.
- ENS names will no longer resolve to their owner if no resolver is set. Resolvers must be explicitly set and configured.

## [3.6.5] - 2017-05-17
### Uncategorized
- Fix bug where edited gas parameters would not take effect.
- Trim currency list.
- Enable decimals in our gas prices.
- Fix reset button.
- Fix event filter bug introduced by newer versions of Geth.
- Fix bug where decimals in gas inputs could result in strange values.

## [3.6.4] - 2017-05-09
### Uncategorized
- Fix main-net ENS resolution.

## [3.6.3] - 2017-05-09
### Uncategorized
- Fix bug that could stop newer versions of Geth from working with MetaMask.

## [3.6.2] - 2017-05-08
### Uncategorized
- Input gas price in Gwei.
- Enforce Safe Gas Minimum recommended by EthGasStation.
- Fix bug where block-tracker could stop polling for new blocks.
- Reduce UI size by removing internal web3.
- Fix bug where gas parameters would not properly update on adjustment.

## [3.6.1] - 2017-05-07
### Uncategorized
- Made fox less nosy.
- Fix bug where error was reported in debugger console when Chrome opened a new window.

## [3.6.0] - 2017-04-27
### Uncategorized
- Add Rinkeby Test Network to our network list.

## [3.5.4] - 2017-04-25
### Uncategorized
- Fix occasional nonce tracking issue.
- Fix bug where some events would not be emitted by web3.
- Fix bug where an error would be thrown when composing signatures for networks with large ID values.

## [3.5.3] - 2017-04-24
### Uncategorized
- Popup new transactions in Firefox.
- Fix transition issue from account detail screen.
- Revise buy screen for more modularity.
- Fixed some other small bugs.

## [3.5.2] - 2017-03-28
### Uncategorized
- Fix bug where gas estimate totals were sometimes wrong.
- Add link to Kovan Test Faucet instructions on buy view.
- Inject web3 into loaded iFrames.

## [3.5.1] - 2017-03-27
### Uncategorized
- Fix edge case where users were unable to enable the notice button if notices were short enough to not require a scrollbar.

## [3.5.0] - 2017-03-27
### Uncategorized
- Add better error messages for when a transaction fails on approval
- Allow sending to ENS names in send form on Ropsten.
- Added an address book functionality that remembers the last 15 unique addresses sent to.
- Can now change network to custom RPC URL from lock screen.
- Removed support for old, lightwallet based vault. Users who have not opened app in over a month will need to recover with their seed phrase. This will allow Firefox support sooner.
- Fixed bug where spinner wouldn't disappear on incorrect password submission on seed word reveal.
- Polish the private key UI.
- Enforce minimum values for gas price and gas limit.
- Fix bug where total gas was sometimes not live-updated.
- Fix bug where editing gas value could have some abrupt behaviors (#1233)
- Add Kovan as an option on our network list.
- Fixed bug where transactions on other networks would disappear when submitting a transaction on another network.

## [3.4.0] - 2017-03-08
### Uncategorized
- Add two most recently used custom RPCs to network dropdown menu.
- Add personal_sign method support.
- Add personal_ecRecover method support.
- Add ability to customize gas and gasPrice on the transaction approval screen.
- Increase default gas buffer to 1.5x estimated gas value.

## [3.3.0] - 2017-02-20
### Uncategorized
- net_version has been made synchronous.
- Test suite for migrations expanded.
- Network now changeable from lock screen.
- Improve test coverage of eth.sign behavior, including a code example of verifying a signature.

## [3.2.2] - 2017-02-09
### Uncategorized
- Revert eth.sign behavior to the previous one with a big warning. We will be gradually implementing the new behavior over the coming time. https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign
- Improve test coverage of eth.sign behavior, including a code example of verifying a signature.

## [3.2.1] - 2017-02-09
### Uncategorized
- Revert back to old style message signing.
- Fixed some build errors that were causing a variety of bugs.

## [3.2.0] - 2017-02-08
### Uncategorized
- Add ability to import accounts in JSON file format (used by Mist, Geth, MyEtherWallet, and more!)
- Fix unapproved messages not being included in extension badge.
- Fix rendering bug where the Confirm transaction view would let you approve transactions when the account has insufficient balance.

## [3.1.2] - 2017-01-24
### Uncategorized
- Fix "New Account" default keychain

## [3.1.1] - 2017-01-20
### Uncategorized
- Fix HD wallet seed export

## [3.1.0] - 2017-01-18
### Uncategorized
- Add ability to import accounts by private key.
- Fixed bug that returned the wrong transaction hashes on private networks that had not implemented EIP 155 replay protection (like TestRPC).

## [3.0.1] - 2017-01-17
### Uncategorized
- Fixed bug that prevented eth.sign from working.
- Fix the displaying of transactions that have been submitted to the network in Transaction History

## [3.0.0] - 2017-01-16
### Uncategorized
- Fix seed word account generation (https://medium.com/metamask/metamask-3-migration-guide-914b79533cdd#.t4i1qmmsz).
- Fix Bug where you see an empty transaction flash by on the confirm transaction view.
- Create visible difference in transaction history between an approved but not yet included in a block transaction and a transaction who has been confirmed.
- Fix memory leak in RPC Cache
- Override RPC commands eth_syncing and web3_clientVersion
- Remove certain non-essential permissions from certain builds.
- Add a check for when a tx is included in a block.
- Fix bug where browser-solidity would sometimes warn of a contract creation error when there was none.
- Minor modifications to network display.
- Network now displays properly for pending transactions.
- Implement replay attack protections allowed by EIP 155.
- Fix bug where sometimes loading account data would fail by querying a future block.

## [2.14.1] - 2016-12-20
### Uncategorized
- Update Coinbase info. and increase the buy amount to $15
- Fixed ropsten transaction links
- Temporarily disable extension reload detection causing infinite reload bug.
- Implemented basic checking for valid RPC URIs.

## [2.14.0] - 2016-12-16
### Uncategorized
- Removed Morden testnet provider from provider menu.
- Add support for notices.
- Fix broken reload detection.
- Fix transaction forever cached-as-pending bug.

## [2.13.11] - 2016-11-23
### Uncategorized
- Add support for synchronous RPC method "eth_uninstallFilter".
- Forgotten password prompts now send users directly to seed word restoration.

## [2.13.10] - 2016-11-22
### Uncategorized
- Improve gas calculation logic.
- Default to Dapp-specified gas limits for transactions.
- Ropsten networks now properly point to the faucet when attempting to buy ether.
- Ropsten transactions now link to etherscan correctly.

## [2.13.9] - 2016-11-21
### Uncategorized
- Add support for the new, default Ropsten Test Network.
- Fix bug that would cause MetaMask to occasionally lose its StreamProvider connection and drop requests.
- Fix bug that would cause the Custom RPC menu item to not appear when Localhost 8545 was selected.
- Point ropsten faucet button to actual faucet.
- Phase out ethereumjs-util from our encryptor module.

## [2.13.8] - 2016-11-16
### Uncategorized
- Show a warning when a transaction fails during simulation.
- Fix bug where 20% of gas estimate was not being added properly.
- Render error messages in confirmation screen more gracefully.

## [2.13.7] - 2016-11-08
### Uncategorized
- Fix bug where gas estimate would sometimes be very high.
- Increased our gas estimate from 100k gas to 20% of estimate.
- Fix GitHub link on info page to point at current repository.

## [2.13.6] - 2016-10-26
### Uncategorized
- Add a check for improper Transaction data.
- Inject up to date version of web3.js
- Now nicknaming new accounts "Account #" instead of "Wallet #" for clarity.
- Fix bug where custom provider selection could show duplicate items.
- Fix bug where connecting to a local morden node would make two providers appear selected.
- Fix bug that was sometimes preventing transactions from being sent.

## [2.13.5] - 2016-10-18
### Uncategorized
- Increase default max gas to `100000` over the RPC's `estimateGas` response.
- Fix bug where slow-loading dapps would sometimes trigger infinite reload loops.

## [2.13.4] - 2016-10-17
### Uncategorized
- Add custom transaction fee field to send form.
- Fix bug where web3 was being injected into XML files.
- Fix bug where changing network would not reload current Dapps.

## [2.13.3] - 2016-10-05
### Uncategorized
- Fix bug where log queries were filtered out.
- Decreased vault confirmation button font size to help some Linux users who could not see it.
- Made popup a little taller because it would sometimes cut off buttons.
- Fix bug where long account lists would get scrunched instead of scrolling.
- Add legal information to relevant pages.
- Rename UI elements to be more consistent with one another.
- Updated Terms of Service and Usage.
- Prompt users to re-agree to the Terms of Service when they are updated.

## [2.13.2] - 2016-10-04
### Uncategorized
- Fix bug where chosen FIAT exchange rate does no persist when switching networks
- Fix additional parameters that made MetaMask sometimes receive errors from Parity.
- Fix bug where invalid transactions would still open the MetaMask popup.
- Removed hex prefix from private key export, to increase compatibility with Geth, MyEtherWallet, and Jaxx.

## [2.13.1] - 2016-09-23
### Uncategorized
- Fix a bug with estimating gas on Parity
- Show loading indication when selecting ShapeShift as purchasing method.

## [2.13.0] - 2016-09-18
### Uncategorized
- Add Parity compatibility, fixing Geth dependency issues.
- Add a link to the transaction in history that goes to https://metamask.github.io/eth-tx-viz to help visualize transactions and to where they are going.
- Show "Buy Ether" button and warning on tx confirmation when sender balance is insufficient

## [2.12.1] - 2016-09-14
### Uncategorized
- Fixed bug where if you send a transaction from within MetaMask extension the popup notification opens up.
- Fixed bug where some tx errors would block subsequent txs until the plugin was refreshed.

## [2.12.0] - 2016-09-14
### Uncategorized
- Add a QR button to the Account detail screen
- Fixed bug where opening MetaMask could close a non-metamask popup.
- Fixed memory leak that caused occasional crashes.

## [2.11.1] - 2016-09-13
### Uncategorized
- Fix bug that prevented caches from being cleared in Opera.

## [2.11.0] - 2016-09-12
### Uncategorized
- Fix bug where pending transactions from Test net (or other networks) show up In Main net.
- Add fiat conversion values to more views.
- On fresh install, open a new tab with the MetaMask Introduction video. Does not open on update.
- Block negative values from transactions.
- Fixed a memory leak.
- MetaMask logo now renders as super lightweight SVG, improving compatibility and performance.
- Now showing loading indication during vault unlocking, to clarify behavior for users who are experiencing slow unlocks.
- Now only initially creates one wallet when restoring a vault, to reduce some users' confusion.

## [2.10.2] - 2016-09-02
### Uncategorized
- Fix bug where notification popup would not display.

## [2.10.1] - 2016-09-02
### Uncategorized
- Fix bug where provider menu did not allow switching to custom network from a custom network.
- Sending a transaction from within MetaMask no longer triggers a popup.
- The ability to build without livereload features (such as for production) can be enabled with the gulp --disableLiveReload flag.
- Fix Ethereum JSON RPC Filters bug.

## [2.10.0] - 2016-08-29
### Uncategorized
- Changed transaction approval from notifications system to popup system.
- Add a back button to locked screen to allow restoring vault from seed words when password is forgotten.
- Forms now retain their values even when closing the popup and reopening it.
- Fixed a spelling error in provider menu.

## [2.9.2] - 2016-08-24
### Uncategorized
- Fixed shortcut bug from preventing installation.

## [2.9.1] - 2016-08-24
### Uncategorized
- Added static image as fallback for when WebGL isn't supported.
- Transaction history now has a hard limit.
- Added info link on account screen that visits Etherscan.
- Fixed bug where a message signing request would be lost if the vault was locked.
- Added shortcut to open MetaMask (Ctrl+Alt+M or Cmd+Opt/Alt+M)
- Prevent API calls in tests.
- Fixed bug where sign message confirmation would sometimes render blank.

## [2.9.0] - 2016-08-22
### Uncategorized
- Added ShapeShift to the transaction history
- Added affiliate key to Shapeshift requests
- Added feature to reflect current conversion rates of current vault balance.
- Modify balance display logic.

## [2.8.0] - 2016-08-15
### Uncategorized
- Integrate ShapeShift
- Add a form for Coinbase to specify amount to buy
- Fix various typos.
- Make dapp-metamask connection more reliable
- Remove Ethereum Classic from provider menu.

## [2.7.3] - 2016-07-29
### Uncategorized
- Fix bug where changing an account would not update in a live Dapp.

## [2.7.2] - 2016-07-29
### Uncategorized
- Add Ethereum Classic to provider menu
- Fix bug where host store would fail to receive updates.

## [2.7.1] - 2016-07-27
### Uncategorized
- Fix bug where web3 would sometimes not be injected in time for the application.
- Fixed bug where sometimes when opening the plugin, it would not fully open until closing and re-opening.
- Got most functionality working within Firefox (still working on review process before it can be available).
- Fixed menu dropdown bug introduced in Chrome 52.

## [2.7.0] - 2016-07-21
### Uncategorized
- Added a Warning screen about storing ETH
- Add buy Button!
- MetaMask now throws descriptive errors when apps try to use synchronous web3 methods.
- Removed firefox-specific line in manifest.

## [2.6.2] - 2016-07-20
### Uncategorized
- Fixed bug that would prevent the plugin from reopening on the first try after receiving a new transaction while locked.
- Fixed bug that would render 0 ETH as a non-exact amount.

## [2.6.1] - 2016-07-13
### Uncategorized
- Fix tool tips on Eth balance to show the 6 decimals
- Fix rendering of recipient SVG in tx approval notification.
- New vaults now generate only one wallet instead of three.
- Bumped version of web3 provider engine.
- Fixed bug where some lowercase or uppercase addresses were not being recognized as valid.
- Fixed bug where gas cost was misestimated on the tx confirmation view.

## [2.6.0] - 2016-07-11
### Uncategorized
- Fix formatting of ETH balance
- Fix formatting of account details.
- Use web3 minified dist for faster inject times
- Fix issue where dropdowns were not in front of icons.
- Update transaction approval styles.
- Align failed and successful transaction history text.
- Fix issue where large domain names and large transaction values would misalign the transaction history.
- Abbreviate ether balances on transaction details to maintain formatting.
- General code cleanup.

## [2.5.0] - 2016-06-29
### Uncategorized
- Implement new account design.
- Added a network indicator mark in dropdown menu
- Added network name next to network indicator
- Add copy transaction hash button to completed transaction list items.
- Unify wording for transaction approve/reject options on notifications and the extension.
- Fix bug where confirmation view would be shown twice.

## [2.4.5] - 2016-06-29
### Uncategorized
- Fixed bug where MetaMask interfered with PDF loading.
- Moved switch account icon into menu bar.
- Changed status shapes to be a yellow warning sign for failure and ellipsis for pending transactions.
- Now enforce 20 character limit on wallet names.
- Wallet titles are now properly truncated in transaction confirmation.
- Fix formatting on terms & conditions page.
- Now enforce 30 character limit on wallet names.
- Fix out-of-place positioning of pending transaction badges on wallet list.
- Change network status icons to reflect current design.

## [2.4.4] - 2016-06-23
### Uncategorized
- Update web3-stream-provider for batch payload bug fix

## [2.4.3] - 2016-06-23
### Uncategorized
- Remove redundant network option buttons from settings page
- Switch out font family Transat for Montserrat

## [2.4.2] - 2016-06-22
### Uncategorized
- Change out export icon for key.
- Unify copy to clipboard icon
- Fixed eth.sign behavior.
- Fix behavior of batched outbound transactions.

## [2.4.0] - 2016-06-20
### Uncategorized
- Clean up UI.
- Remove nonfunctional QR code button.
- Make network loading indicator clickable to select accessible network.
- Show more characters of addresses when space permits.
- Fixed bug when signing messages under 64 hex characters long.
- Add disclaimer view with placeholder text for first time users.

## [2.3.1] - 2016-06-09
### Uncategorized
- Style up the info page
- Cache identicon images to optimize for long lists of transactions.
- Fix out of gas errors

## [2.3.0] - 2016-06-06
### Uncategorized
- Show network status in title bar
- Added seed word recovery to config screen.
- Clicking network status indicator now reveals a provider menu.

## [2.2.0] - 2016-06-02
### Uncategorized
- Redesigned init, vault create, vault restore and seed confirmation screens.
- Added pending transactions to transaction list on account screen.
- Clicking a pending transaction takes you back to the transaction approval screen.
- Update provider-engine to fix intermittent out of gas errors.

## [2.1.0] - 2016-05-26
### Uncategorized
- Added copy address button to account list.
- Fixed back button on confirm transaction screen.
- Add indication of pending transactions to account list screen.
- Fixed bug where error warning was sometimes not cleared on view transition.
- Updated eth-lightwallet to fix a critical security issue.

## [2.0.0] - 2016-05-23
### Uncategorized
- UI Overhaul per Vlad Todirut's designs.
- Replaced identicons with jazzicons.
- Fixed glitchy transitions.
- Added support for capitalization-based address checksums.
- Send value is no longer limited by javascript number precision, and is always in ETH.
- Added ability to generate new accounts.
- Added ability to locally nickname accounts.

## [1.8.4] - 2016-05-13
### Uncategorized
- Point rpc servers to https endpoints.

## [1.8.3] - 2016-05-12
### Uncategorized
- Bumped web3 to 0.6.0
- Really fixed `eth_syncing` method response.

## [1.8.2] - 2016-05-11
### Uncategorized
- Fixed bug where send view would not load correctly the first time it was visited per account.
- Migrated all users to new scalable backend.
- Fixed `eth_syncing` method response.

## [1.8.1] - 2016-05-10
### Uncategorized
- Initial usage of scalable blockchain backend.
- Made official providers more easily configurable for us internally.

## [1.8.0] - 2016-05-10
### Uncategorized
- Add support for calls to `eth.sign`.
- Moved account exporting within subview of the account detail view.
- Added buttons to the account export process.
- Improved visual appearance of account detail transition where button heights would change.
- Restored back button to account detail view.
- Show transaction list always, never collapsed.
- Changing provider now reloads current Dapps
- Improved appearance of transaction list in account detail view.

## [1.7.0] - 2016-04-29
### Uncategorized
- Account detail view is now the primary view.
- The account detail view now has a "Change acct" button which shows the account list.
- Clicking accounts in the account list now both selects that account and displays that account's detail view.
- Selected account is now persisted between sessions, so the current account stays selected.
- Account icons are now "identicons" (deterministically generated from the address).
- Fixed link to Slack channel.
- Added a context guard for "define" to avoid UMD's exporting themselves to the wrong module system, fixing interference with some websites.
- Transaction list now only shows transactions for the current account.
- Transaction list now only shows transactions for the current network (mainnet, testnet, testrpc).
- Fixed transaction links to etherscan blockchain explorer.
- Fixed some UI transitions that had weird behavior.

## [1.6.0] - 2016-04-22
### Uncategorized
- Pending transactions are now persisted to localStorage and resume even after browser is closed.
- Completed transactions are now persisted and can be displayed via UI.
- Added transaction list to account detail view.
- Fix bug on config screen where current RPC address was always displayed wrong.
- Fixed bug where entering a decimal value when sending a transaction would result in sending the wrong amount.
- Add save button to custom RPC input field.
- Add quick-select button for RPC on `localhost:8545`.
- Improve config view styling.
- Users have been migrated from old test-net RPC to a newer test-net RPC.

## [1.5.1] - 2016-04-15
### Uncategorized
- Corrected text above account list. Selected account is visible to all sites, not just the current domain.
- Merged the UI codebase into the main plugin codebase for simpler maintenance.
- Fix Ether display rounding error. Now rendering to four decimal points.
- Fix some inpage synchronous methods
- Change account rendering to show four decimals and a leading zero.

## [1.5.0] - 2016-04-13
### Uncategorized
- Added ability to send ether.
- Fixed bugs related to using Javascript numbers, which lacked appropriate precision.
- Replaced Etherscan main-net provider with our own production RPC.

## [1.4.0] - 2016-04-08
### Uncategorized
- Removed extra entropy text field for simplified vault creation.
- Now supports exporting an account's private key.
- Unified button and input styles across the app.
- Removed some non-working placeholder UI until it works.
- Fix popup's web3 stream provider
- Temporarily deactivated fauceting indication because it would activate when restoring an empty account.

## [1.3.2] - 2016-04-04
### Uncategorized
- When unlocking, first account is auto-selected.
- When creating a first vault on the test-net, the first account is auto-funded.
- Fixed some styling issues.

## [1.0.0] - 2016-03-25
### Uncategorized
- Made seed word restoring BIP44 compatible.

## [0.14.0] - 2016-03-16
### Uncategorized
- Added the ability to restore accounts from seed words.

[Unreleased]: https://github.com/MetaMask/metamask-extension/compare/v9.8.0...HEAD
[9.8.0]: https://github.com/MetaMask/metamask-extension/compare/v9.7.1...v9.8.0
[9.7.1]: https://github.com/MetaMask/metamask-extension/compare/v9.7.0...v9.7.1
[9.7.0]: https://github.com/MetaMask/metamask-extension/compare/v9.6.1...v9.7.0
[9.6.1]: https://github.com/MetaMask/metamask-extension/compare/v9.6.0...v9.6.1
[9.6.0]: https://github.com/MetaMask/metamask-extension/compare/v9.5.9...v9.6.0
[9.5.9]: https://github.com/MetaMask/metamask-extension/compare/v9.5.8...v9.5.9
[9.5.8]: https://github.com/MetaMask/metamask-extension/compare/v9.5.7...v9.5.8
[9.5.7]: https://github.com/MetaMask/metamask-extension/compare/v9.5.6...v9.5.7
[9.5.6]: https://github.com/MetaMask/metamask-extension/compare/v9.5.5...v9.5.6
[9.5.5]: https://github.com/MetaMask/metamask-extension/compare/v9.5.4...v9.5.5
[9.5.4]: https://github.com/MetaMask/metamask-extension/compare/v9.5.3...v9.5.4
[9.5.3]: https://github.com/MetaMask/metamask-extension/compare/v9.5.2...v9.5.3
[9.5.2]: https://github.com/MetaMask/metamask-extension/compare/v9.5.1...v9.5.2
[9.5.1]: https://github.com/MetaMask/metamask-extension/compare/v9.5.0...v9.5.1
[9.5.0]: https://github.com/MetaMask/metamask-extension/compare/v9.4.0...v9.5.0
[9.4.0]: https://github.com/MetaMask/metamask-extension/compare/v9.3.0...v9.4.0
[9.3.0]: https://github.com/MetaMask/metamask-extension/compare/v9.2.1...v9.3.0
[9.2.1]: https://github.com/MetaMask/metamask-extension/compare/v9.2.0...v9.2.1
[9.2.0]: https://github.com/MetaMask/metamask-extension/compare/v9.1.1...v9.2.0
[9.1.1]: https://github.com/MetaMask/metamask-extension/compare/v9.1.0...v9.1.1
[9.1.0]: https://github.com/MetaMask/metamask-extension/compare/v9.0.5...v9.1.0
[9.0.5]: https://github.com/MetaMask/metamask-extension/compare/v9.0.4...v9.0.5
[9.0.4]: https://github.com/MetaMask/metamask-extension/compare/v9.0.3...v9.0.4
[9.0.3]: https://github.com/MetaMask/metamask-extension/compare/v9.0.2...v9.0.3
[9.0.2]: https://github.com/MetaMask/metamask-extension/compare/v9.0.1...v9.0.2
[9.0.1]: https://github.com/MetaMask/metamask-extension/compare/v9.0.0...v9.0.1
[9.0.0]: https://github.com/MetaMask/metamask-extension/compare/v8.1.11...v9.0.0
[8.1.11]: https://github.com/MetaMask/metamask-extension/compare/v8.1.10...v8.1.11
[8.1.10]: https://github.com/MetaMask/metamask-extension/compare/v8.1.9...v8.1.10
[8.1.9]: https://github.com/MetaMask/metamask-extension/compare/v8.1.8...v8.1.9
[8.1.8]: https://github.com/MetaMask/metamask-extension/compare/v8.1.7...v8.1.8
[8.1.7]: https://github.com/MetaMask/metamask-extension/compare/v8.1.6...v8.1.7
[8.1.6]: https://github.com/MetaMask/metamask-extension/compare/v8.1.5...v8.1.6
[8.1.5]: https://github.com/MetaMask/metamask-extension/compare/v8.1.4...v8.1.5
[8.1.4]: https://github.com/MetaMask/metamask-extension/compare/v8.1.3...v8.1.4
[8.1.3]: https://github.com/MetaMask/metamask-extension/compare/v8.1.2...v8.1.3
[8.1.2]: https://github.com/MetaMask/metamask-extension/compare/v8.1.1...v8.1.2
[8.1.1]: https://github.com/MetaMask/metamask-extension/compare/v8.1.0...v8.1.1
[8.1.0]: https://github.com/MetaMask/metamask-extension/compare/v8.0.10...v8.1.0
[8.0.10]: https://github.com/MetaMask/metamask-extension/compare/v8.0.9...v8.0.10
[8.0.9]: https://github.com/MetaMask/metamask-extension/compare/v8.0.8...v8.0.9
[8.0.8]: https://github.com/MetaMask/metamask-extension/compare/v8.0.7...v8.0.8
[8.0.7]: https://github.com/MetaMask/metamask-extension/compare/v8.0.6...v8.0.7
[8.0.6]: https://github.com/MetaMask/metamask-extension/compare/v8.0.5...v8.0.6
[8.0.5]: https://github.com/MetaMask/metamask-extension/compare/v8.0.4...v8.0.5
[8.0.4]: https://github.com/MetaMask/metamask-extension/compare/v8.0.3...v8.0.4
[8.0.3]: https://github.com/MetaMask/metamask-extension/compare/v8.0.2...v8.0.3
[8.0.2]: https://github.com/MetaMask/metamask-extension/compare/v8.0.1...v8.0.2
[8.0.1]: https://github.com/MetaMask/metamask-extension/compare/v8.0.0...v8.0.1
[8.0.0]: https://github.com/MetaMask/metamask-extension/compare/v7.7.9...v8.0.0
[7.7.9]: https://github.com/MetaMask/metamask-extension/compare/v7.7.8...v7.7.9
[7.7.8]: https://github.com/MetaMask/metamask-extension/compare/v7.7.7...v7.7.8
[7.7.7]: https://github.com/MetaMask/metamask-extension/compare/v7.7.6...v7.7.7
[7.7.6]: https://github.com/MetaMask/metamask-extension/compare/v7.7.5...v7.7.6
[7.7.5]: https://github.com/MetaMask/metamask-extension/compare/v7.7.4...v7.7.5
[7.7.4]: https://github.com/MetaMask/metamask-extension/compare/v7.7.3...v7.7.4
[7.7.3]: https://github.com/MetaMask/metamask-extension/compare/v7.7.2...v7.7.3
[7.7.2]: https://github.com/MetaMask/metamask-extension/compare/v7.7.1...v7.7.2
[7.7.1]: https://github.com/MetaMask/metamask-extension/compare/v7.7.0...v7.7.1
[7.7.0]: https://github.com/MetaMask/metamask-extension/compare/v7.6.1...v7.7.0
[7.6.1]: https://github.com/MetaMask/metamask-extension/compare/v7.6.0...v7.6.1
[7.6.0]: https://github.com/MetaMask/metamask-extension/compare/v7.5.3...v7.6.0
[7.5.3]: https://github.com/MetaMask/metamask-extension/compare/v7.5.2...v7.5.3
[7.5.2]: https://github.com/MetaMask/metamask-extension/compare/v7.5.1...v7.5.2
[7.5.1]: https://github.com/MetaMask/metamask-extension/compare/v7.5.0...v7.5.1
[7.5.0]: https://github.com/MetaMask/metamask-extension/compare/v7.4.0...v7.5.0
[7.4.0]: https://github.com/MetaMask/metamask-extension/compare/v7.3.1...v7.4.0
[7.3.1]: https://github.com/MetaMask/metamask-extension/compare/v7.3.0...v7.3.1
[7.3.0]: https://github.com/MetaMask/metamask-extension/compare/v7.2.3...v7.3.0
[7.2.3]: https://github.com/MetaMask/metamask-extension/compare/v7.2.2...v7.2.3
[7.2.2]: https://github.com/MetaMask/metamask-extension/compare/v7.2.1...v7.2.2
[7.2.1]: https://github.com/MetaMask/metamask-extension/compare/v7.2.0...v7.2.1
[7.2.0]: https://github.com/MetaMask/metamask-extension/compare/v7.1.1...v7.2.0
[7.1.1]: https://github.com/MetaMask/metamask-extension/compare/v7.1.0...v7.1.1
[7.1.0]: https://github.com/MetaMask/metamask-extension/compare/v7.0.1...v7.1.0
[7.0.1]: https://github.com/MetaMask/metamask-extension/compare/v7.0.0...v7.0.1
[7.0.0]: https://github.com/MetaMask/metamask-extension/compare/v6.7.3...v7.0.0
[6.7.3]: https://github.com/MetaMask/metamask-extension/compare/v6.7.2...v6.7.3
[6.7.2]: https://github.com/MetaMask/metamask-extension/compare/v6.7.1...v6.7.2
[6.7.1]: https://github.com/MetaMask/metamask-extension/compare/v6.7.0...v6.7.1
[6.7.0]: https://github.com/MetaMask/metamask-extension/compare/v6.6.2...v6.7.0
[6.6.2]: https://github.com/MetaMask/metamask-extension/compare/v6.6.1...v6.6.2
[6.6.1]: https://github.com/MetaMask/metamask-extension/compare/v6.6.0...v6.6.1
[6.6.0]: https://github.com/MetaMask/metamask-extension/compare/v6.5.3...v6.6.0
[6.5.3]: https://github.com/MetaMask/metamask-extension/compare/v6.5.2...v6.5.3
[6.5.2]: https://github.com/MetaMask/metamask-extension/compare/v6.5.1...v6.5.2
[6.5.1]: https://github.com/MetaMask/metamask-extension/compare/v6.5.0...v6.5.1
[6.5.0]: https://github.com/MetaMask/metamask-extension/compare/v6.4.1...v6.5.0
[6.4.1]: https://github.com/MetaMask/metamask-extension/compare/v6.4.0...v6.4.1
[6.4.0]: https://github.com/MetaMask/metamask-extension/compare/v6.3.2...v6.4.0
[6.3.2]: https://github.com/MetaMask/metamask-extension/compare/v6.3.1...v6.3.2
[6.3.1]: https://github.com/MetaMask/metamask-extension/compare/v6.3.0...v6.3.1
[6.3.0]: https://github.com/MetaMask/metamask-extension/compare/v6.2.2...v6.3.0
[6.2.2]: https://github.com/MetaMask/metamask-extension/compare/v6.2.1...v6.2.2
[6.2.1]: https://github.com/MetaMask/metamask-extension/compare/v6.2.0...v6.2.1
[6.2.0]: https://github.com/MetaMask/metamask-extension/compare/v6.1.0...v6.2.0
[6.1.0]: https://github.com/MetaMask/metamask-extension/compare/v6.0.1...v6.1.0
[6.0.1]: https://github.com/MetaMask/metamask-extension/compare/v6.0.0...v6.0.1
[6.0.0]: https://github.com/MetaMask/metamask-extension/compare/v5.3.5...v6.0.0
[5.3.5]: https://github.com/MetaMask/metamask-extension/compare/v5.3.4...v5.3.5
[5.3.4]: https://github.com/MetaMask/metamask-extension/compare/v5.3.3...v5.3.4
[5.3.3]: https://github.com/MetaMask/metamask-extension/compare/v5.3.2...v5.3.3
[5.3.2]: https://github.com/MetaMask/metamask-extension/compare/v5.3.1...v5.3.2
[5.3.1]: https://github.com/MetaMask/metamask-extension/compare/v5.3.0...v5.3.1
[5.3.0]: https://github.com/MetaMask/metamask-extension/compare/v5.2.2...v5.3.0
[5.2.2]: https://github.com/MetaMask/metamask-extension/compare/v5.2.1...v5.2.2
[5.2.1]: https://github.com/MetaMask/metamask-extension/compare/v5.2.0...v5.2.1
[5.2.0]: https://github.com/MetaMask/metamask-extension/compare/v5.1.0...v5.2.0
[5.1.0]: https://github.com/MetaMask/metamask-extension/compare/v5.0.4...v5.1.0
[5.0.4]: https://github.com/MetaMask/metamask-extension/compare/v5.0.3...v5.0.4
[5.0.3]: https://github.com/MetaMask/metamask-extension/compare/v5.0.2...v5.0.3
[5.0.2]: https://github.com/MetaMask/metamask-extension/compare/v5.0.1...v5.0.2
[5.0.1]: https://github.com/MetaMask/metamask-extension/compare/v5.0.0...v5.0.1
[5.0.0]: https://github.com/MetaMask/metamask-extension/compare/v4.17.1...v5.0.0
[4.17.1]: https://github.com/MetaMask/metamask-extension/compare/v4.17.0...v4.17.1
[4.17.0]: https://github.com/MetaMask/metamask-extension/compare/v4.16.0...v4.17.0
[4.16.0]: https://github.com/MetaMask/metamask-extension/compare/v4.15.0...v4.16.0
[4.15.0]: https://github.com/MetaMask/metamask-extension/compare/v4.14.0...v4.15.0
[4.14.0]: https://github.com/MetaMask/metamask-extension/compare/v4.13.0...v4.14.0
[4.13.0]: https://github.com/MetaMask/metamask-extension/compare/v4.12.0...v4.13.0
[4.12.0]: https://github.com/MetaMask/metamask-extension/compare/v4.11.1...v4.12.0
[4.11.1]: https://github.com/MetaMask/metamask-extension/compare/v4.11.0...v4.11.1
[4.11.0]: https://github.com/MetaMask/metamask-extension/compare/v4.10.0...v4.11.0
[4.10.0]: https://github.com/MetaMask/metamask-extension/compare/v4.9.3...v4.10.0
[4.9.3]: https://github.com/MetaMask/metamask-extension/compare/v4.9.2...v4.9.3
[4.9.2]: https://github.com/MetaMask/metamask-extension/compare/v4.9.1...v4.9.2
[4.9.1]: https://github.com/MetaMask/metamask-extension/compare/v4.9.0...v4.9.1
[4.9.0]: https://github.com/MetaMask/metamask-extension/compare/v4.8.0...v4.9.0
[4.8.0]: https://github.com/MetaMask/metamask-extension/compare/v4.7.4...v4.8.0
[4.7.4]: https://github.com/MetaMask/metamask-extension/compare/v4.7.3...v4.7.4
[4.7.3]: https://github.com/MetaMask/metamask-extension/compare/v4.7.2...v4.7.3
[4.7.2]: https://github.com/MetaMask/metamask-extension/compare/v4.7.1...v4.7.2
[4.7.1]: https://github.com/MetaMask/metamask-extension/compare/v4.7.0...v4.7.1
[4.7.0]: https://github.com/MetaMask/metamask-extension/compare/v4.6.1...v4.7.0
[4.6.1]: https://github.com/MetaMask/metamask-extension/compare/v4.6.0...v4.6.1
[4.6.0]: https://github.com/MetaMask/metamask-extension/compare/v4.5.5...v4.6.0
[4.5.5]: https://github.com/MetaMask/metamask-extension/compare/v4.5.4...v4.5.5
[4.5.4]: https://github.com/MetaMask/metamask-extension/compare/v4.5.3...v4.5.4
[4.5.3]: https://github.com/MetaMask/metamask-extension/compare/v4.5.2...v4.5.3
[4.5.2]: https://github.com/MetaMask/metamask-extension/compare/v4.5.1...v4.5.2
[4.5.1]: https://github.com/MetaMask/metamask-extension/compare/v4.5.0...v4.5.1
[4.5.0]: https://github.com/MetaMask/metamask-extension/compare/v4.4.0...v4.5.0
[4.4.0]: https://github.com/MetaMask/metamask-extension/compare/v4.3.0...v4.4.0
[4.3.0]: https://github.com/MetaMask/metamask-extension/compare/v4.2.0...v4.3.0
[4.2.0]: https://github.com/MetaMask/metamask-extension/compare/v4.1.3...v4.2.0
[4.1.3]: https://github.com/MetaMask/metamask-extension/compare/v4.1.2...v4.1.3
[4.1.2]: https://github.com/MetaMask/metamask-extension/compare/v4.1.1...v4.1.2
[4.1.1]: https://github.com/MetaMask/metamask-extension/compare/v4.1.0...v4.1.1
[4.1.0]: https://github.com/MetaMask/metamask-extension/compare/v4.0.0...v4.1.0
[4.0.0]: https://github.com/MetaMask/metamask-extension/compare/v3.14.2...v4.0.0
[3.14.2]: https://github.com/MetaMask/metamask-extension/compare/v3.14.1...v3.14.2
[3.14.1]: https://github.com/MetaMask/metamask-extension/compare/v3.14.0...v3.14.1
[3.14.0]: https://github.com/MetaMask/metamask-extension/compare/v3.13.8...v3.14.0
[3.13.8]: https://github.com/MetaMask/metamask-extension/compare/v3.13.7...v3.13.8
[3.13.7]: https://github.com/MetaMask/metamask-extension/compare/v3.13.6...v3.13.7
[3.13.6]: https://github.com/MetaMask/metamask-extension/compare/v3.13.5...v3.13.6
[3.13.5]: https://github.com/MetaMask/metamask-extension/compare/v3.13.4...v3.13.5
[3.13.4]: https://github.com/MetaMask/metamask-extension/compare/v3.13.3...v3.13.4
[3.13.3]: https://github.com/MetaMask/metamask-extension/compare/v3.13.2...v3.13.3
[3.13.2]: https://github.com/MetaMask/metamask-extension/compare/v3.13.1...v3.13.2
[3.13.1]: https://github.com/MetaMask/metamask-extension/compare/v3.13.0...v3.13.1
[3.13.0]: https://github.com/MetaMask/metamask-extension/compare/v3.12.1...v3.13.0
[3.12.1]: https://github.com/MetaMask/metamask-extension/compare/v3.12.0...v3.12.1
[3.12.0]: https://github.com/MetaMask/metamask-extension/compare/v3.11.2...v3.12.0
[3.11.2]: https://github.com/MetaMask/metamask-extension/compare/v3.11.1...v3.11.2
[3.11.1]: https://github.com/MetaMask/metamask-extension/compare/v3.11.0...v3.11.1
[3.11.0]: https://github.com/MetaMask/metamask-extension/compare/v3.10.9...v3.11.0
[3.10.9]: https://github.com/MetaMask/metamask-extension/compare/v3.10.8...v3.10.9
[3.10.8]: https://github.com/MetaMask/metamask-extension/compare/v3.10.7...v3.10.8
[3.10.7]: https://github.com/MetaMask/metamask-extension/compare/v3.10.6...v3.10.7
[3.10.6]: https://github.com/MetaMask/metamask-extension/compare/v3.10.5...v3.10.6
[3.10.5]: https://github.com/MetaMask/metamask-extension/compare/v3.10.4...v3.10.5
[3.10.4]: https://github.com/MetaMask/metamask-extension/compare/v3.10.3...v3.10.4
[3.10.3]: https://github.com/MetaMask/metamask-extension/compare/v3.10.2...v3.10.3
[3.10.2]: https://github.com/MetaMask/metamask-extension/compare/v3.10.1...v3.10.2
[3.10.1]: https://github.com/MetaMask/metamask-extension/compare/v3.10.0...v3.10.1
[3.10.0]: https://github.com/MetaMask/metamask-extension/compare/v3.9.13...v3.10.0
[3.9.13]: https://github.com/MetaMask/metamask-extension/compare/v3.9.12...v3.9.13
[3.9.12]: https://github.com/MetaMask/metamask-extension/compare/v3.9.11...v3.9.12
[3.9.11]: https://github.com/MetaMask/metamask-extension/compare/v3.9.10...v3.9.11
[3.9.10]: https://github.com/MetaMask/metamask-extension/compare/v3.9.9...v3.9.10
[3.9.9]: https://github.com/MetaMask/metamask-extension/compare/v3.9.8...v3.9.9
[3.9.8]: https://github.com/MetaMask/metamask-extension/compare/v3.9.7...v3.9.8
[3.9.7]: https://github.com/MetaMask/metamask-extension/compare/v3.9.6...v3.9.7
[3.9.6]: https://github.com/MetaMask/metamask-extension/compare/v3.9.5...v3.9.6
[3.9.5]: https://github.com/MetaMask/metamask-extension/compare/v3.9.4...v3.9.5
[3.9.4]: https://github.com/MetaMask/metamask-extension/compare/v3.9.3...v3.9.4
[3.9.3]: https://github.com/MetaMask/metamask-extension/compare/v3.9.2...v3.9.3
[3.9.2]: https://github.com/MetaMask/metamask-extension/compare/v3.9.1...v3.9.2
[3.9.1]: https://github.com/MetaMask/metamask-extension/compare/v3.9.0...v3.9.1
[3.9.0]: https://github.com/MetaMask/metamask-extension/compare/v3.8.6...v3.9.0
[3.8.6]: https://github.com/MetaMask/metamask-extension/compare/v3.8.5...v3.8.6
[3.8.5]: https://github.com/MetaMask/metamask-extension/compare/v3.8.4...v3.8.5
[3.8.4]: https://github.com/MetaMask/metamask-extension/compare/v3.8.3...v3.8.4
[3.8.3]: https://github.com/MetaMask/metamask-extension/compare/v3.8.2...v3.8.3
[3.8.2]: https://github.com/MetaMask/metamask-extension/compare/v3.8.1...v3.8.2
[3.8.1]: https://github.com/MetaMask/metamask-extension/compare/v3.8.0...v3.8.1
[3.8.0]: https://github.com/MetaMask/metamask-extension/compare/v3.7.8...v3.8.0
[3.7.8]: https://github.com/MetaMask/metamask-extension/compare/v3.7.7...v3.7.8
[3.7.7]: https://github.com/MetaMask/metamask-extension/compare/v3.7.6...v3.7.7
[3.7.6]: https://github.com/MetaMask/metamask-extension/compare/v3.7.5...v3.7.6
[3.7.5]: https://github.com/MetaMask/metamask-extension/compare/v3.7.4...v3.7.5
[3.7.4]: https://github.com/MetaMask/metamask-extension/compare/v3.7.3...v3.7.4
[3.7.3]: https://github.com/MetaMask/metamask-extension/compare/v3.7.2...v3.7.3
[3.7.2]: https://github.com/MetaMask/metamask-extension/compare/v3.7.0...v3.7.2
[3.7.0]: https://github.com/MetaMask/metamask-extension/compare/v3.6.5...v3.7.0
[3.6.5]: https://github.com/MetaMask/metamask-extension/compare/v3.6.4...v3.6.5
[3.6.4]: https://github.com/MetaMask/metamask-extension/compare/v3.6.3...v3.6.4
[3.6.3]: https://github.com/MetaMask/metamask-extension/compare/v3.6.2...v3.6.3
[3.6.2]: https://github.com/MetaMask/metamask-extension/compare/v3.6.1...v3.6.2
[3.6.1]: https://github.com/MetaMask/metamask-extension/compare/v3.6.0...v3.6.1
[3.6.0]: https://github.com/MetaMask/metamask-extension/compare/v3.5.4...v3.6.0
[3.5.4]: https://github.com/MetaMask/metamask-extension/compare/v3.5.3...v3.5.4
[3.5.3]: https://github.com/MetaMask/metamask-extension/compare/v3.5.2...v3.5.3
[3.5.2]: https://github.com/MetaMask/metamask-extension/compare/v3.5.1...v3.5.2
[3.5.1]: https://github.com/MetaMask/metamask-extension/compare/v3.5.0...v3.5.1
[3.5.0]: https://github.com/MetaMask/metamask-extension/compare/v3.4.0...v3.5.0
[3.4.0]: https://github.com/MetaMask/metamask-extension/compare/v3.3.0...v3.4.0
[3.3.0]: https://github.com/MetaMask/metamask-extension/compare/v3.2.2...v3.3.0
[3.2.2]: https://github.com/MetaMask/metamask-extension/compare/v3.2.1...v3.2.2
[3.2.1]: https://github.com/MetaMask/metamask-extension/compare/v3.2.0...v3.2.1
[3.2.0]: https://github.com/MetaMask/metamask-extension/compare/v3.1.2...v3.2.0
[3.1.2]: https://github.com/MetaMask/metamask-extension/compare/v3.1.1...v3.1.2
[3.1.1]: https://github.com/MetaMask/metamask-extension/compare/v3.1.0...v3.1.1
[3.1.0]: https://github.com/MetaMask/metamask-extension/compare/v3.0.1...v3.1.0
[3.0.1]: https://github.com/MetaMask/metamask-extension/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/MetaMask/metamask-extension/compare/v2.14.1...v3.0.0
[2.14.1]: https://github.com/MetaMask/metamask-extension/compare/v2.14.0...v2.14.1
[2.14.0]: https://github.com/MetaMask/metamask-extension/compare/v2.13.11...v2.14.0
[2.13.11]: https://github.com/MetaMask/metamask-extension/compare/v2.13.10...v2.13.11
[2.13.10]: https://github.com/MetaMask/metamask-extension/compare/v2.13.9...v2.13.10
[2.13.9]: https://github.com/MetaMask/metamask-extension/compare/v2.13.8...v2.13.9
[2.13.8]: https://github.com/MetaMask/metamask-extension/compare/v2.13.7...v2.13.8
[2.13.7]: https://github.com/MetaMask/metamask-extension/compare/v2.13.6...v2.13.7
[2.13.6]: https://github.com/MetaMask/metamask-extension/compare/v2.13.5...v2.13.6
[2.13.5]: https://github.com/MetaMask/metamask-extension/compare/v2.13.4...v2.13.5
[2.13.4]: https://github.com/MetaMask/metamask-extension/compare/v2.13.3...v2.13.4
[2.13.3]: https://github.com/MetaMask/metamask-extension/compare/v2.13.2...v2.13.3
[2.13.2]: https://github.com/MetaMask/metamask-extension/compare/v2.13.1...v2.13.2
[2.13.1]: https://github.com/MetaMask/metamask-extension/compare/v2.13.0...v2.13.1
[2.13.0]: https://github.com/MetaMask/metamask-extension/compare/v2.12.1...v2.13.0
[2.12.1]: https://github.com/MetaMask/metamask-extension/compare/v2.12.0...v2.12.1
[2.12.0]: https://github.com/MetaMask/metamask-extension/compare/v2.11.1...v2.12.0
[2.11.1]: https://github.com/MetaMask/metamask-extension/compare/v2.11.0...v2.11.1
[2.11.0]: https://github.com/MetaMask/metamask-extension/compare/v2.10.2...v2.11.0
[2.10.2]: https://github.com/MetaMask/metamask-extension/compare/v2.10.1...v2.10.2
[2.10.1]: https://github.com/MetaMask/metamask-extension/compare/v2.10.0...v2.10.1
[2.10.0]: https://github.com/MetaMask/metamask-extension/compare/v2.9.2...v2.10.0
[2.9.2]: https://github.com/MetaMask/metamask-extension/compare/v2.9.1...v2.9.2
[2.9.1]: https://github.com/MetaMask/metamask-extension/compare/v2.9.0...v2.9.1
[2.9.0]: https://github.com/MetaMask/metamask-extension/compare/v2.8.0...v2.9.0
[2.8.0]: https://github.com/MetaMask/metamask-extension/compare/v2.7.3...v2.8.0
[2.7.3]: https://github.com/MetaMask/metamask-extension/compare/v2.7.2...v2.7.3
[2.7.2]: https://github.com/MetaMask/metamask-extension/compare/v2.7.1...v2.7.2
[2.7.1]: https://github.com/MetaMask/metamask-extension/compare/v2.7.0...v2.7.1
[2.7.0]: https://github.com/MetaMask/metamask-extension/compare/v2.6.2...v2.7.0
[2.6.2]: https://github.com/MetaMask/metamask-extension/compare/v2.6.1...v2.6.2
[2.6.1]: https://github.com/MetaMask/metamask-extension/compare/v2.6.0...v2.6.1
[2.6.0]: https://github.com/MetaMask/metamask-extension/compare/v2.5.0...v2.6.0
[2.5.0]: https://github.com/MetaMask/metamask-extension/compare/v2.4.5...v2.5.0
[2.4.5]: https://github.com/MetaMask/metamask-extension/compare/v2.4.4...v2.4.5
[2.4.4]: https://github.com/MetaMask/metamask-extension/compare/v2.4.3...v2.4.4
[2.4.3]: https://github.com/MetaMask/metamask-extension/compare/v2.4.2...v2.4.3
[2.4.2]: https://github.com/MetaMask/metamask-extension/compare/v2.4.0...v2.4.2
[2.4.0]: https://github.com/MetaMask/metamask-extension/compare/v2.3.1...v2.4.0
[2.3.1]: https://github.com/MetaMask/metamask-extension/compare/v2.3.0...v2.3.1
[2.3.0]: https://github.com/MetaMask/metamask-extension/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/MetaMask/metamask-extension/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/MetaMask/metamask-extension/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/MetaMask/metamask-extension/compare/v1.8.4...v2.0.0
[1.8.4]: https://github.com/MetaMask/metamask-extension/compare/v1.8.3...v1.8.4
[1.8.3]: https://github.com/MetaMask/metamask-extension/compare/v1.8.2...v1.8.3
[1.8.2]: https://github.com/MetaMask/metamask-extension/compare/v1.8.1...v1.8.2
[1.8.1]: https://github.com/MetaMask/metamask-extension/compare/v1.8.0...v1.8.1
[1.8.0]: https://github.com/MetaMask/metamask-extension/compare/v1.7.0...v1.8.0
[1.7.0]: https://github.com/MetaMask/metamask-extension/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/MetaMask/metamask-extension/compare/v1.5.1...v1.6.0
[1.5.1]: https://github.com/MetaMask/metamask-extension/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/MetaMask/metamask-extension/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/MetaMask/metamask-extension/compare/v1.3.2...v1.4.0
[1.3.2]: https://github.com/MetaMask/metamask-extension/compare/v1.0.0...v1.3.2
[1.0.0]: https://github.com/MetaMask/metamask-extension/compare/v0.14.0...v1.0.0
[0.14.0]: https://github.com/MetaMask/metamask-extension/releases/tag/v0.14.0
