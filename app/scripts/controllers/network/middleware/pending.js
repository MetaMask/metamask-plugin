import { formatTxMetaForRpcResult } from '../util';

export function createPendingNonceMiddleware({ getPendingNonce }) {
  return async (req, res, next, end) => {
    const { method, params } = req;
    if (method !== 'eth_getTransactionCount') {
      return next();
    }
    const [param, blockRef] = params;
    if (blockRef !== 'pending') {
      return next();
    }
    res.result = await getPendingNonce(param);
    return end();
  };
}

export function createPendingTxMiddleware({ getPendingTransactionByHash }) {
  return (req, res, next, end) => {
    const { method, params } = req;
    if (method !== 'eth_getTransactionByHash') {
      return next();
    }
    const [hash] = params;
    const txMeta = getPendingTransactionByHash(hash);
    if (!txMeta) {
      return next();
    }
    res.result = formatTxMetaForRpcResult(txMeta);
    return end();
  };
}
