function codegen_v6(opts,named_res,_x){var vars,rules,function_m_x,mainloop,ft,function_emit,dbg,function_fail,function_assert,nameline,asserts,single_call_special_case,id_names,commonjs_begin,commonjs_end,function_dbg,dfa_table,dbg_tree
 //opts.debug=true
 //opts.trace=true
 //opts.asserts=true
 opts=extend(_x||{},opts||{})
 // the 'opts' variable includes our options, but since we have to pass these into every part of the code generator, it makes a convenient place to store state, such as caches, various assigned numbers, etc.
 // rather than mutating the passed-in opts object, we copy its properties onto _x if it was provided or a new object
 // the undocumented third argument _x can be used to examine the state after the call
 function extend(a,b){for(var p in b)a[p]=b[p];return a}
 opts.elide=opts.elide||[]
 opts.drop=opts.drop||[]
 opts.leaf=opts.leaf||[]
 opts.prefix=opts.prefix||''
 opts.start=opts.start||named_res[0][0]
 opts.fname=opts.fname||opts.prefix+opts.start
 opts.target_language=opts.target_language||'ES3'
 opts.commonjs=!!opts.commonjs
 opts.S_map=[]
 opts.dfa_table=[]
 rules=v6_named_res_to_rules(opts,named_res)  // build our "rule" structures
 rules=v6_expr_fixups(opts,rules)             // simple syntactic transformations
 rules=v6_dependencies(opts,rules)            // dependency analysis (we don't generate code for unused rules)
 rules=v6_drop_contexts(opts,rules)           // find rules called only in dropped contexts
 rules=v6_add_shadow_start_rule(opts,rules)   // see doc/* for information on the shadow start rule
 nameline=v6_nameline(opts,rules)             // the nameline is an array of the rule names
 rules=v6_leaf_dfas(opts,rules)               // generate leaf DFAs
 rules=v6_tree_attribution(rules)             // next-gen TAL prototype
 if(opts.debug) dbg_tree=pp(rules,{hide:['expr','re']})
 if(opts.t_bufferout) // caller-provided flags
  v6_apply_flags(opts,rules)
 else{
  v6_calculate_flags(opts,rules)
  v6_calculate_streamability(opts,rules)}
 rules=v6_cset_equiv(opts,rules)              // calculate and store the cset equivalence classes
 rules=v6_assign_ids(opts,rules)              // assign state IDs to the rule sub-expressions
 rules=v6_TMF(opts,rules)                     // assign T, M, and F states
 dbg=opts.trace?v6_dbg(opts,rules):function(){return ''}
 asserts=opts.asserts
 function asrt(expr,msg,trm){return asserts?'assert('+expr+','+pp_quote(msg)+')'+(trm||''):''}
 id_names=opts.commonjs?'exports.names':opts.fname+'.names'
 vars=['eof=false'
      ,'s=\'\'','l=0'
      ,'S='+rules._.expr.S_flags
      ,'T','M','F','D','R'
      ,'tbl=[]','x'
      ,'pos=0','offset=0'
      ,'buf=[]','bufs=[]','states=[]','posns=[]','c'
      ,'equiv'
      ,'ds','dp' // DFA state and position saved between chunks
      ,'failed=0'
      ,'emp=0','emps=[]' // emit position and stack
      ]
 if(opts.trace) vars.push('S_map=[\''+opts.S_map.join('\',\'')+'\']')
 ft=v6_flag_test(opts) // ft ("flag test") takes varname, flagname → flag test expression

 dfa_table=v6_dfa_table(opts,rules)('D','s','pos','equiv','ds','dp')+'\n'

 commonjs_begin=';(function(exports){'
  + 'exports.names='+nameline
  + ';exports.parse='+opts.fname
  + '\n'

 commonjs_end='})(typeof exports==\'object\'?exports:'+opts.fname+'={});'

 function_emit='function emit(){var x='
  + 'bufs.length?bufs[0]:buf;'
  + 'if(x.length){out(\'tree segment\',x);'
  +  'if(bufs.length)bufs[0]=[];else buf=[]}}'

 function_fail='function fail(s){'
  + 'out(\'fail\',pos,s);'
  + 'failed=1'
  + '}'

 function_m_x='function(m,x){'
  + 'if(failed){out(\'fail\',pos,\'parse already failed\');return}\n'
  + 'switch(m){\n'
    // probably some room for optimization in this while() loop (i.e. getting rid of it)
  + 'case \'chunk\':s+=x;l=s.length;while(tbl.length<l+1)tbl.push([]);mainloop();break\n'
  + 'case \'eof\':eof=true;mainloop();break\n'
  + 'default:throw new Error(\'unhandled message: \'+m)'
  + '}}\n'

 function_assert='function assert(x,msg){if(!x)throw new Error(\'assertion failed\'+(msg?\': \'+msg:\'\'))}'

 function_dbg="function dbg(msg){"
  + "out(msg,'S:'+(S_map[S>>>"+opts.flagbits+"]||'unknown state'+S>>>"+opts.flagbits+")"
  + "+' pos:'+pos"
  // + "+' '+s.charAt(pos)"
  + "+' R:'+R"
  + "+' stack:'+states.map(function(s){return s>>>"+opts.flagbits+"})"
  + "+' posns:'+posns"
  + "+' bufs:'+bufs.map(function(b){return '['+b+']'})"
  + "+' buf:'+buf"
  + "+' emps:['+emps+']'"
  + "+' emp:'+emp"
  + ")}"

 single_call_special_case='if(typeof out==\'string\'){s=out;out=[];'
  +  'x='+opts.fname+'(function(m,x,y){if(m==\'fail\')out=[false,x,y,s];'
  +    'if(m==\'tree segment\')out=out.concat(x)});'
  +  'x(\'chunk\',s);'
  +  'x(\'eof\');'
  +  'return out[0]===false?out:[true,{names:'+id_names
  +                                  ',tree:out'
  +                                  ',input:s}]}'

 mainloop='//mainloop\nfunction mainloop(){for(;;){'
  + dbg('main')+'\n'
  + 'if(dp==undefined&&('+v6_is_not_prim_test(opts)('S')+'))\nt_block:{\n'
  + (asserts?'assert(typeof S=="number","S")\n'
     + 'assert((S>>>'+opts.flagbits
     +   ')<='+opts.highest_used_S+',"S in range: "+S)\n'
     + "assert(R==undefined,'result is unknown (R:'+R+',S:'+(S>>>"+opts.flagbits+")+')')\n"
     :'')
  + 'if('+ft('S','pushpos')+')posns.push(pos)\n'
  + 'if('+ft('S','t_bufferout')+'){bufs.push(buf);buf=[]}\n'
  + 'if('+ft('S','t_emitstate')+'){'
  +     asrt('emp<=pos','emit position <= pos',';')
  //+     'if(emp<pos)buf.push(-1,pos-emp);'
  +     'emps.push(emp);' // store emit position
  +     'emp=pos;' // will be clobbered by cache hit
  +     'buf.push(S>>>'+opts.flagbits+')}\n' // buf is clobbered by cache hit
  + 'if('+ft('S','cache')+'&&(x=tbl[pos-offset][S])!=undefined){'
  +     'if(x){R=true;pos=x[0];buf=x[1];if(emp<x[2])emp=x[2]}else{R=false}'
  +     dbg('cached')+'}\n'
  + '}\n' // end if not prim test (i.e. t_block)
  + 'if(R==undefined){' // if no cached result
  +  dbg('test')
  +  '\n'// call DFA\n'
  +  'if(D[S>>>'+opts.flagbits+']){'
  +   'R=D[S>>>'+opts.flagbits+'](ds||0,dp||pos);'
  +   'if(R==undefined){' // need more data from caller
  +    'if(eof){ds=dp=undefined;R=false}'
  +    'else{out(\'ready\');return}'
  +   '}' // end if need more data
  +  '}\n' // end if dfa exists
  +  'else{'
  +   'states.push(S);'
  +   asrt('T[S>>>'+opts.flagbits+']','T',';')
  +   'S=T[S>>>'+opts.flagbits+']'
  +  '}\n' // end else
  +  'if(S=='+opts.S_ε+'){R=true;S=states.pop()}'
  + '}' // end if R==undefined

  // has_result loop

  + '\nwhile(R!=undefined){'
  + dbg('result')+'\n'
  + 'if(S=='+rules._.expr.S_flags+'){(R?emit:fail)();return}'
  + 'if(R){\n'
  +  'if('+ft('S','cache')+'){tbl[posns[posns.length-1]][S]=[pos,buf,emp];buf=buf.slice()}\n'
  +  'if('+ft('S','t_emitstate')+'){'
  +    'if(pos!=emp&&emp!=posns[posns.length-1]){'
  +      'buf.push(-1,pos-emp)}'
  +    'emp=emps.pop();'
  +    'if(emp!=posns[posns.length-1]){buf=[-1,posns[posns.length-1]-emp].concat(buf)}'
  +    '}\n'
  +  'if('+ft('S','m_emitstate')+')buf.push(S>>>'+opts.flagbits+')\n'
  +  'if('+ft('S','m_emitclose')+')buf.push(-2)\n'
  +  'if('+ft('S','m_emitlength')+')buf.push(pos-posns[posns.length-1])\n'
  +  'if('+ft('S','t_emitstate')+'){'
  +    'emp=pos'
  +    '}\n'
  +  'if('+ft('S','m_resetpos')+')pos=posns[posns.length-1]\n'
  +  'if('+ft('S','pushpos')+')posns.pop()\n'
  +  'if('+ft('S','m_tossbuf')+')buf=bufs.pop()\n'
  +  'if('+ft('S','m_emitbuf')+'){buf=bufs.pop().concat(buf);'
  +    '}\n'
  +  'if(!bufs.length&&buf.length>64)emit()\n'
  +  (asserts?'assert(M[S>>>'+opts.flagbits+'],\'M\')\n':'')
  +  'S=M[S>>>'+opts.flagbits+']'
  + '}\n' // end if(R)
  + 'else{\n' // rule failed
  +  'if('+ft('S','cache')+')tbl[posns[posns.length-1]][S]=false\n'
  +  'if('+ft('S','pushpos')+')pos=posns.pop()\n'
  +  'if('+ft('S','f_tossbuf')+')buf=bufs.pop()\n'
  +  'if('+ft('S','t_emitstate')+'){emp=emps.pop()}\n'
  +  'if(emp>pos){emp=pos}\n'
  +  asrt('F[S>>>'+opts.flagbits+']','F','\n')
  +  'S=F[S>>>'+opts.flagbits+']'
  + '}\n'
  + 'if(S=='+opts.S_succeed+'){R=true;S=states.pop()}'
  + 'else if(S=='+opts.S_fail+'){R=false;S=states.pop()}'
  + 'else R=undefined'
  + ';'+dbg('res_end')
  + '}' // end has_result loop
  + '}}'
 return (opts.debug?
              ( '/*\n\n'
              + v6_sexp(rules)+'\n\n'
              //+ dir(opts)+'\n\n'
              //+ pp(opts.S_map)+'\n\n'
              //+ pp(opts.prim_test_assignments)+'\n\n'
              + dbg_tree+'\n\n\n\n'
              //+ log.get()+'\n\n'
              + pp(rules,{string_limit:0})+'\n'
              + 'opts.equiv_classes\n' + pp(opts.equiv_classes)+'\n\n'
              //+ 'opts.all_csets\n' + pp(opts.all_csets)+'\n\n'
              + 'opts.cset_cache\n' + pp(opts.cset_cache)+'\n\n'
              + '*/\n\n' ):'')
      + (opts.commonjs?commonjs_begin:'')
      + (opts.trace?v6_legend(opts,rules)+'\n':'')
 
      + opts.fname+'.names='+(opts.commonjs?id_names:nameline)+'\n'
      + 'function '+opts.fname+'(out){'
          +varstmt(vars)+'\n'
          +v6_cset_equiv_array(opts,rules,'equiv')
          +v6_TMF_tables(opts,rules)
          +dfa_table
          +single_call_special_case+'\n'
          +'return '+function_m_x
          +mainloop+'\n'
          +function_emit+'\n'
          +function_fail
          +(asserts?'\n'+function_assert:'')
          +(opts.trace?'\n'+function_dbg:'')
          +'}\n'
      + (opts.commonjs?commonjs_end:'')
 }

function v6_dbg(opts,rules){return function(msg){
  return 'dbg("'+msg+'")'}}

function v6_legend(opts,rules){
 return opts.fname+'.legend="'+v6_sexp(rules).replace(/\n/g,'\\n')+'";'}

function v6_sexp(res){var name,ret=[]
 for(name in res){
  ret.push(name+' ← '+f(res[name].expr))}
 return ret.join('\n')
 function f(expr){var ret=[]
  ret=[expr.id
      ,re_shortnames[expr.type]
      ]
  if(expr.type==0) ret.push(CSET.show(expr.cset).replace(/\n/g,' ').replace(/(.{16}).+/,"$1…"))
  if(expr.type==1) ret.push(expr.strLit)
  if(expr.type==4) ret[1]='rep' // we only have *-rep by this point
  if(expr.type==5) ret.push(expr.ref)
  ret=ret.concat(expr.subexprs.map(f))
  return "("+ret.join(' ')+")"}}

re_shortnames=
['cset'    // 0
,'strLit'  // 1
,'seq'     // 2
,'ordC'    // 3
,'mn_rep'  // 4
,'ref'     // 5
,'neg'     // 6
,'pos'     // 7
,'ϵ'       // 8
]

function v6_dependencies(opts,rules){var ret={},deps
 go('_')(opts.start)
 return ret
 function go(caller){return function _go(rule_name){var rule
   rule=rules[rule_name]
   if(!rule) throw new Error('Rule required but not defined: '+rule_name)
   rule.callers=rule.callers||[]
   if(rule.callers.indexOf(caller)==-1)rule.callers.push(caller)
   rule.drop=opts.drop.indexOf(rule_name)>-1
   rule.elide=opts.elide.indexOf(rule_name)>-1
   if(ret[rule_name])return // it has already been processed
   ret[rule_name]=rule
   rule.direct_deps=v6_direct_dependencies(rule.expr)
   rule.direct_deps.map(go(rule_name))}}}

// Re → [String]
function v6_direct_dependencies(expr){var ret=[]
 v6_walk(function(expr){if(isNamedRef(expr.type))ret.push(expr.ref)})
  (expr)
 return uniq(ret.sort())}

function v6_drop_contexts(opts,rules){var rule_name,rule
 for(rule_name in rules){
  if(rule_name=='_')continue
  rule=rules[rule_name]
  //if('non_drop_ctx' in rule)continue
  if(rule.non_drop_ctx)continue
  v6_non_drop_ctx(rule,opts,rules)}
 return rules}

// non_drop_ctx is set iff a rule is called by a chain of non-dropped parent rules
function v6_non_drop_ctx(rule,opts,rules){var i,l,caller_name
 if(rule.non_drop_ctx=='pending')return // unknown, but cyclic
 if(rule.drop){
  rule.non_drop_ctx=false
  return false}
 rule.non_drop_ctx='pending'
 for(i=0,l=rule.callers.length;i<l;i++){caller_name=rule.callers[i]
  if(caller_name=='_' || v6_non_drop_ctx(rules[caller_name],opts,rules)){
   rule.non_drop_ctx=true
   return true}}
 rule.non_drop_ctx=false
 return false}

function v6_nameline(opts,rules){var names=[],p
 for(p in rules)names[rules[p].S]=rules[p].name
 return '[\''+names.join('\',\'')+'\']'}

function v6_named_res_to_rules(opts,res){var i,l,ret={},name
 for(i=0,l=res.length;i<l;i++){
  name=res[i][0]
  ret[name]={S:i+1
            ,re:res[i][1]
            ,name:name}}
 opts.highest_used_S=i
 return ret}

function v6_add_shadow_start_rule(opts,rules){var shadow_re
 // ShadowStartRule ← StartRule ![^]
 shadow_re=[2,[[5,opts.start],[6,[0,[0]]]]]

 rules._={S:++opts.highest_used_S
         ,name:"_"
         ,re:shadow_re}
 rules._.expr=v6_subexpr_fixups(opts,rules._)
 delete rules._.re
 return rules}

function v6_expr_fixups(opts,rules){var p
 for(p in rules){
  rules[p].expr=v6_subexpr_fixups(opts,rules[p])
  //delete rules[p].re
  }
 return rules}

function v6_subexpr_fixups(opts,rule){var n=0
 if(rule.re[0]!=2) rule.re=[2,[rule.re]]
 return go(rule)(rule.re)
 function go(parent){return function(re){var ret
   if(re[0]==4) re=v6_munge_mnrep(re)
   if(re[0]==1) re=v6_strLit2seq(re)
   ret={id:rule.name+'+'+n++
       ,type:re[0]
       ,S:undefined
       ,T:undefined
       ,M:undefined
       ,F:undefined
       ,flags:undefined}
   if(n==1)ret.toplevel=true
   if(ret.type==0) ret.cset=re[1]
   if(ret.type==1) ret.strLit=re[1]
   if(ret.type==5) ret.ref=re[1]
   ret.flag_n=0
   ret.subexprs=re_subexprs(re).map(go(ret))
   return ret}}}

// replace any m,n-reps with 0,0-reps, sequences, and optionals
function v6_munge_mnrep(re){var m,n,required,optional,i
 m=re[1]
 n=re[2]
 if(m==0&&n==0) return re
 required=[]
 i=m; while(i--) required.push(re[3].slice())
 if(n==0) optional=[4,0,0,re[3]]
 else optional=opt_n(n-m,re[3])
 required.push(optional)
 if(required.length==1)return required[0]
 re=[2,required]
 return re}

function v6_strLit2seq(re){var s=re[1],cset_res=[],i
 if(s.length==0)return [8]
 for(i=0;i<s.length;i++){
  cset_res[i]=[0,CSET.fromInt(s.charCodeAt(i))]}
 if(cset_res.length==1)return cset_res[0]
 return [2,cset_res]}

// n, re → (re (re (re … (re / ϵ) … / ϵ) / ϵ) / ϵ)
function opt_n(n,re){
 if(n==0) return [8]
 assert(n>0)
 if(n==1) return [3,[re,[8]]]
 return [3,[[2,[re,opt_n(n-1,re)]],[8]]]}

function v6_apply_flags(opts,rules){var p,ret={}
 for(p in rules){
  f(rules[p].expr)}
 function f(expr){
  expr.flags=v6_expr_apply_flags(opts,expr)
  expr.subexprs.forEach(f)}}

function v6_expr_apply_flags(opts,expr){var ret={}
 f('cache')
 f('t_bufferout')
 f('pushpos')
 f('t_emitstate')
 f('m_emitstate')
 f('m_emitclose')
 f('m_emitanon')
 ret.m_emitlength=ret.t_emitstate||ret.m_emitstate||ret.m_emitanon
 f('m_resetpos')
 f('m_emitbuf')
 f('m_tossbuf')
 f('f_tossbuf')
 return ret
 function f(s){
  ret[s]=opts[s].indexOf(expr.id)>-1}}

function v6_collect_csets(re){
 switch(re[0]){
 case 0:return [re[1]]
 case 1:return re[1].split('').map(CSET.fromString)
 case 2:
 case 3:return concat(re[1].map(v6_collect_csets))
 case 4:return v6_collect_csets(re[3])
 case 5:throw new Error('named ref not handled.')
 case 6:
 case 7:return v6_collect_csets(re[1])
 case 8:return []}}

function varstmt(vars){
 if(!vars.length) return ''
 return 'var '+vars.join(',')+';'}

function isCset(n){return n==0}
function isStrLit(n){return n==1}
function isSequence(n){return n==2}
function isOrdC(n){return n==3}
function isRep(n){return n==4}
function isNamedRef(n){return n==5}
function isPositiveLookahead(n){return n==7}
function isLookahead(n){return n==6||n==7}
function isEmpty(n){return n==8}

/*
0 → cset
1 → string literal
2 → sequence of res
3 → ordC of res
4 → m to n reps of re
5 → named reference
6 → re negative lookahead
7 → re positive lookahead
8 → ϵ (equivalent to [1,""])
*/

// re_subexprs :: Re → [Re]
function re_subexprs(re){switch(re[0]){
 case 0:return []
 case 1:return []
 case 2:return re[1]
 case 3:return re[1]
 case 4:return [re[3]]
 case 5:return []
 case 6:return [re[1]]
 case 7:return [re[1]]
 case 8:return []}
 throw new Error(pp(re))}

function v6_assign_ids(opts,rules){var name,rule,last_id,bitfield_order,a
 last_id=rules._.S
 for(name in rules){rule=rules[name]
  go(rule.expr)}
 // we can re-use all the flag bits for primitive tests and other special states that don't have flags
 opts.S_succeed=++last_id
 opts.S_fail=++last_id
 opts.S_ε=++last_id
 opts.lowest_prim_test=opts.S_ε
 opts.highest_used_S=last_id
 return rules
 function go(expr){
  if(!bitfield_order){
   bitfield_order=v6_bitfield_order(expr.flags)
   opts.flagbits=bitfield_order[0]
   opts.bitfield_map=bitfield_order[1]}
  //expr.foo=bitfield_order
  if(expr.S==undefined){
   if(expr.toplevel) expr.S=rule.S
   else expr.S=++last_id
   opts.S_map[expr.S]=expr.id}
  expr.flag_n=v6_obj_to_bitfield(expr.flags,opts.bitfield_map)
  expr.S_flags=expr.S<<opts.flagbits^expr.flag_n
  //expr.S_flags_=expr.S_flags.toString(2)
  expr.subexprs.forEach(go)}}

function v6_bitfield_order(o){var p,i=0,ret={}
 for(p in o) ret[p]=1<<i++
 return [i,ret]}

function v6_obj_to_bitfield(flags,bitfield_order){var p,n=0
 for(p in flags){
  if(flags[p]) n^=bitfield_order[p]}
 return n}

function v6_flag_test(opts){return function(varname,flagname){
  return varname+'&'+opts.bitfield_map[flagname]+'/*'+flagname+'*/'}}

function v6_TMF(opts,rules){var name,rule
 for(name in rules){rule=rules[name]
  go()(rule.expr)}
 return rules
 function go(parent){return function(expr,i,a){var next
   switch(expr.type){
    case 0:expr.T=v6_assign_prim_test_id(opts,expr.cset);break
    case 5:expr.T=rules[expr.ref].expr.S_flags;break
    case 4:
    case 6:
    case 7:assert(expr.subexprs.length==1,'subexpr length')
           // fallthrough //
    case 2:
    case 3:expr.T=expr.subexprs[0].S_flags;break
    case 8:expr.T=opts.S_ε;break
    default:throw new Error('bad expr.type '+expr.type)}
   if(expr.toplevel){
    expr.M=opts.S_succeed
    expr.F=opts.S_fail}
   else{
    next=a[i+1] // next sibling expr if any
    switch(parent.type){
     case 2:expr.M=next?next.S_flags:opts.S_succeed
            expr.F=opts.S_fail;break
     case 3:expr.M=opts.S_succeed
            expr.F=next?next.S_flags:opts.S_fail;break
     case 4:assert(!next,'*-expr is singleton')
            expr.M=expr.S_flags
            expr.F=opts.S_succeed;break
     case 6:assert(!next,'lookahead is singleton')
            expr.M=opts.S_fail
            expr.F=opts.S_succeed;break
     case 7:assert(!next,'lookahead is singleton')
            expr.M=opts.S_succeed
            expr.F=opts.S_fail;break
     default:throw new Error('unexpected parent type '+parent.type)}}
   if(expr.dfa){
    opts.dfa_table[expr.S]=expr.dfa
    expr.T=undefined
    return} // no TMF entries for subexpressions when using a DFA
   expr.subexprs.forEach(go(expr))}}}

function v6_assign_prim_test_id(opts,cset){var string_representation,x
 opts.prim_test_assignments=opts.prim_test_assignments||{}
 opts.prim_test_reverse=opts.prim_test_reverse||{}
 string_representation=cset.toString()
 x=opts.prim_test_assignments[string_representation]
 if(x)return x
 x=++opts.highest_used_S
 if(!opts.lowest_prim_test)opts.lowest_prim_test=x
 opts.highest_prim_test=x
 opts.prim_test_assignments[string_representation]=x
 opts.prim_test_reverse[x]=cset
 return x}

function v6_is_prim_test(opts){return function(varname){
  return varname+'<'+(opts.highest_prim_test+1)
    +'&&'+varname+'>'+(opts.lowest_prim_test-1)}}

function v6_is_not_prim_test(opts){return function(id_S){
  return id_S+'>'+(opts.highest_prim_test)
   +'||'+id_S+'<'+(opts.lowest_prim_test)}}

function v6_prim_test_case_statements_BMP(opts){return function(id_c,id_R){var ret=[],p,cset,BMP_no_surrogates,surrogates
  surrogates=CSET.fromIntRange(0xD800,0xDFFF)
  BMP_no_surrogates=CSET.difference(CSET.fromIntRange(0,0xFFFF),surrogates)
  for(p in opts.prim_test_reverse){
   cset=CSET.intersection(opts.prim_test_reverse[p],BMP_no_surrogates)
   ret.push(v6_cset_to_case_stmt(opts)(id_c,id_R,p,cset))}
  return ret.join('\n')}}

function v6_prim_test_case_statements_supplementary(opts){return function(id_c,id_R){var ret=[],p,cset,supplementary
  supplementary=CSET.fromIntRange(0x10000,0x10FFFF)
  for(p in opts.prim_test_reverse){
   cset=CSET.intersection(opts.prim_test_reverse[p],supplementary)
   if(CSET.empty(cset))continue
   else ret.push(v6_cset_to_case_stmt(opts)(id_c,id_R,p,cset))}
  return ret.join('\n')}}

function v6_cset_to_case_stmt(opts){return function(id_c,id_R,_case,cset){
  return 'case '+_case+':'+id_R+'='+cset_to_expr(cset,id_c)+';break'}}

function v6_ε_ifstmt(opts){return function(id_S,id_R){
  return 'if('+id_S+'=='+opts.S_ε+')'+id_R+'=true'}}

function v6_TMF_tables(opts,rules){var T=[],M=[],F=[],name
 for(name in rules){
  v6_walk(f)(rules[name].expr)}
 return 'T='+v6_rle_if_shorter(T)+'\n'
      + 'M='+v6_rle_if_shorter(M)+'\n'
      + 'F='+v6_rle_if_shorter(F)+'\n'
 function f(expr){
  assert(expr.S_flags>>>opts.flagbits === expr.S,'S vs S_flags')
  T[expr.S]=expr.T
  M[expr.S]=expr.M
  F[expr.S]=expr.F}}

function v6_walk(f){return function walk(expr){
  f(expr)
  expr.subexprs.map(walk)}}