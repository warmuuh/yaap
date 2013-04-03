/** @license MIT License (c) copyright 2013 original author or authors */

/**
 * A javascript annotation processor
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
define(["underscore", "./registry", "./plugins/NotNullProcessor", "./plugins/DefaultProcessor", "wire", './parser/PanPG_util', './parser/ECMA5Parser_min', "./parser/walker"], 
function(_, registry, NotNullProcessor, DefaultProcessor, wire, PanPG_util, es5, walker) {


	//default annotations are registered here
	registry.register([
	   NotNullProcessor,
	    DefaultProcessor
	]);


	function callProcessors(obj, fnDescription, config) {
	
	
		//process function-annotations
		_(fnDescription.annotations).each(function (annotation) {
	          _(registry.getProcessors(annotation.name)).each(function (processor) {
	                if (_(processor).has("processFunction"))
	                   processor.processFunction(obj, fnDescription, annotation.parameters, config);
	                else
	                    console.log("Function-annotations are not supported for: " + annotation.name);
	          });
	            
	    });

		//process parameter annotations	
		var parameterArray = {};
		_(fnDescription.parameters).each(function (parameter){
			 _(parameter.annotations).each(function (annotation){
				if (parameterArray[annotation.name] === undefined)
					parameterArray[annotation.name] = [];
				
				var entry = {
					name: parameter.name,
					index: parameter.index,
					annotation: annotation
				};
				parameterArray[annotation.name].push(entry);
				
				
				
			 });
	    });

		//call processors on annotated parameters
          _(parameterArray).chain().keys().each(function (annotationName){
	          _(registry.getProcessors(annotationName)).each(function(processor){
	                if (_(processor).has("processParameter"))
	                   processor.processParameter(obj, fnDescription, parameterArray[annotationName], config);
                else
                    console.log("Parameter-annotations are not supported for: " + annotationName);
	          });
	    }).value();
	}

	 
   
	return {
		register: function (processor) {
			registry.register([processor]);
		},
 
		process: function (obj, config){

			for(var f in obj)
			{
				if (!_(obj[f]).isFunction()) return;
			    
			    var source = obj[f].toString();
				source = source.substring(0, source.indexOf("{")); //strip body //TODO: this is not secure, if comments contain '{'
			    var ast =  es5.Program(source);
          
			    //console.log(PanPG_util.showTree(ast));
          var fnDescriptions = null;
          try{
            fnDescriptions = PanPG_util.treeWalker(walker, ast);
          } catch(e){console.error(e); throw e;}
					    
		_(fnDescriptions).each(function(fnDescription){
		    fnDescription.name = f;
		    callProcessors(obj, fnDescription, config);
		});
		
	  }; //);
      
     return obj; 
		}
	};



});})(typeof define == 'function'? define: function(deps, factory) {module.exports = factory.apply(this, deps.map(function(x) {return require(x);}));});

