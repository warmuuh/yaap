/*global console require exports*/

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
          });
            
    });

	//process parameter annotations
	
	_(fnObj.parameters).each(function (parameter){
          _(parameter.annotations).each(function (annotation){
	          _(registry.getProcessors(annotation.name)).each(function(processor){
	                if (_(processor).has("processParameter"))
	                   processor.processParameter(obj, fnObj, parameter, annotation.parameters, config);
	          });
	            
	    });
    });


};




var process = exports.process = function (obj, config){
	var functions = _(obj).functions();
	_(functions).each(function(f){
	
		var PanPG_util=require('./parser/PanPG_util');
		var es5 = require('./parser/ECMA5Parser');

	    var walker = require("./walker");
	    
	    
	    var source = obj[f].toString();
	    var ast = es5.Program(source);

	    var fnObjs = PanPG_util.treeWalker(walker, ast);

    
	    _(fnObjs).each(function(fnObj){
	        fnObj.name = f;
		    callProcessors(obj, fnObj, config);
		});
  });
};

