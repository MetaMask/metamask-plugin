import { useEffect } from 'react';
import {
  disconnectGasFeeEstimatePoller,
  getGasFeeEstimatesAndStartPolling,
} from '../store/actions';

export function useSafeGasEstimatePolling() {
  useEffect(() => {
    let active = true;
    let pollToken;
    getGasFeeEstimatesAndStartPolling().then((newPollToken) => {
      if (active) {
        pollToken = newPollToken;
      } else {
        disconnectGasFeeEstimatePoller(newPollToken);
      }
    });
    return () => {
      active = false;
      if (pollToken) {
        disconnectGasFeeEstimatePoller(pollToken);
      }
    };
  }, []);
}
