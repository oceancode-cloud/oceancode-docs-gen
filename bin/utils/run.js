const parseMarkdown = require('./md.parse')
const path = require('path') 
const fs = require('fs')
const {readFileAsString,deepScanFiles,copyDir} = require('./file') 
const {convertHtmlDoc} = require('./html.convert')
const DEMOS_DIR_NAME = "demos"
const SRC_DIR_NAME = 'src'
const OUT_DOCS_DIR = 'docs'
function run (installPath,rootDir) {
  const docTemplate = readFileAsString(path.resolve(installPath,'templates','doc.html'))
  const homeTemplate =  readFileAsString(path.resolve(installPath,'templates','index.html'))
  const pageList = []
  copyLib(installPath,rootDir)
  deepScanFiles(rootDir,0,(filePath,deep)=>{
    const filename = filePath.substring(path.resolve(filePath,'..').length+1)
    const relativeDir = filePath.substring(rootDir.length+1)+''
    let outFileRelativePath = relativeDir.substring(0,relativeDir.lastIndexOf('.'))+'.html'
    
    if(relativeDir.startsWith(DEMOS_DIR_NAME) || relativeDir.startsWith('src')){
      if(relativeDir.startsWith(DEMOS_DIR_NAME)){
        const distPath ='statics'+'/'+outFileRelativePath.substring(DEMOS_DIR_NAME.length)
        const outFile = path.resolve(rootDir,OUT_DOCS_DIR,distPath)
        if(deep>2 && filename.toLocaleLowerCase()==='index.md'){
          // doc
          pageList.push({
            path: distPath
          })
          parseDoc(docTemplate,filePath,outFile,deep-1)
        }else if(deep==2 && filename.toLocaleLowerCase()==='index.md'){
          // home
          parseIndex(homeTemplate,filePath,outFile,deep-1)
        }
      }else if(relativeDir.startsWith(SRC_DIR_NAME)){
        const distPath ='statics'+'/'+outFileRelativePath.substring(SRC_DIR_NAME.length)
        const outFile = path.resolve(rootDir,OUT_DOCS_DIR,distPath)
        pageList.push({
          path: distPath
        })
        parseDoc(docTemplate,filePath,outFile,deep-1)
      }
    }
  })
  console.log('ocean docs generator success.');
}
function copyLib(installDir,rootDir){
  const distLib = path.resolve(rootDir,OUT_DOCS_DIR,'libs')
  copyDir(path.resolve(installDir,'resources/libs'),distLib,'')
}


function parseIndex(template,file,outFile){
  const resultData = parseMarkdown(file)
  resultData.dirs = {
    depth: 2
  }
  resultData.menus = []
  const it  = resultData.list.find(e=>e.type==='list')
  resultData.defaultMenu = {
  }
  if(it){
    resultData.menus = it.menus

    resultData.defaultMenu = resultData.menus.find(e=>e.url)
  }
  convertHtmlDoc(outFile,template,resultData)
}
function parseDoc(docTemplate,file,outFile,deep){
  const resultData = parseMarkdown(file)
  resultData.dirs = {
    depth: deep
  }
  resultData.menus = []
  const it  = resultData.list.find(e=>e.type==='list')
  if(it){
    resultData.menus = it.menus
  }
  convertHtmlDoc(outFile,docTemplate,resultData)
}
module.exports = run
