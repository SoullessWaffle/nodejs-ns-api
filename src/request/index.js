import R from 'ramda'
import request from './api-request'
import parse from './api-response-parser'

// request :: String -> Object -> Reader Env (Future Error Object)
export default (endpoint, params) =>
  request(endpoint, params).map(R.chain(parse))
