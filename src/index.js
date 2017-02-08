/*
Name:       nsapi.js - Unofficial NodeJS module for Nederlandse Spoorwegen API
Author:     Franklin van de Meent
Source:     https://github.com/fvdm/nodejs-ns-api
Feedback:   https://github.com/fvdm/nodejs-ns-api/issues
API Docs:   http://www.ns.nl/api/api
License:    Unlicense (Public Domain)
            (see UNLICENSE file or https://raw.github.com/fvdm/nodejs-ns-api/master/UNLICENSE)
*/

import joi from 'joi'
import R from 'ramda'
import Promise from 'bluebird'
import axios from 'axios'
import { xml2obj as parseXml } from 'nodexml'
import { NsApiError, booleanToString, asArray } from './helpers'

const configSchema = joi.object({
  username: joi.string().required(),
  password: joi.string().required(),
  timeout: joi.number().integer().min(0).default(5000),
  apiBasePath: joi.string().default('https://webservices.ns.nl/ns-api-')
})

class NsApi {
  constructor (config) {
    const { error, value } = joi.validate(config, configSchema)
    if (error != null) {
      throw error
    }

    this.config = value

    // Bind this for event handlers
    this.apiRequest = this.apiRequest.bind(this)
    this.processData = this.processData.bind(this)
    this.vertrekTijden = this.vertrekTijden.bind(this)
  }

  /**
   * Process API response data
   *
   * @param {any} data - The API response data
   * @returns {Promise} - A Promise containing the processed response data
   */
  processData (data) {
    return new Promise((resolve, reject) => {
      // console.log('API response data:', data)

      data = data.replace(/&#039;/g, '\'')

      // parse xml
      try {
        data = R.dissoc('@', parseXml(data))
      } catch (e) {
        reject(new NsApiError('Invalid API response', data))
        return
      }

      // parse API error
      if (data.error) {
        reject(new NsApiError('API error', data.error))
        return
      }


      try {
        // TODO: test this
        const { faultcode, faultstring } = data['soap:Envelope']['soap:Body']['soap:Fault']
        if (faultcode) {
          reject(new NsApiError('API error', {
            code: faultcode,
            message: faultstring
          }))
          return
        }
      } catch (e) {
        // skip
      }

      // all good
      resolve(data)
    })
  }

  /**
   * Send a request to the API
   *
   * @param {String} endpoint - Part of request path `/ns-api-ENDPOINT_NAME`
   * @param {Object} [params={}] - Request parameters
   * @returns {Promise} - A Promise containing the processed response data
   */
  apiRequest (endpoint, params = {}) {
    const {
      username,
      password,
      timeout,
      apiBasePath
    } = this.config

    const url = apiBasePath + endpoint

    const options = {
      timeout,
      auth: {
        username,
        password
      },
      headers: {
        'Accept': 'text/xml; charset=UTF-8',
        'Accept-Encoding': 'gzip',
        'User-Agent': 'nsapi.js (https://github.com/Soullesswaffle/nodejs-ns-api)'
      },
      params: R.map(booleanToString, params)
    }

    // do request
    return Promise.resolve(axios.get(url, options))
      .catch((err) => {
        throw new NsApiError('API request failed', err)
      })
      .then(res => this.processData(res.data))
  }

  /**
   * Vertrektijden - departure times
   *
   * @param station {String} - Station ID
   * @returns {Promise} - A promise containing a data object with departure times
   */

  vertrekTijden (station) {
    return this.apiRequest('avt', { station }).then((data) => {
      if (!data.ActueleVertrekTijden || !data.ActueleVertrekTijden.VertrekkendeTrein) {
        throw new NsApiError('Unexpected API response', data)
      }

      data = asArray(data.ActueleVertrekTijden.VertrekkendeTrein)

      return R.map((entry) => {
        entry.VertrekSpoorWijziging = Boolean(entry.VertrekSpoor.wijziging)
        entry.VertrekSpoor = entry.VertrekSpoor['@text']
        return entry
      }, data)
    })
  }
}

export default NsApi

// /**
//  * Prijzen - tariffs
//  *
//  * @callback callback
//  * @param params {object} - Parameters
//  * @param callback {function} - `function (err, data) {}`
//  * @returns {void}
//  */

// function methodPrijzen (params, callback) {
//   httpRequest('prijzen-v3', params, callback)
// }

// /**
//  * Clean up ReisDeel
//  *
//  * @param data {array, object} - Data from .methodReisAdvies
//  * @returns {array} - Converted data
//  */

// function cleanupReisDeel (data) {
//   let reis
//   let deel
//   let stop
//   let r
//   let d
//   let s

//   data = data.ReisMogelijkheden.ReisMogelijkheid

//   if (!(data instanceof Array)) {
//     data = [data]
//   }

//   if (data.length) {
//     for (r in data) {
//       reis = data[r]

//       if (!(reis.ReisDeel instanceof Array)) {
//         reis.ReisDeel = [reis.ReisDeel]
//       }

//       for (d in reis.ReisDeel) {
//         deel = reis.ReisDeel[d]

//         for (s in deel.ReisStop) {
//           stop = deel.ReisStop[s]

//           if (stop.Spoor) {
//             stop.SpoorWijziging = stop.Spoor.wijziging === 'true'
//             stop.Spoor = stop.Spoor['@text']
//             deel.ReisStop[s] = stop
//           }
//         }

//         reis.ReisDeel[d] = deel
//       }

//       data[r] = reis
//     }
//   }

//   return data
// }

// /**
//  * Reisadvies - travel advise
//  *
//  * @callback callback
//  * @param params {object} - Parameters
//  * @param callback {function} - `function (err, data) {}`
//  * @returns {void}
//  */

// function methodReisadvies (params, callback) {
//   httpRequest('treinplanner', params, function (err, data) {
//     if (err) {
//       return callback(err)
//     }

//     if (!data.ReisMogelijkheden || !data.ReisMogelijkheden.ReisMogelijkheid) {
//       return callback(makeError('unexpected response', 'data', data))
//     }

//     data = cleanupReisDeel(data)
//     return callback(null, data)
//   })
// }

// /**
//  * Clean up station object
//  *
//  * @param station {object} - Station from data
//  * @returns {object} - Cleaned up station
//  */

// function cleanupStation (station) {
//   station.Synoniemen = station.Synoniemen && station.Synoniemen.Synoniem || []

//   if (typeof station.Synoniemen === 'string') {
//     station.Synoniemen = [station.Synoniemen]
//   }

//   return station
// }

// /**
//  * Build stations tree
//  *
//  * @param data {object} - Data from methodStations
//  * @param [treeKey = Code] {string, boolean} - Group stations by station.key
//  * @returns {object, array} - Array if `treeKey` == false, else an object
//  */

// function buildStationsTree (data, treeKey) {
//   let station
//   let tree = {}
//   let i

//   // make an array with stations
//   if (treeKey === false) {
//     tree = []
//   }

//   // shorten data
//   data = data.Stations.Station

//   // iterate stations
//   for (i in data) {
//     station = cleanupStation(data[i])

//     if (treeKey === false) {
//       tree.push(station)
//       break
//     }

//     if (treeKey === 'code') {
//       tree[station.Code] = station
//     } else if (!station[treeKey]) {
//       return new Error('key not found in station')
//     }

//     if (!tree[station[treeKey]]) {
//       tree[station[treeKey]] = {}
//     }

//     tree[station[treeKey]][station.Code] = station
//   }

//   return tree
// }

// /**
//  * List available stations
//  *
//  * @callback callback
//  * @param [treeKey] {string} - Group by this key
//  * @param callback {function} - `function (err, data) {}`
//  */

// function methodStations (treeKey, callback) {
//   if (typeof treeKey === 'function') {
//     callback = treeKey
//     treeKey = 'code'
//   }

//   httpRequest('stations-v2', function (err, data) {

//     if (err) {
//       return callback(err)
//     }

//     if (!data.Stations.Station) {
//       return callback(makeError('unexpected response', 'data', data))
//     }

//     const tree = buildStationsTree(data, treeKey)

//     if (!tree) {
//       return callback(tree)
//     }

//     return callback(null, tree)
//   })
// }

// /**
//  * Clean up storingen
//  *
//  * @param data {object} - Response data from methodStoringen
//  * @returns {array} - Clean up array
//  */

// function cleanupStoringen (data) {
//   const storingen = {}

//   storingen.Gepland = data.Storingen.Gepland.Storing || []
//   storingen.Ongepland = data.Storingen.Ongepland.Storing || []

//   // if object or string convert to array
//   if (!Array.isArray(storingen.Gepland)) {
//     storingen.Gepland = [storingen.Gepland]
//   }

//   if (!Array.isArray(storingen.Ongepland)) {
//     storingen.Ongepland = [storingen.Ongepland]
//   }

//   return storingen
// }

// /**
//  * List disruptions
//  *
//  * @callback callback
//  * @param params {object} - Parameters
//  * @param callback {function} - `function (err, data) {}`
//  */

// function methodStoringen (params, callback) {
//   if (typeof params === 'function') {
//     callback = params
//     params = {
//       actual: true
//     }
//   }

//   httpRequest('storingen', params, function (err, data) {
//     if (err) {
//       return callback(err)
//     }

//     data = cleanupStoringen(data)
//     return callback(null, data)
//   })
// }
