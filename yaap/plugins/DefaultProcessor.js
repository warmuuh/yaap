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
 * @version 0.0.1
 */
"use strict";

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
         return joinpoint.proceed();
    });
  }
};

