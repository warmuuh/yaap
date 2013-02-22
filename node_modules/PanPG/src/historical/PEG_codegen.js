if('_CSET'in this) _CSET()['import']('cset_')

function _all(cn,attr){
 return(cn
  .filter(function(c){return !!c[attr]})
  .map(function(c){return c[attr]()}))}

function _wrap_re(re){
 return "re(/^"+re+"/)"}

function ruleset_codegentable(opts,cn){var
 res=_all(cn,'re_kvpair')
 pts=_all(cn,'parse_template')
 deps=_all(cn,'deps')
 return [res,pts,deps]}

function ruleset_deps(opts,cn){var
 deps=_all(cn,'deps'),ret={}
 deps.forEach(function(dep){ret[dep[0]]=dep[1]})
 return ret}

function rule_peg_cg(opts,name,code){
 return [name,_peg_cg_function_part(opts.prefix,name,code)]}

function _peg_cg_function_part(prefix,name,code){
 return "function "+prefix+name+"(s,p){var c=s.pre('"+name+"',p);if(typeof c=='boolean')return c;return s.fin(c,p,"+code+"(s,c))}"}

function ordchoice_peg_cg(opts,children){var
 all=_all(children,'p')
 if(all.length==1)return all[0]
 if(all.length==0)throw Error('ordchoice_peg_cg: no children')
 return "ordChoice("+all.join(',')+")"}

function sequence_peg_cg(opts,children){var
 all=_all(children,'p')
 if(all.length==1)return all[0]
 if(all.length==0)throw Error('sequence_peg_cg: no children')
 return "seq("+all.join(',')+")"}

function charset_peg_cg(opts,re){return _wrap_re(re_serialize(re))}

function charsetdiff_cset(opts,cn){var
 all=_all(cn,'cset')
 return all.slice(1).reduce(function(r,e){return cset_difference(r,e)},all[0])}

function charsetintersection_cset(opts,cn){var
 all=_all(cn,'cset')
 return all.reduce(function(r,e){return cset_intersection(r,e)},cset_universe)}

function charsetunion_cset(opts,cn){var
 all=_all(cn,'cset')
 return all.reduce(function(r,e){return cset_union(r,e)},cset_nil)}

function codepointrange_cset(opts,from,to){
 return cset_fromIntRange(from,to)}

function codepoint_cset(opts,codepoint){
 return cset_fromInt(codepoint)}

function upluscodepoint_peg_codepoint(opts,match){return parseInt(match.slice(2),16)}

function strlit_peg_cg(opts,match){
 return "strLit("+match+")"}

function nonterminal_peg_cg(opts,match){
 return opts.prefix+match}

function anyrep_peg_cg(opts,p){
 return "rep(0,0,"+p+")"}

function posrep_peg_cg(opts,p){
 return "rep(1,0,"+p+")"}

function optional_peg_cg(opts,p){
 return "rep(0,1,"+p+")"}

/* XXX obviously this is a bit of a hack, because it relies on the [MNRep]D[N] being applied after the [MNRep]D[M]. */
function mnrep_peg_cg(opts,p,m,n_hack){
 return "rep("+m+","+n_hack+","+p+")"}
function mnrep_re(opts,re,m,n_hack){
 return re_rep(m,n_hack,re)}

function mn_n(opts,match){
 return parseInt(match,10)}

function neglookahead_peg_cg(opts,p){
 return "negPeek("+p+")"}

function poslookahead_peg_cg(opts,p){
 return "peek("+p+")"}