import {
  KOVAN_CHAIN_ID,
  MAINNET_CHAIN_ID,
} from '../../../shared/constants/network';
import { TRANSACTION_STATUSES } from '../../../shared/constants/transaction';
import {
  unapprovedMessagesSelector,
  transactionsSelector,
  nonceSortedTransactionsSelector,
  nonceSortedPendingTransactionsSelector,
  nonceSortedCompletedTransactionsSelector,
  submittedPendingTransactionsSelector,
} from './transactions';

describe('Transaction Selectors', () => {
  describe('unapprovedMessagesSelector', () => {
    it('returns eth sign msg from unapprovedMsgs', () => {
      const msg = {
        id: 1,
        msgParams: {
          from: '0xAddress',
          data: '0xData',
          origin: 'origin',
        },
        time: 1,
        status: TRANSACTION_STATUSES.UNAPPROVED,
        type: 'eth_sign',
      };

      const state = {
        metamask: {
          unapprovedMsgs: {
            1: msg,
          },
          provider: {
            chainId: KOVAN_CHAIN_ID,
          },
        },
      };

      const msgSelector = unapprovedMessagesSelector(state);

      expect(Array.isArray(msgSelector)).toStrictEqual(true);
      expect(msgSelector).toStrictEqual([msg]);
    });

    it('returns personal sign from unapprovedPersonalMsgsSelector', () => {
      const msg = {
        id: 1,
        msgParams: {
          from: '0xAddress',
          data: '0xData',
          origin: 'origin',
        },
        time: 1,
        status: TRANSACTION_STATUSES.UNAPPROVED,
        type: 'personal_sign',
      };

      const state = {
        metamask: {
          unapprovedPersonalMsgs: {
            1: msg,
          },
          provider: {
            chainId: KOVAN_CHAIN_ID,
          },
        },
      };

      const msgSelector = unapprovedMessagesSelector(state);

      expect(Array.isArray(msgSelector)).toStrictEqual(true);
      expect(msgSelector).toStrictEqual([msg]);
    });

    it('returns typed message from unapprovedTypedMessagesSelector', () => {
      const msg = {
        id: 1,
        msgParams: {
          data: '0xData',
          from: '0xAddress',
          version: 'V3',
          origin: 'origin',
        },
        time: 1,
        status: TRANSACTION_STATUSES.UNAPPROVED,
        type: 'eth_signTypedData',
      };

      const state = {
        metamask: {
          unapprovedTypedMessages: {
            1: msg,
          },
          provider: {
            chainId: KOVAN_CHAIN_ID,
          },
        },
      };

      const msgSelector = unapprovedMessagesSelector(state);

      expect(Array.isArray(msgSelector)).toStrictEqual(true);
      expect(msgSelector).toStrictEqual([msg]);
    });
  });

  describe('transactionsSelector', () => {
    it('selects the currentNetworkTxList', () => {
      const state = {
        metamask: {
          provider: {
            nickname: 'mainnet',
            chainId: MAINNET_CHAIN_ID,
          },
          featureFlags: {
            showExternalTransactions: false,
          },
          selectedAddress: '0xAddress',
          currentNetworkTxList: [
            {
              id: 0,
              time: 0,
              hash: '0',
              txParams: {
                from: '0xAddress',
                to: '0xRecipient',
              },
            },
            {
              id: 1,
              time: 1,
              hash: '1',
              txParams: {
                from: '0xAddress',
                to: '0xRecipient',
              },
            },
          ],
        },
      };

      const orderedTxList = state.metamask.currentNetworkTxList.sort(
        (a, b) => b.time - a.time,
      );

      const selectedTx = transactionsSelector(state);

      expect(Array.isArray(selectedTx)).toStrictEqual(true);
      expect(selectedTx).toStrictEqual(orderedTxList);
    });
  });

  describe('nonceSortedTransactionsSelector', () => {
    it('returns transaction group nonce sorted tx from from selectedTxList wit', () => {
      const tx1 = {
        id: 0,
        time: 0,
        hash: '0',
        txParams: {
          from: '0xAddress',
          to: '0xRecipient',
          nonce: '0x0',
        },
      };

      const tx2 = {
        id: 1,
        time: 1,
        hash: '1',
        txParams: {
          from: '0xAddress',
          to: '0xRecipient',
          nonce: '0x1',
        },
      };

      const state = {
        metamask: {
          provider: {
            nickname: 'mainnet',
            chainId: MAINNET_CHAIN_ID,
          },
          selectedAddress: '0xAddress',
          featureFlags: {
            showExternalTransactions: false,
          },
          currentNetworkTxList: [tx1, tx2],
        },
      };

      const expectedResult = [
        {
          nonce: '0x0',
          transactions: [tx1],
          initialTransaction: tx1,
          primaryTransaction: tx1,
          hasRetried: false,
          hasCancelled: false,
        },
        {
          nonce: '0x1',
          transactions: [tx2],
          initialTransaction: tx2,
          primaryTransaction: tx2,
          hasRetried: false,
          hasCancelled: false,
        },
      ];

      expect(nonceSortedTransactionsSelector(state)).toStrictEqual(
        expectedResult,
      );
    });
  });

  describe('Sorting Transactions Selectors', () => {
    const submittedTx = {
      id: 0,
      time: 0,
      hash: '0',
      txParams: {
        from: '0xAddress',
        to: '0xRecipient',
        nonce: '0x0',
      },
      status: TRANSACTION_STATUSES.SUBMITTED,
    };

    const unapprovedTx = {
      id: 1,
      time: 1,
      hash: '1',
      txParams: {
        from: '0xAddress',
        to: '0xRecipient',
        nonce: '0x1',
      },
      status: TRANSACTION_STATUSES.UNAPPROVED,
    };

    const approvedTx = {
      id: 2,
      time: 2,
      hash: '2',
      txParams: {
        from: '0xAddress',
        to: '0xRecipient',
        nonce: '0x2',
      },
      status: TRANSACTION_STATUSES.APPROVED,
    };

    const confirmedTx = {
      id: 3,
      time: 3,
      hash: '3',
      txParams: {
        from: '0xAddress',
        to: '0xRecipient',
        nonce: '0x3',
      },
      status: TRANSACTION_STATUSES.CONFIRMED,
    };

    const state = {
      metamask: {
        provider: {
          nickname: 'mainnet',
          chainId: MAINNET_CHAIN_ID,
        },
        selectedAddress: '0xAddress',
        featureFlags: {
          showExternalTransactions: false,
        },
        currentNetworkTxList: [
          submittedTx,
          unapprovedTx,
          approvedTx,
          confirmedTx,
        ],
      },
    };

    it('nonceSortedPendingTransactionsSelector', () => {
      const expectedResult = [
        {
          nonce: submittedTx.txParams.nonce,
          transactions: [submittedTx],
          initialTransaction: submittedTx,
          primaryTransaction: submittedTx,
          hasRetried: false,
          hasCancelled: false,
        },
        {
          nonce: unapprovedTx.txParams.nonce,
          transactions: [unapprovedTx],
          initialTransaction: unapprovedTx,
          primaryTransaction: unapprovedTx,
          hasRetried: false,
          hasCancelled: false,
        },
        {
          nonce: approvedTx.txParams.nonce,
          transactions: [approvedTx],
          initialTransaction: approvedTx,
          primaryTransaction: approvedTx,
          hasRetried: false,
          hasCancelled: false,
        },
      ];

      expect(nonceSortedPendingTransactionsSelector(state)).toStrictEqual(
        expectedResult,
      );
    });

    it('nonceSortedCompletedTransactionsSelector', () => {
      const expectedResult = [
        {
          nonce: confirmedTx.txParams.nonce,
          transactions: [confirmedTx],
          initialTransaction: confirmedTx,
          primaryTransaction: confirmedTx,
          hasRetried: false,
          hasCancelled: false,
        },
      ];

      expect(nonceSortedCompletedTransactionsSelector(state)).toStrictEqual(
        expectedResult,
      );
    });

    it('submittedPendingTransactionsSelector', () => {
      const expectedResult = [submittedTx];
      expect(submittedPendingTransactionsSelector(state)).toStrictEqual(
        expectedResult,
      );
    });
  });
});
