import handlers from './handlers'

/**
 * The purpose of this middleware is to create portable RPC method
 * implementations that are decoupled from the rest of our background
 * architecture.
 * 
 * Handlers consume functions that hook into the background, and only depend
 * on their signatures, not e.g. controller internals.
 * 
 * Eventually, we'll want to extract this middleware into its own package.
 */

const handlerMap = handlers.reduce((map, handler) => {
  map.set(handler.methodName, handler.implementation)
  return map
}, new Map())

/**
 * Returns a middleware that implements the following RPC methods:
 * - metamask_logInjectedWeb3Usage
 *
 * @param {Object} opts - The middleware options
 * @param {string} opts.origin - The origin for the middleware stack
 * @param {Function} opts.sendMetrics - A function for sending a metrics event
 * @returns {(req: Object, res: Object, next: Function, end: Function) => void}
 */
export default function createMethodMiddleware (opts) {
  return function methodMiddleware (req, res, next, end) {
    if (handlerMap.has(req.method)) {
      return handlerMap.get(req.method)(req, res, next, end, opts)
    }
    return next()
  }
}
