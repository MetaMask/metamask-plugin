import PropTypes from 'prop-types';
import React, { createRef, Component } from 'react';
import MetaMaskLogo from '@metamask/logo';
import { debounce } from 'lodash';

import { getBuildSpecificAsset } from '../../../helpers/utils/build-types';

const directionTargetGenerator = ({ top, left, height, width }) => {
  const horizontalMiddle = left + width / 2;
  const verticalMiddle = top + height / 2;
  return {
    up: { x: horizontalMiddle, y: top - height },
    down: { x: horizontalMiddle, y: top + height * 2 },
    left: { x: left - width, y: verticalMiddle },
    right: { x: left + width * 2, y: verticalMiddle },
    middle: { x: horizontalMiddle, y: verticalMiddle },
  };
};

export default class Mascot extends Component {
  static propTypes = {
    animationEventEmitter: PropTypes.object.isRequired,
    width: PropTypes.string,
    height: PropTypes.string,
    followMouse: PropTypes.bool,
    lookAtTarget: PropTypes.object,
    lookAtDirection: PropTypes.oneOf(['up', 'down', 'left', 'right', 'middle']),
  };

  static defaultProps = {
    width: '200',
    height: '200',
    followMouse: true,
    lookAtTarget: {},
    lookAtDirection: null,
  };

  constructor(props) {
    super(props);

    const { width, height, followMouse } = props;

    this.logo = MetaMaskLogo({
      followMouse,
      pxNotRatio: true,
      width,
      height,
      meshJson: getBuildSpecificAsset('foxMeshJson'),
    });

    this.mascotContainer = createRef();

    this.refollowMouse = debounce(
      this.logo.setFollowMouse.bind(this.logo, true),
      1000,
    );
    this.unfollowMouse = this.logo.setFollowMouse.bind(this.logo, false);
  }

  handleAnimationEvents() {
    // only setup listeners once
    if (this.animations) {
      return;
    }
    this.animations = this.props.animationEventEmitter;
    this.animations.on('point', this.lookAt.bind(this));
    this.animations.on(
      'setFollowMouse',
      this.logo.setFollowMouse.bind(this.logo),
    );
  }

  lookAt(target) {
    this.unfollowMouse();
    this.logo.lookAt(target);
    this.refollowMouse();
  }

  componentDidMount() {
    this.mascotContainer.current.appendChild(this.logo.container);
    this.directionTargetMap = directionTargetGenerator(
      this.mascotContainer.current.getBoundingClientRect(),
    );

    const { lookAtTarget, lookAtDirection } = this.props;

    if (lookAtTarget?.x && lookAtTarget?.y) {
      this.logo.lookAtAndRender(lookAtTarget);
    } else if (lookAtDirection) {
      this.logo.lookAtAndRender(this.directionTargetMap[lookAtDirection]);
    }
  }

  componentDidUpdate(prevProps) {
    const {
      lookAtTarget: prevTarget = {},
      lookAtDirection: prevDirection = null,
      followMouse: prevFollowMouse,
    } = prevProps;
    const { lookAtTarget = {}, followMouse, lookAtDirection } = this.props;

    if (lookAtDirection && prevDirection !== lookAtDirection) {
      this.logo.lookAtAndRender(this.directionTargetMap[lookAtDirection]);
    } else if (
      lookAtTarget?.x !== prevTarget?.x ||
      lookAtTarget?.y !== prevTarget?.y
    ) {
      this.logo.lookAtAndRender(lookAtTarget);
    }
    if (prevFollowMouse !== followMouse) {
      this.unfollowMouse();
      followMouse && this.refollowMouse();
    }
  }

  componentWillUnmount() {
    this.animations = this.props.animationEventEmitter;
    this.animations.removeAllListeners();
    this.logo.container.remove();
    this.logo.stopAnimation();
  }

  render() {
    // this is a bit hacky
    // the event emitter is on `this.props`
    // and we dont get that until render
    this.handleAnimationEvents();
    return <div ref={this.mascotContainer} style={{ zIndex: 0 }} />;
  }
}
