/** @license MIT License (c) copyright 2013 original author or authors */

/**
 * A javascript annotation processor
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Peter Mucha
 *
 * @version 0.0.1
 */
"use strict";
var _ = require("underscore");



var registry = require("./registry");
registry.register([
    require("./plugins/NotNullProcessor"),
    require("./plugins/DefaultProcessor")
]);

exports.register = function(processor){
  registry.register([processor]);
};



var callProcessors = function(obj, fnObj, config){
	//process function-annotations
	_(fnObj.annotations).each(function (annotation){
          _(registry.getProcessors(annotation.name)).each(function(processor){
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






var process = exports.process = function (obj, config){
	var functions = _(obj).functions();
	_(functions).each(function(f){
	
		
	
	
		var PanPG_util=require('./parser/PanPG_util');
		var es5 = require('./parser/ECMA5Parser');

	    var walker = require("./parser/walker");
	    
	    
	    var source = obj[f].toString();
	    var ast = es5.Program(source);

	    var fnObjs = PanPG_util.treeWalker(walker, ast);

    
	    _(fnObjs).each(function(fnObj){
	        fnObj.name = f;
		    callProcessors(obj, fnObj, config);
		});
  });
};




