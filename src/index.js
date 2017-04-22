/*
Name:       nsapi.js - Unofficial NodeJS module for Nederlandse Spoorwegen API
Author:     Franklin van de Meent
Source:     https://github.com/fvdm/nodejs-ns-api
Feedback:   https://github.com/fvdm/nodejs-ns-api/issues
API Docs:   http://www.ns.nl/api/api
License:    Unlicense (Public Domain)
            (see UNLICENSE file or https://raw.github.com/fvdm/nodejs-ns-api/master/UNLICENSE)
*/

import { Reader } from 'ramda-fantasy'
import look from 'ramda-debug'
import joi from 'joi'

const R = look.wrap(require('ramda'))
// look.on()

// Import helpers
import { validate } from './helpers'
// Import API request handlers
import request from './request'
// Import API response processors
import departuresProcessor from './processors/departures'
import disruptionsProcessor from './processors/disruptions'

// nsApi :: Object -> Object
export default config => {
  // Validate config
  validate(
    joi.object({
      auth: joi.object({
        username: joi.string().required(),
        password: joi.string().required()
      }),
      timeout: joi.number().integer().min(0).default(5000),
      apiBasePath: joi.string().default('https://webservices.ns.nl/ns-api-'),
      momentDates: joi.bool().default(false),
      futures: joi.bool().default(false)
    })
  )(config).either(
    error => {
      throw error
    },
    value => {
      config = value
    }
  )

  // makeApiRequestMethod :: (...args -> Either Error Object) -> String ->
  // (...args -> Object) -> (Object -> Reader Env Object) ->
  // (...args) -> (Future Error Object) | (Promise Error Object)
  const makeApiRequestMethod = R.curry(
    (optionsValidator, endpoint, paramBuilder, processor) => (
      rawOptions = {}
    ) => {
      let resultFuture
      optionsValidator(rawOptions)
        .map(options =>
          request(endpoint, paramBuilder(options))
            .chain(responseFuture =>
              Reader(config =>
                responseFuture.map(data => processor(options, data).run(config))
              )
            )
            .run(config)
        )
        .either(
          error => {
            throw error
          },
          rf => {
            resultFuture = rf
          }
        )

      // Return either a Future or a Promise depending on the config
      return config.futures ? resultFuture : resultFuture.promise()
    }
  )

  // Return api methods
  return {
    /**
     * Request up to date departure information for a station
     * @param {String} station
     * @returns {Object} Departure data
     */
    departures: makeApiRequestMethod(
      // Options validator
      validate(
        joi.object({
          station: joi.string().required()
        })
      ),
      // Endpoint
      'avt',
      // Param builder
      R.identity,
      // Processor
      (options, data) => departuresProcessor(data)
    ),

    /**
     * Request the current disruptions, optionally limited to a specific station
     * @param {String} [station]
     * @returns {Object} Disruptions data
     */
    currentDisruptions: makeApiRequestMethod(
      // Options validator
      validate(
        joi.object({
          station: joi.string().optional()
        })
      ),
      // Endpoint
      'storingen',
      // Param builder
      R.unless(R.has('station'), R.always({ actual: true })),
      // Processor
      (options, data) => disruptionsProcessor(data)
    ),

    /**
     * Request the disruptions due to planned maintenance and engineering work
     * @returns {Object} Disruptions data
     */
    plannedDisruptions: makeApiRequestMethod(
      // Options validator
      validate(joi.object().length(0)),
      // Endpoint
      'storingen',
      // Param builder
      R.always({
        // NB: this parameter is flipped on the API
        unplanned: true
      }),
      // Processor
      (options, data) =>
        R.pipe(disruptionsProcessor, R.map(R.prop('planned')))(data)
    )
  }
}

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
