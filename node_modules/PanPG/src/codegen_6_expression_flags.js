function v6_calculate_flags(opts,rules){var p
 // documented in doc/streaming_expression_flags
 // N.B. flags can also be set in v6_leaf_dfas
 for(p in rules)
  if(p != '_')
   v6_calculate_flags_expr(opts,rules[p],rules)({})(rules[p].expr)
 // special cases for the shadow start rule
 rules._.expr.flags=
  {cache:false
  ,t_bufferout:false
  ,pushpos:false
  ,t_emitstate:false
  ,m_emitstate:false
  ,m_emitclose:false
  ,m_emitlength:false
  ,m_resetpos:false
  ,m_tossbuf:false
  ,f_tossbuf:false}}

function v6_calculate_flags_expr(opts,rule,rules){return function loop(parent){return function(expr,i){var ret={},subs_anon_consume=[],sub_can_emit_named=false,ref_rule
   if(isCset(expr.type)){
    expr.anon_consume=true}
   if(isNamedRef(expr.type)){
    ref_rule=rules[expr.ref]
    if(!ref_rule.elide && !ref_rule.drop && ref_rule.non_drop_ctx){
     expr.can_emit_named=true}
    else expr.anon_consume=true}
   ret.cache=!!expr.toplevel
   expr.subexprs.forEach(loop(expr))                // recurse
   expr.subexprs.forEach(function(sub){
    if(sub.anon_consume) subs_anon_consume.push(sub)
    if(sub.can_emit_named) sub_can_emit_named=true})
   if(isLookahead(expr.type)){
    expr.consumes_anon=false
    expr.can_emit_named=false}
   if(isOrdC(expr.type)){
    expr.anon_consume = !!subs_anon_consume.length
    expr.can_emit_named = sub_can_emit_named
    if(expr.anon_consume && expr.can_emit_named){
     //subs_anon_consume.forEach(makeAnonEmit)
     expr.anon_consume=false}}
   if(isSequence(expr.type)){
    expr.anon_consume = !!subs_anon_consume.length
    expr.can_emit_named = sub_can_emit_named
    if(expr.anon_consume && expr.can_emit_named){
     //subs_anon_consume.forEach(makeAnonEmit)
     expr.anon_consume=false}}
   ret.t_bufferout=!!(  isLookahead(expr.type)
                     || expr.toplevel
                     || isProperSequence(expr) )
   ret.pushpos=!!(  expr.toplevel
                 || isLookahead(expr.type)
                 || expr.emits_anon
                 || isProperSequence(expr) )
   ret.t_emitstate=!!(  expr.toplevel
                     && !rule.elide
                     && !rule.drop
                     && rule.non_drop_ctx )
   ret.m_emitstate=false // used only in streaming
   ret.m_emitclose=ret.t_emitstate
   ret.m_emitanon=false // will only be set by parent expression
   ret.m_emitlength=ret.m_emitclose
   ret.m_resetpos=isPositiveLookahead(expr.type)
   ret.m_tossbuf=ret.t_bufferout
                 && (isLookahead(expr.type) || rule.drop)
   ret.m_emitbuf=ret.t_bufferout && !ret.m_tossbuf
   ret.f_tossbuf=ret.t_bufferout
   assert(!(ret.m_emitbuf&&ret.m_tossbuf),'¬(m_emitbuf ∧ m_tossbuf)')
   assert(ret.t_bufferout==(ret.m_emitbuf!=ret.m_tossbuf),
          't_bufferout implies m_emitbuf xor m_tossbuf')
   expr.flags=ret}}}

function isProperSequence(expr){return isSequence(expr.type) && expr.subexprs.length>1}

function v6_calculate_streamability(opts,rules){var p,parents=[]
 for(p in rules)go(rules[p])
 function go(rule){
  if(parents.indexOf(rule.name)>-1)return explain_cycle(parents,rule.name)
  parents.push(rule.name)
  if(!rule.known_regular)rule.known_regular=go_expr(rule.expr)
  parents.pop()
  return rule.known_regular
  function go_expr(expr){var i,l,res
   if(v6_always_regular(expr.type))return [true]
   if(isNamedRef(expr.type)){
    return annotate(expr.id,go(rules[expr.ref]))}
   for(i=0,l=expr.subexprs.length;i<l;i++){
    res=go_expr(expr.subexprs[i])
    if(!res[0])return annotate(expr.id,res)}
   return [true]}}
 function annotate(id,res){
  if(res[0])return res
  return [false,id+': '+res[1]]}
 function explain_cycle(parents,name){
  return [false,parents.concat([name]).join(' → ')]}}

function v6_always_regular(n){return isCset(n)||isStrLit(n)||isEmpty(n)}

function v6_substitute(name,value){return function self(re){var i,l
  switch(re[0]){
  case 0: case 1: case 8:
   return re
  case 2: case 3:
   return [re[0],re[1].map(self)]
  case 4:
   return [re[0],re[1],re[2],self(re[3])]
  case 5:
   if(re[1]===name)return value
   return re
  case 6: case 7:
   return [re[0],self(re[1])]
  default:
   throw new Error('v6_substitute: unknown re type: '+re[0])}}}