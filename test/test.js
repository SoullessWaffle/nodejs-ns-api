const NsApi = require('../dist/index').default
const auth = require('./fixtures/auth.json')

const ns = NsApi({
  auth,
  futures: true
})

// ns.plannedDisruptions()
// ns.currentDisruptions()
// TODO: test current disruptions for station
// ns.currentDisruptions({ station: 'Amsterdam Centraal' })
ns.departures({ station: 'Hilversum' })
  .fork(console.error, console.log)
