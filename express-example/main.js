/*jshint node:true*/
"use strict";


var wire = require("wire");

wire({
		app: { create: 'express' , ready:{listen:[8000]}},
        myService:  { create: './MyService' }, 
        
        plugins: [
          {module: "../yaap/wire"},
          {module: "../yaap/wire/express", server: "app"}
        ]
}, {require: require}).then(function(ctx){

	console.log("----- initialized -----");
	//ctx.destroy();
}, function(err){console.error(err);});

