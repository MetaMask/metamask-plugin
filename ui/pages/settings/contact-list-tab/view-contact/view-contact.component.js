import React from 'react';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router-dom';

import Identicon from '../../../../components/ui/identicon';
import Copy from '../../../../components/ui/icon/copy-icon.component';
import Button from '../../../../components/ui/button/button.component';

import Tooltip from '../../../../components/ui/tooltip';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../../../hooks/useCopyToClipboard';
import { getEnvironmentType } from '../../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../../shared/constants/app';

const environmentType = getEnvironmentType();
const isFullScreen = environmentType === ENVIRONMENT_TYPE_FULLSCREEN;

function quadSplit(address) {
  return `0x ${address
    .slice(2)
    .match(/.{1,4}/gu)
    .join(' ')}`;
}

function ViewContact({
  history,
  name,
  address,
  checkSummedAddress,
  memo,
  editRoute,
  listRoute,
}) {
  const t = useI18nContext();
  const [copied, handleCopy] = useCopyToClipboard();

  if (!address) {
    return <Redirect to={{ pathname: listRoute }} />;
  }

  return (
    <div className="settings-page__content-row">
      <div className="settings-page__content-item">
        {isFullScreen ? (
          <div className="settings-page__header address-book__header">
            <div>
              <Identicon address={address} diameter={60} />
            </div>
            <div className="address-book__header__column">
              <p className="address-book__header__name">{name}</p>
              <Button
                className="button btn-secondary address-book__header__button"
                type="secondary"
                onClick={() => {
                  history.push(`${editRoute}/${address}`);
                }}
              >
                {t('edit')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="address-book__view-contact__group">
            <div className="address-book__view-contact__group__label--capitalized">
              {t('userName')}
            </div>
            <div className="address-book__view-contact__group__static-address">
              {name}
            </div>
          </div>
        )}
        <div className="address-book__view-contact__group">
          <div className="address-book__view-contact__group__label">
            {t('ethereumPublicAddress')}
          </div>
          <div className="address-book__view-contact__group__value">
            <div className="address-book__view-contact__group__static-address">
              {quadSplit(checkSummedAddress)}
            </div>
            <Tooltip
              position="bottom"
              title={copied ? t('copiedExclamation') : t('copyToClipboard')}
            >
              <button
                className="address-book__view-contact__group__static-address--copy-icon"
                onClick={() => {
                  handleCopy(checkSummedAddress);
                }}
              >
                <Copy size={20} color="#3098DC" />
              </button>
            </Tooltip>
          </div>
        </div>
        <div className="address-book__view-contact__group">
          <div className="address-book__view-contact__group__label--capitalized">
            {t('memo')}
          </div>
          <div className="address-book__view-contact__group__static-address">
            {memo}
          </div>
        </div>
        {isFullScreen ? (
          ''
        ) : (
          <div className="address-book__view-contact__group">
            <Button
              className="button btn-secondary btn--rounded address-book__view-contact__group__button"
              type="secondary"
              onClick={() => {
                history.push(`${editRoute}/${address}`);
              }}
            >
              {t('edit')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

ViewContact.propTypes = {
  name: PropTypes.string,
  address: PropTypes.string,
  history: PropTypes.object,
  checkSummedAddress: PropTypes.string,
  memo: PropTypes.string,
  editRoute: PropTypes.string,
  listRoute: PropTypes.string.isRequired,
};

export default React.memo(ViewContact);
