/*global console require exports module*/

var meld = require("meld");
var _ = require("underscore");
    
    
module.exports = {
  annotation: "@NotNull",
  
  
  processFunction: function(obj, fnObj)  {
    //console.log("@NotNull attached at function");
    meld.before(obj, fnObj.name, function(){
         if (fnObj.parameters.length != arguments.length) //there are undefined parameters!!
            throw "Constraint violated: too few/many arguments at function " + fnObj.name;
          
        _(arguments).each(function(arg){
           if (arg === null || arg === undefined)
            throw "Constraint violated: null or undefined arguments at function " + fnObj.name;
        });
    });
  },
  
  processParameter: function(obj, fnObj, param)  {
    //console.log("@NotNull attached at parameter: " + param.name);
    meld.before(obj, fnObj.name, function(){
  
         if (_(arguments[param.index]).isNull() || _(arguments[param.index]).isUndefined())
           throw "Constraint violated: parameter " + param.name + " of function " + fnObj.name + " is null or undefined.";
	
    });
  }
};

