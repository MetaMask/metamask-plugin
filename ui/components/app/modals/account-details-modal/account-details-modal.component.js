import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { getAccountLink } from '@metamask/etherscan-link';

import { ethers } from 'ethers';
import AccountModalContainer from '../account-modal-container';
import QrView from '../../../ui/qr-code';
import EditableLabel from '../../../ui/editable-label';
import Button from '../../../ui/button';

import ENS from '../../../../../app/scripts/controllers/ens/ens';
import {
  CHAIN_ID_TO_NETWORK_ID_MAP,
  CHAIN_ID_TO_RPC_URL_MAP,
} from '../../../../../shared/constants/network';

export default class AccountDetailsModal extends Component {
  static propTypes = {
    selectedIdentity: PropTypes.object,
    chainId: PropTypes.string,
    showExportPrivateKeyModal: PropTypes.func,
    setAccountLabel: PropTypes.func,
    keyrings: PropTypes.array,
    rpcPrefs: PropTypes.object,
  };

  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  state = {
    name: this.props.selectedIdentity.name || '',
  };

  componentDidMount() {
    const { address } = this.props.selectedIdentity;
    const { chainId } = this.props;

    if (this.checkAccountLabel(this.state.name)) {
      this.doENSReverseLookup(address, chainId);
    }
  }

  checkAccountLabel(accountLabel) {
    // eslint-disable-next-line require-unicode-regexp
    const regExp = /Account [1-9][0-9]*$/;
    return regExp.test(accountLabel);
  }

  async doENSReverseLookup(addr, chainId) {
    const network = CHAIN_ID_TO_NETWORK_ID_MAP[chainId];

    const url = CHAIN_ID_TO_RPC_URL_MAP[chainId];

    if (ENS.getNetworkEnsSupport(network)) {
      const provider = ethers.getDefaultProvider(url);
      const name = await provider.lookupAddress(addr);
      if (name) {
        this.setState({ name });
      }
    }
  }

  render() {
    const {
      selectedIdentity,
      chainId,
      showExportPrivateKeyModal,
      setAccountLabel,
      keyrings,
      rpcPrefs,
    } = this.props;
    const { address } = selectedIdentity;

    const keyring = keyrings.find((kr) => {
      return kr.accounts.includes(address);
    });

    let exportPrivateKeyFeatureEnabled = true;
    // This feature is disabled for hardware wallets
    if (keyring?.type?.search('Hardware') !== -1) {
      exportPrivateKeyFeatureEnabled = false;
    }

    return (
      <AccountModalContainer className="account-details-modal">
        <EditableLabel
          className="account-details-modal__name"
          defaultValue={this.state.name}
          onSubmit={(label) => setAccountLabel(address, label)}
        />

        <QrView
          Qr={{
            data: address,
          }}
        />

        <div className="account-details-modal__divider" />

        <Button
          type="secondary"
          className="account-details-modal__button"
          onClick={() => {
            const accountLink = getAccountLink(address, chainId, rpcPrefs);
            this.context.trackEvent({
              category: 'Navigation',
              event: 'Clicked Block Explorer Link',
              properties: {
                link_type: 'Account Tracker',
                action: 'Account Details Modal',
                block_explorer_domain: accountLink
                  ? new URL(accountLink)?.hostname
                  : '',
              },
            });
            global.platform.openTab({
              url: accountLink,
            });
          }}
        >
          {rpcPrefs.blockExplorerUrl
            ? this.context.t('blockExplorerView', [
                rpcPrefs.blockExplorerUrl.match(/^https?:\/\/(.+)/u)[1],
              ])
            : this.context.t('viewOnEtherscan')}
        </Button>

        {exportPrivateKeyFeatureEnabled ? (
          <Button
            type="secondary"
            className="account-details-modal__button"
            onClick={() => showExportPrivateKeyModal()}
          >
            {this.context.t('exportPrivateKey')}
          </Button>
        ) : null}
      </AccountModalContainer>
    );
  }
}
