import wallet2 from '../../../test/lib/migrations/002.json';
import migration21 from './021';

describe('wallet2 is migrated successfully with out the BlacklistController', () => {
  it('should delete BlacklistController key', async () => {
    const migratedData = await migration21.migrate(wallet2);
    expect(migratedData.meta.version).toStrictEqual(21);
    expect(!migratedData.data.BlacklistController).toStrictEqual(true);
    expect(!migratedData.data.RecentBlocks).toStrictEqual(true);
  });
});
