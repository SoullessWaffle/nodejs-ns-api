const NsApi = require('../dist/index').default
const auth = require('./fixtures/auth.json')

const ns = new NsApi(auth)

ns.vertrekTijden('Hilversum')
  .then(data => {
    console.log('data', data)
  })
  .catch(err => {
    console.error('error', err)
  })
