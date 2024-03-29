const {readFileAsString,writeFile,splitByBlank} = require('./file') 
const { renderFile} = require('./template')
function convertHtmlDoc(outFile,template,resultData){
  const list = resultData.list
  const prePaths = []
  for(let i = 0;i<resultData.dirs.depth;i++){
    prePaths.push('../')
  }
  const obj = {
    prePaths:prePaths.join(''),
    title: '',
    list: list,
    javascripts: resultData.javascripts,
    menus: resultData.menus,
    defaultMenu: resultData.defaultMenu
  }
  const title = list.find(e=>e.type==='heading' && e.depth===1)
  if(title){
    obj.title = title.text
  }
  const renderContent = renderFile(template,obj)
  writeFile(outFile,renderContent)
}

module.exports = {
  convertHtmlDoc
}