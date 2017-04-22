import R from 'ramda'
import { Reader } from 'ramda-fantasy'
import parseXsdDuration from 'parse-xsd-duration'
import cNsApiError from '../ns-api-error'
import { asArray, bakeReader, morph, parseBoolean, parseDate } from '../helpers'
import { departingTrain } from '../lenses'

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

// departures :: Object -> Reader Env Object
export default data =>
  Reader(config =>
    R.ifElse(
      // If
      R.pipe(R.view(departingTrain), R.isNil),
      // Then
      data => {
        throw cNsApiError('Unexpected API response', data)
      },
      // Else
      R.pipe(
        R.view(departingTrain),
        asArray,
        R.map(
          morph({
            comments: R.pipe(R.path(['comments', 'comment']), asArray),
            departingPlatform: R.path(['departingPlatform', '_']),
            departingPlatformChanged: R.pipe(
              R.pathOr(false, ['departingPlatform', '$', 'changed']),
              parseBoolean
            ),
            departureDelay: R.pipe(
              R.propOr(undefined, 'departureDelay'),
              R.when(
                R.is(String),
                R.pipe(
                  parseXsdDuration,
                  R.ifElse(
                    // If
                    R.equals(null),
                    // Then
                    R.always(undefined),
                    // Else
                    R.multiply(1000)
                  )
                )
              )
            ),
            departureDelayXsd: R.prop('departureDelay'),
            departureTime: R.pipe(
              R.prop('departureTime'),
              bakeReader(parseDate, config)
            ),
            route: R.pipe(
              R.propOr(undefined, 'routeText'),
              R.unless(
                R.equals(undefined),
                R.pipe(R.split(', '), R.map(R.trim))
              )
            )
          })
        )
      )
    )(data)
  )
