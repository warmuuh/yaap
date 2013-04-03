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


	function registerExpressCallback(path, fnExpress, obj, fnName, context){
		path = path || '/' + fnName; //in case of no-argument annotation, use fnName as endpoint
		fnExpress(path, function(req, res, next){
			var result = obj[fnName](req, res, next); //dynamic call because there could be other annotations
			if (typeof result === 'string')
				res.render(result + '.' + context.express_view);
			else if (result && result.view){
				res.render(result.view + '.' + context.express_view, result.model);
			}
		});
	};

    
return [
{
  annotation: "@GET",
  processFunction: function(obj, fnDescription, annotationParams, context){
	registerExpressCallback(annotationParams[0], context.express.get.bind(context.express), obj, fnDescription.name, context);
  }
},
{
  annotation: "@PUT",
   processFunction: function(obj, fnDescription, annotationParams, context){
	registerExpressCallback(annotationParams[0], context.express.put.bind(context.express), obj, fnDescription.name, context);
  }
},
{
  annotation: "@POST",
  processFunction: function(obj, fnDescription, annotationParams, context){
	registerExpressCallback(annotationParams[0], context.express.post.bind(context.express), obj, fnDescription.name, context);
  }
},
{
  annotation: "@DELETE",
  processFunction: function(obj, fnDescription, annotationParams, context){
	registerExpressCallback(annotationParams[0], context.express["delete"].bind(context.express), obj, fnDescription.name, context);
  }
}
];

});})(typeof define == 'function'? define: function(deps, factory) {module.exports = factory.apply(this, deps.map(function(x) {return require(x);}));});