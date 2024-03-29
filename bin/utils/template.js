const Handlebars = require('handlebars');

Handlebars.registerHelper('isHeading', function (type) {
  return type==='heading' 
});

Handlebars.registerHelper('isMenu', function (type) {
  return type==='list'
});

Handlebars.registerHelper('isMenuGroup', function (parentId) {
  return parentId ? false : true
});

Handlebars.registerHelper('isDataItem', function (parentId) {
  return parentId ? true : false
});

Handlebars.registerHelper('hasTable', function (item) {
  return item.table
});


Handlebars.registerHelper('toRawString', function (list) {
  if(!Array.isArray(list)){
    return new Handlebars.SafeString(list)
  }
  const strs = (list || []).map(e=>e.text ? e.text : e.raw)
  
  return new Handlebars.SafeString(strs.join(''))
});
function renderFile(templateCode,data){
  const template = Handlebars.compile(templateCode)
  return template(data)
}

module.exports ={
  renderFile
}