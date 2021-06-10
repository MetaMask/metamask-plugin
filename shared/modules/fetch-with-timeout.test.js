import nock from 'nock';

import getFetchWithTimeout from './fetch-with-timeout';

describe('getFetchWithTimeout', () => {
  it('fetches a url', async () => {
    nock('https://api.infura.io').get('/money').reply(200, '{"hodl": false}');

    const fetchWithTimeout = getFetchWithTimeout(30000);
    const response = await (
      await fetchWithTimeout('https://api.infura.io/money')
    ).json();
    expect(response).toStrictEqual({
      hodl: false,
    });
  });

  it('throws when the request hits a custom timeout', async () => {
    nock('https://api.infura.io')
      .get('/moon')
      .delay(2000)
      .reply(200, '{"moon": "2012-12-21T11:11:11Z"}');

    const fetchWithTimeout = getFetchWithTimeout(123);

    await expect(async () => {
      await fetchWithTimeout('https://api.infura.io/moon').then((r) =>
        r.json(),
      );
    }).rejects.toThrow('Aborted');
  });

  it('should abort the request when the custom timeout is hit', async () => {
    nock('https://api.infura.io')
      .get('/moon')
      .delay(2000)
      .reply(200, '{"moon": "2012-12-21T11:11:11Z"}');

    const fetchWithTimeout = getFetchWithTimeout(123);

    await expect(async () => {
      await fetchWithTimeout('https://api.infura.io/moon').then((r) =>
        r.json(),
      );
    }).rejects.toThrow('Aborted');
  });

  it('throws on invalid timeout', async () => {
    await expect(() => getFetchWithTimeout()).toThrow(
      'Must specify positive integer timeout.',
    );
    await expect(() => getFetchWithTimeout(-1)).toThrow(
      'Must specify positive integer timeout.',
    );
    await expect(() => getFetchWithTimeout({})).toThrow(
      'Must specify positive integer timeout.',
    );
    await expect(() => getFetchWithTimeout(true)).toThrow(
      'Must specify positive integer timeout.',
    );
  });
});
