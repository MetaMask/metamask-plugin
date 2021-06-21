import { ethErrors } from 'eth-rpc-errors';
import {
  SEVERITIES,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';
import fetchWithCache from '../../../../shared/modules/fetch-with-cache';

const UNRECOGNIZED_CHAIN = {
  id: 'UNRECOGNIZED_CHAIN',
  severity: SEVERITIES.WARNING,
  content: {
    element: 'span',
    children: {
      element: 'MetaMaskTranslation',
      props: {
        translationKey: 'unrecognizedChain',
        variables: [
          {
            element: 'a',
            key: 'unrecognizedChainLink',
            props: {
              href:
                'https://metamask.zendesk.com/hc/en-us/articles/360057142392',
              target: '__blank',
              tabIndex: 0,
            },
            children: {
              element: 'MetaMaskTranslation',
              props: {
                translationKey: 'unrecognizedChainLinkText',
              },
            },
          },
        ],
      },
    },
  },
};

const INVALID_CHAIN = {
  id: 'INVALID_CHAIN',
  severity: SEVERITIES.DANGER,
  content: {
    element: 'span',
    children: {
      element: 'MetaMaskTranslation',
      props: {
        translationKey: 'mismatchedChain',
        variables: [
          {
            element: 'a',
            key: 'mismatchedChainLink',
            props: {
              href:
                'https://metamask.zendesk.com/hc/en-us/articles/360057142392',
              target: '__blank',
              tabIndex: 0,
            },
            children: {
              element: 'MetaMaskTranslation',
              props: {
                translationKey: 'mismatchedChainLinkText',
              },
            },
          },
        ],
      },
    },
  },
};

async function getAlerts(pendingApproval) {
  const alerts = [];
  const safeChainsList = await fetchWithCache(
    'https://chainid.network/chains.json',
  );
  const matchedChain = safeChainsList.find(
    (chain) =>
      chain.chainId === parseInt(pendingApproval.requestData.chainId, 16),
  );
  let validated = Boolean(matchedChain);

  if (matchedChain) {
    if (
      matchedChain.nativeCurrency?.decimals !== 18 ||
      matchedChain.name.toLowerCase() !==
        pendingApproval.requestData.chainName.toLowerCase() ||
      matchedChain.nativeCurrency?.symbol !== pendingApproval.requestData.ticker
    ) {
      validated = false;
    }

    const { origin } = new URL(pendingApproval.requestData.rpcUrl);
    if (!matchedChain.rpc.map((rpc) => new URL(rpc).origin).includes(origin)) {
      validated = false;
    }
  }

  if (!matchedChain) {
    alerts.push(UNRECOGNIZED_CHAIN);
  } else if (!validated) {
    alerts.push(INVALID_CHAIN);
  }
  return alerts;
}

function getValues(pendingApproval, t, actions) {
  return {
    content: [
      {
        element: 'Typography',
        key: 'title',
        children: t('addEthereumChainConfirmationTitle'),
        props: {
          variant: TYPOGRAPHY.H3,
          align: 'center',
          fontWeight: 'bold',
          boxProps: {
            margin: [0, 0, 4],
          },
        },
      },
      {
        element: 'Typography',
        key: 'description',
        children: t('addEthereumChainConfirmationDescription'),
        props: {
          variant: TYPOGRAPHY.H7,
          align: 'center',
          boxProps: {
            margin: [0, 0, 4],
          },
        },
      },
      {
        element: 'Typography',
        key: 'only-add-networks-you-trust',
        children: [
          {
            element: 'b',
            key: 'bolded-text',
            children: `${t('addEthereumChainConfirmationRisks')} `,
          },
          {
            element: 'MetaMaskTranslation',
            key: 'learn-about-risks',
            props: {
              translationKey: 'addEthereumChainConfirmationRisksLearnMore',
              variables: [
                {
                  element: 'a',
                  children: t('addEthereumChainConfirmationRisksLearnMoreLink'),
                  key: 'addEthereumChainConfirmationRisksLearnMoreLink',
                  props: {
                    href:
                      'https://metamask.zendesk.com/hc/en-us/articles/360056196151',
                    target: '__blank',
                  },
                },
              ],
            },
          },
        ],
        props: {
          variant: TYPOGRAPHY.H7,
          align: 'center',
          boxProps: {
            margin: 0,
          },
        },
      },
      {
        element: 'TruncatedDefinitionList',
        key: 'network-details',
        props: {
          title: t('networkDetails'),
          tooltips: {
            [t('networkName')]: t('networkNameDefinition'),
            [t('networkURL')]: t('networkURLDefinition'),
            [t('chainId')]: t('chainIdDefinition'),
            [t('currencySymbol')]: t('currencySymbolDefinition'),
            [t('blockExplorerUrl')]: t('blockExplorerUrlDefinition'),
          },
          dictionary: {
            [t('networkName')]: pendingApproval.requestData.chainName,
            [t('networkURL')]: pendingApproval.requestData.rpcUrl,
            [t('chainId')]: parseInt(pendingApproval.requestData.chainId, 16),
            [t('currencySymbol')]: pendingApproval.requestData.ticker,
            [t('blockExplorerUrl')]: pendingApproval.requestData
              .blockExplorerUrl,
          },
          prefaceKeys: [t('networkName'), t('networkURL'), t('chainId')],
        },
      },
    ],
    approvalText: t('approveButtonText'),
    cancelText: t('cancel'),
    onApprove: () =>
      actions.resolvePendingApproval(
        pendingApproval.id,
        pendingApproval.requestData,
      ),

    onCancel: () =>
      actions.rejectPendingApproval(
        pendingApproval.id,
        ethErrors.provider.userRejectedRequest(),
      ),
  };
}

const addEthereumChain = {
  getAlerts,
  getValues,
};

export default addEthereumChain;
