import ethUtil from 'ethereumjs-util'
import sigUtil from 'eth-sig-util'
import Transaction from 'ethereumjs-tx'

export function decodeSignature (signer, signature, signable, signerClasses) {
  const signerObj = new signerClasses[signer]({
    signable,
  })
  const { r, s, v } = signerObj.decodeSigned(signature)
  const rHex = ethUtil.bufferToHex(r)
  const sHex = ethUtil.bufferToHex(s)
  const vHex = ethUtil.bufferToHex(v)
  return { r: rHex, s: sHex, v: vHex }
}

export function signatureInError (signable, signature, signer) {
  try {
    let tx
    const { r, s, v } = signer.decodeSigned(signature)
    switch (signable.type) {
      case 'sign_transaction':
        tx = new Transaction(signable.payload)
        tx.r = r
        tx.s = s
        tx.v = v
        return !tx.verifySignature()
      case 'sign_message':
        ethUtil.ecrecover(ethUtil.sha3(ethUtil.toBuffer(signable.payload)), ethUtil.bufferToInt(v), r, s)
        return false
      case 'sign_personal_message':
        ethUtil.ecrecover(ethUtil.hashPersonalMessage(ethUtil.toBuffer(signable.payload)), ethUtil.bufferToInt(v), r, s)
        return false
      case 'sign_typed_data':
        ethUtil.ecrecover(sigUtil.sign(signable.payload), ethUtil.bufferToInt(v), r, s)
        return false
      default:
        throw new Error(`Unsupported sign type ${signable.type}`)
    }
  } catch (e) {
    return true
  }
}

