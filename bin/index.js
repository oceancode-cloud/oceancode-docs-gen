#!/usr/bin/env node
const run = require('./utils/run')
const path = require('path')
function main(){
  const installPath = installDir()
  const rootDir = path.resolve(process.cwd())
  run(installPath,rootDir)
}
main()

function installDir(){
  const installDir = path.dirname(module.filename);
  return path.resolve(installDir,'..')
}