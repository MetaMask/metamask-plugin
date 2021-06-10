import migration37 from './037';

describe('migration #37', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 36,
      },
      data: {},
    };

    const newStorage = await migration37.migrate(oldStorage);
    expect(newStorage.meta.version).toStrictEqual(37);
  });

  it('should transform old state to new format', async () => {
    const oldStorage = {
      meta: {},
      data: {
        AddressBookController: {
          addressBook: {
            '0x1De7e54679bfF0c23856FbF547b2394e723FCA91': {
              address: '0x1De7e54679bfF0c23856FbF547b2394e723FCA91',
              chainId: '4',
              memo: '',
              name: 'account 3',
            },
            '0x32Be343B94f860124dC4fEe278FDCBD38C102D88': {
              address: '0x32Be343B94f860124dC4fEe278FDCBD38C102D88',
              chainId: '4',
              memo: '',
              name: 'account 2',
            },
            // there are no repeated addresses by the current implementation
            '0x1De7e54679bfF0c23856FbF547b2394e723FCA93': {
              address: '0x1De7e54679bfF0c23856FbF547b2394e723FCA93',
              chainId: '2',
              memo: '',
              name: 'account 2',
            },
          },
        },
      },
    };

    const newStorage = await migration37.migrate(oldStorage);
    expect(newStorage.data.AddressBookController.addressBook).toStrictEqual({
      4: {
        '0x1De7e54679bfF0c23856FbF547b2394e723FCA91': {
          address: '0x1De7e54679bfF0c23856FbF547b2394e723FCA91',
          chainId: '4',
          isEns: false,
          memo: '',
          name: 'account 3',
        },
        '0x32Be343B94f860124dC4fEe278FDCBD38C102D88': {
          address: '0x32Be343B94f860124dC4fEe278FDCBD38C102D88',
          chainId: '4',
          isEns: false,
          memo: '',
          name: 'account 2',
        },
      },
      2: {
        '0x1De7e54679bfF0c23856FbF547b2394e723FCA93': {
          address: '0x1De7e54679bfF0c23856FbF547b2394e723FCA93',
          chainId: '2',
          isEns: false,
          memo: '',
          name: 'account 2',
        },
      },
    });
  });

  it('ens validation test', async () => {
    const oldStorage = {
      meta: {},
      data: {
        AddressBookController: {
          addressBook: {
            '0x1De7e54679bfF0c23856FbF547b2394e723FCA91': {
              address: '0x1De7e54679bfF0c23856FbF547b2394e723FCA91',
              chainId: '4',
              memo: '',
              name: 'metamask.eth',
            },
          },
        },
      },
    };

    const newStorage = await migration37.migrate(oldStorage);
    expect(newStorage.data.AddressBookController.addressBook).toStrictEqual({
      4: {
        '0x1De7e54679bfF0c23856FbF547b2394e723FCA91': {
          address: '0x1De7e54679bfF0c23856FbF547b2394e723FCA91',
          chainId: '4',
          isEns: true,
          memo: '',
          name: 'metamask.eth',
        },
      },
    });
  });
});
