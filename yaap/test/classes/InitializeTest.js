"use strict";
module.exports = {
	fn1: function() /*@PostConstruct*/
	{
		this.value = 1;
	},
	fn2: function(bean)/*@Autowired @PostConstruct*/
	{
		this.bean = bean;
	},
	fn3: function()/*@PreDestroy*/
	{
		this.value = 2;
	}
};