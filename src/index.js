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


program
  .version('0.1.0')
  .option('-d, --dir <path>', 'Target directory')
  .option('-c, --config [path]', 'Config file', '.preprc')
  .option('-p, --port [port]', 'Phantom server port', 45678)
  .parse(process.argv)

let config
try {
  config = JSON.parse(fs.readFileSync(path.resolve(program.config)))
} catch (e) {
  throw new Error(`Couldn't read .preprc config file\n${e}`)
}

if (!program.dir) {
  console.log('No target directory provided. Use -d or --dir <path>.')
  process.exit(1)
}
const root = path.resolve(program.dir)

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
