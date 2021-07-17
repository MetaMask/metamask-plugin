import base32Encode from 'base32-encode';
import base64 from 'base64-js';
import extension from 'extensionizer';
import { SECOND } from '../../../../shared/constants/time';
import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';
import resolveEnsToIpfsContentId from './resolver';

const fetchWithTimeout = getFetchWithTimeout(SECOND * 30);

const supportedTopLevelDomains = ['eth'];

export default function setupEnsIpfsResolver({
  provider,
  getCurrentChainId,
  getIpfsGateway,
}) {
  // install listener
  const urlPatterns = supportedTopLevelDomains.map((tld) => `*://*.${tld}/*`);
  extension.webRequest.onErrorOccurred.addListener(webRequestDidFail, {
    urls: urlPatterns,
    types: ['main_frame'],
  });

  // return api object
  return {
    // uninstall listener
    remove() {
      extension.webRequest.onErrorOccurred.removeListener(webRequestDidFail);
    },
  };

  async function webRequestDidFail(details) {
    const { tabId, url } = details;
    // ignore requests that are not associated with tabs
    // only attempt ENS resolution on mainnet
    if (tabId === -1 || getCurrentChainId() !== '0x1') {
      return;
    }
    // parse ens name
    const { hostname: name, pathname, search, hash: fragment } = new URL(url);
    const domainParts = name.split('.');
    const topLevelDomain = domainParts[domainParts.length - 1];
    // if unsupported TLD, abort
    if (!supportedTopLevelDomains.includes(topLevelDomain)) {
      return;
    }
    // otherwise attempt resolve
    attemptResolve({ tabId, name, pathname, search, fragment });
  }

  async function attemptResolve({ tabId, name, pathname, search, fragment }) {
    const ipfsGateway = getIpfsGateway();
    extension.tabs.update(tabId, { url: `loading.html` });
    let url = `https://app.ens.domains/name/${name}`;
    try {
      const { type, hash } = await resolveEnsToIpfsContentId({
        provider,
        name,
      });
      if (type === 'ipfs-ns' || type === 'ipns-ns') {
        const resolvedUrl = `https://${name}.ipns.${ipfsGateway}${pathname}${
          search || ''
        }${fragment || ''}`;
        try {
          // check if ipfs gateway has result
          const response = await fetchWithTimeout(resolvedUrl, {
            method: 'HEAD',
          });
          if (response.status === 200) {
            url = resolvedUrl;
          }
        } catch (err) {
          console.warn(err);
        }
      } else if (type === 'swarm-ns') {
        url = `https://swarm-gateways.net/bzz:/${hash}${pathname}${
          search || ''
        }${fragment || ''}`;
      } else if (type === 'onion' || type === 'onion3') {
        url = `http://${hash}.onion${pathname}${search || ''}${fragment || ''}`;
      } else if (type === 'zeronet') {
        url = `http://127.0.0.1:43110/${hash}${pathname}${search || ''}${
          fragment || ''
        }`;
      } else if (type === 'skynet-ns') {
        const padded = hash.padEnd(hash.length + 4 - (hash.length % 4), '=');
        const decoded = base64.toByteArray(padded);

        const options = { padding: false };
        const base32EncodedSkylink = base32Encode(
          decoded,
          'RFC4648-HEX',
          options,
        ).toLowerCase();
        url = `https://${base32EncodedSkylink}.siasky.net${pathname}${
          search || ''
        }${fragment || ''}`;
      }
    } catch (err) {
      console.warn(err);
    } finally {
      extension.tabs.update(tabId, { url });
    }
  }
}
