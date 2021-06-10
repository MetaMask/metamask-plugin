import sinon from 'sinon';
import { ObservableStore } from '@metamask/obs-store';
import TokenRatesController from './token-rates';

describe('TokenRatesController', () => {
  let nativeCurrency;
  let getNativeCurrency;
  beforeEach(() => {
    nativeCurrency = 'ETH';
    getNativeCurrency = () => nativeCurrency;
  });
  it('should listen for preferences store updates', () => {
    const preferences = new ObservableStore({ tokens: [] });
    preferences.putState({ tokens: ['foo'] });
    const controller = new TokenRatesController({
      preferences,
      getNativeCurrency,
    });
    expect(controller._tokens).toStrictEqual(['foo']);
  });

  it('should poll on correct interval', async () => {
    const stub = sinon.stub(global, 'setInterval');
    const preferences = new ObservableStore({ tokens: [] });
    preferences.putState({ tokens: ['foo'] });
    const controller = new TokenRatesController({
      preferences,
      getNativeCurrency,
    });
    controller.start(1337);

    expect(stub.getCall(0).args[1]).toStrictEqual(1337);
    stub.restore();
    controller.stop();
  });
});
