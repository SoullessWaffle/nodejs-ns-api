const NsApi = require('../dist/index').default
const auth = require('./fixtures/auth.json')

const ns = NsApi({
  auth,
  futures: true
})

// ns.plannedDisruptions()
// ns.currentDisruptions()
// TODO: test current disruptions for station
// ns.currentDisruptions('Amsterdam Centraal')
ns.departures('Hilversum')
  .fork(console.error, console.log)
