const NsApi = require('../dist/index').default
const auth = require('./fixtures/auth.json')
const util = require('util')

const ns = new NsApi({ auth })

ns.departureTimes('Hilversum')
  .then(data => {
    console.log('data', util.inspect(data, false, null))
  })
  .catch(err => {
    console.error(err, util.inspect(err.details, false, null))
  })
