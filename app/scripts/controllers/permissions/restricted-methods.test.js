import pify from 'pify';

import getRestrictedMethods from './restrictedMethods';

describe('restricted methods', function () {
  describe('eth_accounts', function () {
    it('should handle getKeyringAccounts error', async function () {
      const restrictedMethods = getRestrictedMethods({
        getKeyringAccounts: async () => {
          throw new Error('foo');
        },
      });
      const ethAccountsMethod = pify(restrictedMethods.eth_accounts.method);

      const res = {};
      const fooError = new Error('foo');

      await expect(ethAccountsMethod(null, res, null)).rejects.toThrow('foo');

      expect(res).toStrictEqual({ error: fooError });
    });

    it('should handle missing identity for first account when sorting', async function () {
      const restrictedMethods = getRestrictedMethods({
        getIdentities: () => {
          return { '0x7e57e2': {} };
        },
        getKeyringAccounts: async () => ['0x7e57e2', '0x7e57e3'],
      });
      const ethAccountsMethod = pify(restrictedMethods.eth_accounts.method);

      const res = {};
      await expect(ethAccountsMethod(null, res, null)).rejects.toThrow(
        'Missing identity for address 0x7e57e3',
      );
      expect(res.error instanceof Error).toStrictEqual(true);
      expect(Object.keys(res)).toStrictEqual(['error']);
    });

    it('should handle missing identity for second account when sorting', async function () {
      const restrictedMethods = getRestrictedMethods({
        getIdentities: () => {
          return { '0x7e57e3': {} };
        },
        getKeyringAccounts: async () => ['0x7e57e2', '0x7e57e3'],
      });
      const ethAccountsMethod = pify(restrictedMethods.eth_accounts.method);

      const res = {};
      await expect(ethAccountsMethod(null, res, null)).rejects.toThrow(
        'Missing identity for address 0x7e57e2',
      );
      expect(res.error instanceof Error).toStrictEqual(true);
      expect(Object.keys(res)).toStrictEqual(['error']);
    });

    it('should return accounts in keyring order when none are selected', async function () {
      const keyringAccounts = ['0x7e57e2', '0x7e57e3', '0x7e57e4', '0x7e57e5'];
      const restrictedMethods = getRestrictedMethods({
        getIdentities: () => {
          return keyringAccounts.reduce((identities, address) => {
            identities[address] = {};
            return identities;
          }, {});
        },
        getKeyringAccounts: async () => [...keyringAccounts],
      });
      const ethAccountsMethod = pify(restrictedMethods.eth_accounts.method);

      const res = {};
      await ethAccountsMethod(null, res, null);
      expect(res).toStrictEqual({ result: keyringAccounts });
    });

    it('should return accounts in keyring order when all have same last selected time', async function () {
      const keyringAccounts = ['0x7e57e2', '0x7e57e3', '0x7e57e4', '0x7e57e5'];
      const restrictedMethods = getRestrictedMethods({
        getIdentities: () => {
          return keyringAccounts.reduce((identities, address) => {
            identities[address] = { lastSelected: 1000 };
            return identities;
          }, {});
        },
        getKeyringAccounts: async () => [...keyringAccounts],
      });
      const ethAccountsMethod = pify(restrictedMethods.eth_accounts.method);

      const res = {};
      await ethAccountsMethod(null, res, null);
      expect(res).toStrictEqual({ result: keyringAccounts });
    });

    it('should return accounts sorted by last selected (descending)', async function () {
      const keyringAccounts = ['0x7e57e2', '0x7e57e3', '0x7e57e4', '0x7e57e5'];
      const expectedResult = keyringAccounts.slice().reverse();
      const restrictedMethods = getRestrictedMethods({
        getIdentities: () => {
          return keyringAccounts.reduce((identities, address, index) => {
            identities[address] = { lastSelected: index * 1000 };
            return identities;
          }, {});
        },
        getKeyringAccounts: async () => [...keyringAccounts],
      });
      const ethAccountsMethod = pify(restrictedMethods.eth_accounts.method);

      const res = {};
      await ethAccountsMethod(null, res, null);
      expect(res).toStrictEqual({ result: expectedResult });
    });

    it('should return accounts sorted by last selected (descending) with unselected accounts last, in keyring order', async function () {
      const keyringAccounts = [
        '0x7e57e2',
        '0x7e57e3',
        '0x7e57e4',
        '0x7e57e5',
        '0x7e57e6',
      ];
      const expectedResult = [
        '0x7e57e4',
        '0x7e57e2',
        '0x7e57e3',
        '0x7e57e5',
        '0x7e57e6',
      ];
      const restrictedMethods = getRestrictedMethods({
        getIdentities: () => {
          return {
            '0x7e57e2': { lastSelected: 1000 },
            '0x7e57e3': {},
            '0x7e57e4': { lastSelected: 2000 },
            '0x7e57e5': {},
            '0x7e57e6': {},
          };
        },
        getKeyringAccounts: async () => [...keyringAccounts],
      });
      const ethAccountsMethod = pify(restrictedMethods.eth_accounts.method);

      const res = {};
      await ethAccountsMethod(null, res, null);
      expect(res).toStrictEqual({ result: expectedResult });
    });
  });
});
