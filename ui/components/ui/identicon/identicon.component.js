import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import contractMap from '@metamask/contract-metadata';

import { checksumAddress } from '../../../helpers/utils/util';
import Jazzicon from '../jazzicon';
import BlockieIdenticon from './blockieIdenticon';

const getStyles = (diameter) => ({
  height: diameter,
  width: diameter,
  borderRadius: diameter / 2,
});

export default class Identicon extends PureComponent {
  static propTypes = {
    addBorder: PropTypes.bool,
    address: PropTypes.string,
    chainId: PropTypes.string,
    checksumUsesChainId: PropTypes.bool,
    className: PropTypes.string,
    diameter: PropTypes.number,
    image: PropTypes.string,
    useBlockie: PropTypes.bool,
    alt: PropTypes.string,
    imageBorder: PropTypes.bool,
  };

  static defaultProps = {
    addBorder: false,
    address: undefined,
    className: undefined,
    diameter: 46,
    image: undefined,
    useBlockie: false,
    alt: '',
  };

  renderImage() {
    const { className, diameter, image, alt, imageBorder } = this.props;

    return (
      <img
        className={classnames('identicon', className, {
          'identicon__image-border': imageBorder,
        })}
        src={image}
        style={getStyles(diameter)}
        alt={alt}
      />
    );
  }

  renderJazzicon() {
    const { address, className, diameter, alt } = this.props;

    return (
      <Jazzicon
        address={address}
        diameter={diameter}
        className={classnames('identicon', className)}
        style={getStyles(diameter)}
        alt={alt}
      />
    );
  }

  renderBlockie() {
    const { address, className, diameter, alt } = this.props;

    return (
      <div
        className={classnames('identicon', className)}
        style={getStyles(diameter)}
      >
        <BlockieIdenticon address={address} diameter={diameter} alt={alt} />
      </div>
    );
  }

  render() {
    const {
      address,
      chainId,
      checksumUsesChainId,
      image,
      useBlockie,
      addBorder,
      diameter,
    } = this.props;

    if (image) {
      return this.renderImage();
    }

    if (address) {
      const checksummedAddress = checksumAddress(
        address,
        chainId,
        checksumUsesChainId,
      );

      if (contractMap[checksummedAddress]?.logo) {
        return this.renderJazzicon();
      }

      return (
        <div
          className={classnames({ 'identicon__address-wrapper': addBorder })}
        >
          {useBlockie ? this.renderBlockie() : this.renderJazzicon()}
        </div>
      );
    }

    return (
      <div
        style={getStyles(diameter)}
        className="identicon__image-border"
      ></div>
    );
  }
}
