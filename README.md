# prep [![npm version](https://badge.fury.io/js/prep.svg)](https://badge.fury.io/js/prep)

Pre-renders your web app (React, Angular, ...) into static HTML based on your specified routes enabling SEO for single page applications.

## Install

```sh
npm install -g prep
```

## Usage

```sh
  Usage: prep [options] <build-dir> [<target-dir>]

  Options:

    -h, --help           output usage information
    -c, --config [path]  Config file (Default: prep.js)
    -p, --port [port]    Phantom server port (Default: 45678)
```

A prep config will be used to configure rendering specific details the prep config needs to have the following schema.

```js
const defaultConfig = {
  routes: ['/'],
  timeout: 1000,
  pagewidth: 1440,
}
```
* `routes` specifies the list of routes that the renderer should pass. (Default: `['/']`)
* `timeout` is the timeout for how long the renderer should wait for network requests. (Default: `1000`)
* `pagewidth` the page width in pixels that the renderer should use to render the site. (Default: `1440`)

## Example `prep.js`
There are different possibilities to return a prep config.

1. Javascript object
2. Synchronous function
3. Promise

First and easiest way is to return a Javascript object by itself.

```js
export default {
  routes: [
    "/",
    "/world"
  ]
}
```

You can also return a function that returns the prep config.

```js
export default () => {
  return {
    routes: [
      "/",
      "/world"
    ]
  }
}
```

Furthermore you can also return a `Promise` or use `async` & `await`.

```js
export default async () => {
  const routes = await getRoutesAsync()
  return { routes }
}
```

## Known Issues

 - If you want to use `Object.assign()` in your code, please add a polyfill like [phantomjs-polyfill-object-assign](https://github.com/chuckplantain/phantomjs-polyfill-object-assign), because prep uses PhantomJS, which doesn't support `Object.assign()` yet.
