# prep [![npm version](https://badge.fury.io/js/prep.svg)](https://badge.fury.io/js/prep)

Pre-renders your web app into static HTML based on your specified routes enabling SEO for single page applications.

## Features

* 🔎 Makes your single page app SEO friendly
* 🚀 Improves loading speed up to 400x
* ✨ Incredibly flexible and easy to use 
* 📦 Works out-of-the-box with any framework (React, Angular, Backbone...). No code-changes needed.

## Install

```sh
npm install -g prep
```

## Usage

Just run `prep` in your terminal or add it to the `scripts` as part of your build step in your `package.json`. If you don't provide a `target-dir` the contents of the `source-dir` will be overwritten.

```sh
  Usage: prep [options] <source-dir> [target-dir]

  Options:

    -h, --help           output usage information
    -c, --config [path]  Config file (Default: prep.js)
    -p, --port [port]    Phantom server port (Default: 45678)
```

In order to configure the routes which you'd like to pre-render you need to specifiy them in a Javascript config file with the following schema. If you don't provide a config file, `prep` will just pre-render the `/` route.

```js
const defaultConfig = {
  routes: ['/'],
  timeout: 1000,
  dimensions: {
    width: 1440,
    height: 900,
  },
  https: false,
}
```

* `routes` specifies the list of routes that the renderer should pass. (Default: `['/']`)
* `timeout` is the timeout for how long the renderer should wait for network requests. (Default: `1000`)
* `dimensions` the page dimensions in pixels that the renderer should use to render the site. (Default: `1440` x `900`)
* `https` prep uses https if true otherwise http

## Example `prep.js`

There are three different ways to configure `prep`. Which one you pick depends on your use case.

### 1. Javascript Object

The probably easiest way is to export a simple Javascript object.

```js
export default {
  routes: [
    '/',
    '/world'
  ]
}
```

### 2. Synchronous Function

You can also return a function that returns the config for `prep`.

```js
export default () => {
  return {
    routes: [
      '/',
      '/world'
    ]
  }
}
```

### 3. Asynchronous Function (Promise)

Furthermore you can also return a `Promise` or use ES7 features such as `async` & `await`.

```js
export default async () => {
  const routes = await getRoutesAsync()
  return { routes }
}
```

## How it works

The concept behind `prep` is very simple. `prep` starts a temporary local webserver and opens your provided routes via [PhantomJS](http://phantomjs.org/). Each route will be exported as a static HTML file. The resulting folder structure is the same as the structure of your routes.

## Known Issues

 - If you want to use `Object.assign()` in your code, please add a polyfill like [phantomjs-polyfill-object-assign](https://github.com/chuckplantain/phantomjs-polyfill-object-assign), because prep uses PhantomJS, which doesn't support `Object.assign()` yet.


## Help & Community [![Slack Status](https://slack.graph.cool/badge.svg)](https://slack.graph.cool)

Join our [Slack community](http://slack.graph.cool/) if you run into issues or have questions. We love talking to you!

![](http://i.imgur.com/5RHR6Ku.png)
