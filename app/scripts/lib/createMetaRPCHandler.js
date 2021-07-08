import { ethErrors, serializeError } from 'eth-rpc-errors';

const createMetaRPCHandler = (api, outStream) => {
  return (data) => {
    if (outStream._writableState.ended || outStream._readableState.ended) {
      return;
    }
    if (!api[data.method]) {
      outStream.write({
        jsonrpc: '2.0',
        error: ethErrors.rpc.methodNotFound({
          message: `${data.method} not found`,
        }),
        id: data.id,
      });
      return;
    }
    api[data.method](...data.params, (err, result) => {
      if (outStream._writableState.ended || outStream._readableState.ended) {
        return;
      }
      if (err) {
        outStream.write({
          jsonrpc: '2.0',
          error: serializeError(err, { shouldIncludeStack: true }),
          id: data.id,
        });
      } else {
        outStream.write({
          jsonrpc: '2.0',
          result,
          id: data.id,
        });
      }
    });
  };
};

export default createMetaRPCHandler;
