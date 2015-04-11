/** @license MIT License (c) copyright 2013 original author or authors */

/**
 * @Default Annotationprocessor
 * 
 * Inserts default arguments, if they are not supplied on function call  
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Peter Mucha
 *
 * @version 0.1.3
 */
"use strict";
(function(define) {
define([], 
function() {
   
    
return {
  annotation: "@Default",
  
  processParameter: function(obj, fnDescription, annotatedParameters)  {
    //console.log("@Default("+ annotationParams +") attached at parameter: " + param.name);
   
    var origFn = obj[fnDescription.name];
       
    obj[fnDescription.name] =  function(){
    		for(var i = 0; i < annotatedParameters.length; ++i){
    			var param = annotatedParameters[i];
	            while (arguments.length -1 < param.index)
	                [].push.call(arguments, undefined);
	                
	            if (arguments[param.index] == null) //tests for null or undefined because  'null==undefined'
	              arguments[param.index] = param.annotation.parameters[0];
           }
           
            switch(arguments.length){
              case 0: return origFn.call(obj);
              case 1: return origFn.call(obj, arguments[0]);
              case 2: return origFn.call(obj, arguments[0], arguments[1]);
              case 3: return origFn.call(obj, arguments[0], arguments[1], arguments[2]);
              default: return origFn.apply(obj, arguments);
            }
          }; 
    
  }
};

});})(typeof define == 'function'? define: function(deps, factory) {module.exports = factory.apply(this, deps.map(function(x) {return require(x);}));});