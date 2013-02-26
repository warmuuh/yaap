"use strict";
module.exports = {
	
	setUp: function (callback) {
        
        this.yaap = require("../../yaap");
        
        callback();
    },
   


	"parameter level": function(test){
		
		var obj = {fn: function(/*@NotNull*/arg){return arg;}};
		
		this.yaap.process(obj);
		test.throws(function(){obj.fn();});
		test.throws(function(){obj.fn(null);});
		test.throws(function(){obj.fn(undefined);});
		test.doesNotThrow(function(){obj.fn("");});

		test.done();
	},
	"function level": function(test){
		
		var obj = {fn: function(arg)/*@NotNull*/{return arg;}};
		
		this.yaap.process(obj);
		test.throws(function(){obj.fn();});
		test.throws(function(){obj.fn(null);});
		test.throws(function(){obj.fn(undefined);});
		test.doesNotThrow(function(){obj.fn("");});

		test.done();
	}

};