/** @license MIT License (c) copyright 2013 original author or authors */

/**
 * @NotNull annotation processor
 * 
 * Checks, if a given arguemnt is undefined or null and throws an exception  
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Peter Mucha
 *
 * @version 0.0.1
 */
"use strict";
 
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

