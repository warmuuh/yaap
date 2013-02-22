/*global console require exports*/
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