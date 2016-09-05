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
import sitemap from 'sitemap'

let buildDir, targetDir, tmpDir

const crawlAndWrite = async (configuration) => {

  const sm = sitemap.createSitemap({
    hostname: configuration.hostname,
    urls: configuration.routes.map((route) => ({url: route}))
  })

  fs.writeFileSync(`${targetDir}/sitemap.xml`, sm.toString());


  let dimensions = Object.assign({}, {width: 1440, height: 900}, configuration.dimensions)
  delete configuration.dimensions
  configuration = Object.assign({}, {
    routes: ['/'],
    timeout: 1000,
    dimensions,
    https: false,
    hostname: 'http://localhost',
  }, configuration)

  const app = express()
    .use(serveStatic(buildDir))
    .use(fallback('index.html', { root: buildDir }))

  const server = http.createServer(app).listen(program.port)

  const promises = configuration.routes.map(async (route) => {
    // remove leading slash from route
    route = route.replace(/^\//, '')

    const phantomOptions = ['--disk-cache=true']

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

  mkdirp.sync(targetDir)

  await Promise.all(promises)
  server.close()
  await exec(`cp -rf ${tmpDir}/* ${targetDir}/`)
  await exec(`rm -rf ${tmpDir}`)
  process.exit(0)
}

program
  .version('1.0.1')
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
  config.then((c) => crawlAndWrite(c))
  //crawlAndWrite(await config)
} else if (typeof config === 'function') {
  crawlAndWrite(config())
} else {
  crawlAndWrite(config)
}