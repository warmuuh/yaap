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
        "./plugins/VerbProcessors",
        "wire"], function(_, yaap, VERBS, wire) {
                "use strict";


                return function(options) {
								if (!options.server)
                                  throw "yaap/wire/express needs server reference";
                                
                                //register for wiring
                                yaap.config = yaap.config || {};
                                yaap.config.express = {$ref: options.server};
                                yaap.config.express_view = options.view || "jade";
                                for(var i = 0; i < VERBS.length; ++i)
									yaap.register(VERBS[i]);
                                return {};
                        };
                

        });
}(
typeof define == 'function' && define.amd ? define : function(deps, factory) {
        module.exports = factory.apply(this, deps.map(require));
}));