/*jshint node:true*/
"use strict";


wire({
		app: { create: 'express',
			   init:{use:[express.bodyParser()]}, //TODO:shift this into yaap/wire/express
			   ready:{listen:[8000]}
		},
        myService:  { create: './MyService' }, 
        
        plugins: [
			{module: "../yaap/wire"},
			{module: "../yaap/wire/express",server: "app"}
        ]
}, {require: require}).then(function(ctx){
	console.log("----- initialized -----");
	//ctx.destroy();
}, function(err){console.error(err);});

