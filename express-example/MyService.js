"use strict";

function MyService() {
}


MyService.prototype = {
    index: function (req, res, next)/*@GET*/ {
		return 'index';
    },
    
    test: function (req, res, next)/*@POST*/ {
		return {view:'test', model:req.body};
    }
};


module.exports =  MyService;



