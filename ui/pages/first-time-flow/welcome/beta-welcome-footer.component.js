import React from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';

const BetaWelcomeFooter = () => {
  const t = useI18nContext();

  return (
    <>
      <div className="welcome-page__header">{t('betaWelcome')}</div>
      <div className="welcome-page__description">
        <p>{t('betaMetamaskDescription')}</p>
        <p>
          {t('betaMetamaskDescriptionExplanation', [
            <a href="https://metamask.io/terms.html" key="terms-link">
              {t('betaMetamaskDescriptionExplanationTermsLinkText')}
            </a>,
            <a href="https://metamask.io/beta-terms.html" key="beta-terms-link">
              {t('betaMetamaskDescriptionExplanationBetaTermsLinkText')}
            </a>,
          ])}
        </p>
      </div>
    </>
  );
};

export default BetaWelcomeFooter;
