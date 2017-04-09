import R from 'ramda'
import cNsApiError from '../ns-api-error'
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
    throw new cNsApiError('Unexpected API response', data)
  }

  return R.map((entry) => {
    // Parse departure time
    entry.departureTime = parseDate(entry.departureTime)

    // Process departing platform and whether it changed
    entry.departingPlatformChanged = parseBoolean(
      entry.departingPlatform['$'].changed
    )
    entry.departingPlatform = entry.departingPlatform['_']

    // Parse route text to route array
    if (entry.routeText != null) {
      entry.route = entry.routeText.split(', ').map(R.trim)
    }

    // Process notices
    if (entry.notices != null) {
      entry.notices = asArray(entry.notices.notice)
    }

    // TODO: parse departure delay to milliseconds value (PT28M = +28 min)

    return entry
  }, asArray(data.departures.departingTrain))
}
