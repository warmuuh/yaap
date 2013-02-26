/*jshint node:true*/
"use strict";


var wire = require("wire");




wire({
		    message: "autowired",
        myComponent: {
                create: {
				            module: './MyClass',
				            args: "wired"
				        }
        },
        	
        plugins: [
          //{module: "wire/debug", trace: true},
           {module: "../yaap/wire", hookRequire: require}
           
        ]
        
}, {require: require}).then(function(ctx){

	console.log("----- initialized -----");
	ctx.myComponent.doSomething();
  ctx.myComponent.doSomethingElseAgain();

}, console.error);

