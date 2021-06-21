import nock from 'nock';

import { setSwapsLiveness } from '../../store/actions';
import { setStorageItem } from '../../../shared/modules/storage-helpers';
import * as swaps from './swaps';

jest.mock('../../store/actions.js', () => ({
  setSwapsLiveness: jest.fn(),
}));

const providerState = {
  chainId: '0x1',
  nickname: '',
  rpcPrefs: {},
  rpcUrl: '',
  ticker: 'ETH',
  type: 'mainnet',
};

describe('Ducks - Swaps', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  describe('fetchSwapsLiveness', () => {
    const cleanFeatureFlagApiCache = () => {
      setStorageItem(
        'cachedFetch:https://api.metaswap.codefi.network/featureFlag',
        null,
      );
    };

    afterEach(() => {
      cleanFeatureFlagApiCache();
    });

    const mockFeatureFlagApiResponse = ({
      active = false,
      replyWithError = false,
    } = {}) => {
      const apiNock = nock('https://api.metaswap.codefi.network').get(
        '/featureFlag',
      );
      if (replyWithError) {
        return apiNock.replyWithError({
          message: 'Server error. Try again later',
          code: 'serverSideError',
        });
      }
      return apiNock.reply(200, {
        active,
      });
    };

    const createGetState = () => {
      return () => ({
        metamask: { provider: { ...providerState } },
      });
    };

    it('returns true if the Swaps feature is enabled', async () => {
      const mockDispatch = jest.fn();
      const featureFlagApiNock = mockFeatureFlagApiResponse({ active: true });
      const isSwapsFeatureEnabled = await swaps.fetchSwapsLiveness()(
        mockDispatch,
        createGetState(),
      );
      expect(featureFlagApiNock.isDone()).toBe(true);
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(setSwapsLiveness).toHaveBeenCalledWith(true);
      expect(isSwapsFeatureEnabled).toBe(true);
    });

    it('returns false if the Swaps feature is disabled', async () => {
      const mockDispatch = jest.fn();
      const featureFlagApiNock = mockFeatureFlagApiResponse({ active: false });
      const isSwapsFeatureEnabled = await swaps.fetchSwapsLiveness()(
        mockDispatch,
        createGetState(),
      );
      expect(featureFlagApiNock.isDone()).toBe(true);
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(setSwapsLiveness).toHaveBeenCalledWith(false);
      expect(isSwapsFeatureEnabled).toBe(false);
    });

    it('returns false if the /featureFlag API call throws an error', async () => {
      const mockDispatch = jest.fn();
      const featureFlagApiNock = mockFeatureFlagApiResponse({
        replyWithError: true,
      });
      const isSwapsFeatureEnabled = await swaps.fetchSwapsLiveness()(
        mockDispatch,
        createGetState(),
      );
      expect(featureFlagApiNock.isDone()).toBe(true);
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(setSwapsLiveness).toHaveBeenCalledWith(false);
      expect(isSwapsFeatureEnabled).toBe(false);
    });

    it('only calls the API once and returns true from cache for the second call', async () => {
      const mockDispatch = jest.fn();
      const featureFlagApiNock = mockFeatureFlagApiResponse({ active: true });
      await swaps.fetchSwapsLiveness()(mockDispatch, createGetState());
      expect(featureFlagApiNock.isDone()).toBe(true);
      const featureFlagApiNock2 = mockFeatureFlagApiResponse({ active: true });
      const isSwapsFeatureEnabled = await swaps.fetchSwapsLiveness()(
        mockDispatch,
        createGetState(),
      );
      expect(featureFlagApiNock2.isDone()).toBe(false); // Second API call wasn't made, cache was used instead.
      expect(mockDispatch).toHaveBeenCalledTimes(2);
      expect(setSwapsLiveness).toHaveBeenCalledWith(true);
      expect(isSwapsFeatureEnabled).toBe(true);
    });
  });
});
