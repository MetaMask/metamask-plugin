import React from 'react';
import InfoTooltip from '../../ui/info-tooltip/info-tooltip';
import TransactionDetailItem from '../transaction-detail-item/transaction-detail-item.component';
import GasTiming from '../gas-timing/gas-timing.component';
import TransactionDetail from '.';

export default {
  title: 'Transaction Detail',
};

const rows = [
  <TransactionDetailItem
    key="line-1"
    detailTitle={
      <>
        Estimated gas fee
        <InfoTooltip contentText="This is the tooltip text" position="top">
          <i className="fa fa-info-circle" />
        </InfoTooltip>
      </>
    }
    detailText="0.00896 ETH"
    detailTotal="$15.73"
    subTitle={<GasTiming />}
    subText={
      <>
        From <strong>$15.73 - $19.81</strong>
      </>
    }
  />,
  <TransactionDetailItem
    key="line-2"
    detailTitle="Total"
    detailText=".0312 ETH"
    detailTotal="$15.77"
    subTitle="Amount + gas fee"
    subText={
      <>
        Up to <strong>$19.85</strong>
      </>
    }
  />,
];

export const basic = () => {
  return (
    <div style={{ width: '400px' }}>
      <TransactionDetail rows={rows} />
    </div>
  );
};

export const editable = () => {
  return (
    <div style={{ width: '400px' }}>
      <TransactionDetail rows={rows} onEdit={() => console.log('Edit!')} />
    </div>
  );
};
