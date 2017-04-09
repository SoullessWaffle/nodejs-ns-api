import { ExtendableError } from './helpers'
import R from 'ramda'

export class NsApiError extends ExtendableError {
  constructor (message, details = {}) {
    super(message)

    this.context = details
  }
}

export const cNsApiError = R.construct(NsApiError)

export default cNsApiError
