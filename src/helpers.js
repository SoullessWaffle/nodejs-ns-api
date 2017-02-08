import R from 'ramda'

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

// TODO: Figure out how to use JSDoc for functions returned by Ramda
export const booleanToString = R.when(
  R.pipe(
    R.type,
    R.partial(R.equals, ['Boolean'])
  ),
  R.toString
)

export const asArray = R.unless(
  R.pipe(
    R.type,
    R.partial(R.equals, ['Array'])
  ),
  (x) => [x]
)
