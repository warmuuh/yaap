"use strict";

function MyService() {
}


MyService.prototype = {

    handleGet: function (req, res, next)/*@GET("/")*/ {
		res.send('Look ma, no HTML!');
    }
	
};


module.exports =  MyService;



