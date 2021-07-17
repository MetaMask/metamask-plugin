import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { fireEvent } from '@testing-library/react';
import { ASSET_TYPES, initialState, SEND_STAGES } from '../../../ducks/send';
import { renderWithProvider } from '../../../../test/jest';
import SendHeader from './send-header.component';

const middleware = [thunk];

jest.mock('react-router-dom', () => {
  const original = jest.requireActual('react-router-dom');
  return {
    ...original,
    useHistory: () => ({
      push: jest.fn(),
    }),
  };
});

describe('SendHeader Component', () => {
  describe('Title', () => {
    it('should render "Add Recipient" for INACTIVE or ADD_RECIPIENT stages', () => {
      const { getByText, rerender } = renderWithProvider(
        <SendHeader />,
        configureMockStore(middleware)({
          send: initialState,
          gas: { basicEstimateStatus: 'LOADING' },
          history: { mostRecentOverviewPage: 'activity' },
        }),
      );
      expect(getByText('Add Recipient')).toBeTruthy();
      rerender(
        <SendHeader />,
        configureMockStore(middleware)({
          send: { ...initialState, stage: SEND_STAGES.ADD_RECIPIENT },
          gas: { basicEstimateStatus: 'LOADING' },
          history: { mostRecentOverviewPage: 'activity' },
        }),
      );
      expect(getByText('Add Recipient')).toBeTruthy();
    });

    it('should render "Send" for DRAFT stage when asset type is NATIVE', () => {
      const { getByText } = renderWithProvider(
        <SendHeader />,
        configureMockStore(middleware)({
          send: {
            ...initialState,
            stage: SEND_STAGES.DRAFT,
            asset: { ...initialState.asset, type: ASSET_TYPES.NATIVE },
          },
          gas: { basicEstimateStatus: 'LOADING' },
          history: { mostRecentOverviewPage: 'activity' },
        }),
      );
      expect(getByText('Send')).toBeTruthy();
    });

    it('should render "Send Tokens" for DRAFT stage when asset type is TOKEN', () => {
      const { getByText } = renderWithProvider(
        <SendHeader />,
        configureMockStore(middleware)({
          send: {
            ...initialState,
            stage: SEND_STAGES.DRAFT,
            asset: { ...initialState.asset, type: ASSET_TYPES.TOKEN },
          },
          gas: { basicEstimateStatus: 'LOADING' },
          history: { mostRecentOverviewPage: 'activity' },
        }),
      );
      expect(getByText('Send Tokens')).toBeTruthy();
    });

    it('should render "Edit" for EDIT stage', () => {
      const { getByText } = renderWithProvider(
        <SendHeader />,
        configureMockStore(middleware)({
          send: {
            ...initialState,
            stage: SEND_STAGES.EDIT,
          },
          gas: { basicEstimateStatus: 'LOADING' },
          history: { mostRecentOverviewPage: 'activity' },
        }),
      );
      expect(getByText('Edit')).toBeTruthy();
    });
  });

  describe('Cancel Button', () => {
    it('has a cancel button in header', () => {
      const { getByText } = renderWithProvider(
        <SendHeader />,
        configureMockStore(middleware)({
          send: initialState,
          gas: { basicEstimateStatus: 'LOADING' },
          history: { mostRecentOverviewPage: 'activity' },
        }),
      );
      expect(getByText('Cancel')).toBeTruthy();
    });

    it('resets send state when clicked', () => {
      const store = configureMockStore(middleware)({
        send: initialState,
        gas: { basicEstimateStatus: 'LOADING' },
        history: { mostRecentOverviewPage: 'activity' },
      });
      const { getByText } = renderWithProvider(<SendHeader />, store);
      const expectedActions = [
        { type: 'send/resetSendState', payload: undefined },
      ];
      fireEvent.click(getByText('Cancel'));
      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });
});
