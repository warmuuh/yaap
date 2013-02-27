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
 * @version 0.0.2
 */
"use strict";
(function(define) {
define(["underscore", "when", "meld"], 
function(_, when, meld) {

    
return  {
  annotation: "@Autowired",
  processParameter: function(obj, fnObj, param, annotationParams, cfg)  {
    console.log("@Autowired("+ annotationParams +") attached at parameter: " + param.name);
    
    var refName = annotationParams.length == 1
					? annotationParams[0]
                    : param.name;
            
    var ref = {$ref: refName};
    cfg.wire(ref).then(function (value){
	    meld.around(obj, fnObj.name, function(joinpoint){
       
			     var args = joinpoint.args;
	         if (_(args[param.index]).isNull() || _(args[param.index]).isUndefined())
	             args[param.index] = value;
	         
           console.log("@Autowiring..." + refName + " -> " + value);
           return joinpoint.proceed();
	    });
    }, 
    function(err){
           console.error("@Autowired failed: " + err);
    });
    
  },
  
  processFunction: function(obj, fnObj, annotationParams, cfg){
    //console.log("@Autowired("+ annotationParams +") attached at function: " + fnObj.name);
      
    var refs = when.map(fnObj.parameters, 
                              function(param){
                                return {$ref: param.name};
                              });
      
      when.map(refs, cfg.wire).then(function (resolvedRefs){
         meld.around(obj, fnObj.name, function(joinpoint){
                joinpoint.args.length = resolvedRefs.length;
                for(var i = 0; i < resolvedRefs.length; ++i)
                   joinpoint.args[i] = resolvedRefs[i];
                return joinpoint.proceed();
			});
      }, function(err){console.error(err);});
  }
};

});})(typeof define == 'function'? define: function(deps, factory) {module.exports = factory.apply(this, deps.map(function(x) {return require(x);}));});