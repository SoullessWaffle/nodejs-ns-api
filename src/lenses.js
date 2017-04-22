import R from 'ramda'

export const soapFault = R.lensPath([
  'soap:Envelope',
  'soap:Body',
  'soap:Fault'
])

// prettier-ignore
export const departingTrain = R.lensPath([
  'departures',
  'departingTrain'
])

export const plannedDisruptions = R.lensPath([
  'disruptions',
  'planned',
  'disruption'
])

export const unplannedDisruptions = R.lensPath([
  'disruptions',
  'unplanned',
  'disruption'
])
