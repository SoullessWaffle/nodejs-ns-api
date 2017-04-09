import R from 'ramda'
import { parseString } from 'xml2js'
import pify from 'pify'
import camelCase from 'camel-case'
import cNsApiError from './ns-api-error'
import { translate } from './helpers'
import { soapFault } from './lenses'

const parseXml = pify(parseString)

/**
 * Process API response data
 *
 * @param {*} rawData - The raw API response data
 * @returns {Promise} - A Promise containing the processed response data
 */
export default async (rawData) => {
  let data
  try {
    data = await parseXml(rawData, {
      explicitArray: false,
      tagNameProcessors: [camelCase, translate],
      attrNameProcessors: [camelCase, translate],
      valueProcessors: [R.trim],
      attrValueProcessors: [R.trim]
    })
  } catch (err) {
    throw cNsApiError('Invalid API response', { rawData, err })
  }

  // parse API error
  if (data.error != null) {
    throw cNsApiError('API error', data.error)
  }

  // TODO: test this
  const { faultcode, faultstring } = R.defaultTo({}, R.view(soapFault, data))
  if (faultcode != null) {
    throw cNsApiError('API error', {
      code: faultcode,
      message: faultstring
    })
  }

  return data
}
