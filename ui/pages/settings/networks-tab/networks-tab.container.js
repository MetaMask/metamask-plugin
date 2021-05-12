import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  setSelectedSettingsRpcUrl,
  updateAndSetCustomRpc,
  displayWarning,
  setNetworksTabAddMode,
  editRpc,
  showModal,
} from '../../../store/actions';
import { NETWORKS_FORM_ROUTE } from '../../../helpers/constants/routes';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';
import { NETWORK_TYPE_RPC } from '../../../../shared/constants/network';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import NetworksTab from './networks-tab.component';
import { defaultNetworksData } from './networks-tab.constants';

const defaultNetworks = defaultNetworksData.map((network) => ({
  ...network,
  viewOnly: true,
}));

const mapStateToProps = (state, ownProps) => {
  const {
    location: { pathname },
  } = ownProps;

  const environmentType = getEnvironmentType();
  const isFullScreen = environmentType === ENVIRONMENT_TYPE_FULLSCREEN;
  const shouldRenderNetworkForm =
    isFullScreen || Boolean(pathname.match(NETWORKS_FORM_ROUTE));

  const { frequentRpcListDetail, provider } = state.metamask;
  const { networksTabSelectedRpcUrl, networksTabIsInAddMode } = state.appState;

  const frequentRpcNetworkListDetails = frequentRpcListDetail.map((rpc) => {
    return {
      label: rpc.nickname,
      iconColor: '#6A737D',
      providerType: NETWORK_TYPE_RPC,
      rpcUrl: rpc.rpcUrl,
      chainId: rpc.chainId,
      checksumUsesChainId: rpc.checksumUsesChainId,
      ticker: rpc.ticker,
      blockExplorerUrl: rpc.rpcPrefs?.blockExplorerUrl || '',
    };
  });

  const networksToRender = [
    ...defaultNetworks,
    ...frequentRpcNetworkListDetails,
  ];
  let selectedNetwork =
    networksToRender.find(
      (network) => network.rpcUrl === networksTabSelectedRpcUrl,
    ) || {};
  const networkIsSelected = Boolean(selectedNetwork.rpcUrl);

  let networkDefaultedToProvider = false;
  if (!networkIsSelected && !networksTabIsInAddMode) {
    selectedNetwork =
      networksToRender.find((network) => {
        return (
          network.rpcUrl === provider.rpcUrl ||
          (network.providerType !== NETWORK_TYPE_RPC &&
            network.providerType === provider.type)
        );
      }) || {};
    networkDefaultedToProvider = true;
  }

  return {
    selectedNetwork,
    networksToRender,
    networkIsSelected,
    networksTabIsInAddMode,
    providerType: provider.type,
    providerUrl: provider.rpcUrl,
    networkDefaultedToProvider,
    isFullScreen,
    shouldRenderNetworkForm,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setSelectedSettingsRpcUrl: (newRpcUrl) =>
      dispatch(setSelectedSettingsRpcUrl(newRpcUrl)),
    setRpcTarget: (
      newRpc,
      chainId,
      checksumUsesChainId,
      ticker,
      nickname,
      rpcPrefs,
    ) => {
      return dispatch(
        updateAndSetCustomRpc(
          newRpc,
          chainId,
          checksumUsesChainId,
          ticker,
          nickname,
          rpcPrefs,
        ),
      );
    },
    showConfirmDeleteNetworkModal: ({ target, onConfirm }) => {
      return dispatch(
        showModal({ name: 'CONFIRM_DELETE_NETWORK', target, onConfirm }),
      );
    },
    displayWarning: (warning) => dispatch(displayWarning(warning)),
    setNetworksTabAddMode: (isInAddMode) =>
      dispatch(setNetworksTabAddMode(isInAddMode)),
    editRpc: (
      oldRpc,
      newRpc,
      chainId,
      checksumUsesChainId,
      ticker,
      nickname,
      rpcPrefs,
    ) => {
      return dispatch(
        editRpc(
          oldRpc,
          newRpc,
          chainId,
          checksumUsesChainId,
          ticker,
          nickname,
          rpcPrefs,
        ),
      );
    },
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(NetworksTab);
