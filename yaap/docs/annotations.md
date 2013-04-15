#yaap included annotations
despite being an annofation processing framework, there are some annotation processors already included.

While some of them work out of the box, others can only be used with wire.js. 
Some annotations can only be used on parameters while others can also be used at function level or class level.

##Basic annotations

* `@NotNull` (parameter/function): the most basic annotation assures, 
	the one/all arguments of a function call are not null or unassigned.

* `@Default(<value>)` (parameter): if the annotated parameter is unassigned or null, a default value will be injected.


##Wire annotations

* `@Autowired([<refName>])` (parameter/function/class): if a parameter is unassigned or null, a bean from the wire-context will be injected instead.
		If the annotation is placed at a parameter, the given refName or, if ommitted, the parameter-name will be used to resolve the reference.
		If the annotation is function-level, all parameters that are null or unassigned will be autowired by parameter-name.
		If the annotation is class-level, the parameter could be a string, an array of strings or an object that maps strings onto strings. New Properties according to the given names will be injected with the referenced beans.

* `@PostConstruct` (function): the annotated function will be called after container finished configuring the bean.

* `@PreDestroy` (function): the annotated function will be called, if context.destroy() is called.

###browser-specific wire annotations
for these annotations, you need to add the additional `yaap/wire/html`-plugin! (as shown in the browser-example)

* `@On(<refName>, <event>)` (function): the annotated function will automatically be bound the the event of the given dom-node.
	This is intended to be used with the `wire/dom`-plugin. <refName> can reference one or more elements in the dom (though 
	it is probably better practice to reference a bean in the wirecontext, which itself references the dom-nodes).
	For example, you could bind a clickhandler with this annotation: `@On("dom.all!.btn","click")`. 
	The annotated method accepts one argument that is the event (though you could add additional @autowired arguments, if you want)

###Node-Specific wire-annotations (Express.js)
for these annotations, you need to add the additional `yaap/wire/express`-plugin! (and you need to feed the express-application into the plugin as shown in the express-example)

* `@GET/POST/PUT/DELETE([<pathspec>])` (function): registeres the function as an endpoint in an express-application with either the given path 
	or the functionname as path, if omitted.
* `@Param([<name>])` (parameter/function): fetches the annotated parameter from the query/path/post parameters. 
	If annotation is on function-level, all parameters (except `@Body`-annotated parameters) are injected by-name.
* `@Body` (parameter/function): if parameter-level, then the request-body will be injected. If on function-level, 
	it states that the return-value will be returned as-is (Just like @ResponseBody does in SpringMVC).
* `@JSON` (function): states, that the returned value will be send as response in json-format. (using [response.json](http://expressjs.com/api.html#res.json)).
* 