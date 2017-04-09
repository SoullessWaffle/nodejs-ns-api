import R from 'ramda'
import cNsApiError from '../ns-api-error'
import {
  asArray,
  parseBoolean,
  morph
} from '../helpers'
import { departingTrain } from '../lenses'

/**
 * Departures processor
 *
 * @param {Object} data - response to be what?
 * @returns {Object} - Containing a data object with departures
 */
export default (parseDate) => (data) => {
  if (R.view(departingTrain, data) == null) {
    throw cNsApiError('Unexpected API response', data)
  }

  /*
  input object:
  {
    trainId: String,
    departureTime: String,
    departureDelay: String,
    departureDelayText: String,
    destination: String,
    trainType: String,
    carrier: String,
    departingPlatform: { _: String, '$': { changed: String } } 
  }
  output object:
  R.converge(
    R.merge,
    [
    evolve({
      // Parse departure time
      departureTime: parseDate,
      departingPlatform: R.prop('_'),
    }),
  
    applySpec({
      // Process departing platform and whether it changed
      departingPlatformChanged: R.pipe(
        R.path(['departingPlatform', '$', 'changed']),
        parseBoolean
      ),
      route: R.pipe(
        R.propOr(',  ', 'routeText'),
        R.split(', '),
        R.map(R.trim)
      )
    })
    ]
  )
  */
  return R.map(
    // TODO: parse departure delay to milliseconds value (PT28M = +28 min)
    morph(
      // Access just the property
      {
        // Parse departure time
        departureTime: parseDate,
        departingPlatform: R.prop('_'),
        notices: R.pipe(
          R.prop('notice'),
          asArray
        )
      },
      // Access the whole object
      {
        departingPlatformChanged: R.pipe(
          R.pathOr(false, ['departingPlatform', '$', 'changed']),
          parseBoolean
        ),
        route: R.pipe(
          R.propOr([], 'routeText'),
          R.unless(
            R.isEmpty,
            R.pipe(
              R.split(', '),
              R.map(R.trim)
            )
          )
        )
      }
    ),
    asArray(data.departures.departingTrain)
  )
}
