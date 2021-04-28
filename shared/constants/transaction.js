/**
 * Transaction Type is a MetaMask construct used internally
 * @typedef {Object} TransactionTypes
 * @property {'transfer'} TOKEN_METHOD_TRANSFER - A token transaction where the user
 *  is sending tokens that they own to another address
 * @property {'transferfrom'} TOKEN_METHOD_TRANSFER_FROM - A token transaction
 *  transferring tokens from an account that the sender has an allowance of.
 *  For more information on allowances, see the approve type.
 * @property {'approve'} TOKEN_METHOD_APPROVE - A token transaction requesting an
 *  allowance of the token to spend on behalf of the user
 * @property {'incoming'} INCOMING - An incoming (deposit) transaction
 * @property {'sent'} SENT - A transaction sent from external source (other than MetaMask)
 * @property {'sentEther'} SENT_ETHER - A transaction sending ether to a recipient
 * @property {'contractInteraction'} CONTRACT_INTERACTION - A transaction that is
 *  interacting with a smart contract's methods that we have not treated as a special
 *  case, such as approve, transfer, and transferfrom
 * @property {'contractDeployment'} DEPLOY_CONTRACT - A transaction that deployed
 *  a smart contract
 * @property {'swap'} SWAP - A transaction swapping one token for another through
 *  MetaMask Swaps
 * @property {'swapApproval'} SWAP_APPROVAL - Similar to the approve type, a swap
 *  approval is a special case of ERC20 approve method that requests an allowance of
 *  the token to spend on behalf of the user for the MetaMask Swaps contract. The first
 *  swap for any token will have an accompanying swapApproval transaction.
 * @property {'cancel'} CANCEL - A transaction submitted with the same nonce as a
 *  previous transaction, a higher gas price and a zeroed out send amount. Useful
 *  for users who accidentally send to erroneous addresses or if they send too much.
 * @property {'retry'} RETRY - When a transaction is failed it can be retried by
 *  resubmitting the same transaction with a higher gas fee. This type is also used
 *  to speed up pending transactions. This is accomplished by creating a new tx with
 *  the same nonce and higher gas fees.
 */

/**
 * This type will work anywhere you expect a string that can be one of the
 * above transaction types.
 * @typedef {TransactionTypes[keyof TransactionTypes]} TransactionTypeString
 */

/**
 * @type {TransactionTypes}
 */
export const TRANSACTION_TYPES = {
  CANCEL: 'cancel',
  RETRY: 'retry',
  TOKEN_METHOD_TRANSFER: 'transfer',
  TOKEN_METHOD_TRANSFER_FROM: 'transferfrom',
  TOKEN_METHOD_APPROVE: 'approve',
  INCOMING: 'incoming',
  SENT: 'sent',
  SENT_ETHER: 'sentEther',
  CONTRACT_INTERACTION: 'contractInteraction',
  DEPLOY_CONTRACT: 'contractDeployment',
  SWAP: 'swap',
  SWAP_APPROVAL: 'swapApproval',
};

/**
 * Transaction Status is a mix of Ethereum and MetaMask terminology, used internally
 * for transaction processing.
 * @typedef {Object} TransactionStatuses
 * @property {'unapproved'} UNAPPROVED - A new transaction that the user has not
 *  approved or rejected
 * @property {'approved'} APPROVED - The user has approved the transaction in the
 *  MetaMask UI
 * @property {'rejected'} REJECTED - The user has rejected the transaction in the
 *  MetaMask UI
 * @property {'signed'} SIGNED - The transaction has been signed
 * @property {'submitted'} SUBMITTED - The transaction has been submitted to network
 * @property {'failed'} FAILED - The transaction has failed for some reason
 * @property {'dropped'} DROPPED - The transaction was dropped due to a tx with same
 *  nonce being accepted
 * @property {'confirmed'} CONFIRMED - The transaction was confirmed by the network
 */

/**
 * This type will work anywhere you expect a string that can be one of the
 * above transaction statuses.
 * @typedef {TransactionStatuses[keyof TransactionStatuses]} TransactionStatusString
 */

/**
 * @type {TransactionStatuses}
 */
export const TRANSACTION_STATUSES = {
  UNAPPROVED: 'unapproved',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SIGNED: 'signed',
  SUBMITTED: 'submitted',
  FAILED: 'failed',
  DROPPED: 'dropped',
  CONFIRMED: 'confirmed',
};

/**
 * Transaction Group Status is a MetaMask construct to track the status of groups
 * of transactions.
 * @typedef {Object} TransactionGroupStatuses
 * @property {'cancelled'} CANCELLED - A cancel type transaction in the group was
 *  confirmed
 * @property {'pending'} PENDING - The primaryTransaction of the group has a status
 *  that is one of TRANSACTION_STATUSES.APPROVED, TRANSACTION_STATUSES.UNAPPROVED
 *  or TRANSACTION_STATUSES.SUBMITTED
 */

/**
 * @type {TransactionGroupStatuses}
 */
export const TRANSACTION_GROUP_STATUSES = {
  CANCELLED: 'cancelled',
  PENDING: 'pending',
};

/**
 * Transaction Group Category is a MetaMask construct to categorize the intent
 * of a group of transactions for purposes of displaying in the UI
 * @typedef {Object} TransactionGroupCategories
 * @property {'send'} SEND - Transaction group representing ether being sent from
 *  the user.
 * @property {'receive'} RECEIVE - Transaction group representing a deposit/incoming
 *  transaction. This category maps 1:1 with TRANSACTION_CATEGORIES.INCOMING.
 * @property {'interaction'} INTERACTION - Transaction group representing
 *  an interaction with a smart contract's methods.
 * @property {'approval'} APPROVAL - Transaction group representing a request for an
 *  allowance of a token to spend on the user's behalf.
 * @property {'signature-request'} SIGNATURE_REQUEST - Transaction group representing
 *  a signature request This currently only shows up in the UI when its pending user
 *  approval in the UI. Once the user approves or rejects it will no longer show in
 *  activity.
 * @property {'swap'} SWAP - Transaction group representing a token swap through
 *  MetaMask Swaps. This transaction group's primary currency changes depending
 *  on context. If the user is viewing an asset page for a token received from a swap,
 *  the primary currency will be the received token. Otherwise the token exchanged
 *  will be shown.
 */

/**
 * @type {TransactionGroupCategories}
 */
export const TRANSACTION_GROUP_CATEGORIES = {
  SEND: 'send',
  RECEIVE: 'receive',
  INTERACTION: 'interaction',
  APPROVAL: 'approval',
  SIGNATURE_REQUEST: 'signature-request',
  SWAP: 'swap',
};

/**
 * @typedef {Object} TxParams
 * @property {string} from - The address the transaction is sent from
 * @property {string} to - The address the transaction is sent to
 * @property {string} value - The amount of wei, in hexadecimal, to send
 * @property {number} nonce - The transaction count for the current account/network
 * @property {string} gasPrice - The amount of gwei, in hexadecimal, per unit of gas
 * @property {string} gas - The max amount of gwei, in hexadecimal, the user is willing to pay
 * @property {string} [data] - Hexadecimal encoded string representing calls to the EVM's ABI
 */

/**
 * @typedef {Object} TxError
 * @property {string} message - The message from the encountered error.
 * @property {any} rpc - The "value" of the error.
 * @property {string} [stack] - the stack trace from the error, if available.
 */

/**
 * An object representing a transaction, in whatever state it is in.
 * @typedef {Object} TransactionMeta
 *
 * @property {string} [blockNumber] - The block number this transaction was
 *  included in. Currently only present on incoming transactions!
 * @property {number} id - An internally unique tx identifier.
 * @property {number} time - Time the transaction was first suggested, in unix
 *  epoch time (ms).
 * @property {TransactionTypeString} type - The type of transaction this txMeta
 *  represents.
 * @property {TransactionStatusString} status - The current status of the
 *  transaction.
 * @property {string} metamaskNetworkId - The transaction's network ID, used
 *  for EIP-155 compliance.
 * @property {boolean} loadingDefaults - TODO: Document
 * @property {TxParams} txParams - The transaction params as passed to the
 *  network provider.
 * @property {Object[]} history - A history of mutations to this
 *  TransactionMeta object.
 * @property {string} origin - A string representing the interface that
 *  suggested the transaction.
 * @property {Object} nonceDetails - A metadata object containing information
 *  used to derive the suggested nonce, useful for debugging nonce issues.
 * @property {string} rawTx - A hex string of the final signed transaction,
 *  ready to submit to the network.
 * @property {string} hash - A hex string of the transaction hash, used to
 *  identify the transaction on the network.
 * @property {number} [submittedTime] - The time the transaction was submitted to
 *  the network, in Unix epoch time (ms).
 * @property {TxError} [err] - The error encountered during the transaction
 */
