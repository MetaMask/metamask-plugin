import ethUtil from 'ethereumjs-util'
import BidirectionalQrSigner from './bidirectional-qr-sign-signer'

export default class Erc67Signer extends BidirectionalQrSigner {

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
    if (signatureUri.match(/^signature:(0x)?[0-9a-fA-F]{130}/u)) {
      return signatureUri.replace(/^signature:/u, '')
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
        return `ethereum:?message=${this.signable.payload}&from=${this.signable.from}`
      case 'sign_personal_message':
        return `ethereum:?personalmessage=${this.signable.payload}&from=${this.signable.from}`
      case 'sign_typed_data':
        return `ethereum:?typeddata=${encodeURIComponent(this.signable.payload)}&from=${this.signable.from}`
      case 'sign_transaction':
        return `ethereum:${this.signable.payload.to}\
?from=${this.signable.from}\
&nonce=${this.signable.payload.nonce}
&gasPrice=${this.signable.payload.gasPrice}
&gasLimit=${this.signable.payload.gasLimit}
&value=${this.signable.payload.value}
&data=${this.signable.payload.data}`
      default:
        throw new Error(`Unsupported sign type ${this.signable.type}`)
    }
  }
}
