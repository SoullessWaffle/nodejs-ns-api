const NsApi = require('../dist/index').default
const auth = require('./fixtures/auth.json')
const util = require('util')

const ns = NsApi({ auth })

// ns.currentDisruptions()
// TODO: test current disruptions for station
// ns.currentDisruptions('Basel Bad Bf')
// ns.plannedDisruptions()
ns.departures('Hilversum')
  .then(data => {
    console.log('data', util.inspect(data, false, null))
  })
  .catch(err => {
    console.error(err, util.inspect(err.details, false, null))
  })
