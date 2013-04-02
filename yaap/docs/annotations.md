#yaap included annotations
despite being an annofation processing framework, there are some annotation processors already included.

While some of them work out of the box, others can only be used with wire.js. 
Some annotations can only be used on parameters while others can also be used at function level.

##Basic annotations

* `@NotNull` (parameter/function): the most basic annotation assures, 
	the one/all arguments of a function call are not null or unassigned.

* `@Default(<value>)` (parameter): if the annotated parameter is unassigned or null, a default value will be injected.


##Wire annotations

* `@Autowired([<refName>])` (parameter/function): if a parameter is unassigned or null, a bean from the wire-context will be injected instead.
		If the annotation is placed at a parameter, the given refName or, if ommitted, the parameter-name will be used to resolve the reference.
		If the annotation is function-level, all parameters that are null or unassigned will be autowired by parameter-name.

* `@PostConstruct` (function): the annotated function will be called after container finished configuring the bean.

* `@PreDestroy` (function): the annotated function will be called, if context.destroy() is called.

###browser-specific wire annotations
for these annotations, you need to add the additional `yaao/wire/html`-plugin!

* `@On(<refName>, <event>)` (function): the annotated function will automatically be bound the the event of the given dom-node.
	This is intended to be used with the `wire/dom`-plugin. <refName> can reference one or more elements in the dom (though 
	it is probably better practice to reference a bean in the wirecontext, which itself references the dom-nodes).
	For example, you could bind a clickhandler with this annotation: `@On("dom.all!.btn","click")`. 
	The annotated method accepts one argument that is the event (though you could add additional @autowired arguments, if you want)

