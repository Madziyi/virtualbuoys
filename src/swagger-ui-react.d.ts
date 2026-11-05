declare module 'swagger-ui-react' {
  import type { ComponentType } from 'react'
  const SwaggerUI: ComponentType<{ spec: object; docExpansion?: string }>
  export default SwaggerUI
}
