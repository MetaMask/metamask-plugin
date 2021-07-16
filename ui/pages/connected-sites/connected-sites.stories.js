import React from 'react';

import ConnectedSites from './';

export default {
  title: 'Confirmation Screens',
};

const PageSet = ({ children }) => {
  return children;
};

export const ConnectedSitesComponent = () => {
  return (
    <PageSet>
      <ConnectedSites />
    </PageSet>
  );
};
