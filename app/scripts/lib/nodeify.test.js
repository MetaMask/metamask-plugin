import nodeify from './nodeify';

describe('nodeify', () => {
  const obj = {
    foo: 'bar',
    promiseFunc(a) {
      const solution = this.foo + a;
      return Promise.resolve(solution);
    },
  };

  it('should retain original context', () => {
    const nodified = nodeify(obj.promiseFunc, obj);
    nodified('baz', (_, res) => {
      expect(res).toStrictEqual('barbaz');
    });
  });

  it('no callback - should allow the last argument to not be a function', async () => {
    const nodified = nodeify(obj.promiseFunc, obj);
    await expect(() => {
      nodified('baz');
    }).not.toThrow();
  });

  it('sync functions - returns value', async () => {
    const nodified = nodeify(() => 42);
    nodified((_, result) => {
      expect(42).toStrictEqual(result);
    });
  });

  it('sync functions - handles errors', () => {
    const nodified = nodeify(() => {
      throw new Error('boom!');
    });
    nodified((err, _) => {
      expect(err.message).toStrictEqual('boom!');
    });
  });
});
