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
 * @version 0.0.3
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
	while(registeredInitializers.length > 0){
		var init = registeredInitializers.pop();
		init.obj[init.name](); //call it
	}
  }
};

});})(typeof define == 'function'? define: function(deps, factory) {module.exports = factory.apply(this, deps.map(function(x) {return require(x);}));});