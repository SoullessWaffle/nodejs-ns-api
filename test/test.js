const NsApi = require('../dist/index').default
const auth = require('./fixtures/auth.json')

const ns = NsApi({
  auth,
  futures: true
})

// // ns.currentDisruptions()
// // TODO: test current disruptions for station
// // ns.currentDisruptions('Basel Bad Bf')
// // ns.plannedDisruptions()
ns.departures('Hilversum').fork(console.error, console.log)
