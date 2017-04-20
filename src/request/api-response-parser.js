import R from 'ramda'
import { parseString } from 'xml2js'
import camelCase from 'camel-case'
import Future from 'fluture'
import {
  cNsApiError
} from '../ns-api-error'
import { translate, trimTabsAndNewlines } from '../helpers'
import { soapFault } from '../lenses'

// parseXml :: String -> Object -> Future Error Object
const parseXml = (xml, options) => Future.node(done => parseString(xml, options, done))

const processStringValues = R.when(R.is(String), R.pipe(
  R.trim,
  trimTabsAndNewlines
))

// apiResponseParser :: Object -> Future Error Object
export default (rawData) => {
  return parseXml(rawData, {
    explicitArray: false,
    tagNameProcessors: [camelCase, translate],
    attrNameProcessors: [camelCase, translate],
    valueProcessors: [processStringValues],
    attrValueProcessors: [processStringValues]
  })
    .mapRej(err => cNsApiError('Invalid API response', { rawData, err }))
    .chain(
      R.ifElse(
        // If
        R.pipe(R.prop('error'), R.isNil),
        // Then
        Future.of,
        // Else
        R.pipe(
          R.prop('error'),
          cNsApiError('API error'),
          Future.reject
        )
      )
    )
    .chain(data => {
      // TODO: test this
      const { faultcode, faultstring } = R.defaultTo({}, R.view(soapFault, data))
      if (faultcode != null) {
        return Future.reject(cNsApiError('API error', {
          code: faultcode,
          message: faultstring
        }))
      }

      return Future.of(data)
    })
}
