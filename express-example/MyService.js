"use strict";

function MyService() {
}


MyService.prototype = {
    index: function ()/*@GET*/ {
		return 'index';
    },
    
    test: function (name, id)/*@POST("/test/:id") @Param*/ {
		return {view:'test', model:{name: name, id: id}};
    },
    
    rest: function( /*@Body*/msg, 
					/*@Param*/id, 
					/*@Autowired*/test) 
    /*@POST("/rest/:id") @Body*/ {
		return {msg: msg, id: id, wired: test};
    }
};


module.exports =  MyService;



