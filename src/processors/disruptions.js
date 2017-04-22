import R from 'ramda'
import { Reader } from 'ramda-fantasy'
import { asArray, bakeReader, morph, parseDate } from '../helpers'
import { plannedDisruptions, unplannedDisruptions } from '../lenses'

const processDisruption = disruption =>
  Reader(config =>
    morph({
      date: R.pipe(
        R.propOr(undefined, 'date'),
        R.unless(R.isNil, bakeReader(parseDate, config))
      )
    })(disruption)
  )

const bakePd = bakeReader(processDisruption)

export default data =>
  Reader(config =>
    R.applySpec({
      planned: R.pipe(
        R.view(plannedDisruptions),
        asArray,
        R.map(bakePd(config))
      ),
      unplanned: R.pipe(
        R.view(unplannedDisruptions),
        asArray,
        R.map(bakePd(config))
      )
    })(data)
  )
