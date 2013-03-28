/** @license MIT License (c) copyright Peter Mucha */

/**
 * yaap/wire plugin
 * wire plugin that provides annotation processing of components, e.g. @Autowired
 *
 * wire is part of the cujo.js family of libraries (http://cujojs.com/)
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 */
(function(define) {
        define(["underscore", "../yaap", 
        "./plugins/AutowireProcessor", 
        "./plugins/PostConstructProcessor", 
        "./plugins/PreDestroyProcessor", 
        "wire"], function(_, yaap, autowire, postConstruct, preDestroy, wire) {
                "use strict";


                function processAnnotations(resolver, facet, wire) {                		
                        var options = facet.options;
                        var obj = facet.target;
                        yaap.process(obj, {
                                wire: wire //feed in context, so Autowire can do its work
                        });
                        resolver.resolve();
                        
                        
                }

				function afterProcessing(resolver, facet, wire) {
						//TODO: find more decoupled solution
						postConstruct.afterProcessing(facet.target);
                        resolver.resolve();
				}

				function beforeDestroying(resolver, facet, wire) {
						//TODO: find more decoupled solution
						preDestroy.beforeDestroying(facet.target);
                        resolver.resolve();
				}


                return {
                        wire$plugin: function(ready, destroyed, options) {

                                yaap.register(autowire); //register annotation processor for @Autowire
								yaap.register(postConstruct); //register annotation processor for @Initialize
								yaap.register(preDestroy); //register annotation processor for @PreDestroy

                                return {
                                        configure: processAnnotations,
                                        "ready": afterProcessing,
                                        "destroy": beforeDestroying
                                };
                        }
                };

        });
}(
typeof define == 'function' && define.amd ? define : function(deps, factory) {
        module.exports = factory.apply(this, deps.map(require));
}));