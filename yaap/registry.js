/** @license MIT License (c) copyright 2013 original author or authors */

/**
 * A javascript annotation processor
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Peter Mucha
 *
 * @version 0.0.1
 */
"use strict";
 
var _ = require("underscore");


var registry = [];

var register = exports.register = function(processors){
	_(processors).each(function(proc){
		registry.push(proc);
	});
};



var getProcessors = exports.getProcessors = function(annotation){
	return _(registry).where({annotation:annotation});
};