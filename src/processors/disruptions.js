import R from 'ramda'
import { Reader } from 'ramda-fantasy'
import { asArray, bakeReader, morph, parseDate } from '../helpers'
import { plannedDisruptions, unplannedDisruptions } from '../lenses'

const processDisruption = disruption =>
  Reader(env =>
    morph({
      date: R.pipe(
        R.propOr(undefined, 'date'),
        R.unless(R.isNil, bakeReader(parseDate, env))
      )
    })(disruption)
  )

const bakePd = bakeReader(processDisruption)

export default data =>
  Reader(env =>
    R.applySpec({
      planned: R.pipe(R.view(plannedDisruptions), asArray, R.map(bakePd(env))),
      unplanned: R.pipe(
        R.view(unplannedDisruptions),
        asArray,
        R.map(bakePd(env))
      )
    })(data)
  )
