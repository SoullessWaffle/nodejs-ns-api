/*
Name:       nsapi.js - Unofficial NodeJS module for Nederlandse Spoorwegen API
Author:     Franklin van de Meent
Source:     https://github.com/fvdm/nodejs-ns-api
Feedback:   https://github.com/fvdm/nodejs-ns-api/issues
API Docs:   http://www.ns.nl/api/api
License:    Unlicense (Public Domain)
            (see UNLICENSE file or https://raw.github.com/fvdm/nodejs-ns-api/master/UNLICENSE)
*/

import camelCase from 'camel-case'
import moment from 'moment'
import joi from 'joi'
import R from 'ramda'
import Promise from 'bluebird'
import axios from 'axios'
import { parseString } from 'xml2js'
import {
  asArray,
  booleanToString,
  NsApiError,
  parseBoolean,
  parseIsoDate,
  processParams,
  translate
} from './helpers'
import {
  departingTrain,
  soapFault
} from './lenses'

const parseXml = Promise.promisify(parseString)

const configSchema = joi.object({
  auth: joi.object({
    username: joi.string().required(),
    password: joi.string().required()
  }),
  timeout: joi.number().integer().min(0).default(5000),
  apiBasePath: joi.string().default('https://webservices.ns.nl/ns-api-'),
  momentDates: joi.bool().default(false)
})

class NsApi {
  constructor (config) {
    const { error, value } = joi.validate(config, configSchema)
    if (error != null) {
      throw error
    }

    this.config = value

    // Bind this for event handlers
    this.normalizeDate = this.normalizeDate.bind(this)
    this.processData = this.processData.bind(this)
    this.apiRequest = this.apiRequest.bind(this)
    this.departures = this.departures.bind(this)
    this.disruptions = this.disruptions.bind(this)
  }

  /**
   * Normalize a date to either a moment date
   * or a js date object depending on the config
   *
   * @param {Date|Moment} date
   * @returns {Date|Moment} The normalized date
   */
  // TODO: refactor this + parseIsoDate helper
  normalizeDate (date) {
    // Ignore date strings
    if (R.type(date) === 'String') return date

    const { momentDates } = this.config
    const isMoment = moment.isMoment(date)

    // if the date type matches the config, return it as-is
    if (isMoment === momentDates) return date

    // if the date is a moment date but the
    // config requires normal dates, convert it
    if (isMoment && !momentDates) return date.toDate()

    // Otherwise convert it to a moment date
    return moment(date)
  }

  /**
   * Process API response data
   *
   * @param {*} rawData - The raw API response data
   * @returns {Promise} - A Promise containing the processed response data
   */
  processData (rawData) {
    return parseXml(rawData, {
      explicitArray: false,
      tagNameProcessors: [camelCase, translate],
      attrNameProcessors: [camelCase, translate],
      valueProcessors: [R.trim],
      attrValueProcessors: [R.trim]
    })
      .catch(err => {
        throw new NsApiError('Invalid API response', { rawData, err })
      })
      .then(data => {
        // parse API error
        if (data.error != null) {
          throw new NsApiError('API error', data.error)
        }

        // TODO: test this
        const { faultcode, faultstring } = R.defaultTo({}, R.view(soapFault, data))
        if (faultcode != null) {
          throw new NsApiError('API error', {
            code: faultcode,
            message: faultstring
          })
        }

        return data
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
      auth,
      timeout,
      apiBasePath
    } = this.config

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

    // do request
    return Promise.resolve(axios.get(url, options))
      .catch((err) => {
        throw new NsApiError('API request failed', err)
      })
      .then(res => this.processData(res.data))
  }

  /**
   * Departures
   *
   * @param {String} station - Station ID
   * @returns {Promise} - A promise containing a data object with departures
   */
  departures (station) {
    return this.apiRequest('avt', { station }).then((data) => {
      if (R.view(departingTrain, data) == null) {
        throw new NsApiError('Unexpected API response', data)
      }

      return R.map((entry) => {
        // Parse departure time
        entry.departureTime = this.normalizeDate(
          parseIsoDate(entry.departureTime)
        )

        // Process departing platform and whether it changed
        entry.departingPlatformChange = parseBoolean(
          entry.departingPlatform['$'].change
        )
        entry.departingPlatform = entry.departingPlatform['_']

        // Parse route text to route array
        if (entry.routeText != null) {
          entry.route = entry.routeText.split(', ').map(R.trim)
        }

        // Process comments
        if (entry.comments != null) {
          entry.comments = asArray(entry.comments.comment)
        }

        // TODO: parse departure delay to milliseconds value (PT28M = +28 min)

        return entry
      }, asArray(data.departures.departingTrain))
    })
  }

  /**
   * Disruptions
   *
   * @param {Object} options - Options
   * @returns {Promise}
   */
  disruptions (options) {
    return processParams(joi.object({
      station: joi.string().optional(),
      actual: joi.boolean().optional(),
      unplanned: joi.boolean().optional()
    }), options)
      .then((params) => {
        // Flip unplanned option because the API is weird
        if (R.type(params.unplanned) === 'Boolean') {
          params.unplanned = !params.unplanned
        }
        return params
      })
      .then((params) => this.apiRequest('storingen', params))
      .then((data) => {
        const processDisruption = (disruption) => {
          // Parse disruption date
          if (disruption.date != null) {
            disruption.date = this.normalizeDate(
              parseIsoDate(disruption.date)
            )
          }

          return disruption
        }

        const disruptions = {}

        disruptions.planned = asArray(data.disruptions.planned.disruption)
          .map(processDisruption)
        disruptions.unplanned = asArray(data.disruptions.unplanned.disruption)
          .map(processDisruption)

        return disruptions
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
