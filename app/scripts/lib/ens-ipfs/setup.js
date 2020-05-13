import urlUtil from 'url'
import extension from 'extensionizer'
import resolveEnsToIpfsContentId from './resolver.js'

const supportedTopLevelDomains = ['eth']

export default function setupEnsIpfsResolver ({ provider, getCurrentNetwork, getIpfsGateway }) {

  // install listener
  const urlPatterns = supportedTopLevelDomains.map((tld) => `*://*.${tld}/*`)
  extension.webRequest.onErrorOccurred.addListener(webRequestDidFail, { urls: urlPatterns, types: ['main_frame'] })

  // return api object
  return {
    // uninstall listener
    remove () {
      extension.webRequest.onErrorOccurred.removeListener(webRequestDidFail)
    },
  }

  async function webRequestDidFail (details) {
    const { tabId, url } = details
    // ignore requests that are not associated with tabs
    // only attempt ENS resolution on mainnet
    if (tabId === -1 || getCurrentNetwork() !== '1') {
      return
    }
    // parse ens name
    const urlData = urlUtil.parse(url)
    const { hostname: name, path, search, hash: fragment } = urlData
    const domainParts = name.split('.')
    const topLevelDomain = domainParts[domainParts.length - 1]
    // if unsupported TLD, abort
    if (!supportedTopLevelDomains.includes(topLevelDomain)) {
      return
    }
    // otherwise attempt resolve
    attemptResolve({ tabId, name, path, search, fragment })
  }

  async function attemptResolve ({ tabId, name, path, search, fragment }) {
    const ipfsGateway = getIpfsGateway()
    extension.tabs.update(tabId, { url: `loading.html` })
    let url = `https://app.ens.domains/name/${name}`
    const completeSearch = (search || '') + (!search || search.indexOf('?') === -1 ? '?' : '&') + 'ensd=' + name
    try {
      const { type, hash } = await resolveEnsToIpfsContentId({ provider, name })
      if (type === 'ipfs-ns') {
        const resolvedUrl = `https://${hash}.${ipfsGateway}${path}${completeSearch || ''}${fragment || ''}`
        try {
          // check if ipfs gateway has result
          const response = await window.fetch(resolvedUrl, { method: 'HEAD' })
          if (response.status === 200) {
            url = resolvedUrl
          }
        } catch (err) {
          console.warn(err)
        }
      } else if (type === 'swarm-ns') {
        url = `https://swarm-gateways.net/bzz:/${hash}${path}${completeSearch || ''}${fragment || ''}`
      } else if (type === 'onion' || type === 'onion3') {
        url = `http://${hash}.onion${path}${completeSearch || ''}${fragment || ''}`
      } else if (type === 'zeronet') {
        url = `http://127.0.0.1:43110/${hash}${path}${completeSearch || ''}${fragment || ''}`
      }
    } catch (err) {
      console.warn(err)
    } finally {
      extension.tabs.update(tabId, { url })
    }
  }
}
