/** @license MIT License (c) copyright 2013 original author or authors */

/**
 * @PreDestroy annotation processor.
 * 
 * Invokes annotated method of the bean before destroying context
 * 
 *    
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Peter Mucha
 *
 * @version 0.1.2
 */
"use strict";
(function(define) {
define([], 
function() {


var registeredDestroyers = [];

    
return  {
  annotation: "@PreDestroy",
 

  
  processFunction: function(obj, fnDescription, annotationParams, context){
	registeredDestroyers.push({obj: obj, name: fnDescription.name});
  },
  
  beforeDestroying: function(obj){
	for(var i = 0; i  < registeredDestroyers.length; ++i)
		if (registeredDestroyers[i].obj === obj)
		{
			var init = registeredDestroyers.splice(i, 1)[0];
			init.obj[init.name](); //call it
		}
  }
};

});})(typeof define == 'function'? define: function(deps, factory) {module.exports = factory.apply(this, deps.map(function(x) {return require(x);}));});