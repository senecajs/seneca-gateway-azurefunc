/* Copyright © 2023 Richard Rodger, MIT License. */

import Url from 'url'

import Cookie from 'cookie'


import { Open, Skip } from 'gubu'


import type {
  GatewayResult
} from '@seneca/gateway'


type WebHookSpec = {
  re: RegExp
  params: string[]
  fixed: Record<string, any>
}

type GatewayAzureOptions = {
  request?: {
    msg?: any
  },
  auth?: {
    azure: {
      required: boolean
    },
    token: {
      // Cookie name
      name: string
    }
    // Default cookie fields
    cookie?: any
  },
  headers: Record<string, string>,
  webhooks?: WebHookSpec[]
}


type GatewayAzureDirective = {
  // Call Lambda response.next (passes error if defined)
  // next?: boolean

  // Set/remove login cookie
  auth?: {

    // Cookie token value
    token: string

    // Override option cookie fields
    cookie?: any

    // Remove auth cookie
    remove?: boolean
  }

  // HTTP redirect
  redirect?: {
    location: string
  }

  // HTTP status code
  status?: number

  // Custom headers
  headers?: Record<string, string>
}



function gateway_azure(this: any, options: GatewayAzureOptions) {
  const seneca: any = this

  const tag = seneca.plugin.tag
  const gtag = (null == tag || '-' === tag) ? '' : '$' + tag
  const gateway = seneca.export('gateway' + gtag + '/handler')
  const parseJSON = seneca.export('gateway' + gtag + '/parseJSON')

  const webhookMatch = async (req: any, body: any, json: any) => {
    let match = false
    const url = req.url || ''
    const path = Url.parse(url).pathname || ''
    done: for (let webhook of (options.webhooks || [])) {
      if (webhook.re) {
        let m = webhook.re.exec(path)
        if (m) {
          let params = (webhook.params || [])
          for (let pI = 0; pI < params.length; pI++) {
            let param = params[pI]
            json[param] = m[1 + pI]
          }
          Object.assign(json, (webhook.fixed || {}))
          json.body = body || {}
          match = true
          break done;
        }
      }
    }
    return match
  }


  async function handler(req: any, context: any) {

    // console.log("REQ: ", req)
    
    
    const res: any = {
      statusCode: 200,
      headers: { ...options.headers },
      body: '{}',
    }
    
    const url = req.url || ''
    let path = Url.parse(url).pathname || ''
    let method = req.method
    let body: Object | null = req.body
    let headers = null == req.headers ? {} :
      Object.entries(req.headers)
        .reduce(
          (a: any, entry: any) => (a[entry[0].toLowerCase()] = entry[1], a),
          ({} as any)
        )
    
    let query = req.query || {}
    
    body = null != body ? req.body : {}
    // TODO: need better control of how the body is presented
    // shallow copy for better control of the body
    let json: any = { ...body }

    if (json.error$) {
      res.statusCode = 400
      res.body = JSON.stringify(json)
      return res
    }
    
    // console.log("HEADERS: ", headers)
    
    // Check if hook
    if (
      // TODO: legacy, deprecate
      'GET' === method
    ) {
      let pm = path.match(/([^\/]+)\/([^\/]+)$/)
      if (pm) {
        json.name = pm[1]
        json.code = pm[2]
        json.handle = 'hook'
      }
    }
    else {
      await webhookMatch(req, body, json)
    }
    
    let queryStringParams: any = Object.entries(query)
      .reduce((a: any, entry: any) => (a[entry[0]] = entry[1], a),
        {})
    
    Object.keys(queryStringParams).forEach((key, _index) => {
      queryStringParams[key] =
        (Array.isArray(queryStringParams[key]) &&
          queryStringParams[key].length === 1) ?
          queryStringParams[key][0] : queryStringParams[key]
    })
    
    json.gateway = {
      params: req.params,
      query: queryStringParams,
      body,
      headers
    }
     
    let result: any = await gateway(json, { res, req, context })
    
    // console.log('queryStringParams: ', queryStringParams)
    // console.log("BODY: ", json )
    // console.log('result: ', result)
    
    if (result.out) {
      res.body = JSON.stringify(result.out)
    }
    
    let gateway$: GatewayAzureDirective = result.gateway$
    // let gateway$: GatewayAzureDirective = { auth: {token: 'TOKEN' } }

    if (gateway$) {
      delete result.gateway$

      if (gateway$.auth && options.auth) {
        if (gateway$.auth.token) {
          let cookieStr =
            Cookie.serialize(
              options.auth.token.name,
              gateway$.auth.token,
              {
                ...options.auth.cookie,
                ...(gateway$.auth.cookie || {})
              }
            )
          res.headers['Set-Cookie'] = cookieStr
        }
        else if (gateway$.auth.remove) {
          res.headers['Set-Cookie'] =
            options.auth.token.name + '=NONE; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        }
      }

      else if (gateway$.redirect?.location) {
        res.statusCode = 302
        res.headers.location = gateway$.redirect?.location
      }

      if (result.error) {
        res.statusCode = gateway$.status || 500
      }
      else if (gateway$.status) {
        res.statusCode = gateway$.status
      }

      // TODO: should also accept `header` to match express
      if (gateway$.headers) {
        res.headers = { ...res.headers, ...gateway$.headers }
      }
    }
    
    /*

    let queryStringParams = {
      ...(event.queryStringParameters || {}),
      ...(event.multiValueQueryStringParameters || {})
    }

    Object.keys(queryStringParams).forEach((key, _index) => {
      queryStringParams[key] =
        (Array.isArray(queryStringParams[key]) &&
          queryStringParams[key].length === 1) ?
          queryStringParams[key][0] : queryStringParams[key]
    })

    json.gateway = {
      params: event.pathParameters,
      query: queryStringParams,
      body,
      headers
    }

    let result: any = await gateway(json, { res, event, context })

    if (result.out) {
      res.body = JSON.stringify(result.out)
    }

    let gateway$: GatewayLambdaDirective = result.gateway$

    if (gateway$) {
      delete result.gateway$

      if (gateway$.auth && options.auth) {
        if (gateway$.auth.token) {
          let cookieStr =
            Cookie.serialize(
              options.auth.token.name,
              gateway$.auth.token,
              {
                ...options.auth.cookie,
                ...(gateway$.auth.cookie || {})
              }
            )
          res.headers['set-cookie'] = cookieStr
        }
        else if (gateway$.auth.remove) {
          res.headers['set-cookie'] =
            options.auth.token.name + '=NONE; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        }
      }

      else if (gateway$.redirect?.location) {
        res.statusCode = 302
        res.headers.location = gateway$.redirect?.location
      }

      if (result.error) {
        res.statusCode = gateway$.status || 500
      }
      else if (gateway$.status) {
        res.statusCode = gateway$.status
      }

      // TODO: should also accept `header` to match express
      if (gateway$.headers) {
        res.headers = { ...res.headers, ...gateway$.headers }
      }
    }
    */

    return res
  }


  async function eventhandler(request: any, context: any) {
    let msg = seneca.util.Jsonic(request.seneca$.msg)

    let json = {
      request,
      ...msg,
    }
    let result: any = await gateway(json, { request, context })
    return result
  }


  return {
    name: 'gateway-azure',
    exports: {
      handler,
      eventhandler,
    }
  }
}


// Default options.
gateway_azure.defaults = {
  event: {
    msg: 'sys,gateway,handle:event'
  },
  auth: {
    azure: {
      required: false
    },
    token: {
      name: 'seneca-auth'
    },
    cookie: Open({
      // maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'None',
      secure: true,
      path: '/',
    })
  },
  headers: Open({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Credentials': 'true',
  }),
  webhooks: [{
    re: RegExp,
    params: [String],
    fixed: {}
  }]
}


export default gateway_azure

if ('undefined' !== typeof (module)) {
  module.exports = gateway_azure
}
