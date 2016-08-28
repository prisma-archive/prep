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

const crawlAndWrite = async (configuration) => {

  let dimensions = Object.assign({}, {width: 1440, height: 900}, configuration.dimensions)
  delete configuration.dimensions
  configuration = Object.assign({}, {
    routes: ['/'], timeout: 1000, dimensions
  }, configuration)

  const app = express()
    .use(serveStatic(buildDir))
    .use(fallback('index.html', { root: buildDir }))

  const server = http.createServer(app).listen(program.port)

  const promises = configuration.routes.map(async (route) => {
    // remove leading slash from route
    route = route.replace(/^\//, '')
    const instance = await phantom.create()
    const page = await instance.createPage()
    page.property('viewportSize', {width: configuration.dimensions.width, height: configuration.dimensions.height})
    await page.open(`http://localhost:${program.port}/${route}`)
    const content = await new Promise((resolve) => {
          setTimeout(() => resolve(page.evaluate(
              () => document.documentElement.outerHTML,
              configuration.timeout)
          ))
        })
    const filePath = path.join(tmpDir, route)
    mkdirp.sync(filePath)
    fs.writeFileSync(path.join(filePath, 'index.html'), content)

    const logFileName = `${route}/index.html`.replace(/^\//, '')
    console.log(`prep: Rendered ${logFileName}`)

    page.close()
    instance.exit()
  })

  mkdirp.sync(targetDir)

  await Promise.all(promises)
  server.close()
  await exec(`rm -f ${tmpDir}/prep.js`)
  await exec(`cp -rf ${tmpDir}/* ${targetDir}/`)
  await exec(`rm -rf ${tmpDir}`)
  process.exit(0)
}

let babel = require('babel-core')

let config, buildDir, targetDir, tmpDir

program
  .description('Server-side rendering tool for your web app.\n  Prerenders your app into static HTML files and supports routing.')
  .arguments('<build-dir> [target-dir]')
  .option('-c, --config [path]', 'Config file (Default: prep.js)', 'prep.js')
  .option('-p, --port [port]', 'Phantom server port (Default: 45678)', 45678)
  .action((bdir, tdir) => {
    if (!bdir) {
      console.log('No target directory provided.')
      process.exit(1)
    }

    buildDir = path.resolve(bdir)
    targetDir = tdir ? path.resolve(tdir) : buildDir
    tmpDir = path.resolve('.prep-tmp')
  })

program.parse(process.argv)

const prepareConfig = async () => {
  try {
    const code = babel.transformFileSync(path.resolve(program.config), {presets: ["es2015", "stage-0"], plugins: ["transform-runtime"]}).code
    mkdirp.sync(tmpDir)
    fs.writeFileSync(path.join(tmpDir, 'prep.js'), code)
    config = require(path.join(tmpDir, 'prep.js')).default

    if (Promise.resolve(config) === config) {
      crawlAndWrite(await config)
    } else if (typeof config === 'function') {
      crawlAndWrite(config())
    } else {
      crawlAndWrite(config)
    }
  } catch (e) {
    throw new Error(e)
  }
}

prepareConfig()
