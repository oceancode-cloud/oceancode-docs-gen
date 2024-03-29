const fs = require('fs')
const path = require('path')
function readFileAsString(file){
  return fs.readFileSync(file,{encoding:'utf-8'})
}

function writeFile(file,data){
  let parentPath = path.resolve(file,'..')
  while(!fs.existsSync(parentPath)){
    createDirectoryRecursive(parentPath)
  }
  fs.writeFileSync(file,data)
}

function createDirectoryRecursive(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    const parentDir = path.dirname(directoryPath);
    createDirectoryRecursive(parentDir);
    fs.mkdirSync(directoryPath);
  }
}

function splitByBlank(str){
  if(!str) return []
  if(str.indexOf('\r\n')!=-1){
    return str.split('\r\n')
  }
  return str.split('\n')
}

function copyDir(sourceDir,targetDir,parentName){
  const files = fs.readdirSync(sourceDir)
  for(const filename of files){
    const realPath =  path.resolve(sourceDir, filename);
    const isDir = fs.lstatSync(realPath).isDirectory();
    if(isDir){
      copyDir(realPath,targetDir,parentName+'/'+filename)
    }else{
      const targetRealPath = targetDir + (parentName ? '/'+parentName:'')+'/'+filename
      const content = readFileAsString(realPath)
      writeFile(targetRealPath,content)
    }
  }
}

function deepScanFiles(dirPath,deep,cb){
  const files = fs.readdirSync(dirPath)
  for(const filename of files){
    const componentDir = path.resolve(dirPath, filename);
    const isDir = fs.lstatSync(componentDir).isDirectory();
    if(filename.toLocaleLowerCase()==='node_modules'){
      continue
    }
    const curDir = path.resolve(dirPath,filename)
    if(!isDir){
      if(filename.toLocaleLowerCase().endsWith('.md')){
        cb && cb(path.resolve(curDir),deep)
      }
    }else{
      deepScanFiles(curDir,deep+1,cb)
    }
  }
}

module.exports ={
  readFileAsString,
  writeFile,
  splitByBlank,
  deepScanFiles,
  copyDir
}