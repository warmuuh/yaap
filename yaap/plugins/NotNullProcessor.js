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
 * @version 0.0.2
 */
"use strict";
(function(define) {
define(["underscore", "meld"], 
function(_, meld) {

    
    
return  {
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

});})(typeof define == 'function'? define: function(deps, factory) {module.exports = factory.apply(this, deps.map(function(x) {return require(x);}));});