import R from 'ramda'

export const soapFault = R.lensPath([
  'soap:Envelope',
  'soap:Body',
  'soap:Fault'
])

export const departingTrain = R.lensPath([
  'departures',
  'departingTrain'
])
