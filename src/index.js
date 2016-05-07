#!/usr/bin/env node

import program from 'commander'
import path from 'path'
import fs from 'fs'
import http from 'http'
import express from 'express'
import serveStatic from 'serve-static'
import fallback from 'express-history-api-fallback'
import mkdirp from 'mkdirp'
import phantom from 'phantom'
import { exec } from 'child-process-promise'

let config, root

program
  .description('Server-side rendering tool for your web app.\n  Prerenders your app into static HTML files and supports routing.')
  .arguments('<build-dir>')
  .option('-c, --config [path]', 'Config file (Default: .preprc)', '.preprc')
  .option('-p, --port [port]', 'Phantom server port (Default: 45678)', 45678)
  .action((dir) => {
    if (!dir) {
      console.log('No target directory provided.')
      process.exit(1)
    }

    root = path.resolve(dir)
  })

program.parse(process.argv)

try {
  config = JSON.parse(fs.readFileSync(path.resolve(program.config)))
} catch (e) {
  throw new Error(`Couldn't read .preprc config file\n${e}`)
}

const app = express()
  .use(serveStatic(root))
  .use(fallback('index.html', { root: root }))

const server = http.createServer(app).listen(program.port)

const promises = config.routes.map((route) => {
  let page, instance

  // remove leading slash from route
  route = route.replace(/^\//, '')

  return phantom.create()
    .then((_instance) => {
      instance = _instance
      return instance.createPage()
    })
    .then((_page) => {
      page = _page
      return page.open(`http://localhost:45678/${route}`)
    })
    .then(() => (
      page.evaluate(function() {
        return document.documentElement.outerHTML
      })
    ))
    .then((content) => {
      const filePath = path.join('./.tmp-prep', route)
      mkdirp.sync(filePath)
      fs.writeFileSync(path.join(filePath, 'index.html'), content)

      console.log(`prep: Rendered ${route}/index.html`)

      page.close()
      instance.exit()
    })
    .catch((error) => {
      console.log(error)
      instance.exit()
    })
})

Promise.all(promises)
  .catch(() => server.close())
  .then(() => server.close())
  .then(() => exec('cp -r ./.tmp-prep/ ./dist/'))
  .then(() => exec('rm -rf ./.tmp-prep'))
  .then(() => process.exit(0))
