# Changes

## 0.1.0 2026-11-21

First entry of this change log. Earlier versions are on npm and in the git history.

* Seneca 4: the peer dependency is `seneca` `^4.0.0` (was `>=3`).
  Seneca 3 users stay on `@seneca/gateway-azure@0.0.4`.
* The package is published as `@seneca/gateway-azure`, as before. The
  repository's `package.json` had been renamed to
  `@seneca/gateway-azurefunc`, a name that was never published.
* `@seneca/gateway` is a peer dependency at `^2.0.0` (was `>=0.7`), the
  Seneca 4 release of the gateway. The runtime dependency on
  `@seneca/gateway` `^0.8.0` is removed: the plugin uses the gateway
  that the application loads. Error responses now have the
  `@seneca/gateway` 2 body, `{ meta$, name, id, code }`, without the
  `error$` object of 0.8.
* Node.js 24 or later (`engines.node` `>=24`).
* The peer dependency `seneca-promisify` is removed. Seneca 4 has
  promises built in, and the tests no longer load the plugin (D4).
* The option defaults are built with the validator that Seneca passes to
  the plugin: `defaults` is now a function of `{ valid }` (B1). Seneca 4
  validates options with shape and rejects defaults built with Gubu, so
  0.0.4 stops at startup there with `plugin_gubu_shape`. The gubu import
  is removed; gubu was never a declared dependency. The option keys and
  values are unchanged. `auth.cookie` and `headers` stay open, so they
  accept keys that the defaults do not name, such as a cookie `maxAge`.
  Unknown keys in the other option objects, such as `auth` and
  `auth.azure`, are rejected with `invalid_plugin_option`, as they were
  on Seneca 3 (B13).
* The runtime dependency `cookie` is `^0.7.2` (was `^0.5.0`), for the
  advisory GHSA-pxg6-pf52-xh8x. Cookie names, paths and domains with
  characters outside RFC 6265 are now rejected.
* TypeScript: the plugin function is typed `this: Seneca.Instance`, with
  a type-only import of `seneca` (B10).
* The tests load plugins by their full names (`@seneca/gateway`, B14) and
  check the auth cookie built from the `auth.cookie` option.
