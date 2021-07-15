import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Switch, Route } from 'react-router-dom';
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContextProvider } from 'react-dnd';
import {
  INITIALIZE_SEED_PHRASE_ROUTE,
  INITIALIZE_CONFIRM_SEED_PHRASE_ROUTE,
  INITIALIZE_BACKUP_SEED_PHRASE_ROUTE,
  INITIALIZE_SEED_PHRASE_INTRO_ROUTE,
  DEFAULT_ROUTE,
} from '../../../helpers/constants/routes';
import MetaFoxLogo from '../../../components/ui/metafox-logo';
import { isBeta } from '../../../helpers/utils/build-types';
import ConfirmSeedPhrase from './confirm-seed-phrase';
import RevealSeedPhrase from './reveal-seed-phrase';
import SeedPhraseIntro from './seed-phrase-intro';

export default class SeedPhrase extends PureComponent {
  static propTypes = {
    history: PropTypes.object,
    seedPhrase: PropTypes.string,
    verifySeedPhrase: PropTypes.func,
  };

  state = {
    verifiedSeedPhrase: '',
  };

  componentDidMount() {
    const { seedPhrase, history, verifySeedPhrase } = this.props;

    if (!seedPhrase) {
      verifySeedPhrase().then((verifiedSeedPhrase) => {
        if (verifiedSeedPhrase) {
          this.setState({ verifiedSeedPhrase });
        } else {
          history.push(DEFAULT_ROUTE);
        }
      });
    }
  }

  render() {
    const { seedPhrase, history } = this.props;
    const { verifiedSeedPhrase } = this.state;
    const pathname = history?.location?.pathname;
    const introClass =
      pathname === INITIALIZE_SEED_PHRASE_INTRO_ROUTE ? 'intro' : '';

    return (
      <DragDropContextProvider backend={HTML5Backend}>
        <div className={`first-time-flow__wrapper ${introClass}`}>
          <MetaFoxLogo useDark={isBeta()} />
          <Switch>
            <Route
              exact
              path={INITIALIZE_CONFIRM_SEED_PHRASE_ROUTE}
              render={(routeProps) => (
                <ConfirmSeedPhrase
                  {...routeProps}
                  seedPhrase={seedPhrase || verifiedSeedPhrase}
                />
              )}
            />
            <Route
              exact
              path={INITIALIZE_SEED_PHRASE_ROUTE}
              render={(routeProps) => (
                <RevealSeedPhrase
                  {...routeProps}
                  seedPhrase={seedPhrase || verifiedSeedPhrase}
                />
              )}
            />
            <Route
              exact
              path={INITIALIZE_BACKUP_SEED_PHRASE_ROUTE}
              render={(routeProps) => (
                <RevealSeedPhrase
                  {...routeProps}
                  seedPhrase={seedPhrase || verifiedSeedPhrase}
                />
              )}
            />
            <Route
              exact
              path={INITIALIZE_SEED_PHRASE_INTRO_ROUTE}
              render={(routeProps) => (
                <SeedPhraseIntro
                  {...routeProps}
                  seedPhrase={seedPhrase || verifiedSeedPhrase}
                />
              )}
            />
          </Switch>
        </div>
      </DragDropContextProvider>
    );
  }
}
