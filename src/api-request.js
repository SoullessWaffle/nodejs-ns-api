import axios from 'axios'
import R from 'ramda'
import NsApiError from './ns-api-error'
import { booleanToString } from './helpers'

/**
 * Send a request to the API
 *
 * @param {String} endpoint - Part of request path `/ns-api-ENDPOINT_NAME`
 * @param {Object} [params={}] - Request parameters
 * @returns {Promise} - A Promise containing the processed response data
 */
export default (auth, timeout, apiBasePath) => async (endpoint, params = {}) => {
  const url = apiBasePath + endpoint

  const options = {
    timeout,
    auth,
    headers: {
      'Accept': 'text/xml; charset=UTF-8',
      'Accept-Encoding': 'gzip',
      'User-Agent': 'nsapi.js (https://github.com/Soullesswaffle/nodejs-ns-api)'
    },
    params: R.map(booleanToString, params)
  }

  // Make the request
  let res
  try {
    res = await axios.get(url, options)
  } catch (err) {
    throw new NsApiError('API request failed', err)
  }

  return res.data
}
