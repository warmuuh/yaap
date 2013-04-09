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
 * @version 0.0.4
 */
"use strict";
(function(define) { 
define([ "when", "underscore"], 
function(when, _) {




	function registerExpressCallback(path, fnExpress, obj, fnDescription, context){
		path = path || '/' + fnDescription.name; //in case of no-argument annotation, use fnName as endpoint
		fnExpress(path, function(req, res, next){

			var args = processParameters(req, fnDescription);
			//execution
			var result = obj[fnDescription.name].apply(obj, args); //dynamic call because there could be other annotations
			
			processResponse(result, res, fnDescription, context); 
			
		});
	}
	
	
	function processParameters(req, fnDescription){
			var args = [];
			
			var processEveryParameter = (getAnnotation(fnDescription, "@Param") !== undefined);
			for(var i = 0; i < fnDescription.parameters.length; ++i){
				var param = fnDescription.parameters[i];
				
				//handle @Param
				var annoParam = getAnnotation(param, "@Param");
				var annoBody = getAnnotation(param, "@Body");
				
				
				if ((processEveryParameter && annoBody === undefined) //NO other annotations allowed because it would be overwritten
					|| (annoParam !== undefined))
				{
					var parameterName =  param.name;
					if (annoParam !== undefined && annoParam.parameters.length > 0)
							parameterName = annoParam.parameters[0];
					args[param.index] = getParameter(req, parameterName);
				}
				
				//handle @Body
				if (annoBody !== undefined)
				{
					args[param.index] = req.body;
				}
				
			}
			return args;
	}
	
	function getParameter(req, name){
		if (req.params && req.params[name])
			return req.params[name];
		
		if (req.query && req.query[name])
			return req.query[name];
		
		if (req.body && req.body[name])
			return req.body[name];
		
	}

	
	function processResponse(result, res, fnDescription, context){
			//raw?
			if (getAnnotation(fnDescription, "@Body") !== undefined){ 
				res.send(result);
			} else if (getAnnotation(fnDescription, "@JSON") !== undefined){ 
				res.json(result);
			} else { //forwarding to view
				if (typeof result === 'string')
					res.render(result + '.' + context.express_view);
				else if (result && result.view){
					res.render(result.view + '.' + context.express_view, result.model);
				}
			}
	}

	function getAnnotation(fnDescription, annotationName){
		return _(fnDescription.annotations).chain().findWhere({name: annotationName}).value();
	}
    
return [
{
  annotation: "@GET",
  processFunction: function(obj, fnDescription, annotationParams, context){
	registerExpressCallback(annotationParams[0], context.express.get.bind(context.express), obj, fnDescription, context);
  }
},
{
  annotation: "@PUT",
   processFunction: function(obj, fnDescription, annotationParams, context){
	registerExpressCallback(annotationParams[0], context.express.put.bind(context.express), obj, fnDescription, context);
  }
},
{
  annotation: "@POST",
  processFunction: function(obj, fnDescription, annotationParams, context){
	registerExpressCallback(annotationParams[0], context.express.post.bind(context.express), obj, fnDescription, context);
  }
},
{
  annotation: "@DELETE",
  processFunction: function(obj, fnDescription, annotationParams, context){
	registerExpressCallback(annotationParams[0], context.express["delete"].bind(context.express), obj, fnDescription, context);
  }
}
];

});})(typeof define == 'function'? define: function(deps, factory) {module.exports = factory.apply(this, deps.map(function(x) {return require(x);}));});