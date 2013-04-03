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
define([ "when"], 
function(when) {
    
return [
{
  annotation: "@GET",
  processFunction: function(obj, fnDescription, annotationParams, context){
	context.express.get(annotationParams[0], function(req, res, next){
		obj[fnDescription.name](req, res, next); //dynamic call because there could be other annotations
	});
  }
},
{
  annotation: "@PUT",
  processFunction: function(obj, fnDescription, annotationParams, context){
	context.express.put(annotationParams[0], function(req, res, next){
		obj[fnDescription.name](req, res, next); //dynamic call because there could be other annotations
	});
  }
},
{
  annotation: "@POST",
  processFunction: function(obj, fnDescription, annotationParams, context){
	context.express.post(annotationParams[0], function(req, res, next){
		obj[fnDescription.name](req, res, next); //dynamic call because there could be other annotations
	});
  }
},
{
  annotation: "@DELETE",
  processFunction: function(obj, fnDescription, annotationParams, context){
	context.express["delete"](annotationParams[0], function(req, res, next){
		obj[fnDescription.name](req, res, next); //dynamic call because there could be other annotations
	});
  }
}
];

});})(typeof define == 'function'? define: function(deps, factory) {module.exports = factory.apply(this, deps.map(function(x) {return require(x);}));});