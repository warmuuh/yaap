/*jshint node:true*/
"use strict";


var wire = require("wire");
var express= require("express");
var yaap = require("../yaap/wire/express");

/*
var app = express();
app.use(express.bodyParser());
app.use("/index", function(req, res){res.render("index.jade");});
app.use("/test", function(req, res){console.log(req.body);res.render("test.jade", req.body);});
app.listen(8000);
*/


wire({
		app: { create: 'express',
			   init:{use:[express.bodyParser()]},
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

