/*global console require exports module*/

var meld = require("meld");
var _ = require("underscore");
    
    
//TODO: define processFunction based on parameter names
    
module.exports = {
  annotation: "@Autowired",
  processParameter: function(obj, fnObj, param, annotationParams, cfg)  {
    //console.log("@Autowired("+ annotationParams +") attached at parameter: " + param.name);
    
    var refName = annotationParams.length == 1
    				? annotationParams[0]
    				: param.name;
            
    
    
    var ref = {$ref: refName};
    cfg.wire(ref).then(function (value){
	    meld.around(obj, fnObj.name, function(joinpoint){
			 var args = joinpoint.args;
	         if (_(args[param.index]).isNull() || _(args[param.index]).isUndefined())
	             args[param.index] = value;
	         joinpoint.proceed();
	    });
    }, 
    function(err){
           console.error("@Autowired failed: " + err);
    });
    
  }
};

