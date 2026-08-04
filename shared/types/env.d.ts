/// <reference types="@cloudflare/workers-types" />

declare module 'h3' {
  interface H3EventContext {
    cf?: CfProperties
    cloudflare?: {
      request: Request
      env: {
        DB: D1Database
        IMAGES: R2Bucket
      }
      context: ExecutionContext
    }
  }
}

export {}
