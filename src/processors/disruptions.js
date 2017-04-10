import {
  asArray
} from '../helpers'

const processDisruption = (parseDate) => (disruption) => {
  // Parse disruption date
  if (disruption.date != null) {
    disruption.date = parseDate(disruption.date)
  }

  return disruption
}

export default (parseDate) => {
  const pd = processDisruption(parseDate)

  return (data) => {
    const disruptions = {}

    // TODO: use lenses here
    disruptions.planned = asArray(data.disruptions.planned.disruption)
      .map(pd)
    disruptions.unplanned = asArray(data.disruptions.unplanned.disruption)
      .map(pd)

    return disruptions
  }
}
