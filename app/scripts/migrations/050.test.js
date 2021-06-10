import sinon from 'sinon';
import migration50 from './050';

const LEGACY_LOCAL_STORAGE_KEYS = [
  'METASWAP_GAS_PRICE_ESTIMATES_LAST_RETRIEVED',
  'METASWAP_GAS_PRICE_ESTIMATES',
  'cachedFetch',
  'BASIC_PRICE_ESTIMATES_LAST_RETRIEVED',
  'BASIC_PRICE_ESTIMATES',
  'BASIC_GAS_AND_TIME_API_ESTIMATES',
  'BASIC_GAS_AND_TIME_API_ESTIMATES_LAST_RETRIEVED',
  'GAS_API_ESTIMATES_LAST_RETRIEVED',
  'GAS_API_ESTIMATES',
];

describe('migration #50', () => {
  let mockLocalStorageRemoveItem;

  beforeEach(() => {
    mockLocalStorageRemoveItem = jest
      // eslint-disable-next-line no-undef
      .spyOn(Storage.prototype, 'removeItem')
      .mockImplementation();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 49,
      },
      data: {},
    };

    const newStorage = await migration50.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 50,
    });
  });

  it('should call window.localStorage.removeItem for each legacy key', async () => {
    const oldStorage = {
      meta: {
        version: 49,
      },
      data: {},
    };

    await migration50.migrate(oldStorage);
    expect(mockLocalStorageRemoveItem.mock.calls).toHaveLength(9);
    expect(mockLocalStorageRemoveItem.mock.calls[0][0]).toStrictEqual(
      LEGACY_LOCAL_STORAGE_KEYS[0],
    );
    expect(mockLocalStorageRemoveItem.mock.calls[1][0]).toStrictEqual(
      LEGACY_LOCAL_STORAGE_KEYS[1],
    );
    expect(mockLocalStorageRemoveItem.mock.calls[2][0]).toStrictEqual(
      LEGACY_LOCAL_STORAGE_KEYS[2],
    );
    expect(mockLocalStorageRemoveItem.mock.calls[3][0]).toStrictEqual(
      LEGACY_LOCAL_STORAGE_KEYS[3],
    );
    expect(mockLocalStorageRemoveItem.mock.calls[4][0]).toStrictEqual(
      LEGACY_LOCAL_STORAGE_KEYS[4],
    );
    expect(mockLocalStorageRemoveItem.mock.calls[5][0]).toStrictEqual(
      LEGACY_LOCAL_STORAGE_KEYS[5],
    );
    expect(mockLocalStorageRemoveItem.mock.calls[6][0]).toStrictEqual(
      LEGACY_LOCAL_STORAGE_KEYS[6],
    );
    expect(mockLocalStorageRemoveItem.mock.calls[7][0]).toStrictEqual(
      LEGACY_LOCAL_STORAGE_KEYS[7],
    );
    expect(mockLocalStorageRemoveItem.mock.calls[8][0]).toStrictEqual(
      LEGACY_LOCAL_STORAGE_KEYS[8],
    );
  });
});
