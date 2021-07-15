import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../components/ui/button';
import Snackbar from '../../../components/ui/snackbar';
import MetaFoxLogo from '../../../components/ui/metafox-logo';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { returnToOnboardingInitiator } from '../onboarding-initiator-util';
import { isBeta } from '../../../helpers/utils/build-types';

export default class EndOfFlowScreen extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  static propTypes = {
    history: PropTypes.object,
    completionMetaMetricsName: PropTypes.string,
    setCompletedOnboarding: PropTypes.func,
    onboardingInitiator: PropTypes.exact({
      location: PropTypes.string,
      tabId: PropTypes.number,
    }),
  };

  async _beforeUnload() {
    await this._onOnboardingComplete();
  }

  _removeBeforeUnload() {
    window.removeEventListener('beforeunload', this._beforeUnload);
  }

  async _onOnboardingComplete() {
    const { setCompletedOnboarding, completionMetaMetricsName } = this.props;
    await setCompletedOnboarding();
    this.context.metricsEvent({
      eventOpts: {
        category: 'Onboarding',
        action: 'Onboarding Complete',
        name: completionMetaMetricsName,
      },
    });
  }

  onComplete = async () => {
    const { history, onboardingInitiator } = this.props;

    this._removeBeforeUnload();
    await this._onOnboardingComplete();
    if (onboardingInitiator) {
      await returnToOnboardingInitiator(onboardingInitiator);
    }
    history.push(DEFAULT_ROUTE);
  };

  componentDidMount() {
    window.addEventListener('beforeunload', this._beforeUnload.bind(this));
  }

  componentWillUnmount = () => {
    this._removeBeforeUnload();
  };

  render() {
    const { t } = this.context;
    const { onboardingInitiator } = this.props;

    return (
      <div className="end-of-flow">
        <MetaFoxLogo useDark={isBeta()} />
        <div className="end-of-flow__emoji">🎉</div>
        <div className="first-time-flow__header">{t('congratulations')}</div>
        <div className="first-time-flow__text-block end-of-flow__text-1">
          {t('endOfFlowMessage1')}
        </div>
        <div className="first-time-flow__text-block end-of-flow__text-2">
          {t('endOfFlowMessage2')}
        </div>
        <div className="end-of-flow__text-3">
          {`• ${t('endOfFlowMessage3')}`}
        </div>
        <div className="end-of-flow__text-3">
          {`• ${t('endOfFlowMessage4')}`}
        </div>
        <div className="end-of-flow__text-3">
          {`• ${t('endOfFlowMessage5')}`}
        </div>
        <div className="end-of-flow__text-3">
          {`• ${t('endOfFlowMessage6')}`}
        </div>
        <div className="end-of-flow__text-3">
          •{' '}
          {t('endOfFlowMessage7', [
            <a
              target="_blank"
              key="metamaskSupportLink"
              rel="noopener noreferrer"
              href="https://metamask.zendesk.com/hc/en-us/requests/new"
            >
              <span className="first-time-flow__link-text">
                {this.context.t('here')}
              </span>
            </a>,
          ])}
        </div>
        <div className="first-time-flow__text-block end-of-flow__text-4">
          {`*${t('endOfFlowMessage8')}`}&nbsp;
          <a
            href="https://metamask.zendesk.com/hc/en-us/articles/360015489591-Basic-Safety-Tips"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="first-time-flow__link-text">
              {t('endOfFlowMessage9')}
            </span>
          </a>
        </div>
        <Button
          type="primary"
          className="first-time-flow__button"
          onClick={this.onComplete}
        >
          {t('endOfFlowMessage10')}
        </Button>
        {onboardingInitiator ? (
          <Snackbar
            content={t('onboardingReturnNotice', [
              t('endOfFlowMessage10'),
              onboardingInitiator.location,
            ])}
          />
        ) : null}
      </div>
    );
  }
}
