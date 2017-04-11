import R from 'ramda'
import cNsApiError from '../ns-api-error'
import {
  asArray,
  parseBoolean,
  morph
} from '../helpers'
import { departingTrain } from '../lenses'

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
  */
  return R.map(
    // TODO: parse departure delay to milliseconds value (PT28M = +28 min)
    morph(
      {
        comments: R.pipe(
          R.path(['comments', 'comment']),
          asArray
        ),
        departingPlatform: R.path(['departingPlatform', '_']),
        departingPlatformChanged: R.pipe(
          R.pathOr(false, ['departingPlatform', '$', 'changed']),
          parseBoolean
        ),
        departureTime: R.pipe(
          R.prop('departureTime'),
          parseDate
        ),
        route: R.pipe(
          R.propOr(undefined, 'routeText'),
          R.unless(
            R.equals(undefined),
            R.pipe(
              R.split(', '),
              R.map(R.trim)
            )
          )
        )
      }
    )
  )(asArray(data.departures.departingTrain))
}
