import { ObservableStore } from '@metamask/obs-store';
import nanoid from 'nanoid';
import { useFakeTimers } from 'sinon';

import {
  constants,
  getters,
  noop,
} from '../../../../test/mocks/permission-controller';
import { validateActivityEntry } from '../../../../test/helpers/permission-controller-helpers';
import PermissionsLogController from './permissionsLog';
import { LOG_LIMIT, LOG_METHOD_TYPES } from './enums';

const { PERMS, RPC_REQUESTS } = getters;

const {
  ACCOUNTS,
  EXPECTED_HISTORIES,
  DOMAINS,
  PERM_NAMES,
  REQUEST_IDS,
  RESTRICTED_METHODS,
} = constants;

let clock;

const initPermLog = () => {
  return new PermissionsLogController({
    store: new ObservableStore(),
    restrictedMethods: RESTRICTED_METHODS,
  });
};

const mockNext = (handler) => {
  if (handler) {
    handler(noop);
  }
};

const initMiddleware = (permLog) => {
  const middleware = permLog.createMiddleware();
  return (req, res, next = mockNext) => {
    middleware(req, res, next);
  };
};

const initClock = () => {
  // useFakeTimers, is in fact, not a react-hook
  // eslint-disable-next-line
  clock = useFakeTimers(1);
};

const tearDownClock = () => {
  clock.restore();
};

const getSavedMockNext = (arr) => (handler) => {
  arr.push(handler);
};

describe('permissions log', function () {
  describe('activity log', function () {
    let permLog, logMiddleware;

    beforeEach(function () {
      permLog = initPermLog();
      logMiddleware = initMiddleware(permLog);
    });

    it('records activity for restricted methods', function () {
      let log, req, res;

      // test_method, success

      req = RPC_REQUESTS.test_method(DOMAINS.a.origin);
      req.id = REQUEST_IDS.a;
      res = { foo: 'bar' };

      logMiddleware({ ...req }, res);

      log = permLog.getActivityLog();
      const entry1 = log[0];

      expect(log).toHaveLength(1);
      validateActivityEntry(
        entry1,
        { ...req },
        { ...res },
        LOG_METHOD_TYPES.restricted,
        true,
      );

      // eth_accounts, failure

      req = RPC_REQUESTS.eth_accounts(DOMAINS.b.origin);
      req.id = REQUEST_IDS.b;
      res = { error: new Error('Unauthorized.') };

      logMiddleware({ ...req }, res);

      log = permLog.getActivityLog();
      const entry2 = log[1];

      expect(log).toHaveLength(2);
      validateActivityEntry(
        entry2,
        { ...req },
        { ...res },
        LOG_METHOD_TYPES.restricted,
        false,
      );

      // eth_requestAccounts, success

      req = RPC_REQUESTS.eth_requestAccounts(DOMAINS.c.origin);
      req.id = REQUEST_IDS.c;
      res = { result: ACCOUNTS.c.permitted };

      logMiddleware({ ...req }, res);

      log = permLog.getActivityLog();
      const entry3 = log[2];

      expect(log).toHaveLength(3);
      validateActivityEntry(
        entry3,
        { ...req },
        { ...res },
        LOG_METHOD_TYPES.restricted,
        true,
      );

      // test_method, no response

      req = RPC_REQUESTS.test_method(DOMAINS.a.origin);
      req.id = REQUEST_IDS.a;
      res = null;

      logMiddleware({ ...req }, res);

      log = permLog.getActivityLog();
      const entry4 = log[3];

      expect(log).toHaveLength(4);
      validateActivityEntry(
        entry4,
        { ...req },
        null,
        LOG_METHOD_TYPES.restricted,
        false,
      );

      // validate final state

      expect(entry1).toStrictEqual(log[0]);
      expect(entry2).toStrictEqual(log[1]);
      expect(entry3).toStrictEqual(log[2]);
      expect(entry4).toStrictEqual(log[3]);
    });

    it('handles responses added out of order', function () {
      let log;

      const handlerArray = [];

      const id1 = nanoid();
      const id2 = nanoid();
      const id3 = nanoid();

      const req = RPC_REQUESTS.test_method(DOMAINS.a.origin);

      // get make requests
      req.id = id1;
      const res1 = { foo: id1 };
      logMiddleware({ ...req }, { ...res1 }, getSavedMockNext(handlerArray));

      req.id = id2;
      const res2 = { foo: id2 };
      logMiddleware({ ...req }, { ...res2 }, getSavedMockNext(handlerArray));

      req.id = id3;
      const res3 = { foo: id3 };
      logMiddleware({ ...req }, { ...res3 }, getSavedMockNext(handlerArray));

      // verify log state
      log = permLog.getActivityLog();
      expect(log).toHaveLength(3);
      const entry1 = log[0];
      const entry2 = log[1];
      const entry3 = log[2];

      expect(entry1.id).toStrictEqual(id1);
      expect(entry1.response).toBeNull();
      expect(entry2.id).toStrictEqual(id2);
      expect(entry2.response).toBeNull();
      expect(entry3.id).toStrictEqual(id3);
      expect(entry3.response).toBeNull();

      // call response handlers
      for (const i of [1, 2, 0]) {
        handlerArray[i](noop);
      }

      // verify log state again
      log = permLog.getActivityLog();
      expect(log).toHaveLength(3);

      // verify all entries
      log = permLog.getActivityLog();

      validateActivityEntry(
        log[0],
        { ...req, id: id1 },
        { ...res1 },
        LOG_METHOD_TYPES.restricted,
        true,
      );

      validateActivityEntry(
        log[1],
        { ...req, id: id2 },
        { ...res2 },
        LOG_METHOD_TYPES.restricted,
        true,
      );

      validateActivityEntry(
        log[2],
        { ...req, id: id3 },
        { ...res3 },
        LOG_METHOD_TYPES.restricted,
        true,
      );
    });

    it('handles a lack of response', function () {
      let req = RPC_REQUESTS.test_method(DOMAINS.a.origin);
      req.id = REQUEST_IDS.a;
      let res = { foo: 'bar' };

      // noop for next handler prevents recording of response
      logMiddleware({ ...req }, res, noop);

      let log = permLog.getActivityLog();
      const entry1 = log[0];

      expect(log).toHaveLength(1);
      validateActivityEntry(
        entry1,
        { ...req },
        null,
        LOG_METHOD_TYPES.restricted,
        true,
      );

      // next request should be handled as normal
      req = RPC_REQUESTS.eth_accounts(DOMAINS.b.origin);
      req.id = REQUEST_IDS.b;
      res = { result: ACCOUNTS.b.permitted };

      logMiddleware({ ...req }, res);

      log = permLog.getActivityLog();
      const entry2 = log[1];
      expect(log).toHaveLength(2);
      validateActivityEntry(
        entry2,
        { ...req },
        { ...res },
        LOG_METHOD_TYPES.restricted,
        true,
      );

      // validate final state
      expect(entry1).toStrictEqual(log[0]);
      expect(entry2).toStrictEqual(log[1]);
    });

    it('ignores expected methods', function () {
      let log = permLog.getActivityLog();
      expect(log).toHaveLength(0);

      const res = { foo: 'bar' };
      const req1 = RPC_REQUESTS.metamask_sendDomainMetadata(
        DOMAINS.c.origin,
        'foobar',
      );
      const req2 = RPC_REQUESTS.custom(DOMAINS.b.origin, 'eth_getBlockNumber');
      const req3 = RPC_REQUESTS.custom(DOMAINS.b.origin, 'net_version');

      logMiddleware(req1, res);
      logMiddleware(req2, res);
      logMiddleware(req3, res);

      log = permLog.getActivityLog();
      expect(log).toHaveLength(0);
    });

    it('enforces log limit', function () {
      const req = RPC_REQUESTS.test_method(DOMAINS.a.origin);
      const res = { foo: 'bar' };

      // max out log
      let lastId;
      for (let i = 0; i < LOG_LIMIT; i++) {
        lastId = nanoid();
        logMiddleware({ ...req, id: lastId }, { ...res });
      }

      // check last entry valid
      let log = permLog.getActivityLog();
      expect(log).toHaveLength(LOG_LIMIT);

      validateActivityEntry(
        log[LOG_LIMIT - 1],
        { ...req, id: lastId },
        res,
        LOG_METHOD_TYPES.restricted,
        true,
      );

      // store the id of the current second entry
      const nextFirstId = log[1].id;

      // add one more entry to log, putting it over the limit
      lastId = nanoid();
      logMiddleware({ ...req, id: lastId }, { ...res });

      // check log length
      log = permLog.getActivityLog();
      expect(log).toHaveLength(LOG_LIMIT);

      // check first and last entries
      validateActivityEntry(
        log[0],
        { ...req, id: nextFirstId },
        res,
        LOG_METHOD_TYPES.restricted,
        true,
      );

      validateActivityEntry(
        log[LOG_LIMIT - 1],
        { ...req, id: lastId },
        res,
        LOG_METHOD_TYPES.restricted,
        true,
      );
    });
  });

  describe('permissions history', function () {
    let permLog, logMiddleware;

    beforeEach(function () {
      permLog = initPermLog();
      logMiddleware = initMiddleware(permLog);
      initClock();
    });

    afterEach(function () {
      tearDownClock();
    });

    it('only updates history on responses', function () {
      let permHistory;

      const req = RPC_REQUESTS.requestPermission(
        DOMAINS.a.origin,
        PERM_NAMES.test_method,
      );
      const res = { result: [PERMS.granted.test_method()] };

      // noop => no response
      logMiddleware({ ...req }, { ...res }, noop);

      permHistory = permLog.getHistory();
      expect(permHistory).toStrictEqual({});

      // response => records granted permissions
      logMiddleware({ ...req }, { ...res });

      permHistory = permLog.getHistory();
      expect(Object.keys(permHistory)).toHaveLength(1);
      expect.anything(Boolean(permHistory[DOMAINS.a.origin]));
    });

    it('ignores malformed permissions requests', function () {
      const req = RPC_REQUESTS.requestPermission(
        DOMAINS.a.origin,
        PERM_NAMES.test_method,
      );
      delete req.params;
      const res = { result: [PERMS.granted.test_method()] };

      // no params => no response
      logMiddleware({ ...req }, { ...res });

      expect(permLog.getHistory()).toStrictEqual({});
    });

    it('records and updates account history as expected', async function () {
      let permHistory;

      const req = RPC_REQUESTS.requestPermission(
        DOMAINS.a.origin,
        PERM_NAMES.eth_accounts,
      );
      const res = {
        result: [PERMS.granted.eth_accounts(ACCOUNTS.a.permitted)],
      };

      logMiddleware({ ...req }, { ...res });

      // validate history

      permHistory = permLog.getHistory();

      expect(permHistory).toStrictEqual(EXPECTED_HISTORIES.case1[0]);

      // mock permission requested again, with another approved account

      clock.tick(1);

      res.result = [PERMS.granted.eth_accounts([ACCOUNTS.a.permitted[0]])];

      logMiddleware({ ...req }, { ...res });

      permHistory = permLog.getHistory();

      expect(permHistory).toStrictEqual(EXPECTED_HISTORIES.case1[1]); // should have correct history
    });

    it('handles eth_accounts response without caveats', async function () {
      const req = RPC_REQUESTS.requestPermission(
        DOMAINS.a.origin,
        PERM_NAMES.eth_accounts,
      );
      const res = {
        result: [PERMS.granted.eth_accounts(ACCOUNTS.a.permitted)],
      };
      delete res.result[0].caveats;

      logMiddleware({ ...req }, { ...res });

      // validate history

      expect(permLog.getHistory()).toStrictEqual(EXPECTED_HISTORIES.case2[0]);
    });

    it('handles extra caveats for eth_accounts', async function () {
      const req = RPC_REQUESTS.requestPermission(
        DOMAINS.a.origin,
        PERM_NAMES.eth_accounts,
      );
      const res = {
        result: [PERMS.granted.eth_accounts(ACCOUNTS.a.permitted)],
      };
      res.result[0].caveats.push({ foo: 'bar' });

      logMiddleware({ ...req }, { ...res });

      // validate history

      expect(permLog.getHistory()).toStrictEqual(EXPECTED_HISTORIES.case1[0]);
    });

    // wallet_requestPermissions returns all permissions approved for the
    // requesting origin, including old ones
    it('handles unrequested permissions on the response', async function () {
      const req = RPC_REQUESTS.requestPermission(
        DOMAINS.a.origin,
        PERM_NAMES.eth_accounts,
      );
      const res = {
        result: [
          PERMS.granted.eth_accounts(ACCOUNTS.a.permitted),
          PERMS.granted.test_method(),
        ],
      };

      logMiddleware({ ...req }, { ...res });

      // validate history

      expect(permLog.getHistory()).toStrictEqual(EXPECTED_HISTORIES.case1[0]);
    });

    it('does not update history if no new permissions are approved', async function () {
      let req = RPC_REQUESTS.requestPermission(
        DOMAINS.a.origin,
        PERM_NAMES.test_method,
      );
      let res = {
        result: [PERMS.granted.test_method()],
      };

      logMiddleware({ ...req }, { ...res });

      // validate history

      expect(permLog.getHistory()).toStrictEqual(EXPECTED_HISTORIES.case4[0]);

      // new permission requested, but not approved

      clock.tick(1);

      req = RPC_REQUESTS.requestPermission(
        DOMAINS.a.origin,
        PERM_NAMES.eth_accounts,
      );
      res = {
        result: [PERMS.granted.test_method()],
      };

      logMiddleware({ ...req }, { ...res });

      // validate history

      expect(permLog.getHistory()).toStrictEqual(EXPECTED_HISTORIES.case4[0]);
    });

    it('records and updates history for multiple origins, regardless of response order', async function () {
      let permHistory;

      // make first round of requests

      const round1 = [];
      const handlers1 = [];

      // first origin
      round1.push({
        req: RPC_REQUESTS.requestPermission(
          DOMAINS.a.origin,
          PERM_NAMES.test_method,
        ),
        res: {
          result: [PERMS.granted.test_method()],
        },
      });

      // second origin
      round1.push({
        req: RPC_REQUESTS.requestPermission(
          DOMAINS.b.origin,
          PERM_NAMES.eth_accounts,
        ),
        res: {
          result: [PERMS.granted.eth_accounts(ACCOUNTS.b.permitted)],
        },
      });

      // third origin
      round1.push({
        req: RPC_REQUESTS.requestPermissions(DOMAINS.c.origin, {
          [PERM_NAMES.test_method]: {},
          [PERM_NAMES.eth_accounts]: {},
        }),
        res: {
          result: [
            PERMS.granted.test_method(),
            PERMS.granted.eth_accounts(ACCOUNTS.c.permitted),
          ],
        },
      });

      // make requests and process responses out of order
      round1.forEach((x) => {
        logMiddleware({ ...x.req }, { ...x.res }, getSavedMockNext(handlers1));
      });

      for (const i of [1, 2, 0]) {
        handlers1[i](noop);
      }

      // validate history
      permHistory = permLog.getHistory();

      expect(permHistory).toStrictEqual(EXPECTED_HISTORIES.case3[0]);

      // make next round of requests

      clock.tick(1);

      const round2 = [];
      // we're just gonna process these in order

      // first origin
      round2.push({
        req: RPC_REQUESTS.requestPermission(
          DOMAINS.a.origin,
          PERM_NAMES.test_method,
        ),
        res: {
          result: [PERMS.granted.test_method()],
        },
      });

      // nothing for second origin

      // third origin
      round2.push({
        req: RPC_REQUESTS.requestPermissions(DOMAINS.c.origin, {
          [PERM_NAMES.eth_accounts]: {},
        }),
        res: {
          result: [PERMS.granted.eth_accounts(ACCOUNTS.b.permitted)],
        },
      });

      // make requests
      round2.forEach((x) => {
        logMiddleware({ ...x.req }, { ...x.res });
      });

      // validate history
      permHistory = permLog.getHistory();

      expect(permHistory).toStrictEqual(EXPECTED_HISTORIES.case3[1]);
    });
  });
});
