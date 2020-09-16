import ethUtil from 'ethereumjs-util'
import BidirectionalQrSigner from './bidirectional-qr-sign-signer'

export default class ParitySigner extends BidirectionalQrSigner {

  /*
   * Returns the number of QR codes that have to be transmitted.
   * @returns {Number} the number of QR codes to be transmitted
   */
  getQrCount = () => {
    return 1
  }

  /**
   * Extracts the necessary URI from the signature provided by external signer.
   * @param {String} signatureUri The string read by QR code scanner from external signer
   * @return {String}
   * The function must throw an exception if the signatureUri is invalid.
   */
  decodeSignatureString = (signatureUri) => {
    if (signatureUri.match(/^[0-9a-fA-F]{130}/u)) {
      return signatureUri
    }
    throw new Error('Invalid signature')
  }

  /**
   * Extracts signature from signer string.
   * @param {String} signedUri
   * @return {Object} {r, s, v} where r, s, and v are the signature elements
   *
   * This function must be able to process the return value of decodeSignatureString() function.
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
   * @param {Number} qrNum the number of QR to be displayed starting from 0
   * @return {String} the encoded tx or message ready for being encoded in QR
   */
  encodeSignRequestUri = (qrNum) => {
    if (qrNum !== 0) {
      throw new Error('Multiple QR code transmission not supported yet.')
    }
    switch (this.signable.type) {
      case 'sign_message':
        return `{"action":"signData","data":{
        "account":"${ethUtil.stripHexPrefix(this.signable.from)}"
        ,"data":"${ethUtil.stripHexPrefix(this.signable.payload)}"}}`
      case 'sign_transaction':
        return `{"action":"signData","data":{
        "account":"${ethUtil.stripHexPrefix(this.signable.from)}",
        "rlp":"${ethUtil.stripHexPrefix(
          ethUtil.bufferToHex(
            ethUtil.rlp.encode([
              this.signable.payload.nonce,
              this.signable.payload.gasPrice,
              this.signable.payload.gasLimit,
              this.signable.payload.to,
              this.signable.payload.value,
              this.signable.payload.data,
              this.signable.payload.chainId,
              '', // r
              '', // s
            ]),
          ),
        )}"}}`
      case 'sign_personal_message':
        throw new Error('Personal messages are not supported by parity signer.')
      case 'sign_typed_data':
        throw new Error('Typed data is not supported by parity signer.')
      default:
        throw new Error(`Unsupported sign type ${this.signable.type}`)
    }
  }
}
