"use strict";
module.exports = {
	retrival: function(test){
		
		var ap = {
			annotation: "test",
			test:"test"
		};
		
		var registry = require("../registry");
		registry.register([ap]);
		
		
		test.deepEqual(registry.getProcessors("test"), [ap]);
		
		test.done();
	}
};