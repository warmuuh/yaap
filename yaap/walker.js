/*global console require exports module*/
var _ = require("underscore");


var treewalker = module.exports = {
  Program: function(match, children){
    return children;
  },
  AnnotationName: function(match, children){
    return {name: match.text()};
  },
  AnnotationParameter: function(match, children){
    return JSON.parse(match.text());
  },
  AnnotationParameterList: function(match, children){
    //console.log("aparaml: " + children);
    return {parameters: children};
  },
  AnnotationFunction: function(match, children){
    var fnObj = {
      name: _(children).chain().pluck('name').compact().first().value(),
      parameters: _(children).chain().pluck('parameters').compact().first().value()
    };
    if (fnObj.parameters === undefined)
      fnObj.parameters = []
    
   return fnObj;
  },
  Identifier: function(match, children){
   var txt = match.text();
   if (txt.length > 0)
      return {name: match.text()};
  },
  AnnotationComment: function(match, children){
     return {annotations: children};
  },
  Comment: function(match, children){
     return children;
  },
  S: function(match, children){
    
    if (!_(children).isEmpty())
      return children;
  },
  FormalParameter: function(match, children){
    children = _.flatten(children);
     var paramObj = {
      name: _(children).chain().pluck('name').compact().first().value(),
      annotations: _(children).chain().pluck('annotations').flatten().compact().value()
    };
     return paramObj;
  },
  FunctionExpression: function(match, children){
    
   
    children = _.flatten(children);
    
    var fnObj = {
      name: _(children).chain().pluck('name').compact().first().value(),
      parameters: _(children).chain().pluck('parameters').compact().first().value(),
      annotations: _(children).chain().pluck('annotations').flatten().compact().value()
    };
   // console.log("fn decl annotations found: " + JSON.stringify(fnObj));
    

    return fnObj;
  },
  FormalParameterList: function(match, children){
   // console.log("fn param list annotations found: " + JSON.stringify(children));
    //atach index to children
    for(var i = 0; i < children.length; ++i)
       children[i].index = i;
    
    return {parameters: children};
  },
  FunctionBody: function(match, children){
   children = _.flatten(children);
     var bodyObj = {
      annotations: _(children).chain().pluck('annotations').flatten().compact().value()
    };
    //console.log("fn body annotations found: " + JSON.stringify(bodyObj));
  }
  
};