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
	},
	"wiring with @PostConstruct": function(test){
		
		var spec = {
			bean: "autowiredValue",
			testInstance:{create: './classes/InitializeTest'},
			plugins: [//{module: "wire/debug", trace: true},
					    {module:'../wire'}]
		};
		
		wire(spec, {require:require}).then(function(ctx){
			test.equal(ctx.testInstance.bean, ctx.bean);
			test.equal(ctx.testInstance.value, 1);
			test.done();
		}, console.error);
	},
	"wiring with @PreDestroy": function(test){
		
		var spec = {
			bean: "autowiredValue",
			testInstance:{create: './classes/InitializeTest'},
			plugins: [{module:'../wire'}]
		};
		
		wire(spec, {require:require}).then(function(ctx){
			var bean = ctx.testInstance;
			ctx.destroy();
			test.equal(bean.value, 2);
			test.done();
		}, console.error);
	}
	
};