import sinon from 'sinon';
import { ENVIRONMENT_TYPE_BACKGROUND } from '../../../shared/constants/app';
import { createSegmentMock } from '../lib/segment';
import {
  METAMETRICS_ANONYMOUS_ID,
  METAMETRICS_BACKGROUND_PAGE_OBJECT,
} from '../../../shared/constants/metametrics';
import waitUntilCalled from '../../../test/lib/wait-until-called';
import MetaMetricsController from './metametrics';
import { NETWORK_EVENTS } from './network';

const segment = createSegmentMock(2, 10000);

const VERSION = '0.0.1-test';
const NETWORK = 'Mainnet';
const FAKE_CHAIN_ID = '0x1338';
const LOCALE = 'en_US';
const TEST_META_METRICS_ID = '0xabc';

const DEFAULT_TEST_CONTEXT = {
  app: { name: 'MetaMask Extension', version: VERSION },
  page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
  referrer: undefined,
  userAgent: window.navigator.userAgent,
};

const DEFAULT_SHARED_PROPERTIES = {
  chain_id: FAKE_CHAIN_ID,
  locale: LOCALE.replace('_', '-'),
  network: NETWORK,
  environment_type: 'background',
};

const DEFAULT_EVENT_PROPERTIES = {
  category: 'Unit Test',
  revenue: undefined,
  value: undefined,
  currency: undefined,
  ...DEFAULT_SHARED_PROPERTIES,
};

const DEFAULT_PAGE_PROPERTIES = {
  ...DEFAULT_SHARED_PROPERTIES,
};

function getMockNetworkController(
  chainId = FAKE_CHAIN_ID,
  provider = { type: NETWORK },
) {
  let networkStore = { chainId, provider };
  const on = sinon.stub().withArgs(NETWORK_EVENTS.NETWORK_DID_CHANGE);
  const updateState = (newState) => {
    networkStore = { ...networkStore, ...newState };
    on.getCall(0).args[1]();
  };
  return {
    store: {
      getState: () => networkStore,
      updateState,
    },
    getCurrentChainId: () => networkStore.chainId,
    getNetworkIdentifier: () => networkStore.provider.type,
    on,
  };
}

function getMockPreferencesStore({ currentLocale = LOCALE } = {}) {
  let preferencesStore = {
    currentLocale,
  };
  const subscribe = sinon.stub();
  const updateState = (newState) => {
    preferencesStore = { ...preferencesStore, ...newState };
    subscribe.getCall(0).args[0](preferencesStore);
  };
  return {
    getState: sinon.stub().returns(preferencesStore),
    updateState,
    subscribe,
  };
}

function getMetaMetricsController({
  participateInMetaMetrics = true,
  metaMetricsId = TEST_META_METRICS_ID,
  metaMetricsSendCount = 0,
  preferencesStore = getMockPreferencesStore(),
  networkController = getMockNetworkController(),
} = {}) {
  return new MetaMetricsController({
    segment,
    getNetworkIdentifier: networkController.getNetworkIdentifier.bind(
      networkController,
    ),
    getCurrentChainId: networkController.getCurrentChainId.bind(
      networkController,
    ),
    onNetworkDidChange: networkController.on.bind(
      networkController,
      NETWORK_EVENTS.NETWORK_DID_CHANGE,
    ),
    preferencesStore,
    version: '0.0.1',
    environment: 'test',
    initState: {
      participateInMetaMetrics,
      metaMetricsId,
      metaMetricsSendCount,
    },
  });
}
describe('MetaMetricsController', () => {
  afterEach(() => {
    // flush the queues manually after each test
    segment.flush();
    sinon.restore();
  });

  describe('constructor', () => {
    it('should properly initialize', () => {
      const metaMetricsController = getMetaMetricsController();
      expect(metaMetricsController.version).toStrictEqual(VERSION);
      expect(metaMetricsController.network).toStrictEqual(NETWORK);
      expect(metaMetricsController.chainId).toStrictEqual(FAKE_CHAIN_ID);
      expect(
        metaMetricsController.state.participateInMetaMetrics,
      ).toStrictEqual(true);
      expect(metaMetricsController.state.metaMetricsId).toStrictEqual(
        TEST_META_METRICS_ID,
      );
      expect(metaMetricsController.locale).toStrictEqual(
        LOCALE.replace('_', '-'),
      );
    });

    it('should update when network changes', () => {
      const networkController = getMockNetworkController();
      const metaMetricsController = getMetaMetricsController({
        networkController,
      });
      expect(metaMetricsController.network).toStrictEqual(NETWORK);
      networkController.store.updateState({
        provider: {
          type: 'NEW_NETWORK',
        },
        chainId: '0xaab',
      });
      expect(metaMetricsController.network).toStrictEqual('NEW_NETWORK');
      expect(metaMetricsController.chainId).toStrictEqual('0xaab');
    });

    it('should update when preferences changes', () => {
      const preferencesStore = getMockPreferencesStore();
      const metaMetricsController = getMetaMetricsController({
        preferencesStore,
      });
      expect(metaMetricsController.network).toStrictEqual(NETWORK);
      preferencesStore.updateState({
        currentLocale: 'en_UK',
      });
      expect(metaMetricsController.locale).toStrictEqual('en-UK');
    });
  });

  describe('generateMetaMetricsId', () => {
    it('should generate an 0x prefixed hex string', () => {
      const metaMetricsController = getMetaMetricsController();
      expect(
        metaMetricsController.generateMetaMetricsId().startsWith('0x'),
      ).toStrictEqual(true);
    });
  });

  describe('setParticipateInMetaMetrics', () => {
    it('should update the value of participateInMetaMetrics', () => {
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: null,
        metaMetricsId: null,
      });
      expect(metaMetricsController.state.participateInMetaMetrics).toBeNull();
      metaMetricsController.setParticipateInMetaMetrics(true);
      expect(
        metaMetricsController.state.participateInMetaMetrics,
      ).toStrictEqual(true);
      metaMetricsController.setParticipateInMetaMetrics(false);
      expect(
        metaMetricsController.state.participateInMetaMetrics,
      ).toStrictEqual(false);
    });
    it('should generate and update the metaMetricsId when set to true', () => {
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: null,
        metaMetricsId: null,
      });
      expect(metaMetricsController.state.metaMetricsId).toBeNull();
      metaMetricsController.setParticipateInMetaMetrics(true);
      expect(typeof metaMetricsController.state.metaMetricsId).toStrictEqual(
        'string',
      );
    });
    it('should nullify the metaMetricsId when set to false', () => {
      const metaMetricsController = getMetaMetricsController();
      metaMetricsController.setParticipateInMetaMetrics(false);
      expect(metaMetricsController.state.metaMetricsId).toBeNull();
    });
  });

  describe('setMetaMetricsSendCount', () => {
    it('should update the send count in state', () => {
      const metaMetricsController = getMetaMetricsController();
      metaMetricsController.setMetaMetricsSendCount(1);
      expect(metaMetricsController.state.metaMetricsSendCount).toStrictEqual(1);
    });
  });

  describe('trackEvent', () => {
    it('should not track an event if user is not participating in metametrics', () => {
      const mock = sinon.mock(segment);
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: false,
      });
      mock.expects('track').never();
      metaMetricsController.trackEvent({
        event: 'Fake Event',
        category: 'Unit Test',
        properties: {
          test: 1,
        },
      });
      expect(mock.verify()).toStrictEqual(true);
    });

    it('should track an event if user has not opted in, but isOptIn is true', () => {
      const mock = sinon.mock(segment);
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: false,
      });
      mock
        .expects('track')
        .once()
        .withArgs({
          event: 'Fake Event',
          anonymousId: METAMETRICS_ANONYMOUS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            test: 1,
            ...DEFAULT_EVENT_PROPERTIES,
          },
        });
      metaMetricsController.trackEvent(
        {
          event: 'Fake Event',
          category: 'Unit Test',
          properties: {
            test: 1,
          },
        },
        { isOptIn: true },
      );
      expect(mock.verify()).toStrictEqual(true);
    });

    it('should track an event during optin and allow for metaMetricsId override', () => {
      const mock = sinon.mock(segment);
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: false,
      });
      mock
        .expects('track')
        .once()
        .withArgs({
          event: 'Fake Event',
          userId: 'TESTID',
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            test: 1,
            ...DEFAULT_EVENT_PROPERTIES,
          },
        });
      metaMetricsController.trackEvent(
        {
          event: 'Fake Event',
          category: 'Unit Test',
          properties: {
            test: 1,
          },
        },
        { isOptIn: true, metaMetricsId: 'TESTID' },
      );
      expect(mock.verify()).toStrictEqual(true);
    });

    it('should track a legacy event', () => {
      const mock = sinon.mock(segment);
      const metaMetricsController = getMetaMetricsController();
      mock
        .expects('track')
        .once()
        .withArgs({
          event: 'Fake Event',
          userId: TEST_META_METRICS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            test: 1,
            legacy_event: true,
            ...DEFAULT_EVENT_PROPERTIES,
          },
        });
      metaMetricsController.trackEvent(
        {
          event: 'Fake Event',
          category: 'Unit Test',
          properties: {
            test: 1,
          },
        },
        { matomoEvent: true },
      );
      expect(mock.verify()).toStrictEqual(true);
    });

    it('should track a non legacy event', () => {
      const mock = sinon.mock(segment);
      const metaMetricsController = getMetaMetricsController();
      mock
        .expects('track')
        .once()
        .withArgs({
          event: 'Fake Event',
          userId: TEST_META_METRICS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            test: 1,
            ...DEFAULT_EVENT_PROPERTIES,
          },
        });
      metaMetricsController.trackEvent({
        event: 'Fake Event',
        category: 'Unit Test',
        properties: {
          test: 1,
        },
      });
      expect(mock.verify()).toStrictEqual(true);
    });

    it('should use anonymousId when metametrics send count is not trackable in send flow', () => {
      const mock = sinon.mock(segment);
      const metaMetricsController = getMetaMetricsController({
        metaMetricsSendCount: 1,
      });
      mock
        .expects('track')
        .once()
        .withArgs({
          event: 'Send Fake Event',
          anonymousId: METAMETRICS_ANONYMOUS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            test: 1,
            ...DEFAULT_EVENT_PROPERTIES,
          },
        });
      metaMetricsController.trackEvent({
        event: 'Send Fake Event',
        category: 'Unit Test',
        properties: {
          test: 1,
        },
      });
      expect(mock.verify()).toStrictEqual(true);
    });

    it('should use user metametrics id when metametrics send count is trackable in send flow', () => {
      const mock = sinon.mock(segment);
      const metaMetricsController = getMetaMetricsController();
      mock
        .expects('track')
        .once()
        .withArgs({
          event: 'Send Fake Event',
          userId: TEST_META_METRICS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            test: 1,
            ...DEFAULT_EVENT_PROPERTIES,
          },
        });
      metaMetricsController.trackEvent(
        {
          event: 'Send Fake Event',
          category: 'Unit Test',
          properties: {
            test: 1,
          },
        },
        { metaMetricsSendCount: 0 },
      );
      expect(mock.verify()).toStrictEqual(true);
    });

    it('should immediately flush queue if flushImmediately set to true', async () => {
      const metaMetricsController = getMetaMetricsController();
      const flushStub = sinon.stub(segment, 'flush');
      waitUntilCalled(flushStub, segment);
      metaMetricsController.trackEvent(
        {
          event: 'Fake Event',
          category: 'Unit Test',
        },
        { flushImmediately: true },
      );
      expect(flushStub.callCount).toStrictEqual(1);
    });

    it('should throw if event or category not provided', async () => {
      const metaMetricsController = getMetaMetricsController();
      await expect(() =>
        metaMetricsController.trackEvent({ event: 'test' }),
      ).rejects.toThrow('Must specify event and category.');

      await expect(() =>
        metaMetricsController.trackEvent({ category: 'test' }),
      ).rejects.toThrow('Must specify event and category.');
    });

    it('should throw if provided sensitiveProperties, when excludeMetaMetricsId is true', async () => {
      const metaMetricsController = getMetaMetricsController();
      await expect(() =>
        metaMetricsController.trackEvent(
          {
            event: 'Fake Event',
            category: 'Unit Test',
            sensitiveProperties: { foo: 'bar' },
          },
          { excludeMetaMetricsId: true },
        ),
      ).rejects.toThrow(
        'sensitiveProperties was specified in an event payload that also set the excludeMetaMetricsId flag',
      );
    });

    it('should track sensitiveProperties in a separate, anonymous event', () => {
      const metaMetricsController = getMetaMetricsController();
      const spy = sinon.spy(segment, 'track');
      metaMetricsController.trackEvent({
        event: 'Fake Event',
        category: 'Unit Test',
        sensitiveProperties: { foo: 'bar' },
      });
      expect(spy.callCount).toStrictEqual(2);
      expect(
        spy.calledWith({
          event: 'Fake Event',
          anonymousId: METAMETRICS_ANONYMOUS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            foo: 'bar',
            ...DEFAULT_EVENT_PROPERTIES,
          },
        }),
      ).toStrictEqual(true);
      expect(
        spy.calledWith({
          event: 'Fake Event',
          userId: TEST_META_METRICS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: DEFAULT_EVENT_PROPERTIES,
        }),
      ).toStrictEqual(true);
    });
  });

  describe('trackPage', () => {
    it('should track a page view', () => {
      const mock = sinon.mock(segment);
      const metaMetricsController = getMetaMetricsController();
      mock
        .expects('page')
        .once()
        .withArgs({
          name: 'home',
          userId: TEST_META_METRICS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            params: null,
            ...DEFAULT_PAGE_PROPERTIES,
          },
        });
      metaMetricsController.trackPage({
        name: 'home',
        params: null,
        environmentType: ENVIRONMENT_TYPE_BACKGROUND,
        page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
      });
      expect(mock.verify()).toStrictEqual(true);
    });

    it('should not track a page view if user is not participating in metametrics', () => {
      const mock = sinon.mock(segment);
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: false,
      });
      mock.expects('page').never();
      metaMetricsController.trackPage({
        name: 'home',
        params: null,
        environmentType: ENVIRONMENT_TYPE_BACKGROUND,
        page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
      });
      expect(mock.verify()).toStrictEqual(true);
    });

    it('should track a page view if isOptInPath is true and user not yet opted in', () => {
      const mock = sinon.mock(segment);
      const metaMetricsController = getMetaMetricsController({
        preferencesStore: getMockPreferencesStore({
          participateInMetaMetrics: null,
        }),
      });
      mock
        .expects('page')
        .once()
        .withArgs({
          name: 'home',
          userId: TEST_META_METRICS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            params: null,
            ...DEFAULT_PAGE_PROPERTIES,
          },
        });
      metaMetricsController.trackPage(
        {
          name: 'home',
          params: null,
          environmentType: ENVIRONMENT_TYPE_BACKGROUND,
          page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
        },
        { isOptInPath: true },
      );
      expect(mock.verify()).toStrictEqual(true);
    });
  });
});
