"use strict";
module.exports = {
	fn1: function() /*@Initialize*/
	{
		this.value = 1;
	},
	fn2: function(bean)/*@Autowired @Initialize*/
	{
		this.bean = bean;
	}
};