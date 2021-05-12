import React from 'react';
import PropTypes from 'prop-types';
import { checksumAddress } from '../../../helpers/utils/util';
import Identicon from '../../ui/identicon';
import AccountMismatchWarning from '../../ui/account-mismatch-warning/account-mismatch-warning.component';

export default function AccountListItem({
  account,
  chainId,
  checksumUsesChainId,
  className,
  displayAddress = false,
  handleClick,
  icon = null,
}) {
  const { name, address, balance } = account || {};

  return (
    <div
      className={`account-list-item ${className}`}
      onClick={() => handleClick?.({ name, address, balance })}
    >
      <div className="account-list-item__top-row">
        <Identicon
          address={address}
          className="account-list-item__identicon"
          diameter={18}
        />

        <div className="account-list-item__account-name">{name || address}</div>

        {icon && <div className="account-list-item__icon">{icon}</div>}

        <AccountMismatchWarning address={address} />
      </div>

      {displayAddress && name && (
        <div className="account-list-item__account-address">
          {checksumAddress(address, chainId, checksumUsesChainId)}
        </div>
      )}
    </div>
  );
}

AccountListItem.propTypes = {
  account: PropTypes.object,
  chainId: PropTypes.string,
  checksumUsesChainId: PropTypes.bool,
  className: PropTypes.string,
  displayAddress: PropTypes.bool,
  handleClick: PropTypes.func,
  icon: PropTypes.node,
};
