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

let buildDir, targetDir, tmpDir

const crawlAndWrite = async (configuration) => {

  let dimensions = Object.assign({}, {width: 1440, height: 900}, configuration.dimensions)
  delete configuration.dimensions
  configuration = Object.assign(
    {
      routes: ['/'],
      timeout: 1000,
      dimensions,
    },
    configuration
  )

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

//const run = () => {
  //const configFilePath = path.resolve(program.config)
  //const babelOptions = {
    //presets: ['es2015', 'stage-0'],
    //plugins: ['transform-runtime'],
    //babelrc: false,
  //}
  // transpile config file to ES5
  //const { code } = babel.transformFileSync(configFilePath, babelOptions)

  // write transpiled code to temp file and require it
  //const writeStream = fs.writeFileSync('.prep.js', code)
  const config = require(path.resolve(program.config)).default

  if (Promise.resolve(config) === config) {
    config.then((c) => crawlAndWrite(c))
    //crawlAndWrite(await config)
  } else if (typeof config === 'function') {
    crawlAndWrite(config())
  } else {
    crawlAndWrite(config)
  }
//}

//run()
