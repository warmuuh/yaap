#Yaap

Yaap is a generic annotation processor for javascript. It can be used to implement cross-cutting concerns and inject additional aspect oriented code.


It [integrates](#wirejs-integration) with [wire.js](https://github.com/cujojs/wire) (part of [cujo.js](http://cujojs.com)), which enables Spring-style wiring (i.e. dependency injection) of your javascript applications. 
With the `yaap/wire` plugin, @Autowired applications are possible

`Remark:` This is an experimentational library and should not be used in production.

##Installation
Installation for node: `npm install yaap`

##Articles

[Annotations for JavaScript](http://cubiccow.blogspot.com/2013/02/yaap-annotations-for-javascript.html)
[@Autowired for JavaScript](http://cubiccow.blogspot.de/2013/02/autowire-for-javascript.html)

##Example

The Yaap-library can process annotated javascript-objects. One simply defines the object adds annotations and let Yaap process it.

The library already includes some so-called annotation processors, e.g. @NotNull or @Default, which injects a default value in case of a missing or null-argument.

```js
var logger = {
	log: function(message, /*@Defaul("INFO")*/ level){
		console.log(level + ": " + message);
	}
};
yaap.process(logger);
```

The level-parameter is annotated with @Default. Calling <code>yaap.process</code> scans and 
enables attached annotations.


```js
logger.log("hello world"); //will print "INFO: hello world"
```

##Annotations in Javascript
Javascript does not have annotations, but at specific positions, comments are saved and can be retrieved during runtime. This library allow to retrieve and parse annotations placed at these positions.

Right now, Yaap supports parameter-annotations and function-annotations:

```js
var obj = {
	fn: function(message, /*@Defaul("INFO")*/ level) /*@NotNull*/{
		console.log(level + ": " + message);
	}
};
```
`@Default` here is an parameter-annotation while `@NotNull` is a function-annotation. (`@NotNull` can also be used as parameter-annotation though).



##Processors
Yaap is no library of pre-defined annotations for javascript. It should be an extensible foundation to process 
your own annotations easily. All need to be done is to register your processor. The rest is taken care of by Yaap.

```js
var myProcessor = {
	annotation: "@NotNull",
	processFunction: function(object, fnDescription, configuration){...	},
	processParameter: function(object, fnDescription, paramDescription, configuration){...}
}
yaap.register(myProcessor);
```

After registering your processor, `processFunction` will be called, 
if a function is annotated with the according annotation. `processParameter` is called, 
if an annotated parameter is found.

`Remark:` You can either define both or one of these functions, depending on 
where you want to allow your annotation to be placed.

##wire.js Integration
To use @Autowired (and annotations in general) in wire.js, simply add it as a plugin:
```js
var wire = require("wire");
wire({
	level: "INFO",
	logger: {create:  './Logger'},
        
	plugins: [
		{module: "yaap/wire"}
	]
}, {require: require}).then(function(ctx){
	ctx.logger.log("message");
}, console.error);
```
Everything else is done by yaap, so you can start use your annotations:

```js
//Logger.js

module.exports = {
  log: function(message, /*@Autowire*/ level){
		console.log(level + ": " + message);
	}
}
```
`level` references the value in the wire-context (with value "INFO") now.

`Remark:` Yaap/wire uses the parameter name to autowire. You can also supply a reference name with `/*@Autowire("level")*/`

`Remark:` You can also annotate the whole function with `@Autowire` so every parameter will be autowired by name.

###Constructors
The yaap/wire plugin will be called after the bean was created. That means, the constructor itself will not be affected by annotations. 

As a workaround, use a separate initialize-method (using the [init-facade](https://github.com/cujojs/wire/blob/master/docs/configure.md#init-methods) of wire).
