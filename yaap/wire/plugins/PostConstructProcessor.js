/** @license MIT License (c) copyright 2013 original author or authors */

/**
 * @PostConstruct annotation processor.
 * 
 * Invokes annotated method after configuration of the bean
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


var registeredInitializers = [];

    
return  {
  annotation: "@PostConstruct",
 

  
  processFunction: function(obj, fnDescription, annotationParams, context){
	registeredInitializers.push({obj: obj, name: fnDescription.name});
  },
  
  afterProcessing: function(obj){
  	for(var i = 0; i  < registeredInitializers.length; ++i)
  		if (registeredInitializers[i].obj === obj)
  		{
  			var init = registeredInitializers.splice(i, 1)[0];
  			init.obj[init.name](); //call it
  		}
  
  }
};

});})(typeof define == 'function'? define: function(deps, factory) {module.exports = factory.apply(this, deps.map(function(x) {return require(x);}));});