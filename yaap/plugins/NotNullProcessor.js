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
 * @version 0.0.3
 */
"use strict";
(function(define) {
define([], 
function() {

    
    
return  {
  annotation: "@NotNull",
  
  
  processFunction: function(obj, fnObj)  {
    //console.log("@NotNull attached at function");
   
    var origFn = obj[fnObj.name];
    obj[fnObj.name] = function(){
    
       if (fnObj.parameters.length != arguments.length)
        throw "Constraint violated: too few/many arguments at function " + fnObj.name;
       
        var idx = arguments.length-1
        do{
          if (arguments[idx] == null) //null or undefined
            throw "Constraint violated: parameter " + param.name + " of function " + fnObj.name + " is null or undefined.";
        }while(idx--);
        
        switch(arguments.length){
            case 0: return origFn.call(obj);
            case 1: return origFn.call(obj, arguments[0]);
            case 2: return origFn.call(obj, arguments[0], arguments[1]);
            case 3: return origFn.call(obj, arguments[0], arguments[1], arguments[2]);
            default: return origFn.apply(obj, arguments);
        }
        
    }
    
    
    
  },
  
  processParameter: function(obj, fnObj, param)  {
    //console.log("@NotNull attached at parameter: " + param.name);
    var origFn = obj[fnObj.name];
    obj[fnObj.name] = function(){
        if (arguments[param.index] == null) //null or undefined
          throw "Constraint violated: parameter " + param.name + " of function " + fnObj.name + " is null or undefined.";
       
        switch(arguments.length){
            case 0: return origFn.call(obj);
            case 1: return origFn.call(obj, arguments[0]);
            case 2: return origFn.call(obj, arguments[0], arguments[1]);
            case 3: return origFn.call(obj, arguments[0], arguments[1], arguments[2]);
            default: return origFn.apply(obj, arguments);
        }
        
    }
    
  }
};

});})(typeof define == 'function'? define: function(deps, factory) {module.exports = factory.apply(this, deps.map(function(x) {return require(x);}));});