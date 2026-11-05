import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'
import { parse } from 'yaml'
import specification from '../../docs/openapi.yaml?raw'
export default function ApiPlayground() {
  return <div className="api-swagger"><SwaggerUI spec={parse(specification)} docExpansion="list" /></div>
}
