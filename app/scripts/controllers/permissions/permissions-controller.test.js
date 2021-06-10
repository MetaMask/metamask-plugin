import { find } from 'lodash';
import sinon from 'sinon';

import {
  constants,
  getters,
  getNotifyDomain,
  getNotifyAllDomains,
  getPermControllerOpts,
} from '../../../../test/mocks/permission-controller';
import {
  getRequestUserApprovalHelper,
  grantPermissions,
} from '../../../../test/helpers/permission-controller-helpers';
import { METADATA_STORE_KEY, METADATA_CACHE_MAX_SIZE } from './enums';

import { PermissionsController } from '.';

const { ERRORS, NOTIFICATIONS, PERMS } = getters;

const {
  ALL_ACCOUNTS,
  ACCOUNTS,
  DUMMY_ACCOUNT,
  DOMAINS,
  PERM_NAMES,
  REQUEST_IDS,
  EXTRA_ACCOUNT,
} = constants;

const initNotifications = () => {
  return Object.values(DOMAINS).reduce((acc, domain) => {
    acc[domain.origin] = [];
    return acc;
  }, {});
};

const initPermController = (notifications = initNotifications()) => {
  return new PermissionsController({
    ...getPermControllerOpts(),
    notifyDomain: getNotifyDomain(notifications),
    notifyAllDomains: getNotifyAllDomains(notifications),
  });
};

describe('permissions controller', () => {
  describe('constructor', () => {
    it('throws on undefined argument', async () => {
      await expect(() => new PermissionsController()).toThrow('undefined');
    });
  });

  describe('getAccounts', () => {
    let permController;

    beforeEach(() => {
      permController = initPermController();
      grantPermissions(
        permController,
        DOMAINS.a.origin,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.a.permitted),
      );
      grantPermissions(
        permController,
        DOMAINS.b.origin,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.b.permitted),
      );
    });

    it('gets permitted accounts for permitted origins', async () => {
      const aAccounts = await permController.getAccounts(DOMAINS.a.origin);
      const bAccounts = await permController.getAccounts(DOMAINS.b.origin);

      expect(aAccounts).toStrictEqual([ACCOUNTS.a.primary]);
      expect(bAccounts).toStrictEqual([ACCOUNTS.b.primary]);
    });

    it('does not get accounts for unpermitted origins', async () => {
      const cAccounts = await permController.getAccounts(DOMAINS.c.origin);
      expect(cAccounts).toStrictEqual([]);
    });

    it('does not handle "metamask" origin as special case', async () => {
      const metamaskAccounts = await permController.getAccounts('metamask');
      expect(metamaskAccounts).toStrictEqual([]);
    });
  });

  describe('hasPermission', () => {
    it('returns correct values', async () => {
      const permController = initPermController();
      grantPermissions(
        permController,
        DOMAINS.a.origin,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.a.permitted),
      );
      grantPermissions(
        permController,
        DOMAINS.b.origin,
        PERMS.finalizedRequests.test_method(),
      );

      expect(
        permController.hasPermission(DOMAINS.a.origin, 'eth_accounts'),
      ).toStrictEqual(true);
      expect(
        permController.hasPermission(DOMAINS.b.origin, 'test_method'),
      ).toStrictEqual(true);

      expect(
        !permController.hasPermission(DOMAINS.a.origin, 'test_method'),
      ).toStrictEqual(true);
      expect(
        !permController.hasPermission(DOMAINS.b.origin, 'eth_accounts'),
      ).toStrictEqual(true);

      expect(
        !permController.hasPermission('foo', 'eth_accounts'),
      ).toStrictEqual(true);
      expect(
        !permController.hasPermission(DOMAINS.b.origin, 'foo'),
      ).toStrictEqual(true);
    });
  });

  describe('clearPermissions', () => {
    it('notifies all appropriate domains and removes permissions', async () => {
      const notifications = initNotifications();
      const permController = initPermController(notifications);

      grantPermissions(
        permController,
        DOMAINS.a.origin,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.a.permitted),
      );
      grantPermissions(
        permController,
        DOMAINS.b.origin,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.b.permitted),
      );
      grantPermissions(
        permController,
        DOMAINS.c.origin,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.c.permitted),
      );

      let aAccounts = await permController.getAccounts(DOMAINS.a.origin);
      let bAccounts = await permController.getAccounts(DOMAINS.b.origin);
      let cAccounts = await permController.getAccounts(DOMAINS.c.origin);

      expect(aAccounts).toStrictEqual([ACCOUNTS.a.primary]);
      expect(bAccounts).toStrictEqual([ACCOUNTS.b.primary]);
      expect(cAccounts).toStrictEqual([ACCOUNTS.c.primary]);

      permController.clearPermissions();

      Object.keys(notifications).forEach((origin) => {
        expect(notifications[origin]).toStrictEqual([
          NOTIFICATIONS.removedAccounts(),
        ]);
      });

      aAccounts = await permController.getAccounts(DOMAINS.a.origin);
      bAccounts = await permController.getAccounts(DOMAINS.b.origin);
      cAccounts = await permController.getAccounts(DOMAINS.c.origin);

      expect(aAccounts).toStrictEqual([]);
      expect(bAccounts).toStrictEqual([]);
      expect(cAccounts).toStrictEqual([]);

      Object.keys(notifications).forEach((origin) => {
        expect(
          permController.permissions.getPermissionsForDomain(origin),
        ).toStrictEqual([]);
      });

      expect(
        Object.keys(permController.permissions.getDomains()),
      ).toStrictEqual([]);
    });
  });

  describe('removePermissionsFor', () => {
    let permController, notifications;

    beforeEach(() => {
      notifications = initNotifications();
      permController = initPermController(notifications);
      grantPermissions(
        permController,
        DOMAINS.a.origin,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.a.permitted),
      );
      grantPermissions(
        permController,
        DOMAINS.b.origin,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.b.permitted),
      );
    });

    it('removes permissions for multiple domains', async () => {
      let aAccounts = await permController.getAccounts(DOMAINS.a.origin);
      let bAccounts = await permController.getAccounts(DOMAINS.b.origin);

      expect(aAccounts).toStrictEqual([ACCOUNTS.a.primary]);
      expect(bAccounts).toStrictEqual([ACCOUNTS.b.primary]);

      permController.removePermissionsFor({
        [DOMAINS.a.origin]: [PERM_NAMES.eth_accounts],
        [DOMAINS.b.origin]: [PERM_NAMES.eth_accounts],
      });

      aAccounts = await permController.getAccounts(DOMAINS.a.origin);
      bAccounts = await permController.getAccounts(DOMAINS.b.origin);

      expect(aAccounts).toStrictEqual([]);
      expect(bAccounts).toStrictEqual([]);

      expect(notifications[DOMAINS.a.origin]).toStrictEqual([
        NOTIFICATIONS.removedAccounts(),
      ]);
      expect(notifications[DOMAINS.b.origin]).toStrictEqual([
        NOTIFICATIONS.removedAccounts(),
      ]);

      expect(
        Object.keys(permController.permissions.getDomains()),
      ).toStrictEqual([]);
    });

    it('only removes targeted permissions from single domain', async () => {
      grantPermissions(
        permController,
        DOMAINS.b.origin,
        PERMS.finalizedRequests.test_method(),
      );

      let bPermissions = permController.permissions.getPermissionsForDomain(
        DOMAINS.b.origin,
      );

      expect.anything(
        bPermissions.length === 2 &&
          find(bPermissions, { parentCapability: PERM_NAMES.eth_accounts }) &&
          find(bPermissions, { parentCapability: PERM_NAMES.test_method }),
      );

      permController.removePermissionsFor({
        [DOMAINS.b.origin]: [PERM_NAMES.test_method],
      });

      bPermissions = permController.permissions.getPermissionsForDomain(
        DOMAINS.b.origin,
      );

      expect.anything(
        bPermissions.length === 1 &&
          find(bPermissions, { parentCapability: PERM_NAMES.eth_accounts }),
      );
    });

    it('removes permissions for a single domain, without affecting another', async () => {
      permController.removePermissionsFor({
        [DOMAINS.b.origin]: [PERM_NAMES.eth_accounts],
      });

      const aAccounts = await permController.getAccounts(DOMAINS.a.origin);
      const bAccounts = await permController.getAccounts(DOMAINS.b.origin);

      expect(aAccounts).toStrictEqual([ACCOUNTS.a.primary]);
      expect(bAccounts).toStrictEqual([]);

      expect(notifications[DOMAINS.a.origin]).toStrictEqual([]);
      expect(notifications[DOMAINS.b.origin]).toStrictEqual([
        NOTIFICATIONS.removedAccounts(),
      ]);

      expect(
        Object.keys(permController.permissions.getDomains()),
      ).toStrictEqual([DOMAINS.a.origin]);
    });

    it('send notification but does not affect permissions for unknown domain', async () => {
      // it knows nothing of this origin
      permController.removePermissionsFor({
        [DOMAINS.c.origin]: [PERM_NAMES.eth_accounts],
      });

      expect(notifications[DOMAINS.c.origin]).toStrictEqual([
        NOTIFICATIONS.removedAccounts(),
      ]);

      const aAccounts = await permController.getAccounts(DOMAINS.a.origin);
      const bAccounts = await permController.getAccounts(DOMAINS.b.origin);

      expect(aAccounts).toStrictEqual([ACCOUNTS.a.primary]);
      expect(bAccounts).toStrictEqual([ACCOUNTS.b.primary]);

      expect(
        Object.keys(permController.permissions.getDomains()),
      ).toStrictEqual([DOMAINS.a.origin, DOMAINS.b.origin]);
    });
  });

  describe('validatePermittedAccounts', () => {
    let permController;

    beforeEach(() => {
      permController = initPermController();
      grantPermissions(
        permController,
        DOMAINS.a.origin,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.a.permitted),
      );
      grantPermissions(
        permController,
        DOMAINS.b.origin,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.b.permitted),
      );
    });

    it('throws error on non-array accounts', async () => {
      await expect(() =>
        permController.validatePermittedAccounts(undefined),
      ).toThrow(ERRORS.validatePermittedAccounts.invalidParam());

      await expect(() =>
        permController.validatePermittedAccounts(false),
      ).toThrow(ERRORS.validatePermittedAccounts.invalidParam());

      await expect(() =>
        permController.validatePermittedAccounts(true),
      ).toThrow(ERRORS.validatePermittedAccounts.invalidParam());

      await expect(() => permController.validatePermittedAccounts({})).toThrow(
        ERRORS.validatePermittedAccounts.invalidParam(),
      );
    });

    it('throws error on empty array of accounts', async () => {
      await expect(() => permController.validatePermittedAccounts([])).toThrow(
        ERRORS.validatePermittedAccounts.invalidParam(),
      );
    });

    it('throws error if any account value is not in keyring', async () => {
      const keyringAccounts = await permController.getKeyringAccounts();

      await expect(() =>
        permController.validatePermittedAccounts([DUMMY_ACCOUNT]),
      ).toThrow(
        ERRORS.validatePermittedAccounts.nonKeyringAccount(DUMMY_ACCOUNT),
      );

      await expect(() =>
        permController.validatePermittedAccounts(
          keyringAccounts.concat(DUMMY_ACCOUNT),
        ),
      ).toThrow(
        ERRORS.validatePermittedAccounts.nonKeyringAccount(DUMMY_ACCOUNT),
      );
    });

    it('succeeds if all accounts are in keyring', async () => {
      const keyringAccounts = await permController.getKeyringAccounts();

      await expect(() =>
        permController.validatePermittedAccounts(keyringAccounts),
      ).not.toThrow();

      await expect(() =>
        permController.validatePermittedAccounts([keyringAccounts[0]]),
      ).not.toThrow();

      await expect(() =>
        permController.validatePermittedAccounts([keyringAccounts[1]]),
      ).not.toThrow();
    });
  });

  describe('addPermittedAccount', () => {
    let permController, notifications;

    beforeEach(() => {
      notifications = initNotifications();
      permController = initPermController(notifications);
      grantPermissions(
        permController,
        DOMAINS.a.origin,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.a.permitted),
      );
      grantPermissions(
        permController,
        DOMAINS.b.origin,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.b.permitted),
      );
    });

    it('should throw if account is not a string', async () => {
      await expect(() =>
        permController.addPermittedAccount(DOMAINS.a.origin, {}),
      ).rejects.toThrow(ERRORS.validatePermittedAccounts.nonKeyringAccount({}));
    });

    it('should throw if given account is not in keyring', async () => {
      await expect(() =>
        permController.addPermittedAccount(DOMAINS.a.origin, DUMMY_ACCOUNT),
      ).rejects.toThrow(
        ERRORS.validatePermittedAccounts.nonKeyringAccount(DUMMY_ACCOUNT),
      );
    });

    it('should throw if origin is invalid', async () => {
      await expect(() =>
        permController.addPermittedAccount(false, EXTRA_ACCOUNT),
      ).rejects.toThrow(ERRORS.addPermittedAccount.invalidOrigin());
    });

    it('should throw if origin lacks any permissions', async () => {
      await expect(() =>
        permController.addPermittedAccount(DOMAINS.c.origin, EXTRA_ACCOUNT),
      ).rejects.toThrow(ERRORS.addPermittedAccount.invalidOrigin());
    });

    it('should throw if origin lacks eth_accounts permission', async () => {
      grantPermissions(
        permController,
        DOMAINS.c.origin,
        PERMS.finalizedRequests.test_method(),
      );

      await expect(() =>
        permController.addPermittedAccount(DOMAINS.c.origin, EXTRA_ACCOUNT),
      ).rejects.toThrow(ERRORS.addPermittedAccount.noEthAccountsPermission());
    });

    it('should throw if account is already permitted', async () => {
      await expect(() =>
        permController.addPermittedAccount(
          DOMAINS.a.origin,
          ACCOUNTS.a.permitted[0],
        ),
      ).rejects.toThrow(ERRORS.addPermittedAccount.alreadyPermitted());
    });

    it('should successfully add permitted account', async () => {
      await permController.addPermittedAccount(DOMAINS.a.origin, EXTRA_ACCOUNT);

      const accounts = await permController._getPermittedAccounts(
        DOMAINS.a.origin,
      );

      expect(accounts).toStrictEqual([...ACCOUNTS.a.permitted, EXTRA_ACCOUNT]);

      expect(notifications[DOMAINS.a.origin][0]).toStrictEqual(
        NOTIFICATIONS.newAccounts([ACCOUNTS.a.primary]),
      );
    });
  });

  describe('removePermittedAccount', () => {
    let permController, notifications;

    beforeEach(() => {
      notifications = initNotifications();
      permController = initPermController(notifications);
      grantPermissions(
        permController,
        DOMAINS.a.origin,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.a.permitted),
      );
      grantPermissions(
        permController,
        DOMAINS.b.origin,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.b.permitted),
      );
    });

    it('should throw if account is not a string', async () => {
      await expect(() =>
        permController.removePermittedAccount(DOMAINS.a.origin, {}),
      ).rejects.toThrow(ERRORS.validatePermittedAccounts.nonKeyringAccount({}));
    });

    it('should throw if given account is not in keyring', async () => {
      await expect(() =>
        permController.removePermittedAccount(DOMAINS.a.origin, DUMMY_ACCOUNT),
      ).rejects.toThrow(
        ERRORS.validatePermittedAccounts.nonKeyringAccount(DUMMY_ACCOUNT),
      );
    });

    it('should throw if origin is invalid', async () => {
      await expect(() =>
        permController.removePermittedAccount(false, EXTRA_ACCOUNT),
      ).rejects.toThrow(ERRORS.removePermittedAccount.invalidOrigin());
    });

    it('should throw if origin lacks any permissions', async () => {
      await expect(() =>
        permController.removePermittedAccount(DOMAINS.c.origin, EXTRA_ACCOUNT),
      ).rejects.toThrow(ERRORS.removePermittedAccount.invalidOrigin());
    });

    it('should throw if origin lacks eth_accounts permission', async () => {
      grantPermissions(
        permController,
        DOMAINS.c.origin,
        PERMS.finalizedRequests.test_method(),
      );

      await expect(() =>
        permController.removePermittedAccount(DOMAINS.c.origin, EXTRA_ACCOUNT),
      ).rejects.toThrow(
        ERRORS.removePermittedAccount.noEthAccountsPermission(),
      );
    });

    it('should throw if account is not permitted', async () => {
      await expect(() =>
        permController.removePermittedAccount(
          DOMAINS.b.origin,
          ACCOUNTS.c.permitted[0],
        ),
      ).rejects.toThrow(ERRORS.removePermittedAccount.notPermitted());
    });

    it('should successfully remove permitted account', async () => {
      await permController.removePermittedAccount(
        DOMAINS.a.origin,
        ACCOUNTS.a.permitted[1],
      );

      const accounts = await permController._getPermittedAccounts(
        DOMAINS.a.origin,
      );

      expect(accounts).toStrictEqual(
        ACCOUNTS.a.permitted.filter((acc) => acc !== ACCOUNTS.a.permitted[1]),
      );

      expect(notifications[DOMAINS.a.origin][0]).toStrictEqual(
        NOTIFICATIONS.newAccounts([ACCOUNTS.a.primary]),
      );
    });

    it('should remove eth_accounts permission if removing only permitted account', async () => {
      await permController.removePermittedAccount(
        DOMAINS.b.origin,
        ACCOUNTS.b.permitted[0],
      );

      const accounts = await permController.getAccounts(DOMAINS.b.origin);

      expect(accounts).toStrictEqual([]);

      const permission = await permController.permissions.getPermission(
        DOMAINS.b.origin,
        PERM_NAMES.eth_accounts,
      );

      expect(permission).toBeUndefined();

      expect(notifications[DOMAINS.b.origin][0]).toStrictEqual(
        NOTIFICATIONS.removedAccounts(),
      );
    });
  });

  describe('removeAllAccountPermissions', () => {
    let permController, notifications;

    beforeEach(() => {
      notifications = initNotifications();
      permController = initPermController(notifications);
      grantPermissions(
        permController,
        DOMAINS.a.origin,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.a.permitted),
      );
      grantPermissions(
        permController,
        DOMAINS.b.origin,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.b.permitted),
      );
      grantPermissions(
        permController,
        DOMAINS.c.origin,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.b.permitted),
      );
    });

    it('should throw if account is not a string', async () => {
      await expect(() =>
        permController.removeAllAccountPermissions({}),
      ).rejects.toThrow(ERRORS.validatePermittedAccounts.nonKeyringAccount({}));
    });

    it('should throw if given account is not in keyring', async () => {
      await expect(() =>
        permController.removeAllAccountPermissions(DUMMY_ACCOUNT),
      ).rejects.toThrow(
        ERRORS.validatePermittedAccounts.nonKeyringAccount(DUMMY_ACCOUNT),
      );
    });

    it('should remove permitted account from single origin', async () => {
      await permController.removeAllAccountPermissions(ACCOUNTS.a.permitted[1]);

      const accounts = await permController._getPermittedAccounts(
        DOMAINS.a.origin,
      );

      expect(accounts).toStrictEqual(
        ACCOUNTS.a.permitted.filter((acc) => acc !== ACCOUNTS.a.permitted[1]),
      );

      expect(notifications[DOMAINS.a.origin][0]).toStrictEqual(
        NOTIFICATIONS.newAccounts([ACCOUNTS.a.primary]),
      );
    });

    it('should permitted account from multiple origins', async () => {
      await permController.removeAllAccountPermissions(ACCOUNTS.b.permitted[0]);

      const bAccounts = await permController.getAccounts(DOMAINS.b.origin);
      expect(bAccounts).toStrictEqual([]);

      const cAccounts = await permController.getAccounts(DOMAINS.c.origin);
      expect(cAccounts).toStrictEqual([]);

      expect(notifications[DOMAINS.b.origin][0]).toStrictEqual(
        NOTIFICATIONS.removedAccounts(),
      );

      expect(notifications[DOMAINS.c.origin][0]).toStrictEqual(
        NOTIFICATIONS.removedAccounts(),
      );
    });

    it('should remove eth_accounts permission if removing only permitted account', async () => {
      await permController.removeAllAccountPermissions(ACCOUNTS.b.permitted[0]);

      const accounts = await permController.getAccounts(DOMAINS.b.origin);

      expect(accounts).toStrictEqual([]);

      const permission = await permController.permissions.getPermission(
        DOMAINS.b.origin,
        PERM_NAMES.eth_accounts,
      );

      expect(permission).toBeUndefined();

      expect(notifications[DOMAINS.b.origin][0]).toStrictEqual(
        NOTIFICATIONS.removedAccounts(),
      );
    });
  });

  describe('finalizePermissionsRequest', () => {
    let permController;

    beforeEach(() => {
      permController = initPermController();
    });

    it('throws on non-keyring accounts', async () => {
      await expect(
        permController.finalizePermissionsRequest(
          PERMS.requests.eth_accounts(),
          [DUMMY_ACCOUNT],
        ),
      ).rejects.toThrow(
        ERRORS.validatePermittedAccounts.nonKeyringAccount(DUMMY_ACCOUNT),
      );
    });

    it('adds caveat to eth_accounts permission', async () => {
      const perm = await permController.finalizePermissionsRequest(
        PERMS.requests.eth_accounts(),
        ACCOUNTS.a.permitted,
      );

      expect(perm).toStrictEqual(
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.a.permitted),
      );
    });

    it('replaces caveat of eth_accounts permission', async () => {
      const perm = await permController.finalizePermissionsRequest(
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.a.permitted),
        ACCOUNTS.b.permitted,
      );

      expect(perm).toStrictEqual(
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.b.permitted),
      );
    });

    it('handles non-eth_accounts permission', async () => {
      const perm = await permController.finalizePermissionsRequest(
        PERMS.finalizedRequests.test_method(),
        ACCOUNTS.b.permitted,
      );

      expect(perm).toStrictEqual(PERMS.finalizedRequests.test_method());
    });
  });

  describe('preferences state update', () => {
    let permController, notifications, preferences, identities;

    beforeEach(() => {
      identities = ALL_ACCOUNTS.reduce((identitiesAcc, account) => {
        identitiesAcc[account] = {};
        return identitiesAcc;
      }, {});
      preferences = {
        getState: sinon.stub(),
        subscribe: sinon.stub(),
      };
      preferences.getState.returns({
        identities,
        selectedAddress: DUMMY_ACCOUNT,
      });
      notifications = initNotifications();
      permController = new PermissionsController({
        ...getPermControllerOpts(),
        notifyDomain: getNotifyDomain(notifications),
        notifyAllDomains: getNotifyAllDomains(notifications),
        preferences,
      });
      grantPermissions(
        permController,
        DOMAINS.b.origin,
        PERMS.finalizedRequests.eth_accounts([
          ...ACCOUNTS.a.permitted,
          EXTRA_ACCOUNT,
        ]),
      );
      grantPermissions(
        permController,
        DOMAINS.c.origin,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.a.permitted),
      );
    });

    it('should throw if given invalid account', async () => {
      expect(preferences.subscribe.calledOnce).toStrictEqual(true);
      expect(preferences.subscribe.firstCall.args).toHaveLength(1);
      const onPreferencesUpdate = preferences.subscribe.firstCall.args[0];

      await expect(() =>
        onPreferencesUpdate({ selectedAddress: {} }),
      ).rejects.toThrow(ERRORS._handleAccountSelected.invalidParams());
    });

    it('should do nothing if account not permitted for any origins', async () => {
      expect(preferences.subscribe.calledOnce).toStrictEqual(true);
      expect(preferences.subscribe.firstCall.args).toHaveLength(1);
      const onPreferencesUpdate = preferences.subscribe.firstCall.args[0];

      await onPreferencesUpdate({ selectedAddress: DUMMY_ACCOUNT });

      expect(notifications[DOMAINS.b.origin]).toStrictEqual([]);
      expect(notifications[DOMAINS.c.origin]).toStrictEqual([]);
    });

    it('should emit notification if account already first in array for each connected site', async () => {
      identities[ACCOUNTS.a.permitted[0]] = { lastSelected: 1000 };
      expect(preferences.subscribe.calledOnce).toStrictEqual(true);
      expect(preferences.subscribe.firstCall.args).toHaveLength(1);
      const onPreferencesUpdate = preferences.subscribe.firstCall.args[0];

      await onPreferencesUpdate({ selectedAddress: ACCOUNTS.a.permitted[0] });

      expect(notifications[DOMAINS.b.origin]).toStrictEqual([
        NOTIFICATIONS.newAccounts([ACCOUNTS.a.primary]),
      ]);
      expect(notifications[DOMAINS.c.origin]).toStrictEqual([
        NOTIFICATIONS.newAccounts([ACCOUNTS.a.primary]),
      ]);
    });

    it('should emit notification just for connected domains', async () => {
      identities[EXTRA_ACCOUNT] = { lastSelected: 1000 };
      expect(preferences.subscribe.calledOnce).toStrictEqual(true);
      expect(preferences.subscribe.firstCall.args).toHaveLength(1);
      const onPreferencesUpdate = preferences.subscribe.firstCall.args[0];

      await onPreferencesUpdate({ selectedAddress: EXTRA_ACCOUNT });

      expect(notifications[DOMAINS.b.origin]).toStrictEqual([
        NOTIFICATIONS.newAccounts([EXTRA_ACCOUNT]),
      ]);
      expect(notifications[DOMAINS.c.origin]).toStrictEqual([]);
    });

    it('should emit notification for multiple connected domains', async () => {
      identities[ACCOUNTS.a.permitted[1]] = { lastSelected: 1000 };
      expect(preferences.subscribe.calledOnce).toStrictEqual(true);
      expect(preferences.subscribe.firstCall.args).toHaveLength(1);
      const onPreferencesUpdate = preferences.subscribe.firstCall.args[0];

      await onPreferencesUpdate({ selectedAddress: ACCOUNTS.a.permitted[1] });

      expect(notifications[DOMAINS.b.origin]).toStrictEqual([
        NOTIFICATIONS.newAccounts([ACCOUNTS.a.permitted[1]]),
      ]);
      expect(notifications[DOMAINS.c.origin]).toStrictEqual([
        NOTIFICATIONS.newAccounts([ACCOUNTS.c.primary]),
      ]);
    });
  });

  describe('approvePermissionsRequest', () => {
    let permController, requestUserApproval;

    beforeEach(() => {
      permController = initPermController();
      requestUserApproval = getRequestUserApprovalHelper(permController);
    });

    it('does nothing if called on non-existing request', async () => {
      sinon.spy(permController, 'finalizePermissionsRequest');

      const request = PERMS.approvedRequest(REQUEST_IDS.a, null);

      await expect(async () => {
        await permController.approvePermissionsRequest(request, null);
      }).not.toThrow();

      expect(permController.finalizePermissionsRequest.notCalled).toStrictEqual(
        true,
      );
    });

    it('rejects request with bad accounts param', async function () {
      const request = PERMS.approvedRequest(
        REQUEST_IDS.a,
        PERMS.requests.eth_accounts(),
      );

      const rejectionPromise = requestUserApproval(REQUEST_IDS.a);

      await permController.approvePermissionsRequest(request, null);

      await expect(async () => {
        await rejectionPromise;
      }).rejects.toThrow('Must provide non-empty array of account(s).');
    });

    it('rejects request with no permissions', async () => {
      const request = PERMS.approvedRequest(REQUEST_IDS.a, {});

      const rejectionPromise = requestUserApproval(REQUEST_IDS.a);

      await permController.approvePermissionsRequest(
        request,
        ACCOUNTS.a.permitted,
      );

      await expect(async () => {
        await rejectionPromise;
      }).rejects.toThrow('Must request at least one permission.');
    });

    it('approves valid request', async () => {
      const request = PERMS.approvedRequest(
        REQUEST_IDS.a,
        PERMS.requests.eth_accounts(),
      );

      const requestApproval = requestUserApproval(REQUEST_IDS.a);

      await permController.approvePermissionsRequest(
        request,
        ACCOUNTS.a.permitted,
      );

      expect(async () => {
        await requestApproval;
      }).not.toThrow(/eth_accounts/u);

      expect(await requestApproval).toStrictEqual(
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.a.permitted),
      );
    });

    it('approves valid requests regardless of order', async () => {
      const request1 = PERMS.approvedRequest(
        REQUEST_IDS.a,
        PERMS.requests.eth_accounts(),
      );
      const request2 = PERMS.approvedRequest(
        REQUEST_IDS.b,
        PERMS.requests.eth_accounts(),
      );
      const request3 = PERMS.approvedRequest(
        REQUEST_IDS.c,
        PERMS.requests.eth_accounts(),
      );

      let perms1, perms2;

      const approval1 = await expect(async () => {
        perms1 = await requestUserApproval(REQUEST_IDS.a, DOMAINS.a.origin);
      }).not.toThrow();

      const approval2 = await expect(async () => {
        perms2 = await requestUserApproval(REQUEST_IDS.b, DOMAINS.b.origin);
      }).not.toThrow();

      // approve out of order
      await permController.approvePermissionsRequest(
        request2,
        ACCOUNTS.b.permitted,
      );
      // add a non-existing request to the mix
      await permController.approvePermissionsRequest(
        request3,
        ACCOUNTS.c.permitted,
      );
      await permController.approvePermissionsRequest(
        request1,
        ACCOUNTS.a.permitted,
      );

      await approval1;
      await approval2;

      expect(perms1).toStrictEqual(
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.a.permitted),
      );

      expect(perms2).toStrictEqual(
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.b.permitted),
      );
    });
  });

  describe('rejectPermissionsRequest', () => {
    let permController, requestUserApproval;

    beforeEach(() => {
      permController = initPermController();
      requestUserApproval = getRequestUserApprovalHelper(permController);
    });

    it('does nothing if called on non-existing request', async () => {
      permController.approvals.add = sinon.fake.throws(
        new Error('should not call add'),
      );

      await expect(() => {
        permController.rejectPermissionsRequest(REQUEST_IDS.a);
      }).not.toThrow();
    });

    it('rejects single existing request', async () => {
      const requestApproval = requestUserApproval(REQUEST_IDS.a);

      await permController.rejectPermissionsRequest(REQUEST_IDS.a);

      await expect(async () => {
        await requestApproval;
      }).rejects.toThrow(ERRORS.rejectPermissionsRequest.rejection());
    });

    it('rejects requests regardless of order', async () => {
      const requestRejection1 = requestUserApproval(
        REQUEST_IDS.b,
        DOMAINS.b.origin,
      );
      const requestRejection2 = requestUserApproval(
        REQUEST_IDS.c,
        DOMAINS.c.origin,
      );

      // reject out of order
      await permController.rejectPermissionsRequest(REQUEST_IDS.c);
      // add a non-existing request to the mix
      await permController.rejectPermissionsRequest(REQUEST_IDS.a);
      await permController.rejectPermissionsRequest(REQUEST_IDS.b);

      await expect(async () => {
        await requestRejection1;
      }).rejects.toThrow(ERRORS.rejectPermissionsRequest.rejection());

      await expect(async () => {
        await requestRejection2;
      }).rejects.toThrow(ERRORS.rejectPermissionsRequest.rejection());
    });
  });

  // see permissions-middleware-test for testing the middleware itself
  describe('createMiddleware', () => {
    let permController, clock;

    beforeEach(() => {
      permController = initPermController();
      clock = sinon.useFakeTimers(1);
    });

    afterEach(() => {
      clock.restore();
    });

    it('should throw on bad origin', async () => {
      await expect(() =>
        permController.createMiddleware({ origin: {} }),
      ).toThrow(ERRORS.createMiddleware.badOrigin());

      await expect(() =>
        permController.createMiddleware({ origin: '' }),
      ).toThrow(ERRORS.createMiddleware.badOrigin());

      await expect(() => permController.createMiddleware({})).toThrow(
        ERRORS.createMiddleware.badOrigin(),
      );
    });

    it('should create a middleware', async () => {
      let middleware;
      await expect(() => {
        middleware = permController.createMiddleware({
          origin: DOMAINS.a.origin,
        });
      }).not.toThrow();

      expect(typeof middleware).toStrictEqual('function');
    });

    it('should create a middleware with extensionId', async () => {
      const extensionId = 'fooExtension';

      let middleware;
      await expect(() => {
        middleware = permController.createMiddleware({
          origin: DOMAINS.a.origin,
          extensionId,
        });
      }).not.toThrow();

      expect(typeof middleware).toStrictEqual('function');

      const metadataStore = permController.store.getState()[METADATA_STORE_KEY];

      expect(metadataStore[DOMAINS.a.origin]).toStrictEqual({
        extensionId,
        lastUpdated: 1,
      });
    });
  });

  describe('notifyAccountsChanged', () => {
    let notifications, permController;

    beforeEach(() => {
      notifications = initNotifications();
      permController = initPermController(notifications);
      sinon.spy(permController.permissionsLog, 'updateAccountsHistory');
    });

    it('notifyAccountsChanged records history and sends notification', async () => {
      sinon.spy(permController, '_isUnlocked');

      permController.notifyAccountsChanged(
        DOMAINS.a.origin,
        ACCOUNTS.a.permitted,
      );

      expect(permController._isUnlocked.calledOnce).toStrictEqual(true);

      expect(
        permController.permissionsLog.updateAccountsHistory.calledOnce,
      ).toStrictEqual(true);

      expect(notifications[DOMAINS.a.origin]).toStrictEqual([
        NOTIFICATIONS.newAccounts(ACCOUNTS.a.permitted),
      ]);
    });

    it('notifyAccountsChanged does nothing if _isUnlocked returns false', async () => {
      permController._isUnlocked = sinon.fake.returns(false);

      permController.notifyAccountsChanged(
        DOMAINS.a.origin,
        ACCOUNTS.a.permitted,
      );

      expect(permController._isUnlocked.calledOnce).toStrictEqual(true);

      expect(
        permController.permissionsLog.updateAccountsHistory.notCalled,
      ).toStrictEqual(true);
    });

    it('notifyAccountsChanged throws on invalid origin', async () => {
      await expect(
        async () =>
          await permController.notifyAccountsChanged(4, ACCOUNTS.a.permitted),
      ).rejects.toThrow(ERRORS.notifyAccountsChanged.invalidOrigin(4));

      await expect(
        async () =>
          await permController.notifyAccountsChanged('', ACCOUNTS.a.permitted),
      ).rejects.toThrow(ERRORS.notifyAccountsChanged.invalidOrigin(''));
    });

    it('notifyAccountsChanged throws on invalid accounts', async () => {
      await expect(
        async () =>
          await permController.notifyAccountsChanged(DOMAINS.a.origin, 4),
      ).rejects.toThrow(ERRORS.notifyAccountsChanged.invalidAccounts());

      await expect(
        async () =>
          await permController.notifyAccountsChanged(DOMAINS.a.origin, null),
      ).rejects.toThrow(ERRORS.notifyAccountsChanged.invalidAccounts());
    });
  });

  describe('addDomainMetadata', () => {
    let permController, clock;

    function getMockMetadata(size) {
      const dummyData = {};
      for (let i = 0; i < size; i++) {
        const key = i.toString();
        dummyData[key] = {};
      }
      return dummyData;
    }

    beforeEach(() => {
      permController = initPermController();
      permController._setDomainMetadata = sinon.fake();
      clock = sinon.useFakeTimers(1);
    });

    afterEach(() => {
      clock.restore();
    });

    it('calls setter function with expected new state when adding domain', () => {
      permController.store.getState = sinon.fake.returns({
        [METADATA_STORE_KEY]: {
          [DOMAINS.a.origin]: {
            foo: 'bar',
          },
        },
      });

      permController.addDomainMetadata(DOMAINS.b.origin, { foo: 'bar' });

      expect(permController.store.getState.called).toStrictEqual(true);
      expect(permController._setDomainMetadata.getCalls()).toHaveLength(1);
      expect(permController._setDomainMetadata.lastCall.args).toStrictEqual([
        {
          [DOMAINS.a.origin]: {
            foo: 'bar',
          },
          [DOMAINS.b.origin]: {
            foo: 'bar',
            host: DOMAINS.b.host,
            lastUpdated: 1,
          },
        },
      ]);
    });

    it('calls setter function with expected new states when updating existing domain', () => {
      permController.store.getState = sinon.fake.returns({
        [METADATA_STORE_KEY]: {
          [DOMAINS.a.origin]: {
            foo: 'bar',
          },
          [DOMAINS.b.origin]: {
            bar: 'baz',
          },
        },
      });

      permController.addDomainMetadata(DOMAINS.b.origin, { foo: 'bar' });

      expect(permController.store.getState.called).toStrictEqual(true);
      expect(permController._setDomainMetadata.getCalls()).toHaveLength(1);
      expect(permController._setDomainMetadata.lastCall.args).toStrictEqual([
        {
          [DOMAINS.a.origin]: {
            foo: 'bar',
          },
          [DOMAINS.b.origin]: {
            foo: 'bar',
            bar: 'baz',
            host: DOMAINS.b.host,
            lastUpdated: 1,
          },
        },
      ]);
    });

    it('pops metadata on add when too many origins are pending', () => {
      sinon.spy(permController._pendingSiteMetadata, 'delete');

      const mockMetadata = getMockMetadata(METADATA_CACHE_MAX_SIZE);
      const expectedDeletedOrigin = Object.keys(mockMetadata)[0];

      permController.store.getState = sinon.fake.returns({
        [METADATA_STORE_KEY]: { ...mockMetadata },
      });

      // populate permController._pendingSiteMetadata, as though these origins
      // were actually added
      Object.keys(mockMetadata).forEach((origin) => {
        permController._pendingSiteMetadata.add(origin);
      });

      permController.addDomainMetadata(DOMAINS.a.origin, { foo: 'bar' });

      expect(permController.store.getState.called).toStrictEqual(true);

      const expectedMetadata = {
        ...mockMetadata,
        [DOMAINS.a.origin]: {
          foo: 'bar',
          host: DOMAINS.a.host,
          lastUpdated: 1,
        },
      };
      delete expectedMetadata[expectedDeletedOrigin];

      expect(
        permController._pendingSiteMetadata.delete.calledOnceWithExactly(
          expectedDeletedOrigin,
        ),
      ).toStrictEqual(true);
      expect(permController._setDomainMetadata.getCalls()).toHaveLength(1);
      expect(permController._setDomainMetadata.lastCall.args).toStrictEqual([
        expectedMetadata,
      ]);
    });
  });

  describe('_trimDomainMetadata', () => {
    const permController = initPermController();

    it('trims domain metadata for domains without permissions', () => {
      const metadataArg = {
        [DOMAINS.a.origin]: {},
        [DOMAINS.b.origin]: {},
      };

      permController.permissions.getDomains = sinon.fake.returns({
        [DOMAINS.a.origin]: {},
      });

      const metadataResult = permController._trimDomainMetadata(metadataArg);

      expect(permController.permissions.getDomains.getCalls()).toHaveLength(1);
      expect(metadataResult).toStrictEqual({
        [DOMAINS.a.origin]: {},
      });
    });
  });

  describe('miscellanea and edge cases', () => {
    it('requestAccountsPermissionWithId calls _requestPermissions and notifyAccounts', () => {
      const notifications = initNotifications();
      const permController = initPermController(notifications);
      const _requestPermissions = sinon
        .stub(permController, '_requestPermissions')
        .resolves();
      const notifyAccountsChanged = sinon
        .stub(permController, 'notifyAccountsChanged')
        .callsFake(() => {
          expect(
            notifyAccountsChanged.calledOnceWithExactly('example.com', []),
          ).toStrictEqual(true);
          notifyAccountsChanged.restore();
          _requestPermissions.restore();
        });
      permController.requestAccountsPermissionWithId('example.com');
    });
    it('requestAccountsPermissionWithId calls _requestAccountsPermission with an explicit request ID', () => {
      const permController = initPermController();
      const _requestPermissions = sinon
        .stub(permController, '_requestPermissions')
        .resolves();
      const onResolved = async () => {
        expect(
          _requestPermissions.calledOnceWithExactly(
            sinon.match.object.and(sinon.match.has('origin')),
            { eth_accounts: {} },
            sinon.match.string.and(sinon.match.truthy),
          ),
        ).toStrictEqual(true);
        _requestPermissions.restore();
        // eslint-disable-next-line no-use-before-define
        notifyAccountsChanged.restore();
      };
      const notifyAccountsChanged = sinon
        .stub(permController, 'notifyAccountsChanged')
        .callsFake(onResolved);
      permController.requestAccountsPermissionWithId('example.com');
    });
  });
});
