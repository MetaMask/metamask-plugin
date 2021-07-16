import EventEmitter from 'events';
import { strict as assert } from 'assert';
import { ObservableStore } from '@metamask/obs-store';
import { ethErrors } from 'eth-rpc-errors';
import { typedSignatureHash, TYPED_MESSAGE_SCHEMA } from 'eth-sig-util';
import log from 'loglevel';
import jsonschema from 'jsonschema';
import { MESSAGE_TYPE } from '../../../shared/constants/app';
import { METAMASK_CONTROLLER_EVENTS } from '../metamask-controller';
import createId from '../../../shared/modules/random-id';
import { isValidHexAddress } from '../../../shared/modules/hexstring-utils';

/**
 * Represents, and contains data about, an 'eth_signTypedData' type signature request. These are created when a
 * signature for an eth_signTypedData call is requested.
 *
 * @typedef {Object} TypedMessage
 * @property {number} id An id to track and identify the message object
 * @property {Object} msgParams The parameters to pass to the eth_signTypedData method once the signature request is
 * approved.
 * @property {Object} msgParams.metamaskId Added to msgParams for tracking and identification within MetaMask.
 * @property {Object} msgParams.from The address that is making the signature request.
 * @property {string} msgParams.data A hex string conversion of the raw buffer data of the signature request
 * @property {number} time The epoch time at which the this message was created
 * @property {string} status Indicates whether the signature request is 'unapproved', 'approved', 'signed', 'rejected', or 'errored'
 * @property {string} type The json-prc signing method for which a signature request has been made. A 'Message' will
 * always have a 'eth_signTypedData' type.
 *
 */

export default class TypedMessageManager extends EventEmitter {
  /**
   * Controller in charge of managing - storing, adding, removing, updating - TypedMessage.
   */
  constructor({ getCurrentChainId }) {
    super();
    this._getCurrentChainId = getCurrentChainId;
    this.memStore = new ObservableStore({
      unapprovedTypedMessages: {},
      unapprovedTypedMessagesCount: 0,
    });
    this.messages = [];
  }

  /**
   * A getter for the number of 'unapproved' TypedMessages in this.messages
   *
   * @returns {number} The number of 'unapproved' TypedMessages in this.messages
   *
   */
  get unapprovedTypedMessagesCount() {
    return Object.keys(this.getUnapprovedMsgs()).length;
  }

  /**
   * A getter for the 'unapproved' TypedMessages in this.messages
   *
   * @returns {Object} An index of TypedMessage ids to TypedMessages, for all 'unapproved' TypedMessages in
   * this.messages
   *
   */
  getUnapprovedMsgs() {
    return this.messages
      .filter((msg) => msg.status === 'unapproved')
      .reduce((result, msg) => {
        result[msg.id] = msg;
        return result;
      }, {});
  }

  /**
   * Creates a new TypedMessage with an 'unapproved' status using the passed msgParams. this.addMsg is called to add
   * the new TypedMessage to this.messages, and to save the unapproved TypedMessages from that list to
   * this.memStore. Before any of this is done, msgParams are validated
   *
   * @param {Object} msgParams - The params for the eth_sign call to be made after the message is approved.
   * @param {Object} [req] - The original request object possibly containing the origin
   * @returns {promise} When the message has been signed or rejected
   *
   */
  addUnapprovedMessageAsync(msgParams, req, version) {
    return new Promise((resolve, reject) => {
      const msgId = this.addUnapprovedMessage(msgParams, req, version);
      this.once(`${msgId}:finished`, (data) => {
        switch (data.status) {
          case 'signed':
            return resolve(data.rawSig);
          case 'rejected':
            return reject(
              ethErrors.provider.userRejectedRequest(
                'MetaMask Message Signature: User denied message signature.',
              ),
            );
          case 'errored':
            return reject(
              new Error(`MetaMask Message Signature: ${data.error}`),
            );
          default:
            return reject(
              new Error(
                `MetaMask Message Signature: Unknown problem: ${JSON.stringify(
                  msgParams,
                )}`,
              ),
            );
        }
      });
    });
  }

  /**
   * Creates a new TypedMessage with an 'unapproved' status using the passed msgParams. this.addMsg is called to add
   * the new TypedMessage to this.messages, and to save the unapproved TypedMessages from that list to
   * this.memStore. Before any of this is done, msgParams are validated
   *
   * @param {Object} msgParams - The params for the eth_sign call to be made after the message is approved.
   * @param {Object} [req] - The original request object possibly containing the origin
   * @returns {number} The id of the newly created TypedMessage.
   *
   */
  addUnapprovedMessage(msgParams, req, version) {
    msgParams.version = version;
    if (req) {
      msgParams.origin = req.origin;
    }
    let warning;
    try {
      this.validateParams(msgParams);
    } catch (error) {
      if (error.message === 'Domain name does not match origin') {
        warning = `Domain passed to message - ${error.actual} - does not match the origin of the signature request: ${error.expected}`;
      } else {
        throw error;
      }
    }
    log.debug(
      `TypedMessageManager addUnapprovedMessage: ${JSON.stringify(msgParams)}`,
    );

    // create txData obj with parameters and meta data
    const time = new Date().getTime();
    const msgId = createId();
    const msgData = {
      id: msgId,
      msgParams,
      time,
      status: 'unapproved',
      type: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA,
      warning,
    };
    this.addMsg(msgData);

    // signal update
    this.emit('update');
    return msgId;
  }

  /**
   * Helper method for this.addUnapprovedMessage. Validates that the passed params have the required properties.
   *
   * @param {Object} params - The params to validate
   *
   */
  validateParams(params) {
    assert.ok(
      params && typeof params === 'object',
      'Params must be an object.',
    );
    assert.ok('data' in params, 'Params must include a "data" field.');
    assert.ok('from' in params, 'Params must include a "from" field.');
    assert.ok(
      typeof params.from === 'string' &&
        isValidHexAddress(params.from, { allowNonPrefixed: false }),
      '"from" field must be a valid, lowercase, hexadecimal Ethereum address string.',
    );

    switch (params.version) {
      case 'V1':
        assert.ok(
          Array.isArray(params.data),
          '"params.data" must be an array.',
        );
        assert.doesNotThrow(() => {
          typedSignatureHash(params.data);
        }, 'Signing data must be valid EIP-712 typed data.');
        break;
      case 'V3':
      case 'V4': {
        assert.equal(
          typeof params.data,
          'string',
          '"params.data" must be a string.',
        );
        let data;
        assert.doesNotThrow(() => {
          data = JSON.parse(params.data);
        }, '"data" must be a valid JSON string.');
        const validation = jsonschema.validate(data, TYPED_MESSAGE_SCHEMA);
        assert.ok(
          data.primaryType in data.types,
          `Primary type of "${data.primaryType}" has no type definition.`,
        );
        assert.equal(
          validation.errors.length,
          0,
          'Signing data must conform to EIP-712 schema. See https://git.io/fNtcx.',
        );
        let { chainId } = data.domain;
        if (chainId) {
          const activeChainId = parseInt(this._getCurrentChainId(), 16);
          assert.ok(
            !Number.isNaN(activeChainId),
            `Cannot sign messages for chainId "${chainId}", because MetaMask is switching networks.`,
          );
          if (typeof chainId === 'string') {
            chainId = parseInt(chainId, 16);
          }
          assert.equal(
            chainId,
            activeChainId,
            `Provided chainId "${chainId}" must match the active chainId "${activeChainId}"`,
          );
        }
        const { domain } = data;
        assert.equal(
          domain?.name,
          new URL(params?.origin).hostname,
          'Domain name does not match origin',
        );

        break;
      }
      default:
        assert.fail(`Unknown typed data version "${params.version}"`);
    }
  }

  /**
   * Adds a passed TypedMessage to this.messages, and calls this._saveMsgList() to save the unapproved TypedMessages from that
   * list to this.memStore.
   *
   * @param {Message} msg - The TypedMessage to add to this.messages
   *
   */
  addMsg(msg) {
    this.messages.push(msg);
    this._saveMsgList();
  }

  /**
   * Returns a specified TypedMessage.
   *
   * @param {number} msgId - The id of the TypedMessage to get
   * @returns {TypedMessage|undefined} The TypedMessage with the id that matches the passed msgId, or undefined
   * if no TypedMessage has that id.
   *
   */
  getMsg(msgId) {
    return this.messages.find((msg) => msg.id === msgId);
  }

  /**
   * Approves a TypedMessage. Sets the message status via a call to this.setMsgStatusApproved, and returns a promise
   * with any the message params modified for proper signing.
   *
   * @param {Object} msgParams - The msgParams to be used when eth_sign is called, plus data added by MetaMask.
   * @param {Object} msgParams.metamaskId Added to msgParams for tracking and identification within MetaMask.
   * @returns {Promise<object>} Promises the msgParams object with metamaskId removed.
   *
   */
  approveMessage(msgParams) {
    this.setMsgStatusApproved(msgParams.metamaskId);
    return this.prepMsgForSigning(msgParams);
  }

  /**
   * Sets a TypedMessage status to 'approved' via a call to this._setMsgStatus.
   *
   * @param {number} msgId - The id of the TypedMessage to approve.
   *
   */
  setMsgStatusApproved(msgId) {
    this._setMsgStatus(msgId, 'approved');
  }

  /**
   * Sets a TypedMessage status to 'signed' via a call to this._setMsgStatus and updates that TypedMessage in
   * this.messages by adding the raw signature data of the signature request to the TypedMessage
   *
   * @param {number} msgId - The id of the TypedMessage to sign.
   * @param {buffer} rawSig - The raw data of the signature request
   *
   */
  setMsgStatusSigned(msgId, rawSig) {
    const msg = this.getMsg(msgId);
    msg.rawSig = rawSig;
    this._updateMsg(msg);
    this._setMsgStatus(msgId, 'signed');
  }

  /**
   * Removes the metamaskId property from passed msgParams and returns a promise which resolves the updated msgParams
   *
   * @param {Object} msgParams - The msgParams to modify
   * @returns {Promise<object>} Promises the msgParams with the metamaskId property removed
   *
   */
  prepMsgForSigning(msgParams) {
    delete msgParams.metamaskId;
    delete msgParams.version;
    return Promise.resolve(msgParams);
  }

  /**
   * Sets a TypedMessage status to 'rejected' via a call to this._setMsgStatus.
   *
   * @param {number} msgId - The id of the TypedMessage to reject.
   *
   */
  rejectMsg(msgId) {
    this._setMsgStatus(msgId, 'rejected');
  }

  /**
   * Sets a TypedMessage status to 'errored' via a call to this._setMsgStatus.
   *
   * @param {number} msgId - The id of the TypedMessage to error
   *
   */
  errorMessage(msgId, error) {
    const msg = this.getMsg(msgId);
    msg.error = error;
    this._updateMsg(msg);
    this._setMsgStatus(msgId, 'errored');
  }

  /**
   * Clears all unapproved messages from memory.
   */
  clearUnapproved() {
    this.messages = this.messages.filter((msg) => msg.status !== 'unapproved');
    this._saveMsgList();
  }

  //
  // PRIVATE METHODS
  //

  /**
   * Updates the status of a TypedMessage in this.messages via a call to this._updateMsg
   *
   * @private
   * @param {number} msgId - The id of the TypedMessage to update.
   * @param {string} status - The new status of the TypedMessage.
   * @throws A 'TypedMessageManager - TypedMessage not found for id: "${msgId}".' if there is no TypedMessage
   * in this.messages with an id equal to the passed msgId
   * @fires An event with a name equal to `${msgId}:${status}`. The TypedMessage is also fired.
   * @fires If status is 'rejected' or 'signed', an event with a name equal to `${msgId}:finished` is fired along
   * with the TypedMessage
   *
   */
  _setMsgStatus(msgId, status) {
    const msg = this.getMsg(msgId);
    if (!msg) {
      throw new Error(
        `TypedMessageManager - Message not found for id: "${msgId}".`,
      );
    }
    msg.status = status;
    this._updateMsg(msg);
    this.emit(`${msgId}:${status}`, msg);
    if (status === 'rejected' || status === 'signed' || status === 'errored') {
      this.emit(`${msgId}:finished`, msg);
    }
  }

  /**
   * Sets a TypedMessage in this.messages to the passed TypedMessage if the ids are equal. Then saves the
   * unapprovedTypedMsgs index to storage via this._saveMsgList
   *
   * @private
   * @param {msg} TypedMessage - A TypedMessage that will replace an existing TypedMessage (with the same
   * id) in this.messages
   *
   */
  _updateMsg(msg) {
    const index = this.messages.findIndex((message) => message.id === msg.id);
    if (index !== -1) {
      this.messages[index] = msg;
    }
    this._saveMsgList();
  }

  /**
   * Saves the unapproved TypedMessages, and their count, to this.memStore
   *
   * @private
   * @fires 'updateBadge'
   *
   */
  _saveMsgList() {
    const unapprovedTypedMessages = this.getUnapprovedMsgs();
    const unapprovedTypedMessagesCount = Object.keys(unapprovedTypedMessages)
      .length;
    this.memStore.updateState({
      unapprovedTypedMessages,
      unapprovedTypedMessagesCount,
    });
    this.emit(METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE);
  }
}
