import migration49 from './049';

describe('migration #49', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 48,
      },
      data: {},
    };

    const newStorage = await migration49.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 49,
    });
  });

  it('should move metaMetricsId to MetaMetricsController', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          metaMetricsId: '0xaab',
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration49.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        bar: 'baz',
      },
      MetaMetricsController: {
        metaMetricsId: '0xaab',
      },
      foo: 'bar',
    });
  });

  it('should move participateInMetaMetrics to MetaMetricsController', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          participateInMetaMetrics: false,
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration49.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        bar: 'baz',
      },
      MetaMetricsController: {
        participateInMetaMetrics: false,
      },
      foo: 'bar',
    });
  });

  it('should move metaMetricsSendCount to MetaMetricsController', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          metaMetricsSendCount: 1,
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration49.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        bar: 'baz',
      },
      MetaMetricsController: {
        metaMetricsSendCount: 1,
      },
      foo: 'bar',
    });
  });

  it('should move all metaMetrics fields to MetaMetricsController', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          metaMetricsSendCount: 1,
          metaMetricsId: '0xaab',
          participateInMetaMetrics: true,
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration49.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        bar: 'baz',
      },
      MetaMetricsController: {
        metaMetricsSendCount: 1,
        metaMetricsId: '0xaab',
        participateInMetaMetrics: true,
      },
      foo: 'bar',
    });
  });

  it('should do nothing if no PreferencesController key', async () => {
    const oldStorage = {
      meta: {},
      data: {
        foo: 'bar',
      },
    };

    const newStorage = await migration49.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      foo: 'bar',
    });
  });
});
