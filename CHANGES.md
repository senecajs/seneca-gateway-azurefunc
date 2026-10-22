# Changes

## 0.1.0 2026-10-22

* Seneca 4 support. Seneca 4.0.0 validates with
  [shape](https://github.com/rjrodger/shape), the renamed successor of
  Gubu, and rejects option defaults built with Gubu, so 0.0.4 stops the
  process at startup there (`plugin_gubu_shape`). `defaults` is now a
  function of `{ valid }`, the builders Seneca passes to it: shape on
  Seneca 4, Gubu on Seneca 3. The options are unchanged.
* The gubu import is removed. gubu was never a declared dependency; it
  was available only through Seneca's own dependency on it.
* Breaking: Seneca 3 support starts at 3.38. The peer range is
  `>=3.38||>=4.0.0-rc5` (was `>=3`).
* The package is published as `@seneca/gateway-azure`, as before; the
  repository's package.json had been renamed to
  `@seneca/gateway-azurefunc`, a name that was never published.
* `@seneca/gateway` stays at `^0.8.0`, which loads on Seneca 4.0.0.
* The tests run against Seneca 4.0.0, 4.0.0-rc5 (the development
  dependency, `^4.0.0-rc5`) and 3.38, and check the auth cookie built
  from the `auth.cookie` option. `.npmrc` sets `legacy-peer-deps` while
  published dependencies exclude the Seneca 4 prerelease from their
  peer range.
