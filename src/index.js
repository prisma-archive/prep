#!/usr/bin/env node

import program from 'commander'
import path from 'path'
import fs from 'fs'
import http from 'http'
import https from 'https'
import express from 'express'
import serveStatic from 'serve-static'
import fallback from 'express-history-api-fallback'
import mkdirp from 'mkdirp'
import phantom from 'phantom'
import { exec } from 'child-process-promise'
import sitemap from 'sitemap'

const { version } = require('../package.json')

let buildDir, targetDir, tmpDir

async function crawlAndWrite (configuration) {

  // prepare configuration
  let dimensions = Object.assign({}, {width: 1440, height: 900}, configuration.dimensions)
  delete configuration.dimensions
  configuration = Object.assign({}, {
    routes: ['/'],
    timeout: 1000,
    dimensions,
    https: false,
    hostname: 'http://localhost',
  }, configuration)

  // render sitemap
  const sm = sitemap.createSitemap({
    hostname: configuration.hostname,
    urls: configuration.routes.map((route) => ({url: route}))
  })
  mkdirp.sync(targetDir)
  fs.writeFileSync(`${targetDir}/sitemap.xml`, sm.toString());

  // start temporary local webserver
  const app = express()
    .use(serveStatic(buildDir))
    .use(fallback('index.html', { root: buildDir }))
  let server
  if (configuration.https) {
    const credentials = {
      key: fs.readFileSync(`${__dirname}/../ssl/key.pem`),
      cert: fs.readFileSync(`${__dirname}/../ssl/cert.pem`),
    }
    server = https.createServer(credentials, app)
  } else {
    server = http.createServer(app)
  }

  server.listen(program.port)

  // render routes
  const promises = configuration.routes.map(async (route) => {
    // remove leading slash from route
    route = route.replace(/^\//, '')

    const phantomOptions = ['--disk-cache=true', '--ignore-ssl-errors=yes']

    const instance = await phantom.create(phantomOptions)
    const page = await instance.createPage()
    page.property('viewportSize', {width: configuration.dimensions.width, height: configuration.dimensions.height})
    await page.open(`http${configuration.https ? 's' : ''}://localhost:${program.port}/${route}`)
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

  // clean up files
  await Promise.all(promises)
  server.close()
  await exec(`cp -rf ${tmpDir}/* ${targetDir}/`)
  await exec(`rm -rf ${tmpDir}`)
  process.exit(0)
}

async function run () {
  try {
    program
      .version(version)
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

    const config = require(path.resolve(program.config)).default

    if (Promise.resolve(config) === config) {
      await crawlAndWrite(await config)
    } else if (typeof config === 'function') {
      await crawlAndWrite(config())
    } else {
      await crawlAndWrite(config)
    }
  } catch (e) {
    console.log(e)
    process.exit(1)
  }
}

run()
