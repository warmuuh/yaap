"use strict";
module.exports = {
	
	setUp: function (callback) {
        
        this.yaap = require("../../yaap");
        
        callback();
    },
   


	"null value": function(test){
		
		var obj = {fn: function(/*@Default("def")*/arg){return arg;}};
		
		this.yaap.process(obj);
		test.equal(obj.fn(), "def");

		test.done();
	},
	"value given": function(test){
		
		var obj = {fn: function(/*@Default("def")*/arg){return arg;}};
		
		this.yaap.process(obj);
		test.equal(obj.fn("test"), "test");

		test.done();
	}

};