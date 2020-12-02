import { useEffect, useState } from 'react'

/**
 * Evaluates whether the transaction is eligible to be sped up, and registers
 * an effect to check the logic again after the transaction has surpassed 5 seconds
 * of queue time.
 * @param {Object} transactionGroup - the transaction group to check against
 * @param {boolean} isEarliestNonce - Whether this group is currently the earliest nonce
 * @param {boolean} speedUpAnyTransactionActive - Whether user allowed to speed up transaction with any nonce
 */
export function useShouldShowSpeedUp(
  transactionGroup,
  isEarliestNonce,
  speedUpAnyTransactionActive,
) {
  const { transactions, hasRetried } = transactionGroup
  const [earliestTransaction = {}] = transactions
  const { submittedTime } = earliestTransaction
  const [speedUpEnabled, setSpeedUpEnabled] = useState(() => {
    return Date.now() - submittedTime > 5000 && isEarliestNonce && !hasRetried
  })
  useEffect(() => {
    // because this hook is optimized to only run on changes we have to
    // key into the changing time delta between submittedTime and now()
    // and if the status of the transaction changes based on that difference
    // trigger a setState call to tell react to re-render. This effect will
    // also immediately set retryEnabled and not create a timeout if the
    // condition is already met. This effect will run anytime the variables
    // for determining enabled status change
    let timeoutId
    if (!hasRetried && !speedUpEnabled) {
      if (isEarliestNonce || speedUpAnyTransactionActive) {
        if (Date.now() - submittedTime > 5000) {
          setSpeedUpEnabled(true)
        } else {
          timeoutId = setTimeout(() => {
            setSpeedUpEnabled(true)
            clearTimeout(timeoutId)
          }, 5001 - (Date.now() - submittedTime))
        }
      }
    }
    // Anytime the effect is re-ran, make sure to remove a previously set timeout
    // so as to avoid multiple timers potentially overlapping
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [
    submittedTime,
    speedUpEnabled,
    hasRetried,
    isEarliestNonce,
    speedUpAnyTransactionActive,
  ])

  return speedUpEnabled
}
