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
        define(["underscore", "../../yaap", 
        "./plugins/OnProcessor",
        "wire"], function(_, yaap, on, wire) {
                "use strict";


                return function(options) {
								yaap.register(on);
                                return {};
                        };
                

        });
}(
typeof define == 'function' && define.amd ? define : function(deps, factory) {
        module.exports = factory.apply(this, deps.map(require));
}));