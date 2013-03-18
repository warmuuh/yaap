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



	registry.register([
	   NotNullProcessor,
	    DefaultProcessor
	]);


	function callProcessors(obj, fnObj, config) {
		//process function-annotations
		_(fnObj.annotations).each(function (annotation) {
	          _(registry.getProcessors(annotation.name)).each(function (processor) {
	                if (_(processor).has("processFunction"))
	                   processor.processFunction(obj, fnObj, annotation.parameters, config);
	                else
	                    console.log("Function-annotations are not supported for: " + annotation.name);
	          });
	            
	    });

		//process parameter annotations
		
		_(fnObj.parameters).each(function (parameter){
	          _(parameter.annotations).each(function (annotation){
		          _(registry.getProcessors(annotation.name)).each(function(processor){
		                if (_(processor).has("processParameter"))
		                   processor.processParameter(obj, fnObj, parameter, annotation.parameters, config);
	                else
	                    console.log("Parameter-annotations are not supported for: " + annotation.name);
		          });
		            
		    });
	    });



		

	};

	 
   
   
   
   
	return {
		register: function (processor) {
			registry.register([processor]);
		},
 
		process: function (obj, config){
			var functions = _(obj).functions();
			_(functions).each(function(f){
			
			    
			    var source = obj[f].toString();
          
          
          source = source.substring(0, source.indexOf("{")); //strip body //TODO: this is not secure, if comments contain '{'
          
          
          
          
			    var ast = es5.Program(source);
          
			    //console.log(PanPG_util.showTree(ast));
          var fnObjs = null;
          try{
            fnObjs = PanPG_util.treeWalker(walker, ast);
          } catch(e){console.error(e); throw e;}
		    
			    _(fnObjs).each(function(fnObj){
			        fnObj.name = f;
				    callProcessors(obj, fnObj, config);
				});
		  });
      
     return obj; 
		}
	};



});})(typeof define == 'function'? define: function(deps, factory) {module.exports = factory.apply(this, deps.map(function(x) {return require(x);}));});

