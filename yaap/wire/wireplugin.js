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
        "wire", "when"], function(_, yaap, autowire, postConstruct, preDestroy, wire, when) {
                "use strict";


                function processAnnotations(resolver, facet, wire) {                		
                        var options = facet.options;
                        var obj = facet.target;

                        yaap.config = yaap.config || {};
                        //TODO this rewires yaap-config on every processed bean: do it once only
						wire(yaap.config).then(function(ctx){
	                        ctx.wire= wire; //feed in context, so Autowire can do its work
	                        ctx.promises= []; //plugins can save promises here
	                        yaap.process(obj, ctx);

	                        when.all(ctx.promises).then(resolver.resolve,resolver.reject);
						
						}, function(err){
							console.log("wiring yaap-config failed:" + err);
							resolver.reject();
						} );
                        
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


                return function(options) {
								yaap.setOptions(options);
                                yaap.register(autowire); //register annotation processor for @Autowire
								yaap.register(postConstruct); //register annotation processor for @Initialize
								yaap.register(preDestroy); //register annotation processor for @PreDestroy
								
							 
                                return {
                                        "connect": 	processAnnotations,
                                        "ready": 	afterProcessing,
                                        "destroy": beforeDestroying
                                };
                        };
                

        });
}(
typeof define == 'function' && define.amd ? define : function(deps, factory) {
        module.exports = factory.apply(this, deps.map(require));
}));