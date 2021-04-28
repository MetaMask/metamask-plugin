import EventEmitter from 'events';
import { ObservableStore } from '@metamask/obs-store';
import { bufferToHex, stripHexPrefix } from 'ethereumjs-util';
import { ethErrors } from 'eth-rpc-errors';
import log from 'loglevel';
import { MESSAGE_TYPE } from '../../../shared/constants/app';
import { METAMASK_CONTROLLER_EVENTS } from '../metamask-controller';
import createId from '../../../shared/modules/random-id';
import { addHexPrefix } from './util';

const hexRe = /^[0-9A-Fa-f]+$/gu;

/**
 * Represents, and contains data about, an 'eth_decrypt' type decryption request. These are created when a
 * decryption for an eth_decrypt call is requested.
 *
 * @typedef {Object} DecryptMessage
 * @property {number} id An id to track and identify the message object
 * @property {Object} msgParams The parameters to pass to the decryptMessage method once the decryption request is
 * approved.
 * @property {Object} msgParams.metamaskId Added to msgParams for tracking and identification within MetaMask.
 * @property {string} msgParams.data A hex string conversion of the raw buffer data of the decryption request
 * @property {number} time The epoch time at which the this message was created
 * @property {string} status Indicates whether the decryption request is 'unapproved', 'approved', 'decrypted' or 'rejected'
 * @property {string} type The json-prc decryption method for which a decryption request has been made. A 'Message' will
 * always have a 'eth_decrypt' type.
 *
 */

export default class DecryptMessageManager extends EventEmitter {
  /**
   * Controller in charge of managing - storing, adding, removing, updating - DecryptMessage.
   *
   * @typedef {Object} DecryptMessageManager
   * @property {Object} memStore The observable store where DecryptMessage are saved.
   * @property {Object} memStore.unapprovedDecryptMsgs A collection of all DecryptMessages in the 'unapproved' state
   * @property {number} memStore.unapprovedDecryptMsgCount The count of all DecryptMessages in this.memStore.unapprovedDecryptMsgs
   * @property {Array} messages Holds all messages that have been created by this DecryptMessageManager
   *
   */
  constructor() {
    super();
    this.memStore = new ObservableStore({
      unapprovedDecryptMsgs: {},
      unapprovedDecryptMsgCount: 0,
    });
    this.messages = [];
  }

  /**
   * A getter for the number of 'unapproved' DecryptMessages in this.messages
   *
   * @returns {number} The number of 'unapproved' DecryptMessages in this.messages
   *
   */
  get unapprovedDecryptMsgCount() {
    return Object.keys(this.getUnapprovedMsgs()).length;
  }

  /**
   * A getter for the 'unapproved' DecryptMessages in this.messages
   *
   * @returns {Object} An index of DecryptMessage ids to DecryptMessages, for all 'unapproved' DecryptMessages in
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
   * Creates a new DecryptMessage with an 'unapproved' status using the passed msgParams. this.addMsg is called to add
   * the new DecryptMessage to this.messages, and to save the unapproved DecryptMessages from that list to
   * this.memStore.
   *
   * @param {Object} msgParams - The params for the eth_decrypt call to be made after the message is approved.
   * @param {Object} [req] - The original request object possibly containing the origin
   * @returns {Promise<Buffer>} The raw decrypted message contents
   *
   */
  addUnapprovedMessageAsync(msgParams, req) {
    return new Promise((resolve, reject) => {
      if (!msgParams.from) {
        reject(new Error('MetaMask Decryption: from field is required.'));
        return;
      }
      const msgId = this.addUnapprovedMessage(msgParams, req);
      this.once(`${msgId}:finished`, (data) => {
        switch (data.status) {
          case 'decrypted':
            resolve(data.rawData);
            return;
          case 'rejected':
            reject(
              ethErrors.provider.userRejectedRequest(
                'MetaMask Decryption: User denied message decryption.',
              ),
            );
            return;
          case 'errored':
            reject(new Error('This message cannot be decrypted'));
            return;
          default:
            reject(
              new Error(
                `MetaMask Decryption: Unknown problem: ${JSON.stringify(
                  msgParams,
                )}`,
              ),
            );
        }
      });
    });
  }

  /**
   * Creates a new DecryptMessage with an 'unapproved' status using the passed msgParams. this.addMsg is called to add
   * the new DecryptMessage to this.messages, and to save the unapproved DecryptMessages from that list to
   * this.memStore.
   *
   * @param {Object} msgParams - The params for the eth_decryptMsg call to be made after the message is approved.
   * @param {Object} [req] - The original request object possibly containing the origin
   * @returns {number} The id of the newly created DecryptMessage.
   *
   */
  addUnapprovedMessage(msgParams, req) {
    log.debug(
      `DecryptMessageManager addUnapprovedMessage: ${JSON.stringify(
        msgParams,
      )}`,
    );
    // add origin from request
    if (req) {
      msgParams.origin = req.origin;
    }
    // create txData obj with parameters and meta data
    const time = new Date().getTime();
    const msgId = createId();
    const msgData = {
      id: msgId,
      msgParams,
      time,
      status: 'unapproved',
      type: MESSAGE_TYPE.ETH_DECRYPT,
    };
    this.addMsg(msgData);

    // signal update
    this.emit('update');
    return msgId;
  }

  /**
   * Adds a passed DecryptMessage to this.messages, and calls this._saveMsgList() to save the unapproved DecryptMessages from that
   * list to this.memStore.
   *
   * @param {Message} msg The DecryptMessage to add to this.messages
   *
   */
  addMsg(msg) {
    this.messages.push(msg);
    this._saveMsgList();
  }

  /**
   * Returns a specified DecryptMessage.
   *
   * @param {number} msgId The id of the DecryptMessage to get
   * @returns {DecryptMessage|undefined} The DecryptMessage with the id that matches the passed msgId, or undefined
   * if no DecryptMessage has that id.
   *
   */
  getMsg(msgId) {
    return this.messages.find((msg) => msg.id === msgId);
  }

  /**
   * Approves a DecryptMessage. Sets the message status via a call to this.setMsgStatusApproved, and returns a promise
   * with the message params modified for proper decryption.
   *
   * @param {Object} msgParams The msgParams to be used when eth_decryptMsg is called, plus data added by MetaMask.
   * @param {Object} msgParams.metamaskId Added to msgParams for tracking and identification within MetaMask.
   * @returns {Promise<object>} Promises the msgParams object with metamaskId removed.
   *
   */
  approveMessage(msgParams) {
    this.setMsgStatusApproved(msgParams.metamaskId);
    return this.prepMsgForDecryption(msgParams);
  }

  /**
   * Sets a DecryptMessage status to 'approved' via a call to this._setMsgStatus.
   *
   * @param {number} msgId The id of the DecryptMessage to approve.
   *
   */
  setMsgStatusApproved(msgId) {
    this._setMsgStatus(msgId, 'approved');
  }

  /**
   * Sets a DecryptMessage status to 'decrypted' via a call to this._setMsgStatus and updates that DecryptMessage in
   * this.messages by adding the raw decryption data of the decryption request to the DecryptMessage
   *
   * @param {number} msgId The id of the DecryptMessage to decrypt.
   * @param {buffer} rawData The raw data of the message request
   *
   */
  setMsgStatusDecrypted(msgId, rawData) {
    const msg = this.getMsg(msgId);
    msg.rawData = rawData;
    this._updateMsg(msg);
    this._setMsgStatus(msgId, 'decrypted');
  }

  /**
   * Removes the metamaskId property from passed msgParams and returns a promise which resolves the updated msgParams
   *
   * @param {Object} msgParams The msgParams to modify
   * @returns {Promise<object>} Promises the msgParams with the metamaskId property removed
   *
   */
  prepMsgForDecryption(msgParams) {
    delete msgParams.metamaskId;
    return Promise.resolve(msgParams);
  }

  /**
   * Sets a DecryptMessage status to 'rejected' via a call to this._setMsgStatus.
   *
   * @param {number} msgId The id of the DecryptMessage to reject.
   *
   */
  rejectMsg(msgId) {
    this._setMsgStatus(msgId, 'rejected');
  }

  /**
   * Sets a TypedMessage status to 'errored' via a call to this._setMsgStatus.
   *
   * @param {number} msgId The id of the TypedMessage to error
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

  /**
   * Updates the status of a DecryptMessage in this.messages via a call to this._updateMsg
   *
   * @private
   * @param {number} msgId The id of the DecryptMessage to update.
   * @param {string} status The new status of the DecryptMessage.
   * @throws A 'DecryptMessageManager - DecryptMessage not found for id: "${msgId}".' if there is no DecryptMessage
   * in this.messages with an id equal to the passed msgId
   * @fires An event with a name equal to `${msgId}:${status}`. The DecryptMessage is also fired.
   * @fires If status is 'rejected' or 'decrypted', an event with a name equal to `${msgId}:finished` is fired along
   * with the DecryptMessage
   *
   */
  _setMsgStatus(msgId, status) {
    const msg = this.getMsg(msgId);
    if (!msg) {
      throw new Error(
        `DecryptMessageManager - Message not found for id: "${msgId}".`,
      );
    }
    msg.status = status;
    this._updateMsg(msg);
    this.emit(`${msgId}:${status}`, msg);
    if (
      status === 'rejected' ||
      status === 'decrypted' ||
      status === 'errored'
    ) {
      this.emit(`${msgId}:finished`, msg);
    }
  }

  /**
   * Sets a DecryptMessage in this.messages to the passed DecryptMessage if the ids are equal. Then saves the
   * unapprovedDecryptMsgs index to storage via this._saveMsgList
   *
   * @private
   * @param {DecryptMessage} msg - A DecryptMessage that will replace an existing DecryptMessage (with the same
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
   * Saves the unapproved DecryptMessages, and their count, to this.memStore
   *
   * @private
   * @fires 'updateBadge'
   *
   */
  _saveMsgList() {
    const unapprovedDecryptMsgs = this.getUnapprovedMsgs();
    const unapprovedDecryptMsgCount = Object.keys(unapprovedDecryptMsgs).length;
    this.memStore.updateState({
      unapprovedDecryptMsgs,
      unapprovedDecryptMsgCount,
    });
    this.emit(METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE);
  }

  /**
   * A helper function that converts raw buffer data to a hex, or just returns the data if it is already formatted as a hex.
   *
   * @param {any} data The buffer data to convert to a hex
   * @returns {string} A hex string conversion of the buffer data
   *
   */
  normalizeMsgData(data) {
    try {
      const stripped = stripHexPrefix(data);
      if (stripped.match(hexRe)) {
        return addHexPrefix(stripped);
      }
    } catch (e) {
      log.debug(`Message was not hex encoded, interpreting as utf8.`);
    }

    return bufferToHex(Buffer.from(data, 'utf8'));
  }
}
