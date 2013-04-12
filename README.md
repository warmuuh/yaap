#Yaap

Yaap is a generic annotation processor for javascript. It can be used to implement cross-cutting concerns and inject additional aspect oriented code.

See [Readme](yaap) for more information.


There are also three examples for server and client scenario:

* On [Node](node-example)
* With [Express.js](express-example)
* In [Browser](browser-example)

###Example application
There is a more complex web application example developed with wire and a lot of yaap-features: [yaap-nodepad](https://github.com/warmuuh/yaap-nodepad)


#News

##master
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
