#yaap included annotations
despite being an annofation processing framework, there are some annotation processors already included.

While some of them work out of the box, others can only be used with wire.js.
Some annotations can only be used on parameters while others can also be used at function level or class level.

##Basic annotations

* `@NotNull` (parameter/function): the most basic annotation assures,
	the one/all arguments of a function call are not null or unassigned.

* `@Default(<value>)` (parameter): if the annotated parameter is unassigned or null, a default value will be injected.

##More annotations
More annotations are available for example in the [yaap-wire](https://github.com/warmuuh/yaap-wire) project, e.g.:
* @Autowired
* @PostConstruct
* @PreDestroy

but also Express-specific annotations to create Webservices, e.g. @POST, @GET etc
