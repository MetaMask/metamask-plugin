import { cloneDeep } from 'lodash';

const version = 58;

/**
 * replace IncomingTransactionsController with ExternalTransactionsController
 * replace showIncomingTransactions with showExternalTransactions
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data;
    versionedData.data = transformState(state);
    return versionedData;
  },
};

function transformState(state) {
  if (state?.IncomingTransactionsController) {
    state.ExternalTransactionsController = state.IncomingTransactionsController;
    state.ExternalTransactionsController.externalTransactions =
      state.IncomingTransactionsController.incomingTransactions;
    state.ExternalTransactionsController.externalTxLastFetchedBlockByChainId =
      state.IncomingTransactionsController.incomingTxLastFetchedBlockByChainId;

    delete state.IncomingTransactionsController;
    delete state.ExternalTransactionsController.incomingTransactions;
    delete state.ExternalTransactionsController
      .incomingTxLastFetchedBlockByChainId;
  }

  if (state?.PreferencesController?.featureFlags) {
    state.PreferencesController.featureFlags.showExternalTransactions =
      state.PreferencesController.featureFlags?.showIncomingTransactions;
    delete state.PreferencesController.featureFlags.showIncomingTransactions;
  }
  return state;
}
