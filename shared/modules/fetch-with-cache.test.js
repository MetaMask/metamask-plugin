import nock from 'nock';
import sinon from 'sinon';

import { getStorageItem, setStorageItem } from './storage-helpers';

jest.mock('./storage-helpers.js', () => ({
  getStorageItem: jest.fn(),
  setStorageItem: jest.fn(),
}));

const fetchWithCache = require('./fetch-with-cache').default;

describe('Fetch with cache', function () {
  afterEach(function () {
    sinon.restore();
    nock.cleanAll();
  });

  it('fetches a url', async function () {
    nock('https://fetchwithcache.metamask.io')
      .get('/price')
      .reply(200, '{"average": 1}');

    const response = await fetchWithCache(
      'https://fetchwithcache.metamask.io/price',
    );
    expect(response).toStrictEqual({
      average: 1,
    });
  });

  it('returns cached response', async function () {
    nock('https://fetchwithcache.metamask.io')
      .get('/price')
      .reply(200, '{"average": 2}');

    getStorageItem.mockReturnValueOnce({
      cachedResponse: { average: 1 },
      cachedTime: Date.now(),
    });

    const response = await fetchWithCache(
      'https://fetchwithcache.metamask.io/price',
    );
    expect(response).toStrictEqual({
      average: 1,
    });
  });

  it('fetches URL again after cache refresh time has passed', async function () {
    nock('https://fetchwithcache.metamask.io')
      .get('/price')
      .reply(200, '{"average": 3}');

    getStorageItem.mockReturnValueOnce({
      cachedResponse: { average: 1 },
      cachedTime: Date.now() - 1000,
    });

    const response = await fetchWithCache(
      'https://fetchwithcache.metamask.io/price',
      {},
      { cacheRefreshTime: 123 },
    );
    expect(response).toStrictEqual({
      average: 3,
    });
  });

  it('should abort the request when the custom timeout is hit', async function () {
    nock('https://fetchwithcache.metamask.io')
      .get('/price')
      .delay(100)
      .reply(200, '{"average": 4}');

    await expect(() =>
      fetchWithCache(
        'https://fetchwithcache.metamask.io/price',
        {},
        { timeout: 20 },
      ),
    ).rejects.toThrow({ name: 'AbortError', message: 'Aborted' });
  });

  it('throws when the response is unsuccessful', async function () {
    nock('https://fetchwithcache.metamask.io')
      .get('/price')
      .reply(500, '{"average": 6}');

    await expect(() =>
      fetchWithCache('https://fetchwithcache.metamask.io/price'),
    ).rejects.toThrow('');
  });

  it('throws when a POST request is attempted', async function () {
    nock('https://fetchwithcache.metamask.io')
      .post('/price')
      .reply(200, '{"average": 7}');

    await expect(() =>
      fetchWithCache('https://fetchwithcache.metamask.io/price', {
        method: 'POST',
      }),
    ).rejects.toThrow('');
  });

  it('throws when the request has a truthy body', async function () {
    nock('https://fetchwithcache.metamask.io')
      .get('/price')
      .reply(200, '{"average": 8}');

    await expect(() =>
      fetchWithCache('https://fetchwithcache.metamask.io/price', { body: 1 }),
    ).rejects.toThrow('');
  });

  it('throws when the request has an invalid Content-Type header', async function () {
    nock('https://fetchwithcache.metamask.io')
      .get('/price')
      .reply(200, '{"average": 9}');

    await expect(() =>
      fetchWithCache('https://fetchwithcache.metamask.io/price', {
        headers: { 'Content-Type': 'text/plain' },
      }),
    ).rejects.toThrow({
      message: 'fetchWithCache only supports JSON responses',
    });
  });

  it('should correctly cache responses from interwoven requests', async function () {
    nock('https://fetchwithcache.metamask.io')
      .get('/foo')
      .reply(200, '{"average": 9}');

    nock('https://fetchwithcache.metamask.io')
      .get('/bar')
      .reply(200, '{"average": 9}');

    const testCache = {};
    getStorageItem.mockImplementation((key) => testCache[key]);
    setStorageItem.mockImplementation((key, value) => {
      testCache[key] = value;
    });

    await Promise.all([
      fetchWithCache(
        'https://fetchwithcache.metamask.io/foo',
        {},
        { cacheRefreshTime: 123 },
      ),
      fetchWithCache(
        'https://fetchwithcache.metamask.io/bar',
        {},
        { cacheRefreshTime: 123 },
      ),
    ]);

    expect(
      testCache['cachedFetch:https://fetchwithcache.metamask.io/foo']
        .cachedResponse,
    ).toStrictEqual({ average: 9 });
    expect(
      testCache['cachedFetch:https://fetchwithcache.metamask.io/bar']
        .cachedResponse,
    ).toStrictEqual({ average: 9 });
  });
});
