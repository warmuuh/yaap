"use strict";
var wire = require("wire");

module.exports = {
	"wire integration": function(test){
		
		var spec = {
			testInstance:{create: './classes/TestClass'},
			plugins: [//{module: "wire/debug", trace: true},
					    {module:'../wire'}]
		};
		
		wire(spec, {require:require}).then(function(ctx){
			test.equal(ctx.testInstance.fn(), "def");
			test.done();
		}, console.error);
		
			
	
	},
	"wiring by @Autowire": function(test){
		
		var spec = {
			bean: "autowiredValue",
			testInstance:{create: './classes/AutoWiredTest'},
			plugins: [//{module: "wire/debug", trace: true},
					    {module:'../wire'}]
		};
		
		wire(spec, {require:require}).then(function(ctx){
			test.equal(ctx.testInstance.fn1(), ctx.bean);
			test.equal(ctx.testInstance.fn2(), ctx.bean);
			test.equal(ctx.testInstance.fn3(), ctx.bean);
			test.done();
		}, console.error);
	}
};