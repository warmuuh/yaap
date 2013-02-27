
/*jshint node:true*/
"use strict";


function onInitCtx(spec){
  console.log("oninit");
}

function isConstructor(func) {
  if (typeof func != "function")
  return false;
		var is = false, p;
		for (p in func.prototype) {
			if (p !== undefined) {
				is = true;
				break;
			}
		}
    //static methods are not supported right now
    for(var key in func){
      if (typeof func[key] === "function"){
        is = false;
        break;
      }
    }

		return is;
	} 
  
  

var wire = require("wire");
var jsModuleLoader = require.extensions['.js'];

require.extensions['.js'] = function(module, filename){
  jsModuleLoader(module, filename);
  console.log("js  >" + filename);
  if (isConstructor(module.exports)){
    //console.log(module);
    console.log("ctor wrapping");
    var ctor  = module.exports;
    
    
    
    var adapter = function(){
        console.log("calling wrapped ctor:");
        ctor.apply(this, arguments);
    }
    

    adapter.prototype = new module.exports();
    adapter.$setCtor = function(fn){ctor = fn; this.$adviced = true;};
    adapter.$getCtor = function(){return ctor};
    adapter.$adviced = false;
    
    
    module.exports = adapter;
  
  }
}


require.extensions['.wire'] = function(module, filename){
 var content = require('fs').readFileSync(filename, 'utf8');             
 var spec = JSON.parse(content);
 console.log("wire>" + filename);
 wire(spec, {require: require, init: onInitCtx}).then(function(ctx){
  module.exports = ctx
  
 }, function(err){console.error("wiring error: " + err)});
} 



var ctx = require("./spec");

console.log("----- initialized -----");
ctx.myComponent.doSomething();
ctx.myComponent.doSomethingElseAgain();