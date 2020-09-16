import ethUtil from 'ethereumjs-util'
import log from 'loglevel'

export default class BidirectionalQrSigner {

  /**
   * @param {String} opts.signable.from The signer address.
   * @param {String} opts.signable.type The type of signature requested. Can be either
   * sign_transaction, sign_message, sign_personal_message, sign_typed_data.
   * @param {Object} opts.signable.payload If opts.signable.type equals sign_message, sign_personal_message, or sign_typed_data, the payload is the message data. Otherwise opts.signable.payload contains the Object of tx data the following way:
   * @param {String} opts.signable.payload.nonce nonce hex
   * @param {String} opts.signable.payload.gasPrice gas price hex
   * @param {String} opts.signable.payload.gasLimit gas limit hex
   * @param {String} opts.signable.payload.value eth value to send hex
   * @param {String} opts.signable.payload.data data hex
   * @param {String} opts.signable.payload.chainId chain id dec*/
  constructor (opts) {
    this.signable = opts.signable
  }

  /**
   * Returns the number of QR codes that have to be transmitted.
   * @returns {Number} the number of QR codes to be transmitted
   */
  getQrCount = () => {
    throw new Error('getQrCount() must be implemented.')
  }

  /**
   * Extracts the necessary URI from the signature provided by external signer.
   * @param {String} signatureUri The string read by QR code scanner from external signer
   * @return {String}
   * The function must throw an exception if the signatureUri is invalid.
   */
  decodeSignatureString = (signatureUri) => {
    if (signatureUri.match(/^\s*ethereum:.*/u)) {
      return signatureUri.replace(/^\s*ethereum:/u, '')
    }
    throw new Error('Invalid signature')
  }

  /**
   * Extracts signature from signer string.
   * @param {String} signedUri
   * @return {Object} {r, s, v} where r, s, and v are the signature elements
   */
  decodeSigned = (signedUri) => {
    const stripUri = ethUtil.stripHexPrefix(signedUri)
    const r = ethUtil.toBuffer(`0x${stripUri.substr(0, 64)}`)
    const s = ethUtil.toBuffer(`0x${stripUri.substr(64, 64)}`)
    const v = ethUtil.toBuffer(`0x${stripUri.substr(128, 2)}`)
    return { r, s, v }
  }

  /**
   * Encode the to be signed tx or message in a format readable by external signer.
   * @param {Number} qrNum the number of QR to currently display starting with 0
   * @return {String}
   */
  encodeSignRequestUri = (qrNum) => {
    log.info(`current qr no.: ${qrNum}`)
    throw new Error('encodeSignRequestUri must be implemented.')
  }
}
