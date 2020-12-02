import React, { useMemo, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { getFeatureFlags } from '../../../selectors'
import ListItem from '../../ui/list-item'
import { useTransactionDisplayData } from '../../../hooks/useTransactionDisplayData'
import Preloader from '../../ui/icon/preloader'
import { useI18nContext } from '../../../hooks/useI18nContext'
import { useCancelTransaction } from '../../../hooks/useCancelTransaction'
import { useRetryTransaction } from '../../../hooks/useRetryTransaction'
import Button from '../../ui/button'
import Tooltip from '../../ui/tooltip'
import TransactionListItemDetails from '../transaction-list-item-details'
import { CONFIRM_TRANSACTION_ROUTE } from '../../../helpers/constants/routes'
import { useShouldShowSpeedUp } from '../../../hooks/useShouldShowSpeedUp'
import TransactionStatus from '../transaction-status/transaction-status.component'
import TransactionIcon from '../transaction-icon'
import { useTransactionTimeRemaining } from '../../../hooks/useTransactionTimeRemaining'
import IconWithLabel from '../../ui/icon-with-label'
import {
  TRANSACTION_GROUP_CATEGORIES,
  TRANSACTION_STATUSES,
} from '../../../../../shared/constants/transaction'

export default function TransactionListItem({
  transactionGroup,
  isEarliestNonce = false,
}) {
  const t = useI18nContext()
  const history = useHistory()
  const { hasCancelled } = transactionGroup
  const [showDetails, setShowDetails] = useState(false)

  const {
    initialTransaction: { id },
    primaryTransaction: { err, gasPrice, status, submittedTime },
  } = transactionGroup
  const [cancelEnabled, cancelTransaction] = useCancelTransaction(
    transactionGroup,
  )
  const retryTransaction = useRetryTransaction(transactionGroup)
  const { speedUpAnyTransaction: speedUpAnyTransactionActive } = useSelector(
    getFeatureFlags,
  )
  const shouldShowSpeedUp = useShouldShowSpeedUp(
    transactionGroup,
    isEarliestNonce,
    speedUpAnyTransactionActive,
  )

  const {
    title,
    subtitle,
    subtitleContainsOrigin,
    date,
    category,
    primaryCurrency,
    recipientAddress,
    secondaryCurrency,
    displayedStatusKey,
    isPending,
    senderAddress,
    isSubmitted,
  } = useTransactionDisplayData(transactionGroup)

  const timeRemaining = useTransactionTimeRemaining(
    isSubmitted,
    isEarliestNonce,
    submittedTime,
    gasPrice,
  )

  const isSignatureReq =
    category === TRANSACTION_GROUP_CATEGORIES.SIGNATURE_REQUEST
  const isApproval = category === TRANSACTION_GROUP_CATEGORIES.APPROVAL
  const isUnapproved = status === TRANSACTION_STATUSES.UNAPPROVED
  const isSwap = category === TRANSACTION_GROUP_CATEGORIES.SWAP

  const className = classnames('transaction-list-item', {
    'transaction-list-item--unconfirmed':
      isPending ||
      [
        TRANSACTION_STATUSES.FAILED,
        TRANSACTION_STATUSES.DROPPED,
        TRANSACTION_STATUSES.REJECTED,
      ].includes(displayedStatusKey),
  })

  const toggleShowDetails = useCallback(() => {
    if (isUnapproved) {
      history.push(`${CONFIRM_TRANSACTION_ROUTE}/${id}`)
      return
    }
    setShowDetails((prev) => !prev)
  }, [isUnapproved, history, id])

  const cancelButton = useMemo(() => {
    const btn = (
      <Button
        onClick={cancelTransaction}
        rounded
        className="transaction-list-item__header-button"
        disabled={!cancelEnabled}
      >
        {t('cancel')}
      </Button>
    )
    if (hasCancelled || !isPending || isUnapproved) {
      return null
    }

    return cancelEnabled ? (
      btn
    ) : (
      <Tooltip title={t('notEnoughGas')} position="bottom">
        <div>{btn}</div>
      </Tooltip>
    )
  }, [
    isPending,
    t,
    isUnapproved,
    cancelEnabled,
    cancelTransaction,
    hasCancelled,
  ])

  const speedUpButton = useMemo(() => {
    if (!shouldShowSpeedUp || !isPending || isUnapproved) {
      return null
    }
    return (
      <Button
        type="secondary"
        rounded
        onClick={retryTransaction}
        className="transaction-list-item-details__header-button"
      >
        {t('speedUp')}
      </Button>
    )
  }, [shouldShowSpeedUp, isUnapproved, t, isPending, retryTransaction])

  return (
    <>
      <ListItem
        onClick={toggleShowDetails}
        className={className}
        title={title}
        titleIcon={
          !isUnapproved &&
          isPending &&
          isEarliestNonce && (
            <IconWithLabel
              icon={<Preloader size={16} color="#D73A49" />}
              label={timeRemaining}
            />
          )
        }
        icon={
          <TransactionIcon category={category} status={displayedStatusKey} />
        }
        subtitle={
          <h3>
            <TransactionStatus
              isPending={isPending}
              isEarliestNonce={isEarliestNonce}
              error={err}
              date={date}
              status={displayedStatusKey}
            />
            <span
              className={
                subtitleContainsOrigin
                  ? 'transaction-list-item__origin'
                  : 'transaction-list-item__address'
              }
              title={subtitle}
            >
              {subtitle}
            </span>
          </h3>
        }
        rightContent={
          !isSignatureReq &&
          !isApproval && (
            <>
              <h2
                title={primaryCurrency}
                className="transaction-list-item__primary-currency"
              >
                {primaryCurrency}
              </h2>
              <h3 className="transaction-list-item__secondary-currency">
                {secondaryCurrency}
              </h3>
            </>
          )
        }
      >
        <div className="transaction-list-item__pending-actions">
          {speedUpButton}
          {cancelButton}
        </div>
      </ListItem>
      {showDetails && (
        <TransactionListItemDetails
          title={title}
          onClose={toggleShowDetails}
          transactionGroup={transactionGroup}
          primaryCurrency={primaryCurrency}
          senderAddress={senderAddress}
          recipientAddress={recipientAddress}
          onRetry={retryTransaction}
          showRetry={status === TRANSACTION_STATUSES.FAILED && !isSwap}
          showSpeedUp={shouldShowSpeedUp}
          isEarliestNonce={isEarliestNonce}
          onCancel={cancelTransaction}
          showCancel={isPending && !hasCancelled}
          cancelDisabled={!cancelEnabled}
        />
      )}
    </>
  )
}

TransactionListItem.propTypes = {
  transactionGroup: PropTypes.object.isRequired,
  isEarliestNonce: PropTypes.bool,
}
