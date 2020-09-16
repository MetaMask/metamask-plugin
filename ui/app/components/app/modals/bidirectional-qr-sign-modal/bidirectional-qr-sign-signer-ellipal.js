import ethUtil from 'ethereumjs-util'
import {
  getUrisForTx,
  decodeSignedTx,
} from 'eth-ellipal-util'
import BidirectionalQrSigner from './bidirectional-qr-sign-signer'

export default class Ellipal extends BidirectionalQrSigner {

  constructor (opts) {
    super(opts)
    if (opts.signable.type !== 'sign_transaction') {
      throw new Error(`Transaction type ${opts.signable.type} not supported`)
    }
    const { nonce, gasPrice, gasLimit, to, value, data, chainId } = opts.signable.payload
    this.chainId = ethUtil.intToHex(parseInt(chainId, 10))
    const txParams = { nonce, gasPrice, gasLimit, to, value, data, chainId }
    this.uris = getUrisForTx({ txParams, fromAddress: opts.signable.from })
  }

  /*
   * Returns the number of QR codes that have to be transmitted.
   * @returns {Number} the number of QR codes to be transmitted
   */
  getQrCount = () => {
    return this.uris.length
  }

  /**
   * Extracts the necessary URI from the signature provided by external signer.
   * @param {String} signatureUri The string read by QR code scanner from external signer
   * @return {String}
   * The function must throw an exception if the signatureUri is invalid.
   */
  decodeSignatureString = (signatureUri) => {
    let signature = signatureUri.match(/^\s*elp:\/\/signed\/.*\/([0-9A-F]{130})/u)
    if (signature) {
      signature = signatureUri.match(/[0-9A-F]{130}/u)
      return signature[0]
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
    return decodeSignedTx({ encodedSignature: signedUri, chainId: this.chainId })
  }

  /**
   * Encode the to be signed tx or message in a format readable by external signer.
   * @param {Number} qrNum the number of QR to be displayed starting from 0
   * @return {String} the encoded tx or message ready for being encoded in QR
   */
  encodeSignRequestUri = (qrNum) => {
    if (qrNum >= this.uris.length) {
      const max = this.uris.length - 1
      throw new Error(`QR code sequence number overflow. Max allowed: ${max} Current: ${qrNum.toString()}`)
    }
    return this.uris[qrNum]
  }
}
