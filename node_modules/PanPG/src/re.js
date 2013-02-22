/* Here we define an 're' type and operations on it.  These are like regular expressions, except that they are stored not as strings but in a more convenient format.  They may be operated on and combined in various ways and eventually may be converted into ECMAScript regexes.  An re object can also be a named reference, to some other re object, which means that a set of re objects can be recursive and can express non-regular languages.  Circular re objects cannot be turned into ECMAScript regexes, although some collections of re objects that contain named references but are not circular can be flattened by substitution. */

/* An re is an array, in which the first element is an integer which encodes the type of the second element:

0 → cset
1 → string literal
2 → sequence of res
3 → union of res
4 → m to n reps of re
5 → named reference
6 → re negative lookahead
7 → re positive lookahead

*/

function re_from_cset(cset){return [0,cset]}

function re_from_str(str){return [1,str]}

function re_sequence(res){return res.length>1 ?[2,res] :res[0]}

function re_union(res){return res.length>1 ?[3,res] :res[0]}

function re_rep(m,n,re){return [4,m,n,re]}

function re_reference(name){return [5,name]}

function re_neg_lookahead(re){return [6,re]}

function re_pos_lookahead(re){return [7,re]}

/* the following needs a correctness proof. */
function re_serialize(re){
 return f(re)
 function f(re){return h(re,1)}// wants parens
 function g(re){return h(re,0)}// doesn't
 function h(re,paren){var q,cs
  switch(re[0]){
  case 0:
   return CSET.toRegex(re[1])
  case 1:
   return reEsc(re[1].slice(1,-1)) // defined in primitives.js
  case 2:
   return re[1].map(f).join('')
  case 3:
   return (!paren || re[1].length<2)
            ?    re[1].map(f).join('|')
            :'('+re[1].map(g).join('|')+')'
  case 4:
   if(re[1]==0){
    if     (re[2]==0) q='*'
    else if(re[2]==1) q='?'}
   else if(re[1]==1 && re[2]==0) q='+'
   else q='{'+re[1]+','+re[2]+'}'
   return '('+g(re[3])+')'+q
  case 5:
   throw Error('re_serialize: cannot serialize named reference')
  case 6:
   return '(?!'+g(re[1])+')'
  case 7:
   return '(?='+g(re[1])+')'
  default:
   throw Error('re_serialize: unknown re type: '+re[0])}}}

function re_simplify(re){var r
 switch(re[0]){
 case 0:
 case 1:
  return re
 case 2:
  r=[2,re[1].map(re_simplify)]
  return r
 case 3:
  r=[3,re[1].map(re_simplify)]
  if(r[1].every(function(r){return r[0]===0})){
   cs=r[1][0][1]
   r[1].slice(1).forEach(function(r){cs=CSET.union(cs,r[1])})
   return [0,cs]}
  return r
 case 4:
  return [4,re[1],re[2],re_simplify(re[3])]
 case 5:
  throw Error('re_simplify: cannot simplify named reference')
 case 6:
  r=re_simplify(re[1])
  //if(r[0]===0)return [0,CSET.complement(r[1])] WRONG
  return [6,r]
 case 7:
  return [7,re_simplify(re[1])]
 default:
  throw Error('re_simplify: unknown re type: '+re[0])}}

/* we return either a string which is a dependency of the provided re object, or undefined if the re is self-contained. */
function re_dependency(re){var i,l,r
 switch(re[0]){
 case 0:
 case 1:
 case 8:
  return
 case 2:
 case 3:
  for(i=0,l=re[1].length;i<l;i++)
   if(r=re_dependency(re[1][i]))return r
  return
 case 4:
  return re_dependency(re[3])
 case 5:
  return re[1]
 case 6:
 case 7:
  return re_dependency(re[1])
 default:
  throw Error('re_dependency: unknown re type: '+re[0])}}

function re_substitute(re,name,value){var i,l
 //log([re,name,value])
 switch(re[0]){
 case 0:
 case 1:
  return re
 case 2:
 case 3:
  for(i=0,l=re[1].length;i<l;i++)
   re[1][i]=re_substitute(re[1][i],name,value)
  return re
 case 4:
  re[3]=re_substitute(re[3],name,value)
  return re
 case 5:
  if(re[1]===name)return value
  return re
 case 6:
 case 7:
  re[1]=re_substitute(re[1],name,value)
  return re
 default:
  throw Error('re_substitute: unknown re type: '+re[0])}}

/*
6 → re negative lookahead
7 → re positive lookahead
*/

function re_to_function(ctx){return function(re){
 return f(re)
 function f(re){
  switch(re[0]){
   case 0:
    return 'cs_'+cset_ref(ctx,re[1])
   case 1:
    if(!re[1].length)return 'empty'
    return 'sl_'+strlit_ref(ctx,re[1])
   case 2:
    return 'seq('+re[1].map(f).join(',')+')'
   case 3:
    return 'ordChoice('+re[1].map(f).join(',')+')'
   case 4:
    return 'rep('+re[1]+','+re[2]+','+f(re[3])+')'
   case 5:
    return re[1]
   }
  return re}}
 function cset_ref(ctx,cset){var x
  if(x=lookup(cset,ctx.csets,cset_test))return x
  x=ctx.csets.length
  ctx.csets[x]=cset_f(cset,x)
  return x}
 function lookup(x,xs,eq){
  }
 function cset_test(a,b){
  }
 function cset_f(cset,n){
  return 'function cs_'+n+'(s){var c;'
  + 'c=s._str.charCodeAt(s.pos);'
  + 'if('+cset_to_expr(cset,'c')+'){s.adv(1);return true}'
  + 'return false'
  + '}'}
 function strlit_ref(ctx,str){
  if(x=lookup(ctx.strlits,str))return x
  x=ctx.strlits.length
  ctx.strlits[x]=strlit_f(str,x)
  return x}
 function strlit_f(str,n){var i,l,ret,ret2
  l=str.length
  if(l>8){
   return 'function sl_'+n+'(s){var x;'
   + 'x=s._str.slice'
   + '}'}
  else{
   ret=['function sl_'+n+'(s){var '
   ,'p=s.pos'
   ,',t=s._str;'
   ,'if(']
   ret2=[]
   for(i=0;i<l;i++)
    ret2.push('t.charCodeAt(p'+(i<l-1?'++':'')+')=='+str.charCodeAt(i))
   ret.push(ret2.join('&&'))
   ret.push('){s.adv('+str.length+');return true}')
   ret.push('return false}')
   return ret.join('')}}}

/* probably belongs in CSET */
/* takes a cset and a variable name to a JavaScript expression which is a test on the value of that variable for membership in that cset. */
/* This is a dumb implementation, but has the advantage of favoring small codepoints; much more efficient implementations are possible. */
function cset_to_expr(cset,id){var i,l,ret=[]
 for(i=0,l=cset.length;i<l;i++)
  ret.push(id+'<'+cset[i]+'?'+(i%2?'1':'0')+':')
 ret.push(l%2?'1':'0')
 return ret.join('')}

