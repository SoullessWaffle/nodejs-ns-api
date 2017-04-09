import R from 'ramda'
import moment from 'moment'
import joi from 'joi'
import strings from './strings.json'

// See http://stackoverflow.com/a/32749533/1233003
export class ExtendableError extends Error {
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
    R.test(/^(true|false)$/i)
  ),
  (x) => R.equals(R.toLower(x), 'true')
)

export const parseDate = (returnMomentDates) => (rawDate) => {
  const date = moment(rawDate, moment.ISO_8601, true)
  const valid = date.isValid()

  if (!valid) return rawDate

  if (returnMomentDates) return date
  else return date.toDate()
}

export const asArray = R.unless(
  (x) => R.equals(R.type(x), 'Array'),
  R.ifElse(
    // If x is null or undefined
    R.isNil,
    // Return an empty array
    R.always([]),
    // Else return the value in an array
    R.of
  )
)

export const translate = (key) => {
  return strings[key] || key
}

export const processParams = (schema, data) => {
  const { error, value } = joi.validate(data, schema)

  if (error != null) throw error

  return value
}

export const validateConfig = R.curry((schema, config) => {
  const result = joi.validate(config, schema)

  if (result.error != null) {
    throw result.error
  }

  return result.value
})

export const alwaysCall = (fn) =>
  (...args) =>
    (args.length === 0) ? fn(undefined) : fn(...args)
