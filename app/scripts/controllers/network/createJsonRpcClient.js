import { mergeMiddleware } from 'json-rpc-engine';
import createFetchMiddleware from 'eth-json-rpc-middleware/fetch';
import createBlockRefRewriteMiddleware from 'eth-json-rpc-middleware/block-ref-rewrite';
import createBlockCacheMiddleware from 'eth-json-rpc-middleware/block-cache';
import createInflightMiddleware from 'eth-json-rpc-middleware/inflight-cache';
import createBlockTrackerInspectorMiddleware from 'eth-json-rpc-middleware/block-tracker-inspector';
import providerFromMiddleware from 'eth-json-rpc-middleware/providerFromMiddleware';
import { PollingBlockTracker } from 'eth-block-tracker';

const inTest = process.env.IN_TEST === 'true';
const blockTrackerOpts = inTest ? { pollingInterval: 1000 } : {};
const getTestMiddlewares = () => {
  return inTest ? [createEstimateGasDelayTestMiddleware()] : [];
};

export default function createJsonRpcClient({ rpcUrl, chainId }) {
  const fetchMiddleware = createFetchMiddleware({ rpcUrl });
  const blockProvider = providerFromMiddleware(fetchMiddleware);
  const blockTracker = new PollingBlockTracker({
    ...blockTrackerOpts,
    provider: blockProvider,
  });

  const networkMiddleware = mergeMiddleware([
    ...getTestMiddlewares(),
    createChainIdMiddleware(chainId),
    createBlockRefRewriteMiddleware({ blockTracker }),
    createBlockCacheMiddleware({ blockTracker }),
    createInflightMiddleware(),
    createBlockTrackerInspectorMiddleware({ blockTracker }),
    fetchMiddleware,
  ]);

  return { networkMiddleware, blockTracker };
}

function createChainIdMiddleware(chainId) {
  return (req, res, next, end) => {
    if (req.method === 'eth_chainId') {
      res.result = chainId;
      return end();
    }
    return next();
  };
}

/**
 * For use in tests only.
 * Adds a delay to `eth_estimateGas` calls.
 */
function createEstimateGasDelayTestMiddleware() {
  return async (req, _, next) => {
    if (req.method === 'eth_estimateGas') {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    return next();
  };
}
