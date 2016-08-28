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

const util = require('util')

const crawlAndWrite = (configuration) => {
  const app = express()
    .use(serveStatic(buildDir))
    .use(fallback('index.html', { root: buildDir }))

  const server = http.createServer(app).listen(program.port)

  const promises = configuration.routes.map((route) => {
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
        page.property('viewportSize', {width: configuration.pagewidth, height: 1080})
        return page.open(`http://localhost:${program.port}/${route}`)
      })
      .then(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(page.evaluate(
              () => document.documentElement.outerHTML,
              configuration.timeout)
          ))
        })
      })
      .then((content) => {
        const filePath = path.join(tmpDir, route)
        mkdirp.sync(filePath)
        fs.writeFileSync(path.join(filePath, 'index.html'), content)

        const logFileName = `${route}/index.html`.replace(/^\//, '')
        console.log(`prep: Rendered ${logFileName}`)

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
    .then(() => exec(`cp -rf ${tmpDir}/* ${buildDir}/`))
    .then(() => exec(`rm -rf ${tmpDir}`))
    .then(() => process.exit(0))
}

let babel = require('babel-core')

let config, buildDir, tmpDir

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

    buildDir = path.resolve(dir)
    tmpDir = path.resolve('.prep-tmp')
  })

program.parse(process.argv)

try {
  const code = babel.transformFileSync(path.resolve(program.config), {presets: ["es2015"]}).code
  mkdirp.sync(tmpDir)
  fs.writeFileSync(path.join(tmpDir, 'prep.js'), code)
  config = require(path.join(tmpDir, 'prep.js')).default

  if (Promise.resolve(config) === config) {
    config.then((x) => {
      crawlAndWrite(x)
    })
  } else if (typeof config === 'function') {
    crawlAndWrite(config())
  } else {
    crawlAndWrite(config)
  }
} catch (e) {
  throw new Error(e)
}

