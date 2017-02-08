const NsApi = require('../dist/index').default
const auth = require('./fixtures/auth.json')
const util = require('util')

const ns = new NsApi({ auth })

ns.vertrekTijden('Hilversum')
  .then(data => {
    console.log('data', util.inspect(data, false, null))
  })
  .catch(err => {
    console.error('error', err)
  })
