/* eslint-disable jest/valid-expect-in-promise */
import wallet1 from '../../../test/lib/migrations/001.json';
import vault4 from '../../../test/lib/migrations/004.json';
import migration2 from './002';
import migration3 from './003';
import migration4 from './004';
import migration5 from './005';
import migration6 from './006';
import migration7 from './007';
import migration8 from './008';
import migration9 from './009';
import migration10 from './010';
import migration11 from './011';
import migration12 from './012';
import migration13 from './013';

let vault5, vault6, vault7, vault8, vault9; // vault10, vault11

const oldTestRpc = 'https://rawtestrpc.metamask.io/';
const newTestRpc = 'https://testrpc.metamask.io/';

describe('wallet1 is migrated successfully', () => {
  it('should convert providers', () => {
    wallet1.data.config.provider = { type: 'etherscan', rpcTarget: null };

    migration2
      .migrate(wallet1)
      .then((secondResult) => {
        const secondData = secondResult.data;
        expect(secondData.config.provider.type).toStrictEqual('rpc');
        expect(secondData.config.provider.rpcTarget).toStrictEqual(
          'https://rpc.metamask.io/',
        );
        secondResult.data.config.provider.rpcTarget = oldTestRpc;
        return migration3.migrate(secondResult);
      })
      .then((thirdResult) => {
        expect(thirdResult.data.config.provider.rpcTarget).toStrictEqual(
          newTestRpc,
        );
        return migration4.migrate(thirdResult);
      })
      .then((fourthResult) => {
        const fourthData = fourthResult.data;
        expect(fourthData.config.provider.rpcTarget).toBeUndefined();
        expect(fourthData.config.provider.type).toStrictEqual('testnet');

        return migration5.migrate(vault4);
      })
      .then((fifthResult) => {
        const fifthData = fifthResult.data;
        expect(fifthData.vault).toBeUndefined();
        expect(fifthData.walletNicknames).toBeUndefined();
        expect(fifthData.config.selectedAccount).toBeUndefined();
        expect(fifthData.KeyringController.vault).toStrictEqual(
          vault4.data.vault,
        );
        expect(fifthData.KeyringController.selectedAccount).toStrictEqual(
          vault4.data.config.selectedAccount,
        );
        expect(
          fifthData.KeyringController.walletNicknames[
            '0x0beb674745816b125fbc07285d39fd373e64895c'
          ],
        ).toStrictEqual(
          vault4.data.walletNicknames[
            '0x0beb674745816b125fbc07285d39fd373e64895c'
          ],
        );

        vault5 = fifthResult;
        return migration6.migrate(fifthResult);
      })
      .then((sixthResult) => {
        expect(
          sixthResult.data.KeyringController.selectedAccount,
        ).toBeUndefined();
        expect(
          sixthResult.data.PreferencesController.selectedAddress,
        ).toStrictEqual(vault5.data.KeyringController.selectedAccount);

        vault6 = sixthResult;
        return migration7.migrate(sixthResult);
      })
      .then((seventhResult) => {
        expect(seventhResult.data.transactions).toBeUndefined();
        expect(seventhResult.data.gasMultiplier).toBeUndefined();
        expect(
          seventhResult.data.TransactionManager.transactions[0].id,
        ).toStrictEqual(vault6.data.transactions[0].id);
        expect(
          seventhResult.data.TransactionManager.gasMultiplier,
        ).toStrictEqual(vault6.data.gasMultiplier);

        vault7 = seventhResult;
        return migration8.migrate(seventhResult);
      })
      .then((eighthResult) => {
        expect(eighthResult.data.noticesList).toBeUndefined();
        expect(
          eighthResult.data.NoticeController.noticesList[0].title,
        ).toStrictEqual(vault7.data.noticesList[0].title);

        vault8 = eighthResult;
        return migration9.migrate(eighthResult);
      })
      .then((ninthResult) => {
        expect(ninthResult.data.currentFiat).toBeUndefined();
        expect(ninthResult.data.fiatCurrency).toBeUndefined();
        expect(ninthResult.data.conversionRate).toBeUndefined();
        expect(ninthResult.data.conversionDate).toBeUndefined();

        expect(
          ninthResult.data.CurrencyController.currentCurrency,
        ).toStrictEqual(vault8.data.fiatCurrency);
        expect(
          ninthResult.data.CurrencyController.conversionRate,
        ).toStrictEqual(vault8.data.conversionRate);
        expect(
          ninthResult.data.CurrencyController.conversionDate,
        ).toStrictEqual(vault8.data.conversionDate);

        vault9 = ninthResult;
        return migration10.migrate(ninthResult);
      })
      .then((tenthResult) => {
        expect(tenthResult.data.shapeShiftTxList).toBeUndefined();
        expect(
          tenthResult.data.ShapeShiftController.shapeShiftTxList[0].transaction,
        ).toStrictEqual(vault9.data.shapeShiftTxList[0].transaction);

        return migration11.migrate(tenthResult);
      })
      .then((eleventhResult) => {
        expect(eleventhResult.data.isDisclaimerConfirmed).toBeUndefined();
        expect(eleventhResult.data.TOSHash).toBeUndefined();

        return migration12.migrate(eleventhResult);
      })
      .then((twelfthResult) => {
        expect(
          twelfthResult.data.NoticeController.noticesList[0].body,
        ).toStrictEqual('');
        expect(
          twelfthResult.data.NoticeController.noticesList[1].body,
        ).toStrictEqual('nonempty');

        expect(twelfthResult.data.config.provider.type).toStrictEqual(
          'testnet',
        );
        return migration13.migrate(twelfthResult);
      })
      .then((thirteenthResult) => {
        expect(thirteenthResult.data.config.provider.type).toStrictEqual(
          'ropsten',
        );
      });
  });
});
