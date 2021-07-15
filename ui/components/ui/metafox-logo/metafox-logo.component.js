import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { getBuildSpecificAsset } from '../../../helpers/utils/build-types';

export default class MetaFoxLogo extends PureComponent {
  static propTypes = {
    onClick: PropTypes.func,
    unsetIconHeight: PropTypes.bool,
    useDark: PropTypes.bool,
  };

  static defaultProps = {
    onClick: undefined,
    useDark: false,
  };

  render() {
    const { onClick, unsetIconHeight, useDark } = this.props;
    const iconProps = unsetIconHeight ? {} : { height: 42, width: 42 };

    return (
      <div
        onClick={onClick}
        className={classnames('app-header__logo-container', {
          'app-header__logo-container--clickable': Boolean(onClick),
        })}
      >
        <img
          height="30"
          src={
            useDark
              ? getBuildSpecificAsset('metafoxLogoHorizontalDark')
              : '/images/logo/metamask-logo-horizontal.svg'
          }
          className={classnames(
            'app-header__metafox-logo',
            'app-header__metafox-logo--horizontal',
          )}
          alt=""
        />
        <img
          {...iconProps}
          src="/images/logo/metamask-fox.svg"
          className={classnames(
            'app-header__metafox-logo',
            'app-header__metafox-logo--icon',
          )}
          alt=""
        />
      </div>
    );
  }
}
