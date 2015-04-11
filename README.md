#Yaap [![Build Status](https://travis-ci.org/warmuuh/yaap.svg?branch=master)](https://travis-ci.org/warmuuh/yaap)

Yaap is a generic annotation processor for javascript. It can be used to implement cross-cutting concerns and inject additional aspect oriented code.

It supports annotations at class-, function- and parameter-level of javascript objects. (see examples)

 * See [Readme](https://github.com/warmuuh/yaap/blob/master/docs/yaap.md) for more information and usage, e.g. on using **@Autowired**-annotation
 * *See [Video Demonstration](http://y2u.be/HrgnyGl2K8A)* for a quick Overview
 * **Try it** using the yeoman generator [generator-yaap-express](https://github.com/warmuuh/generator-yaap-express)

There are also three examples for server and client scenario:

* On [Node](https://github.com/warmuuh/yaap-wire/tree/master/examples/node)
* With [Express.js](https://github.com/warmuuh/yaap-wire/tree/master/examples/express)
* In [Browser](https://github.com/warmuuh/yaap-wire/tree/master/examples/browser)

###Example application
There is a more complex web application example developed with wire and a lot of yaap-features: [yaap-nodepad](https://github.com/warmuuh/yaap-nodepad)


#Changelog
##0.1.4
* moved wire-plugins and express-functionality into its own project `yaap-wire` to make yaap more lightweight

##0.1.3
* improved debug logging
* support for Promises in `yaap/wire/express` (instead of `@Callback`)

##0.1.2
* updated dependencies to wire.js 0.10.0 and when.js 2.2.1

* added yaap-options:
  * `debug`:   add debug output (default: false)
  * `shallow`: only process own methods (not inherited) => boosts performance (default: true)
  * `improved` performance


##0.1.0
* classbased annotations
* "return"-callback with `@Callback` to cope with asynchronity
* connect-auth integration with `@Auth`
* bugfix for @PreDestroy/@PostConstruct

##0.0.4
* New Express-Annotations: `@POST`,`@GET`,`@PUT`,`@DELETE` and req/res-processing parameters: `@Body`, `@JSON`, `@Param`

##0.0.3
* New Wire-Annotations: `@PostConstruct`, `@PreDestroy` ([more information](yaap/docs/annotation.md))
* New Browser-specific Wire-Annotation: `@On` (for eventbinding) ([more information](yaap/docs/annotation.md))
* Performance Improvements
* Rearranged plugin-api
* yaap/wire-plugins can promise now (and must, in case of deferred reference-resolving) ([more information](yaap/docs/processors.md))


##0.0.2
* browser-compatibility (available in `bower`)

##0.0.1
* Yaap Annotation processor
* Initial Annotations: `@Default`, `@NotNull`
* Initial Wire-specific Annotations: `@Autowired`
