import React from 'react';
import { useI18nContext } from '../../hooks/useI18nContext';

const BetaHomeFooter = () => {
  const t = useI18nContext();

  return (
    <>
      <a
        href="https://metamask.zendesk.com/hc/en-us/requests/new"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('needHelpSubmitTicket')}
      </a>{' '}
      |{' '}
      <a
        href="https://community.metamask.io/c/metamask-beta/30"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('needHelpFeedback')}
      </a>
    </>
  );
};

export default BetaHomeFooter;
