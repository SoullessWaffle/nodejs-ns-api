import R from 'ramda'
import moment from 'moment'

// See http://stackoverflow.com/a/32749533/1233003
class ExtendableError extends Error {
  constructor (message) {
    super(message)
    this.name = this.constructor.name
    this.message = message

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor)
    } else {
      this.stack = (new Error(message)).stack
    }
  }
}

export class NsApiError extends ExtendableError {
  constructor (message, details = {}) {
    super(message)

    this.context = details
  }
}

export const conditionalConvert = R.curry((fn, predicate, value) => {
  const result = fn(value)
  return predicate(result) ? result : value
})

// TODO: Figure out how to use JSDoc for functions returned by Ramda
export const booleanToString = R.when(
  (x) => R.equals(R.type(x), 'Boolean'),
  R.toString
)

export const parseBoolean = R.when(
  R.both(
    (x) => R.equals(R.type(x), 'String'),
    R.partial(R.test, [/^(true|false)$/i])
  ),
  (x) => R.equals(R.toLower(x), 'true')
)

export const parseIsoDate = conditionalConvert(
  // Converter
  (x) => moment(x, moment.ISO_8601, true),
  // Predicate
  (x) => x.isValid()
)

export const asArray = R.unless(
  (x) => R.equals(R.type(x), 'Array'),
  (x) => [x]
)