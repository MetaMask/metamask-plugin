import React, { useContext, useMemo, useRef, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { I18nContext } from '../../../contexts/i18n';
import { useEqualityCheck } from '../../../hooks/useEqualityCheck';
import Button from '../../ui/button';
import Popover from '../../ui/popover';
import { updateViewedNotifications } from '../../../store/actions';
import { getTranslatedUINoficiations } from '../../../../../shared/notifications';
import { getSortedNotificationsToShow } from '../../../selectors';

function getActionFunctions() {
  const actionFunctions = {
    1: () => {
      global.platform.openTab({
        url: 'https://metamask.io/download.html',
      });
    },
    2: () => {
      global.platform.openTab({
        url:
          'https://survey.alchemer.com/s3/6173069/MetaMask-Extension-NPS-January-2021',
      });
    },
    3: () => {
      global.platform.openTab({
        url: 'https://community.metamask.io/t/about-the-security-category/72',
      });
    },
  };

  return actionFunctions;
}

export default function WhatsNewPopup({ onClose }) {
  const t = useContext(I18nContext);

  const actionFunctions = getActionFunctions();

  const notifications = useSelector(getSortedNotificationsToShow);

  const [seenNotifications, setSeenNotifications] = useState({});
  const [imageLoaded, setImageLoaded] = useState(!notifications[0].image);

  const popoverRef = useRef();

  const memoizedNotifications = useEqualityCheck(notifications);
  const idRefMap = useMemo(
    () =>
      memoizedNotifications.reduce(
        (_idRefMap, notification) => ({
          ..._idRefMap,
          [notification.id]: React.createRef(),
        }),
        {},
      ),
    [memoizedNotifications],
  );

  useEffect(() => {
    let observer;
    if (imageLoaded) {
      observer = new window.IntersectionObserver(
        (entries, _observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const [id, ref] = Object.entries(idRefMap).find(([_, _ref]) =>
                _ref.current.isSameNode(entry.target),
              );

              setSeenNotifications((_seenNotifications) => ({
                ..._seenNotifications,
                [id]: true,
              }));

              _observer.unobserve(ref.current);
            }
          });
        },
        {
          root: popoverRef.current,
          threshold: 1.0,
        },
      );

      Object.values(idRefMap).forEach((ref) => {
        observer.observe(ref.current);
      });
    }

    return () => {
      observer?.disconnect();
    };
  }, [idRefMap, setSeenNotifications, imageLoaded]);

  const renderFirstNotification = (notification, id, date) => {
    return (
      <div
        className={classnames(
          'whats-new-popup__notification whats-new-popup__first-notification',
        )}
        key="whats-new-popop-notificatiion-0"
        ref={idRefMap[id]}
      >
        {notification.image && (
          <img
            className="whats-new-popup__notification-image"
            src={notification.image}
            onLoad={() => setImageLoaded(true)}
          />
        )}
        <div className="whats-new-popup__notification-title">
          {notification.title}
        </div>
        <div className="whats-new-popup__description-and-date">
          <div className="whats-new-popup__notification-description">
            {notification.description}
          </div>
          <div className="whats-new-popup__notification-date">{date}</div>
        </div>
        {notification.actionText && (
          <Button
            type="secondary"
            className="whats-new-popup__button"
            rounded
            onClick={actionFunctions[id]}
          >
            {notification.actionText}
          </Button>
        )}
      </div>
    );
  };

  const renderSubsequentNotification = (notification, id, date, index) => {
    return (
      <div
        className={classnames('whats-new-popup__notification')}
        key={`whats-new-popop-notificatiion-${index}`}
        ref={idRefMap[id]}
      >
        <div className="whats-new-popup__notification-title">
          {notification.title}
        </div>
        <div className="whats-new-popup__description-and-date">
          <div className="whats-new-popup__notification-description">
            {notification.description}
          </div>
          <div className="whats-new-popup__notification-date">{date}</div>
        </div>
        <div className="whats-new-popup__link" onClick={actionFunctions[id]}>
          {notification.actionText}
        </div>
      </div>
    );
  };

  return (
    <Popover
      className="whats-new-popup__popover"
      title={t('whatsNew')}
      onClose={() => {
        updateViewedNotifications(seenNotifications);
        onClose();
      }}
      popoverRef={popoverRef}
      mediumHeight
    >
      <div className="whats-new-popup__notifications">
        {notifications.map(({ id, date }, index) => {
          const notification = getTranslatedUINoficiations(t)[id];
          return index === 0
            ? renderFirstNotification(notification, id, date)
            : renderSubsequentNotification(notification, id, date, index);
        })}
      </div>
    </Popover>
  );
}

WhatsNewPopup.propTypes = {
  onClose: PropTypes.func.isRequired,
};
