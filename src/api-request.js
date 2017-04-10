import axios from 'axios'
import R from 'ramda'
import cNsApiError from './ns-api-error'
import { booleanToString } from './helpers'

export default (auth, timeout, apiBasePath) => (endpoint, params = {}) => {
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
  return axios.get(url, options)
    .then(R.prop('data'))
    .catch(cNsApiError('API request failed'))
}
