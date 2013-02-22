"use strict";
module.exports = {

	setUp: function (callback) {
        
        this.parse = function(source){
				
				var PanPG_util=require('../PanPG_util');
				var es5 = require('../ECMA5Parser');
			    var walker = require("../walker");
			    var ast = es5.Program(source);
			    var fnObjs = PanPG_util.treeWalker(walker, ast);
			    return fnObjs;
        };
        
        callback();
    },
   
    
	"single simple annotations at functionExpression": function(test){
		
		var fnObj = this.parse("function/*@a*/ (/*@c*/a, /*@d*/b)/*@b*/ { c = d;}");
		
	
		test.deepEqual(fnObj, [{
			name: undefined,
			parameters: [
				{name: "a", annotations: [{name:"@c", parameters: []}], index: 0},
				{name: "b", annotations: [{name:"@d", parameters: []}], index: 1}
			],
			annotations: [{name:"@a", parameters: []}, {name:"@b", parameters: []}]
		}]);
		
		test.done();
	},
	"annotations with parameters": function(test){
		
		var fnObj = this.parse("function/*@a(1) @b(2)*/ (/*@c(3)*/a, /*@d(4)*/b){ c = d;}");
		
	
		test.deepEqual(fnObj, [{
			name: undefined,
			parameters: [
				{name: "a", annotations: [{name:"@c", parameters: [3]}], index: 0},
				{name: "b", annotations: [{name:"@d", parameters: [4]}], index: 1}
			],
			annotations: [{name:"@a", parameters: [1]}, {name:"@b", parameters: [2]}]
		}]);
		
		test.done();
	}
	
	
	
	
};