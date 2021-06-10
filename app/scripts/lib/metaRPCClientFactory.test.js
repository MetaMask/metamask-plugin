import { obj as createThoughStream } from 'through2';
import metaRPCClientFactory from './metaRPCClientFactory';

describe('metaRPCClientFactory', () => {
  it('should be able to make an rpc request with the method', () => {
    const streamTest = createThoughStream((chunk) => {
      expect(chunk.method).toStrictEqual('foo');
    });
    const metaRPCClient = metaRPCClientFactory(streamTest);
    metaRPCClient.foo();
  });
  it('should be able to make an rpc request/response with the method and params and node-style callback', () => {
    const streamTest = createThoughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    // make a "foo" method call
    metaRPCClient.foo('bar', (_, result) => {
      expect(result).toStrictEqual('foobarbaz');
    });

    // fake a response
    metaRPCClient.requests.forEach((_, key) => {
      streamTest.write({
        jsonrpc: '2.0',
        id: key,
        result: 'foobarbaz',
      });
    });
  });
  it('should be able to make an rpc request/error with the method and params and node-style callback', () => {
    const streamTest = createThoughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    // make a "foo" method call
    metaRPCClient.foo('bar', (err) => {
      expect(err.message).toStrictEqual('foo-message');
      expect(err.code).toStrictEqual(1);
    });

    metaRPCClient.requests.forEach((_, key) => {
      streamTest.write({
        jsonrpc: '2.0',
        id: key,
        error: {
          code: 1,
          message: 'foo-message',
        },
      });
    });
  });

  it('should be able to make an rpc request/response with the method and params and node-style callback with multiple instances of metaRPCClientFactory and the same connectionStream', () => {
    const streamTest = createThoughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);
    const metaRPCClient2 = metaRPCClientFactory(streamTest);

    // make a "foo" method call, followed by "baz" call on metaRPCClient2
    metaRPCClient.foo('bar', (_, result) => {
      expect(result).toStrictEqual('foobarbaz');
      metaRPCClient2.baz('bar', (err) => {
        expect(err).toBeNull();
      });
    });

    // fake a response
    metaRPCClient.requests.forEach((_, key) => {
      streamTest.write({
        jsonrpc: '2.0',
        id: key,
        result: 'foobarbaz',
      });
    });

    // fake client2's response
    metaRPCClient2.requests.forEach((_, key) => {
      streamTest.write({
        jsonrpc: '2.0',
        id: key,
        result: 'foobarbaz',
      });
    });
  });

  it('should be able to handle notifications', () => {
    const streamTest = createThoughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    metaRPCClient.onNotification((notification) => {
      expect(notification.method).toStrictEqual('foobarbaz');
    });

    // send a notification
    streamTest.write({
      jsonrpc: '2.0',
      method: 'foobarbaz',
      params: ['bar'],
    });
  });

  it('should be able to handle errors with no id', () => {
    const streamTest = createThoughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    metaRPCClient.onUncaughtError((error) => {
      expect(error.code).toStrictEqual(1);
    });

    streamTest.write({
      jsonrpc: '2.0',
      error: {
        code: 1,
        message: 'error msg',
      },
    });
  });

  it('should be able to handle errors with null id', () => {
    const streamTest = createThoughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    metaRPCClient.onUncaughtError((error) => {
      expect(error.code).toStrictEqual(1);
    });

    streamTest.write({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: 1,
        message: 'error msg',
      },
    });
  });
});
