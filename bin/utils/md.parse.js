const createRenderer = require('./md.render')
const ndRenderer = createRenderer()
const { marked } = require('marked')
const path = require('path') 
const { v4  } = require('uuid');
 
const fs = require('fs')
const {readFileAsString,writeFile,splitByBlank} = require('./file') 
module.exports = function parseMarkdown(file){
  const content = readFileAsString(file)
  const tokens = marked.lexer(content)
  const resultList = []
  let curObj
  let index = 0
  const javascriptList = {
    scripts:[],
    setupReturns:[]
  }
  while(index<tokens.length){
    const item = tokens[index]
    const type = item.type
    if(type==='heading'){
      curObj = {
        type: type,
        depth: item.depth,
        text: item.text,
        contents:[]
      }
      resultList.push(curObj)
    }else if(type==='paragraph'){
      if(!curObj){
        curObj = {
          contents:[]
        }
        resultList.push(curObj)
      }
      curObj.contents = curObj.contents.concat(parseParagraph(item))
    } else if(type==='space'){
      if(!curObj){
        curObj = {
          contents:[]
        }
        resultList.push(curObj)
      }
      if(!curObj.contents){
        curObj.contents = []
      }
      curObj.contents.push({
        type:type,
        raw: item.raw
      })
    } else if(type==='code'){
      if(!curObj){
        curObj = {
          contents:[]
        }
        resultList.push(curObj)
      }
      curObj.contents = curObj.contents.concat(parseCode(file,item,javascriptList))
    }else if(type==='table'){
      if(!curObj){
        curObj = {
          type: type,
        }
        resultList.push(curObj)
      }
      curObj.table = parseTable(item)
    }else if(type==='list'){
      curObj = {
        type: type,
        menus: parseMenu(item)
      }
      resultList.push(curObj)
    }

    index++
  }

  return {
    list:resultList,
    javascripts:javascriptList
  }
}
function parseRawData(str){
  const o = {
    title: '',
    path: ''
  }
  if(str.indexOf('[')!=-1 && str.indexOf(']')!=-1){
    o.title = str.substring(str.indexOf('[')+1,str.indexOf(']')).trim()
  }
  if(str.indexOf('(')!=-1 && str.indexOf(')')!=-1){
    o.path = str.substring(str.indexOf('(')+1,str.indexOf(')')).trim()
    if(o.path.startsWith("'")){
      o.path = o.path.substring(1).trim()
    }
    if(o.path.endsWith("'")){
      o.path = o.path.substring(0,o.path.length-1).trim()
    }
  }

  return o
}
function parseMenu(item,parentId){
  if(!item || !item.items || item.items.length==0) return []
  let resultList = []
  const items = item.items
  let curId
  for(let it of items){
    if(it.type==='list_item'){
      for(let token of it.tokens){
        if(token.type==='text'){
          const info = parseRawData(token.text)
          curId = v4()
          let url = info.path
          if(url){
            url = url.substring(0,url.lastIndexOf('.'))+'.html'
            if(url.indexOf('/src/')!=-1){
              url = '..'+url.substring(url.indexOf('src')+3)
            }
          }
          resultList.push({
            title: info.title,
            path: info.path,
            url: url,
            id: curId,
            parentId: parentId
          })
        }else if(token.type==='list'){
          resultList = resultList.concat(parseMenu(token,curId))
        }
      }
    }
  }
  return resultList
}
function parseTable(item){
  const table = {
    columns:[],
    rows:[]
  }

  if(item.header){
    for(const hd of item.header){
      table.columns.push({
        text: hd.text
      })
    }
  }
  if(item.rows){
    for(const rowLines of item.rows){
      const rowData = []
      for(token of rowLines){
        const tempStrs = []
        for(const line of token.tokens){
          const type = line.type
          let text = line.text
          if(type==='codespan'){
            text = `<code>${text}</code>`
          }
          tempStrs.push(text)
        }
        rowData.push(tempStrs.join(''))
      }
      table.rows.push(rowData)
    }
  }
  return table
}
function parseCode(file,item,javascriptList){
  const obj = {
    type:item.type,
    lang: item.lang,
    text:item.text
  }
  if(obj.lang==='demo'){
    obj.text = parseDemoCode(file,item.text,javascriptList)
  }
  
  return [obj]
}
function parseDemoCode(file,text,javascriptList){
  const lines = splitByBlank(text)
  const strs = []
  const dirPath = path.resolve(file,'..')
  strs.push('<o-demos-doc>')
  for(const line of lines){
    const filename = (line+'').trim().toLocaleLowerCase()
    if(filename.endsWith('.md')){
      const filepath = path.resolve(dirPath,line.trim())
      if(!fs.existsSync(filepath)){
        continue
      }
      const content = readFileAsString(filepath)
      strs.push(parseDemoFile(content,javascriptList))
    }else{
      strs.push(line)
    }
  }
  strs.push('</o-demos-doc>')
  return strs.join('')
}
function parseDemoFile(content,javascriptList){
  const tokens = marked.lexer(content)
  let index = 0
  let title
  const descs = []
  let startCode = false
  let templateCode
  let commonCode
  let javascriptCode
  let typescriptCode
  const setupReturns = javascriptList.setupReturns
  while(index<tokens.length){
    const item = tokens[index]
    if(!title && item.type==='heading' && item.depth==1){
      title = item.text
    }else if(item.type==='paragraph'){
      descs.push(item.text)
    }else if(item.type==='space'){
      if(!startCode){
        descs.push(item.raw)
      }
    }else if(item.type==='code'){
      startCode = true
      if(item.lang==='template'){
        templateCode = item.text
      }else if(item.lang==='code-common'){
        commonCode = item.text
      }else if(item.lang==='javascript'){
        javascriptCode = item.text
      }else if(item.lang==='typescript'){
        typescriptCode = item.text
      }else if(item.lang==='code-setup-return'){
        if(setupReturns.length>0){
          if(!setupReturns[setupReturns.length-1].endsWith(',')){
            setupReturns.push(',')
          }
        }
        setupReturns.push(item.text)
      }
    }
    index++
  }
  let desc = descs.join('').trim()
  let code = typescriptCode || ''
  if(commonCode){
    code = `${typescriptCode||''}<br>${commonCode}`
    javascriptCode = `${commonCode}\n${javascriptCode}`
  }
  if(javascriptCode){
    javascriptList.scripts.push(javascriptCode)
  }
  const varName = 'template_'+v4().replaceAll('-','')
  javascriptList.scripts.push('\nconst '+varName+'=`'+templateCode+'<br/>'+code+'`')
  if(setupReturns.length>0){
    if(!setupReturns[setupReturns.length-1].endsWith(',')){
      setupReturns[setupReturns.length-1].push(',')
    }
  }
  setupReturns.push(varName+',')
  const str = `<o-demo-doc title="${title}">
  <template #code>
<pre><code v-text="${varName}"></code></pre>
  </template>
    <o-space vertical>${desc}
            ${templateCode||''}
            </o-space>
          </o-demo-doc>
          `
  return str
}
function parseParagraph(item){
  if(!item || !item.tokens) return []
  return item.tokens.map(e=>{
    return {
      type:e.type,
      text: e.text
    }
  })
}