/** @license MIT License (c) copyright 2013 original author or authors */

/**
 * A javascript annotation processor
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Peter Mucha
 *
 * @version 0.1.1
 */
"use strict";
(function(define) {
define(["underscore"], function(_) {

var registry = [];




return {
	getProcessors: function(annotation){
		return _(registry).where({annotation:annotation});
	},
	register: function(processors){
		_(processors).each(function(proc){
			registry.push(proc);
		});
	}
};


});})(typeof define == 'function'? define: function(deps, factory) {module.exports = factory.apply(this, deps.map(function(x) {return require(x);}));});