/** @license MIT License (c) copyright 2013 original author or authors */

/**
 * A javascript annotation processor
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
define(["underscore", "./registry", "./plugins/NotNullProcessor", "./plugins/DefaultProcessor", "wire", './parser/PanPG_util', './parser/ECMA5Parser', "./parser/walker"], 
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
      
      
       console.log("obj  " + _(obj).functions());
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
			    var ast = es5.Program(source);

			    var fnObjs = PanPG_util.treeWalker(walker, ast);


		    
		    
			    _(fnObjs).each(function(fnObj){
			        fnObj.name = f;
				    callProcessors(obj, fnObj, config);
				});
		  });
		},
    processFunction: function (fname, f, config){
          var obj = {};
          obj[fname] = f;
          
			    console.log("fs  " + _(obj).functions());
          
			    var source = f.toString();
          
			    console.log("f2  " + source);
			    var ast = es5.Program(source);

			    console.log("f3  " + ast);
			    var fnObjs = PanPG_util.treeWalker(walker, ast);


			    console.log("f4  " + JSON.stringify(fnObjs));
      

			    _(fnObjs).each(function(fnObj){
  			      fnObj.name = fname;
  				    callProcessors(obj, fnObj, config);
				    });
            
            
          
		      return obj[fname];
		},
    
    
    
    
	}



});})(typeof define == 'function'? define: function(deps, factory) {module.exports = factory.apply(this, deps.map(function(x) {return require(x);}));});

