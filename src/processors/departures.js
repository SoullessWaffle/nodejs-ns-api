import R from 'ramda'
import NsApiError from '../ns-api-error'
import {
  asArray,
  parseBoolean
} from '../helpers'
import { departingTrain } from '../lenses'

/**
 * Departures
 *
 * @param {String} station - Station ID
 * @returns {Promise} - A promise containing a data object with departures
 */
export default (parseDate) => (data) => {
  if (R.view(departingTrain, data) == null) {
    throw new NsApiError('Unexpected API response', data)
  }

  return R.map((entry) => {
    // Parse departure time
    entry.departureTime = parseDate(entry.departureTime)

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
}
