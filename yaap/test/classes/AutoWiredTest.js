"use strict";

module.exports = {

	fn1: function(/*@Autowired("bean")*/arg)
	{
		return arg;
	},
	fn2: function(/*@Autowired*/bean)
	{
		return bean;
	},
	fn3: function(bean)/*@Autowired*/
	{
		return bean;
	}
};