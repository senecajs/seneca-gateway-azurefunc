
import GatewayAzure from '../src/gateway-azure'

const Seneca = require('seneca')

describe('gateway-azure', () => {

  test('happy', async () => {
    const seneca = Seneca({ legacy: false })
      .test()
      .use('promisify')
      .use('gateway')
      .use(GatewayAzure)
    await seneca.ready()
  })


  test('basic', async () => {
    const seneca = Seneca({ legacy: false })
      .test()

      // use quiet$ directive when available
      .quiet()

      .use('promisify')
      .use('gateway')
      .use(GatewayAzure)
      .act('sys:gateway,add:hook,hook:fixed', { action: { y: 99 } })
      .message('foo:1', async function(m: any) {
        return { x: m.x, y: m.y }
      })

    await seneca.ready()

    let handler = seneca.export('gateway-azure/handler')

    let evmock = (body: any, headers?: any) => ({
      body,
      query: body.query,
      params: body.params,
      headers: headers || {},
    })
    let ctxmock = {}

    let out = await handler(evmock({
      foo: 1,
      x: 2,
      params: { var: 1 },
      query: { query: 1 },
    }, { 'Foo-Bar': 'Zed' }), ctxmock)
    
    out.body = out.body.replace(/,"meta\$":\{"id":".*"\}/, '')

    expect(out).toMatchObject({
      "body": "{\"x\":2,\"y\":99}",
      "headers": {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      },
      "statusCode": 200,
    })

    out = await handler(evmock({ bad: 1 }), ctxmock)

    out.body =
      out.body.replace(/meta\$":\{"id":"[^"]+"/, 'meta$\":{\"id\":\"METAID\"')

    expect(out).toMatchObject({
      "body": "{\"meta$\":{\"id\":\"METAID\"},\"error$\":{\"name\":\"Error\",\"code\":\"act_not_found\"}}",
      "headers": {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      },
      "statusCode": 500,
    })

  })


  test('headers', async () => {
    const seneca = Seneca({ legacy: false })
      .test()

      // use quiet$ directive when available
      .quiet()

      .use('promisify')
      .use('gateway')
      .use(GatewayAzure, {
        headers: {
          "Access-Control-Allow-Origin": "foo",
          "Access-Control-Allow-Headers": "bar"
        }
      })
      .act('sys:gateway,add:hook,hook:fixed', { action: { y: 99 } })
      .message('foo:1', async function(m: any) {
        expect(m.gateway.headers['foo-bar']).toEqual('Zed')
        return { x: m.x, y: m.y }
      })

    await seneca.ready()

    let handler = seneca.export('gateway-azure/handler')

    let evmock = (body: any, headers?: any) => ({
      body,
      headers: headers || {},
    })
    let ctxmock = {}

    let out = await handler(evmock({ foo: 1, x: 2 }, { 'Foo-Bar': 'Zed' }), ctxmock)
    out.body = out.body.replace(/,"meta\$":\{"id":".*"\}/, '')

    expect(out).toMatchObject({
      "body": "{\"x\":2,\"y\":99}",
      "headers": {
        "Access-Control-Allow-Origin": "foo",
        "Access-Control-Allow-Headers": "bar"
      },
      "statusCode": 200,
    })
  })



  test('eventhandler', async () => {

    const seneca = Seneca({ legacy: false })
      .test()

      // use quiet$ directive when available
      // .quiet()

      .use('promisify')
      .use('gateway')
      .use(GatewayAzure)
      .message('foo:1', async function(msg: any) {
        return { ok: true, bar: 2, event: msg.event }
      })

    await seneca.ready()

    let eventhandler = seneca.export('gateway-azure/eventhandler')

    let res = await eventhandler(
      {
        seneca$: {
          msg: 'foo:1'
          // msg: { foo: 1 }
        }
      },
      { ctx: true }
    )

    // console.log(res)

    let out = res.out

    expect(out).toMatchObject({ ok: true, bar: 2, event: {} })
  })


  test('webhooks', async () => {
    const seneca = Seneca({ legacy: false })
      // .test('print')

      // use quiet$ directive when available
      .quiet()

      .use('promisify')
      .use('gateway')
      .use(GatewayAzure, {
        webhooks: [{
          re: /api\/public\/hook\/([^\/]+)\/([^\/?]+)/,
          params: ['name', 'code'],
          fixed: { handle: 'hook' },
        }]
      })
      .message('handle:hook,name:foo', async function(m: any) {
        // console.log(m)

        return { x: m.body.x, y: m.gateway.query.y }
      })

    await seneca.ready()

    let handler = seneca.export('gateway-azure/handler')

    let evmock = (path: string, body: any, headers?: any, query?: any) => ({
      url: path,
      body,
      headers: headers || {},
      query: query || {},
    })
    let ctxmock = {}

    let event = evmock(
      'http://example.com/api/public/hook/foo/bar?y=1',
      { x: 2 },
      { 'Foo-Bar': 'Zed' },
      { y: '1' },
    )

    //  console.log('EVENT', event)

    let out = await handler(event, ctxmock)
    out.body = out.body.replace(/,"meta\$":\{"id":".*"\}/, '')

    expect(out).toMatchObject({
      "body": "{\"x\":2,\"y\":\"1\"}",
      "statusCode": 200,
    })
  })


})
