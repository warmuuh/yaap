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
		
		//prepend basename
		if (obj["@Path"] != null) //null or undefind
			path = obj["@Path"] + path;
		
		console.log("Registering route: " + path);
				
		var authFn = null;
		
		try{authFn = getAuthentification(fnDescription)}
		catch(e){console.log(e)}
		
		fnExpress(path, authFn, function(req, res, next){


			var responseSent = false;
			var sendResponse = function(result){
				responseSent = true;
				processResponse(result, res, fnDescription, context); 
			};
			
			var args = processParameters(req, fnDescription, sendResponse);
			//execution
			var result = obj[fnDescription.name].apply(obj, args); //dynamic call because there could be other annotations
			
			//if it is undefined, then there *should* be a callback ;)
			if (result !== undefined && !responseSent)
				sendResponse(result); 
			
		});
	}
	
	
	function getAuthentification(fnDescription){
		var useAuth = (getAnnotation(fnDescription, "@Auth") !== undefined);
		
		var authFn = function(req, res, next){next()};
		if (useAuth)
			 authFn = function(req, res, next)
				{
					if (req.isAuthenticated === undefined){
						console.error("connect-auth is missing"); 
						next();
					}
					if (!req.isAuthenticated())
						{
							req.authenticate(function(err, succ){
								if (err) console.log(err);
								next();
							});
							return;
						}
					else{
						next();
					}
				};
		
			
		return authFn;
	
	}
	
	
	function processParameters(req, fnDescription, responseCallback){
			var args = [];
			
			var processEveryParameter = (getAnnotation(fnDescription, "@Param") !== undefined);
			for(var i = 0; i < fnDescription.parameters.length; ++i){
				var param = fnDescription.parameters[i];
				
				//handle @Param
				var annoParam = getAnnotation(param, "@Param");
				
				
				if ((processEveryParameter && param.annotations.length == 0) //NO other annotations allowed because it would be overwritten
					|| (annoParam !== undefined))
				{
					var parameterName =  param.name;
					if (annoParam !== undefined && annoParam.parameters.length > 0)
							parameterName = annoParam.parameters[0];
					args[param.index] = getParameter(req, parameterName);
				}
				
				//handle @Body
				if ( getAnnotation(param, "@Body") !== undefined)
					args[param.index] = req.body;
				
				if ( getAnnotation(param, "@Req") !== undefined)
					args[param.index] = req;
					
				if ( getAnnotation(param, "@Res") !== undefined)
					args[param.index] = req;
				
				if ( getAnnotation(param, "@Session") !== undefined)
					args[param.index] = req.session;
				
				//handle @Callback
				if (getAnnotation(param, "@Callback") !== undefined)
				{
					args[param.index] = responseCallback;
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
					if (result.lastIndexOf("redirect:", 0) === 0) //starts with 'redirect:'?
						res.redirect(result.split(":")[1]);
					else
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