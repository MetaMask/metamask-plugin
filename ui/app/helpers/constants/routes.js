const DEFAULT_ROUTE = '/'
const UNLOCK_ROUTE = '/unlock'
const LOCK_ROUTE = '/lock'
const ASSET_ROUTE = '/asset'
const SETTINGS_ROUTE = '/settings'
const GENERAL_ROUTE = '/settings/general'
const ADVANCED_ROUTE = '/settings/advanced'
const SECURITY_ROUTE = '/settings/security'
const ABOUT_US_ROUTE = '/settings/about-us'
const ALERTS_ROUTE = '/settings/alerts'
const NETWORKS_ROUTE = '/settings/networks'
const CONTACT_LIST_ROUTE = '/settings/contact-list'
const CONTACT_EDIT_ROUTE = '/settings/contact-list/edit-contact'
const CONTACT_ADD_ROUTE = '/settings/contact-list/add-contact'
const CONTACT_VIEW_ROUTE = '/settings/contact-list/view-contact'
const CONTACT_MY_ACCOUNTS_ROUTE = '/settings/contact-list/my-accounts'
const CONTACT_MY_ACCOUNTS_VIEW_ROUTE = '/settings/contact-list/my-accounts/view'
const CONTACT_MY_ACCOUNTS_EDIT_ROUTE = '/settings/contact-list/my-accounts/edit'
const REVEAL_SEED_ROUTE = '/seed'
const MOBILE_SYNC_ROUTE = '/mobile-sync'
const RESTORE_VAULT_ROUTE = '/restore-vault'
const ADD_TOKEN_ROUTE = '/add-token'
const CONFIRM_ADD_TOKEN_ROUTE = '/confirm-add-token'
const CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE = '/confirm-add-suggested-token'
const NEW_ACCOUNT_ROUTE = '/new-account'
const IMPORT_ACCOUNT_ROUTE = '/new-account/import'
const CONNECT_HARDWARE_ROUTE = '/new-account/connect'
const BIDIRECTIONAL_QR_ROUTE = '/new-account/bidirectional-qr'
const SEND_ROUTE = '/send'
const CONNECT_ROUTE = '/connect'
const CONNECT_CONFIRM_PERMISSIONS_ROUTE = '/confirm-permissions'
const CONNECTED_ROUTE = '/connected'
const CONNECTED_ACCOUNTS_ROUTE = '/connected/accounts'

const INITIALIZE_ROUTE = '/initialize'
const INITIALIZE_WELCOME_ROUTE = '/initialize/welcome'
const INITIALIZE_UNLOCK_ROUTE = '/initialize/unlock'
const INITIALIZE_CREATE_PASSWORD_ROUTE = '/initialize/create-password'
const INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE = '/initialize/create-password/import-with-seed-phrase'
const INITIALIZE_SELECT_ACTION_ROUTE = '/initialize/select-action'
const INITIALIZE_SEED_PHRASE_ROUTE = '/initialize/seed-phrase'
const INITIALIZE_BACKUP_SEED_PHRASE_ROUTE = '/initialize/backup-seed-phrase'
const INITIALIZE_END_OF_FLOW_ROUTE = '/initialize/end-of-flow'
const INITIALIZE_CONFIRM_SEED_PHRASE_ROUTE = '/initialize/seed-phrase/confirm'
const INITIALIZE_METAMETRICS_OPT_IN_ROUTE = '/initialize/metametrics-opt-in'

const CONFIRM_TRANSACTION_ROUTE = '/confirm-transaction'
const CONFIRM_SEND_ETHER_PATH = '/send-ether'
const CONFIRM_SEND_TOKEN_PATH = '/send-token'
const CONFIRM_DEPLOY_CONTRACT_PATH = '/deploy-contract'
const CONFIRM_APPROVE_PATH = '/approve'
const CONFIRM_TRANSFER_FROM_PATH = '/transfer-from'
const CONFIRM_TOKEN_METHOD_PATH = '/token-method'
const SIGNATURE_REQUEST_PATH = '/signature-request'
const DECRYPT_MESSAGE_REQUEST_PATH = '/decrypt-message-request'
const ENCRYPTION_PUBLIC_KEY_REQUEST_PATH = '/encryption-public-key-request'

// Used to pull a convenient name for analytics tracking events. The key must
// be react-router ready path, and can include params such as :id for popup windows
const PATH_NAME_MAP = {
  [DEFAULT_ROUTE]: 'Home',
  [UNLOCK_ROUTE]: 'Unlock Page',
  [LOCK_ROUTE]: 'Lock Page',
  [`${ASSET_ROUTE}/:asset`]: `Asset Page`,
  [SETTINGS_ROUTE]: 'Settings Page',
  [GENERAL_ROUTE]: 'General Settings Page',
  [ADVANCED_ROUTE]: 'Advanced Settings Page',
  [SECURITY_ROUTE]: 'Security Settings Page',
  [ABOUT_US_ROUTE]: 'About Us Page',
  [ALERTS_ROUTE]: 'Alerts Settings Page',
  [NETWORKS_ROUTE]: 'Network Settings Page',
  [CONTACT_LIST_ROUTE]: 'Contact List Settings Page',
  [`${CONTACT_EDIT_ROUTE}/:address`]: 'Edit Contact Settings Page',
  [CONTACT_ADD_ROUTE]: 'Add Contact Settings Page',
  [`${CONTACT_VIEW_ROUTE}/:address`]: 'View Contact Settings Page',
  [CONTACT_MY_ACCOUNTS_ROUTE]: 'My Accounts List Settings Page',
  [`${CONTACT_MY_ACCOUNTS_VIEW_ROUTE}/:account`]: 'View Account Settings Page',
  [`${CONTACT_MY_ACCOUNTS_EDIT_ROUTE}/:account`]: 'Edit Account Settings Page',
  [REVEAL_SEED_ROUTE]: 'Reveal Seed Page',
  [MOBILE_SYNC_ROUTE]: 'Sync With Mobile Page',
  [RESTORE_VAULT_ROUTE]: 'Restore Vault Page',
  [ADD_TOKEN_ROUTE]: 'Add Token Page',
  [CONFIRM_ADD_TOKEN_ROUTE]: 'Confirm Add Token Page',
  [CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE]: 'Confirm Add Suggested Token Page',
  [NEW_ACCOUNT_ROUTE]: 'New Account Page',
  [IMPORT_ACCOUNT_ROUTE]: 'Import Account Page',
  [CONNECT_HARDWARE_ROUTE]: 'Connect Hardware Wallet Page',
  [SEND_ROUTE]: 'Send Page',
  [`${CONNECT_ROUTE}/:id`]: 'Connect To Site Confirmation Page',
  [`${CONNECT_ROUTE}/:id${CONNECT_CONFIRM_PERMISSIONS_ROUTE}`]: 'Grant Connected Site Permissions Confirmation Page',
  [CONNECTED_ROUTE]: 'Sites Connected To This Account Page',
  [CONNECTED_ACCOUNTS_ROUTE]: 'Accounts Connected To This Site Page',
  [`${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_TOKEN_METHOD_PATH}`]: 'Confirm Token Method Transaction Page',
  [`${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_SEND_ETHER_PATH}`]: 'Confirm Send Ether Transaction Page',
  [`${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_SEND_TOKEN_PATH}`]: 'Confirm Send Token Transaction Page',
  [`${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_DEPLOY_CONTRACT_PATH}`]: 'Confirm Deploy Contract Transaction Page',
  [`${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_APPROVE_PATH}`]: 'Confirm Approve Transaction Page',
  [`${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_TRANSFER_FROM_PATH}`]: 'Confirm Transfer From Transaction Page',
  [`${CONFIRM_TRANSACTION_ROUTE}/:id${SIGNATURE_REQUEST_PATH}`]: 'Signature Request Page',
  [`${CONFIRM_TRANSACTION_ROUTE}/:id${DECRYPT_MESSAGE_REQUEST_PATH}`]: 'Decrypt Message Request Page',
  [`${CONFIRM_TRANSACTION_ROUTE}/:id${ENCRYPTION_PUBLIC_KEY_REQUEST_PATH}`]: 'Encryption Public Key Request Page',
  [INITIALIZE_ROUTE]: 'Initialization Page',
  [INITIALIZE_WELCOME_ROUTE]: 'Install Welcome Page',
  [INITIALIZE_UNLOCK_ROUTE]: 'Initialization Unlock page',
  [INITIALIZE_CREATE_PASSWORD_ROUTE]: 'Initialization Create Password Page',
  [INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE]: 'Initialization Import Account With Seed Phrase Page',
  [INITIALIZE_SELECT_ACTION_ROUTE]: 'Initialization Choose Restore or New Account Page',
  [INITIALIZE_SEED_PHRASE_ROUTE]: 'Initialization Seed Phrase Page',
  [INITIALIZE_BACKUP_SEED_PHRASE_ROUTE]: 'Initialization Backup Seed Phrase Page',
  [INITIALIZE_END_OF_FLOW_ROUTE]: 'End of Initialization Page',
  [INITIALIZE_CONFIRM_SEED_PHRASE_ROUTE]: 'Initialization Confirm Seed Phrase Page',
  [INITIALIZE_METAMETRICS_OPT_IN_ROUTE]: 'MetaMetrics Opt In Page',
}

export {
  DEFAULT_ROUTE,
  ALERTS_ROUTE,
  ASSET_ROUTE,
  UNLOCK_ROUTE,
  LOCK_ROUTE,
  SETTINGS_ROUTE,
  REVEAL_SEED_ROUTE,
  MOBILE_SYNC_ROUTE,
  RESTORE_VAULT_ROUTE,
  ADD_TOKEN_ROUTE,
  CONFIRM_ADD_TOKEN_ROUTE,
  CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
  NEW_ACCOUNT_ROUTE,
  IMPORT_ACCOUNT_ROUTE,
  CONNECT_HARDWARE_ROUTE,
  BIDIRECTIONAL_QR_ROUTE,
  SEND_ROUTE,
  INITIALIZE_ROUTE,
  INITIALIZE_WELCOME_ROUTE,
  INITIALIZE_UNLOCK_ROUTE,
  INITIALIZE_CREATE_PASSWORD_ROUTE,
  INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE,
  INITIALIZE_SELECT_ACTION_ROUTE,
  INITIALIZE_SEED_PHRASE_ROUTE,
  INITIALIZE_CONFIRM_SEED_PHRASE_ROUTE,
  INITIALIZE_END_OF_FLOW_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRM_SEND_ETHER_PATH,
  CONFIRM_SEND_TOKEN_PATH,
  CONFIRM_DEPLOY_CONTRACT_PATH,
  CONFIRM_APPROVE_PATH,
  CONFIRM_TRANSFER_FROM_PATH,
  CONFIRM_TOKEN_METHOD_PATH,
  SIGNATURE_REQUEST_PATH,
  DECRYPT_MESSAGE_REQUEST_PATH,
  ENCRYPTION_PUBLIC_KEY_REQUEST_PATH,
  INITIALIZE_METAMETRICS_OPT_IN_ROUTE,
  ADVANCED_ROUTE,
  SECURITY_ROUTE,
  GENERAL_ROUTE,
  ABOUT_US_ROUTE,
  CONTACT_LIST_ROUTE,
  CONTACT_EDIT_ROUTE,
  CONTACT_ADD_ROUTE,
  CONTACT_VIEW_ROUTE,
  CONTACT_MY_ACCOUNTS_ROUTE,
  CONTACT_MY_ACCOUNTS_VIEW_ROUTE,
  CONTACT_MY_ACCOUNTS_EDIT_ROUTE,
  NETWORKS_ROUTE,
  INITIALIZE_BACKUP_SEED_PHRASE_ROUTE,
  CONNECT_ROUTE,
  CONNECT_CONFIRM_PERMISSIONS_ROUTE,
  CONNECTED_ROUTE,
  CONNECTED_ACCOUNTS_ROUTE,
  PATH_NAME_MAP,
}
