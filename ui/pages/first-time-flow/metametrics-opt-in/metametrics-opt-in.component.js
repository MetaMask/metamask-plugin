import React, { Component } from 'react';
import PropTypes from 'prop-types';
import MetaFoxLogo from '../../../components/ui/metafox-logo';
import PageContainerFooter from '../../../components/ui/page-container/page-container-footer';
import { isBeta } from '../../../helpers/utils/build-types';

export default class MetaMetricsOptIn extends Component {
  static propTypes = {
    history: PropTypes.object,
    setParticipateInMetaMetrics: PropTypes.func,
    nextRoute: PropTypes.string,
    firstTimeSelectionMetaMetricsName: PropTypes.string,
    participateInMetaMetrics: PropTypes.bool,
  };

  static contextTypes = {
    metricsEvent: PropTypes.func,
    t: PropTypes.func,
  };

  render() {
    const { metricsEvent, t } = this.context;
    const {
      nextRoute,
      history,
      setParticipateInMetaMetrics,
      firstTimeSelectionMetaMetricsName,
      participateInMetaMetrics,
    } = this.props;

    return (
      <div className="metametrics-opt-in">
        <div className="metametrics-opt-in__main">
          <MetaFoxLogo useDark={isBeta()} />
          <div className="metametrics-opt-in__body-graphic">
            <img src="images/metrics-chart.svg" alt="" />
          </div>
          <div className="metametrics-opt-in__title">
            {t('metametricsHelpImproveMetaMask')}
          </div>
          <div className="metametrics-opt-in__body">
            <div className="metametrics-opt-in__description">
              {t('metametricsOptInDescription')}
            </div>
            <div className="metametrics-opt-in__description">
              {t('metametricsCommitmentsIntro')}
            </div>

            <div className="metametrics-opt-in__committments">
              <div className="metametrics-opt-in__row">
                <i className="fa fa-check" />
                <div className="metametrics-opt-in__row-description">
                  {t('metametricsCommitmentsAllowOptOut')}
                </div>
              </div>
              <div className="metametrics-opt-in__row">
                <i className="fa fa-check" />
                <div className="metametrics-opt-in__row-description">
                  {t('metametricsCommitmentsSendAnonymizedEvents')}
                </div>
              </div>
              <div className="metametrics-opt-in__row metametrics-opt-in__break-row">
                <i className="fa fa-times" />
                <div className="metametrics-opt-in__row-description">
                  {t('metametricsCommitmentsNeverCollectKeysEtc', [
                    <span
                      className="metametrics-opt-in__bold"
                      key="neverCollectKeys"
                    >
                      {t('metametricsCommitmentsBoldNever')}
                    </span>,
                  ])}
                </div>
              </div>
              <div className="metametrics-opt-in__row">
                <i className="fa fa-times" />
                <div className="metametrics-opt-in__row-description">
                  {t('metametricsCommitmentsNeverCollectIP', [
                    <span
                      className="metametrics-opt-in__bold"
                      key="neverCollectIP"
                    >
                      {t('metametricsCommitmentsBoldNever')}
                    </span>,
                  ])}
                </div>
              </div>
              <div className="metametrics-opt-in__row">
                <i className="fa fa-times" />
                <div className="metametrics-opt-in__row-description">
                  {t('metametricsCommitmentsNeverSellDataForProfit', [
                    <span
                      className="metametrics-opt-in__bold"
                      key="neverSellData"
                    >
                      {t('metametricsCommitmentsBoldNever')}
                    </span>,
                  ])}
                </div>
              </div>
            </div>
          </div>
          <div className="metametrics-opt-in__footer">
            <PageContainerFooter
              onCancel={async () => {
                await setParticipateInMetaMetrics(false);

                try {
                  if (
                    participateInMetaMetrics === null ||
                    participateInMetaMetrics === true
                  ) {
                    await metricsEvent({
                      eventOpts: {
                        category: 'Onboarding',
                        action: 'Metrics Option',
                        name: 'Metrics Opt Out',
                      },
                      isOptIn: true,
                      flushImmediately: true,
                    });
                  }
                } finally {
                  history.push(nextRoute);
                }
              }}
              cancelText={t('noThanks')}
              hideCancel={false}
              onSubmit={async () => {
                const [, metaMetricsId] = await setParticipateInMetaMetrics(
                  true,
                );
                try {
                  const metrics = [];
                  if (
                    participateInMetaMetrics === null ||
                    participateInMetaMetrics === false
                  ) {
                    metrics.push(
                      metricsEvent({
                        eventOpts: {
                          category: 'Onboarding',
                          action: 'Metrics Option',
                          name: 'Metrics Opt In',
                        },
                        isOptIn: true,
                        flushImmediately: true,
                      }),
                    );
                  }
                  metrics.push(
                    metricsEvent({
                      eventOpts: {
                        category: 'Onboarding',
                        action: 'Import or Create',
                        name: firstTimeSelectionMetaMetricsName,
                      },
                      isOptIn: true,
                      metaMetricsId,
                      flushImmediately: true,
                    }),
                  );
                  await Promise.all(metrics);
                } finally {
                  history.push(nextRoute);
                }
              }}
              submitText={t('affirmAgree')}
              submitButtonType="primary"
              disabled={false}
            />
            <div className="metametrics-opt-in__bottom-text">
              {t('gdprMessage', [
                <a
                  key="metametrics-bottom-text-wrapper"
                  href="https://metamask.io/privacy.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('gdprMessagePrivacyPolicy')}
                </a>,
              ])}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
