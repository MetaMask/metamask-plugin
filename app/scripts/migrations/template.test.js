import migrationTemplate from './template';

const storage = {
  meta: {},
  data: {},
};

describe('storage is migrated successfully', () => {
  it('should work', async () => {
    const migratedData = await migrationTemplate.migrate(storage);
    expect(migratedData.meta.version).toStrictEqual(0);
  });
});
