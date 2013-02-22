// prototype of a different approach to TAL.
// used to collect the csets for character equivalence classes
// the v6_tree_rules is what the syntax might look like, the rest of the file is the support code.

function v6_tree_attribution(parse_rules){
 v6_tree_select(v6_tree_rules())(parse_rules)
 //v6_tree_force_all(parse_rules)
 v6_tree_force(parse_rules)
 v6_tree_cleanup(parse_rules)
 return parse_rules}

function v6_tree_cleanup(o){var p
 if(typeof o != 'object')return
 if(!('_attrs' in o))return
 if(o._attrs.deleting)return
 o._attrs.deleting=true
 for(p in o)if(hasprop(o,p)&&p!='_attrs')v6_tree_cleanup(o[p])
 delete o._attrs}

function hasprop(o,p){return Object.prototype.hasOwnProperty.call(o,p)}

function v6_tree_force(rules){var p,stack
 for(p in rules) if(hasprop(rules,p) && p!='_attrs'){
  rules[p].all_csets=v6_tree_force_attr('all_csets',stack=[])(rules[p])}}

function v6_tree_force_all(o){var p,stack
 if(!(typeof o=='object'))return
 if(!o._attrs)return
 for(p in o._attrs.functions){
  v6_tree_force_attr(p,stack=[])(o)}
 for(p in o) if(hasprop(o,p) && p!='_attrs'){
  v6_tree_force_all(o[p])}}

function v6_tree_select(rules){var token
 return function(tree){token={}; loop(tree)}
 function loop(tree){var environment,i,l,rule,test,p
  environment={}
  if(tree._attrs && tree._attrs.token==token)return
  setup(tree)
  for(i=0,l=rules.length;i<l;i++){rule=rules[i]
   environment.anchor=tree
   environment.current=tree
   environment.bindings={}
   if(rule[0](environment)) rule[1](environment)}
  if(tree instanceof Array){
   for(i=0,l=tree.length;i<l;i++){
    if(typeof tree[i]=='object'){
     loop(tree[i])}}}
  else{
   for(p in tree) if(Object.prototype.hasOwnProperty.call(tree,p)){
    if(typeof tree[p]=='object'){
     if(p=='_attrs')continue
     loop(tree[p])}}}}
 function setup(node){
  node._attrs=
   {token:token
   ,functions:{}
   ,forced:{}
   ,pending:{}
   ,errors:{}
   ,values:{}}}}

function v6_tree_rules(){var stack=[]
 return build(
 [

  //{subexprs:cn←[{}]}
  [obj(key('subexprs',collect('cn',list(obj())))),
     'all_csets',function(m){return concat(m.cn.map(attr('all_csets')))}]
 

  //{expr:x←{}}
 ,[obj(key('expr',collect('x',obj()))),
     'all_csets',function(m){return attr('all_csets')(m.x)}]


  //{dfa:trans←{type:'transition'}}
 ,[obj(key('dfa',collect('trans',obj(key('type',eq('transition')))))),
     'all_csets',function(m){return v6_csets_from_dfa(m.trans)}]

 ])

function v6_csets_from_dfa(d){var all,i,l,t
 if(d.type!='transition')return []
 all=[]
 t=d.transition
 for(i=0,l=t.length;i<l;i++){
  all.push(t[i][0])
  all=all.concat(v6_csets_from_dfa(t[i][1]))}
 return all}

function among(as){return function _among(x){
  return as.indexOf(x.current)>-1}}

function and(a,rest){rest=Array.prototype.slice.call(arguments,1)
 if(!a)return function(){return true}
 rest=and.apply(null,rest)
 return function _and(x){var current
  current=x.current
  if(!a(x))return false
  x.current=current
  return rest(x)}}

function key(k,p){return function _key(x){var test
 if(!(k in x.current))return false
 x.current = x.current[k]
 test = !p || p(x)
 return test}}

function eq(a){return function _eq(x){return x.current==a}}

function list(p){return function _list(x){var i,l,xs
 xs=x.current
 if(!(x.current instanceof Array))return false
 if(p) for(i=0,l=xs.length;i<l;i++){
  x.current=xs[i]
  if(!p(x)){x.current=xs;return false}}
 x.current=xs
 return true}}

function collect(n,p){return function _collect(x){var it
  it=x.current
  return (!p || p(x)) && (x.bindings[n]=it, true)}}

function obj(p){return function _obj(x){
  return typeof x=='object' && (!p || p(x))}}

function build(rules){var i,l,rule,ret=[]
 for(i=0,l=rules.length;i<l;i++){rule=rules[i]
  ret.push([rule[0] // selector
           ,attr_define(rule[1],rule[2])])} // setter
 return ret}

function attr_define(n,f){return function _attr_define(x){
  x.anchor._attrs.functions[n]=
   (function(bindings){return function(){return f(bindings)}})
   (x.bindings)}}

function attr(n){var force
 force=v6_tree_force_attr(n,stack)
 return function _attr(x){return force(x)}}

} // end v6_tree_rules

function v6_tree_force_attr(n,stack){return function _v6_tree_force_attr(x){
  if(!x._attrs){
   x._attrs={errors:{},forced:{}}
   return err('attribute '+n+' requested but not defined')}
  if(!x._attrs.forced[n]){
   if(x._attrs.pending[n]) return err('circular reference')
   stack.push(n)
   if(!x._attrs.functions[n]){
    return err('attribute '+n+' requested but not defined')}
   try{x._attrs.values[n]=x._attrs.functions[n]()}
   catch(e){return err(e)}
   x._attrs.pending[n]=false
   x._attrs.forced[n]=true
   stack.pop()}
  return x._attrs.values[n]
  function err(s){
   return x._attrs.errors[n]=s+' '+stack.join(', ')}}}