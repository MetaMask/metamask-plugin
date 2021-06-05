import { ethErrors } from 'eth-rpc-errors';

/**
 * Create middleware for handling certain methods and preprocessing permissions requests.
 */
export default function createPermissionsMethodMiddleware({
  addDomainMetadata,
  getAccounts,
  getUnlockPromise,
  hasPermission,
  notifyAccountsChanged,
  requestAccountsPermission,
}) {
  let isProcessingRequestAccounts = false;

  return async (req, res, next, end) => {
    let responseHandler;

    switch (req.method) {
      // Intercepting eth_accounts requests for backwards compatibility:
      // The getAccounts call below wraps the rpc-cap middleware, and returns
      // an empty array in case of errors (such as 4100:unauthorized)
      case 'eth_accounts': {
        res.result = await getAccounts();
        return end();
      }

      case 'eth_requestAccounts': {
        if (isProcessingRequestAccounts) {
          return end(
            ethErrors.rpc.resourceUnavailable(
              'Already processing eth_requestAccounts. Please wait.',
            ),
          );
        }

        if (hasPermission('eth_accounts')) {
          isProcessingRequestAccounts = true;
          await getUnlockPromise();
          isProcessingRequestAccounts = false;
        }

        // first, just try to get accounts
        let accounts = await getAccounts();
        if (accounts.length > 0) {
          res.result = accounts;
          return end();
        }

        // if no accounts, request the accounts permission
        try {
          await requestAccountsPermission();
        } catch (error) {
          return end(error);
        }

        // get the accounts again
        accounts = await getAccounts();
        /* istanbul ignore else: too hard to induce, see below comment */
        if (accounts.length > 0) {
          res.result = accounts;
        } else {
          // this should never happen, because it should be caught in the
          // above catch clause
          res.error = ethErrors.rpc.internal(
            'Accounts unexpectedly unavailable. Please report this bug.',
          );
        }

        return end();
      }

      // custom method for getting metadata from the requesting domain,
      // sent automatically by the inpage provider when it's initialized
      case 'metamask_sendDomainMetadata': {
        if (typeof req.params?.name === 'string') {
          addDomainMetadata(req.origin, req.params);
        }
        res.result = true;
        return end();
      }

      // register return handler to send accountsChanged notification
      case 'wallet_requestPermissions': {
        if ('eth_accounts' in req.params?.[0]) {
          responseHandler = async (done) => {
            try {
              if (Array.isArray(res.result)) {
                for (const permission of res.result) {
                  if (permission.parentCapability === 'eth_accounts') {
                    notifyAccountsChanged(await getAccounts());
                  }
                }
              }
              return done();
            } catch (error) {
              return done(error);
            }
          };
        }
        break;
      }

      default:
        break;
    }

    return next(responseHandler);
  };
}
