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
  processParameter: function(obj, fnObj, param, annotationParams, cfg)  {
    //console.log("@Autowired("+ annotationParams +") attached at parameter: " + param.name);
    
    var refName = annotationParams.length == 1
					? annotationParams[0]
                    : param.name;
            
    var ref = {$ref: refName};
    cfg.wire(ref).then(function (value) {
      
      var origFn = obj[fnObj.name];
      
      obj[fnObj.name] = function(){
            while (arguments.length -1 < param.index)
                [].push.call(arguments, undefined);
                
            if (arguments[param.index] == null) //tests for null or undefined because  'null==undefined'
              arguments[param.index] = value;
           
           
            switch(arguments.length){
              case 0: return origFn.call(obj);
              case 1: return origFn.call(obj, arguments[0]);
              case 2: return origFn.call(obj, arguments[0], arguments[1]);
              case 3: return origFn.call(obj, arguments[0], arguments[1], arguments[2]);
              default: return origFn.apply(obj, arguments);
            }
          }; 
      
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
        //console.log("1");
        var origFn = obj[fnObj.name];
      
        obj[fnObj.name] = function(){
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
      
      
      }, function(err){console.error(err);});
  }
};

});})(typeof define == 'function'? define: function(deps, factory) {module.exports = factory.apply(this, deps.map(function(x) {return require(x);}));});