import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ToggleButton from '../../../components/ui/toggle-button';
import { REVEAL_SEED_ROUTE } from '../../../helpers/constants/routes';
import Button from '../../../components/ui/button';

export default class SecurityTab extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  static propTypes = {
    warning: PropTypes.string,
    history: PropTypes.object,
    participateInMetaMetrics: PropTypes.bool.isRequired,
    setParticipateInMetaMetrics: PropTypes.func.isRequired,
    showExternalTransactions: PropTypes.bool.isRequired,
    setShowExternalTransactionsFeatureFlag: PropTypes.func.isRequired,
    setUsePhishDetect: PropTypes.func.isRequired,
    usePhishDetect: PropTypes.bool.isRequired,
  };

  renderSeedWords() {
    const { t } = this.context;
    const { history } = this.props;

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{t('revealSeedWords')}</span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Button
              type="danger"
              large
              onClick={(event) => {
                event.preventDefault();
                this.context.metricsEvent({
                  eventOpts: {
                    category: 'Settings',
                    action: 'Reveal Seed Phrase',
                    name: 'Reveal Seed Phrase',
                  },
                });
                history.push(REVEAL_SEED_ROUTE);
              }}
            >
              {t('revealSeedWords')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  renderMetaMetricsOptIn() {
    const { t } = this.context;
    const {
      participateInMetaMetrics,
      setParticipateInMetaMetrics,
    } = this.props;

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{t('participateInMetaMetrics')}</span>
          <div className="settings-page__content-description">
            <span>{t('participateInMetaMetricsDescription')}</span>
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={participateInMetaMetrics}
              onToggle={(value) => setParticipateInMetaMetrics(!value)}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    );
  }

  renderExternalTransactionsOptIn() {
    const { t } = this.context;
    const {
      showExternalTransactions,
      setShowExternalTransactionsFeatureFlag,
    } = this.props;

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{t('showExternalTransactions')}</span>
          <div className="settings-page__content-description">
            {t('showExternalTransactionsDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={showExternalTransactions}
              onToggle={(value) =>
                setShowExternalTransactionsFeatureFlag(!value)
              }
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    );
  }

  renderPhishingDetectionToggle() {
    const { t } = this.context;
    const { usePhishDetect, setUsePhishDetect } = this.props;

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{t('usePhishingDetection')}</span>
          <div className="settings-page__content-description">
            {t('usePhishingDetectionDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={usePhishDetect}
              onToggle={(value) => setUsePhishDetect(!value)}
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { warning } = this.props;

    return (
      <div className="settings-page__body">
        {warning && <div className="settings-tab__error">{warning}</div>}
        {this.renderSeedWords()}
        {this.renderExternalTransactionsOptIn()}
        {this.renderPhishingDetectionToggle()}
        {this.renderMetaMetricsOptIn()}
      </div>
    );
  }
}
