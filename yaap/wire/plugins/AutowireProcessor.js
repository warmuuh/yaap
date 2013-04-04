/** @license MIT License (c) copyright 2013 original author or authors */

/**
 * @Autowired annotation processor.
 * 
 * Autowires parameters of function calls based on a given or the parameter name.
 * 
 * needs wire to be in the configuration object. 
 *    
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
define(["underscore", "when"], 
function(_, when) {

    
return  {
  annotation: "@Autowired",
  processParameter: function(obj, fnDescription, annotatedParameters, context)  {
   
    var refs = {};
    for(var i = 0; i < annotatedParameters.length; ++i){
    
	    var param = annotatedParameters[i];
	    var refName = param.annotation.parameters.length == 1
						? param.annotation.parameters[0]
	                    : param.name;
	     
	    refs[param.name] = {$ref: refName};
    }
    //  console.log("@Autowire "+ JSON.stringify(refs));      
	var promise = when.defer();
    context.promises.push(promise.promise);
    context.wire(refs).then(function (resolvedRefs) {

      var origFn = obj[fnDescription.name];
      //console.log("@Autowire "+ JSON.stringify(resolvedRefs));       
      obj[fnDescription.name] = function(){
		for(var i = 0; i < annotatedParameters.length; ++i){
			var param = annotatedParameters[i];
            while (arguments.length -1 < param.index)
                [].push.call(arguments, undefined);
                
            if (arguments[param.index] == null) //tests for null or undefined because  'null==undefined'
              arguments[param.index] = resolvedRefs[param.name];
        }
           
            switch(arguments.length){
              case 0: return origFn.call(obj);
              case 1: return origFn.call(obj, arguments[0]);
              case 2: return origFn.call(obj, arguments[0], arguments[1]);
              case 3: return origFn.call(obj, arguments[0], arguments[1], arguments[2]);
              default: return origFn.apply(obj, arguments);
            }
          }; 
          
          promise.resolve();
      
    }, 
    function(err){
           console.error("@Autowired failed: " + err);
           promise.reject();
    });
    
  },
  
  processFunction: function(obj, fnDescription, annotationParams, context){
    //console.log("@Autowired("+ annotationParams +") attached at function: " + fnDescription.name);
      
    var refs = when.map(fnDescription.parameters, 
                              function(param){
                                return {$ref: param.name};
                              });
      
    var promise = when.defer();
    context.promises.push(promise.promise);
      when.map(refs, context.wire).then(function (resolvedRefs){
        var origFn = obj[fnDescription.name];
      
        obj[fnDescription.name] = function(){
              while (arguments.length < resolvedRefs.length)
                  [].push.call(arguments, undefined);
                  
              for(var i = 0; i < resolvedRefs.length; ++i)
                if (arguments[i] == null) //tests for null or undefined because  'null==undefined'
                  arguments[i] = resolvedRefs[i];
             
             
              switch(arguments.length){
                case 0: return origFn.call(obj);
                case 1: return origFn.call(obj, arguments[0]);
                case 2: return origFn.call(obj, arguments[0], arguments[1]);
                case 3: return origFn.call(obj, arguments[0], arguments[1], arguments[2]);
                default: return origFn.apply(obj, arguments);
              }
              
            }; 
        promise.resolve();
      
      }, function(err){
			console.error(err);
			promise.reject();
		});
  }
};

});})(typeof define == 'function'? define: function(deps, factory) {module.exports = factory.apply(this, deps.map(function(x) {return require(x);}));});