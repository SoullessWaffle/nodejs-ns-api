import axios from 'axios'
import R from 'ramda'
import { cNsApiError } from '../ns-api-error'
import Future from 'fluture'
import { booleanToString, futureProp } from '../helpers'
import { Reader } from 'ramda-fantasy'

// get :: String -> Object -> Future Error Object
const get = Future.fromPromise2(R.binary(axios.get))

// apiRequest :: String -> Object -> Reader Env (Future Error String)
export default (endpoint, params = {}) =>
  Reader(config => {
    const url = config.apiBasePath + endpoint

    const options = {
      timeout: config.timeout,
      auth: config.auth,
      headers: {
        Accept: 'text/xml; charset=UTF-8',
        'Accept-Encoding': 'gzip',
        'User-Agent': 'nsapi.js (https://github.com/Soullesswaffle/nodejs-ns-api)'
      },
      params: R.map(booleanToString, params)
    }

    // Make the request
    return get(url, options)
      .chain(futureProp('data'))
      .mapRej(cNsApiError('API request failed'))
  })
