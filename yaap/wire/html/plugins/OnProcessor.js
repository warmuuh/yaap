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
 * @version 0.1.2
 */
"use strict";
(function(define) { 
define([ "wire/on", "when"], 
function(on, when) {
    
return  {
  annotation: "@On",
  
  
  processFunction: function(obj, fnDescription, annotationParams, context){
    var wire = context.wire;
 	
 	var promise = when.defer();
    context.promises.push(promise.promise);
	wire.resolveRef(annotationParams[0]).then(function(nodeRef){
		if( nodeRef.length && nodeRef.length > 0 ) {

			for(var i = 0; i < nodeRef.length; ++i)
				on(nodeRef[i], annotationParams[1], function(evt){
					obj[fnDescription.name](evt); //dynamic call because there could be other annotations
				});
		}
		else
			on(nodeRef, annotationParams[1], function(evt){
					obj[fnDescription.name](evt); //dynamic call because there could be other annotations
				});
		
		promise.resolve();
	}, promise.reject);
    
  }
};

});})(typeof define == 'function'? define: function(deps, factory) {module.exports = factory.apply(this, deps.map(function(x) {return require(x);}));});