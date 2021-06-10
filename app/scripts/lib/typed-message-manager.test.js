import sinon from 'sinon';
import { TRANSACTION_STATUSES } from '../../../shared/constants/transaction';
import TypedMessageManager from './typed-message-manager';

describe('Typed Message Manager', () => {
  let typedMessageManager,
    msgParamsV1,
    msgParamsV3,
    typedMsgs,
    messages,
    msgId,
    numberMsgId;

  const address = '0xc42edfcc21ed14dda456aa0756c153f7985d8813';

  beforeEach(async () => {
    typedMessageManager = new TypedMessageManager({
      getCurrentChainId: sinon.fake.returns('0x1'),
    });

    msgParamsV1 = {
      from: address,
      data: [
        { type: 'string', name: 'unit test', value: 'hello there' },
        {
          type: 'uint32',
          name: 'A number, but not really a number',
          value: '$$$',
        },
      ],
    };

    msgParamsV3 = {
      from: address,
      data: JSON.stringify({
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' },
          ],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
            { name: 'contents', type: 'string' },
          ],
        },
        primaryType: 'Mail',
        domain: {
          name: 'Ether Mainl',
          version: '1',
          chainId: 1,
          verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        },
        message: {
          from: {
            name: 'Cow',
            wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
          },
          to: {
            name: 'Bob',
            wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
          },
          contents: 'Hello, Bob!',
        },
      }),
    };

    await typedMessageManager.addUnapprovedMessage(msgParamsV3, null, 'V3');
    typedMsgs = typedMessageManager.getUnapprovedMsgs();
    messages = typedMessageManager.messages;
    msgId = Object.keys(typedMsgs)[0];
    messages[0].msgParams.metamaskId = parseInt(msgId, 10);
    numberMsgId = parseInt(msgId, 10);
  });

  it('supports version 1 of signedTypedData', () => {
    typedMessageManager.addUnapprovedMessage(msgParamsV1, null, 'V1');
    expect(messages[messages.length - 1].msgParams.data).toStrictEqual(
      msgParamsV1.data,
    );
  });

  it('has params address', () => {
    expect(typedMsgs[msgId].msgParams.from).toStrictEqual(address);
  });

  it('adds to unapproved messages and sets status to unapproved', () => {
    expect(typedMsgs[msgId].status).toStrictEqual(
      TRANSACTION_STATUSES.UNAPPROVED,
    );
  });

  it('validates params', async () => {
    await expect(() => {
      typedMessageManager.validateParams(messages[0].msgParams);
    }).not.toThrow();
  });

  it('gets unapproved by id', () => {
    const getMsg = typedMessageManager.getMsg(numberMsgId);
    expect(getMsg.id).toStrictEqual(numberMsgId);
  });

  it('approves messages', async () => {
    const messageMetaMaskId = messages[0].msgParams;
    typedMessageManager.approveMessage(messageMetaMaskId);
    expect(messages[0].status).toStrictEqual(TRANSACTION_STATUSES.APPROVED);
  });

  it('sets msg status to signed and adds a raw sig to message details', () => {
    typedMessageManager.setMsgStatusSigned(numberMsgId, 'raw sig');
    expect(messages[0].status).toStrictEqual(TRANSACTION_STATUSES.SIGNED);
    expect(messages[0].rawSig).toStrictEqual('raw sig');
  });

  it('rejects message', () => {
    typedMessageManager.rejectMsg(numberMsgId);
    expect(messages[0].status).toStrictEqual(TRANSACTION_STATUSES.REJECTED);
  });
});
