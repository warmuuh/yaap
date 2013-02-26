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
        define(["underscore", "../yaap", "./plugins/AutowireProcessor", "wire"], function(_, yaap, autowire, wire) {
                "use strict";


                function annotatesFacet(resolver, facet, wire) {
                        var options = facet.options;
                        var obj = facet.target;
                        yaap.process(obj, {
                                wire: wire
                        });
                        resolver.resolve();
                }






                return {
                        wire$plugin: function(ready, destroyed, options) {

                                yaap.register(autowire);

                                return {
                                        initialize: annotatesFacet
                                };
                        }
                };

        });
}(
typeof define == 'function' && define.amd ? define : function(deps, factory) {
        module.exports = factory.apply(this, deps.map(require));
}));