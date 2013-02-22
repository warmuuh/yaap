/** @license MIT License (c) copyright wrm */

/**
 * yaap/annotate plugin
 * wire plugin that provides annotation processing of components, e.g. @Autowired
 *
 * wire is part of the cujo.js family of libraries (http://cujojs.com/)
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 */
(function (define) {
define(["underscore", "../index", "./plugins/AutowireProcessor"], function ( _, yaap, autowire) {
"use strict";




	function annotatesFacet(resolver, facet, wire) {


		var options = facet.options;
		var obj = facet.target;
		
		yaap.process(obj, {wire: wire});
		
		
		resolver.resolve();
	} 


	

	return {	wire$plugin: function(){
    yaap.register(autowire)
  
		/*return {
			facets: {
				//define annotate facet
				annotate: {
					//called at configuration-phase
					configure: annotatesFacet
				}
			
			}
		};*/
		
		return {
			initialize:annotatesFacet
		};
		
		
	}};

	

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (deps, factory) { module.exports = factory.apply(this, deps.map(require)); }
)); 