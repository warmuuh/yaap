/*global console require exports module*/

var meld = require("meld");
var _ = require("underscore");
    
    
module.exports = {
  annotation: "@Default",
  
  processParameter: function(obj, fnObj, param, annotationParams)  {
    //console.log("@Default("+ annotationParams +") attached at parameter: " + param.name);
    meld.around(obj, fnObj.name, function(joinpoint){
		 var args = joinpoint.args;
         if (_(args[param.index]).isNull() || _(args[param.index]).isUndefined())
             args[param.index] = annotationParams[0];
         joinpoint.proceed();
    });
  }
};

