import cleanErrorStack from './cleanErrorStack';

describe('Clean Error Stack', () => {
  const testMessage = 'Test Message';
  const testError = new Error(testMessage);
  const undefinedErrorName = new Error(testMessage);
  const blankErrorName = new Error(testMessage);
  const blankMsgError = new Error();

  beforeEach(() => {
    undefinedErrorName.name = undefined;
    blankErrorName.name = '';
  });

  it('tests error with message', () => {
    expect(cleanErrorStack(testError).toString()).toStrictEqual(
      'Error: Test Message',
    );
  });

  it('tests error with undefined name', () => {
    expect(cleanErrorStack(undefinedErrorName).toString()).toStrictEqual(
      'Error: Test Message',
    );
  });

  it('tests error with blank name', () => {
    expect(cleanErrorStack(blankErrorName).toString()).toStrictEqual(
      'Test Message',
    );
  });

  it('tests error with blank message', () => {
    expect(cleanErrorStack(blankMsgError).toString()).toStrictEqual('Error');
  });
});
