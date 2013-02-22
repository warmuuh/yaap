/* See doc/code_generation for the documentation of the following algorithms. */

function reTablePostProcess(inArr){
 var PS=[]  // parent stack
   , ret={} // output table
   , A      // current re object being processed
   , D      // the first found dependency of A
   , quick={} // the input array as a hash for quick lookup
   , i      // the current index into the input array
   , l=inArr.length
   , cached // an entry that was already in the output table
 for(i=0;i<l;i++)
  quick[name(inArr[i])] = value(inArr[i])

 input_loop:
 for(i=0;;){
  if(!(A=next()))break input_loop
  PS.push(A)
  dependency_loop:
  for(;;){
   if(!(D=dependency(A))){
    PS.pop()
    output(name(A),value(A))
    if(!PS.length) continue input_loop
    A=PS[PS.length-1]
    continue dependency_loop}
   if(inPS(D)){
    handle_cycle_error()
    continue input_loop}
   if(cached=output_lookup(D)){
    if(success(cached)){
     A=substitute(A,D,cached)
     continue dependency_loop}
    handle_dependency_error()
    continue input_loop}
   if(!(A=quick[D])){
    handle_not_found_error(D)
    continue input_loop}
   A=[D,A]
   PS.push(A)
   continue dependency_loop}}
 return ret

 function next(){var ret
  if(i>=l)return
  ret=inArr[i++]
  if(output_lookup(name(ret)))return next()
  return ret}
 function output(name,value){
  if(name in ret)throw Error("WTF") //XXX debugging only
  ret[name]=value}
 function inPS(x) PS.some(function(y){return name(y)===x})
 function handle_cycle_error(){
  unwind_with_error('cyclical dependency')}
 function unwind_with_error(msg){
  msg+=': '+PS.map(name).concat([D]).join(' → ')
  while(PS.length) output(name(PS.pop()),msg)}
 function output_lookup(x){return ret[x]}
 function success(x){return typeof x!=='string'}
 function substitute(re_kvpair,n,re){return [name(re_kvpair),re_substitute(value(re_kvpair),n,re)]}
 function handle_dependency_error(){
  unwind_with_error('unsatisfiable dependency')}
 function handle_not_found_error(x){
  unwind_with_error('dependency not found')}
}

function name(re_kvpair){return re_kvpair[0]}
function value(re_kvpair){return re_kvpair[1]}
function dependency(re_kvpair){return re_dependency(value(re_kvpair))}

function reTableCodeGen(start,prefix,res,pfs,deps,elisionSet,elisionFlag){var r,p,s=[],RT={}
 r=f(start)
 for(p in r[1])s.push(r[1][p]?ptExpand(pfs[p],prefix):reWrap(res[p],p,prefix))
 return s.join('\n')
 function f(T){var x,a=0,r=0,d,i,l,o={},p={},v
  if(x=RT[T])return x
  if(!elidable(T))a=1
  d=deps[T]
  if(!d)throw new Error('depTable entry missing: '+T)
  RT[T]=[1,o]
  for(i=0,l=d.length;i<l;i++){
   x=f(d[i])
   if(x[0]){
    a=r=1
    add(o,x[1])}
   else
    add(p,x[1])}
  if(!r && !(res[T]))r=1
  if(r){
   add(o,p)
   o[T]=1}
  else
   o[T]=0
  if(a)v=[1,o]
  else v=[0,o]
  RT[T]=v
  return v}
 function elidable(n){return (elisionSet.indexOf(n)==-1)?elisionFlag:!elisionFlag}
 function add(a,b){for(var p in b)a[p]=b[p]}}

function reWrap(re,name,prefix){
 var code='re(/^'+re_serialize(re)+'/)'
 return _peg_cg_function_part(prefix,name,code)} // implemented in PEG_codegen.js

function ptExpand(pt,prefix){
 return pt.replace(/\$PREFIX\$/g,prefix)}

/* find the set of rules that appear in the dependency table only as dependencies */
function missingDependencies(deps){var missing={},a=[],a2=[],p,used={}
 for(p in deps)used[p]=0
 for(p in deps)
  deps[p].forEach(function(dep){
   if(!deps[dep])
    missing[dep]=1
   else
    used[dep]=1})
 for(p in missing)a.push(p)
 for(p in used)if(!used[p])a2.push(p)
 return [a,a2]}

/* as missingDependencies, but rather than the entire table we consider only the dependency graph of the provided start token. */
function missingDependenciesOf(deps,start){var missing={},unused={},seen={},p
 for(p in deps)unused[p]=1
 f(start)
 return [toArr(missing),toArr(unused)]
 function f(T){
  if(seen[T])return
  seen[T]=1
  unused[T]=0
  if(!deps[T])missing[T]=1
  else deps[T].forEach(f)}
 function toArr(o){var p,ret=[]
  for(p in o)if(o[p]==1)ret.push(p)
  return ret}}