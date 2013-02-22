function checkTrace(msgs){var i,l,m
 ,msg,S,pos,R,stack,posns,bufs,buf // regex captures
 ,calls=[],callstack=[],call,notes=[],prev_state,parser_is_resuming
 for(i=0,l=msgs.length;i<l;i++){
  if(m=/^(\w+)\s+S:(\S+) pos:(\d+) R:(\S+) stack:((?:,?\d+)*) posns:(\S*) bufs:(\S*) buf:(.*)/.exec(msgs[i])){
   msg=m[1],S=m[2],pos=m[3],R=m[4],stack=m[5],posns=m[6],bufs=m[7],buf=m[8]


   if(msg=='main'){
    if(parser_is_resuming){
         calls.push({resuming:true})}
    else{
         call={depth:callstack.length,expr:S,start:pos,main_stack:stack
              ,main_posns:posns,main_bufs:bufs}
         calls.push(call)
         callstack.push(call)}}


   if(msg=='test'){
        if(parser_is_resuming){
         if(!equal_states(msgs[i],prev_state)){
          calls.push({error:'parser resumed in a different state'
                            +msgs[i]+' '+prev_state})}}
        prev_state=msgs[i]
        if(!call){calls.push({error:'test without main'});continue}
        call.test_posns=posns
        call.test_bufs=bufs
        parser_is_resuming=false}}


   if(msg=='result'){
        call=callstack.pop()
        if(!call){/*calls.push({error:'empty stack'});*/continue}
        call.result=R
        call.end=pos
        //if(S != call.expr) call.expr = 'XXX:' + call.expr + '!=' + S
        call.result_stack=stack
        call.result_posns=posns
        call.result_bufs=bufs}


   if(msg=='res_end'){
        call=callstack[callstack.length-1]
        if(!call){calls.push({error:'empty stack'});continue}
        call.res_end_bufs=bufs}


  if(m=/^ready/.exec(msgs[i])){
   // after requesting a chunk a parser should resume in the same state
   parser_is_resuming=true}}
 return calls.map(show).join('\n')
 function equal_states(a,b){
  return a.replace(/ . R/,'  R')
          .replace(/dp:\S*/,'')
      == b.replace(/dp:\S*/,'')}
 function show(call){var indent
  if(call.error)return 'ERROR: '+call.error
  if(call.resuming)return '────────┤chunk├────────'
  indent=Array(call.depth+1).join(' ').replace(/.../g,'  ↓')
  if(call.result==undefined)return indent + call.expr + ' [?]'
  return indent
       + call.expr
       + ' '+call.start+'→'+call.end+''
       + ' '+(call.stack_before==call.stack_after?''
               :'XXX:changed stack '+call.stack_before+'→'+call.stack_after)
       + (call.test_posns? // won't exist if it was cached
          (call.test_posns==call.result_posns?'':' XXX: changed position stack')
          :'')
       + (call.test_bufs?
          (call.test_bufs==call.result_bufs?'':' XXX: changed bufs stack')
          :'')
       + (call.result=='false'?' [x]':'')}}

function explain(grammar,opts,input,verbosity){var either_error_parser,parser,trace,streaming_parser,tree,e,result,fail,fail_msg
 // generate a parser
 opts=extend({},opts)
 opts.fname='trace_test'
 opts.trace=true
 if(verbosity>2) opts.debug=true // if code will be shown, generate the big top comment
 //opts.asserts=true
 //if(verbosity>1) opts.show_trace=true
 //if(verbosity>2) opts.show_code=true
 either_error_parser=memoized(grammar)
 if(!either_error_parser[0])return'Cannot generate parser: '+either_error_parser[1]
 try{parser=eval(either_error_parser[1]+'\n;'+opts.fname)}
 catch(e){return 'The parser did not eval() cleanly (shouldn\'t happen): '+e.toString()}

 // parse the input
 trace=[],tree=[]
 streaming_parser=parser(message_handler)
 function message_handler(m,x,y,z){
  spaces='                '.slice(m.length)
  trace.push(m+spaces+x+(y?' '+y:''))
  if(m=='tree segment')tree=tree.concat(x)
  if(m=='fail')fail=[m,x,y,z]}
 try{
  streaming_parser('chunk',input)
  streaming_parser('eof')}
 catch(except){e=except}
 if(fail){try{fail_msg=showError.apply(null,fail)}catch(e){}}
 result=e?'The parser threw an exception:'+'\n\n'+(e.stack?e+'\n\n'+e.stack:e)
         :fail?'Parse failed: '+fail_msg
              :'Parser consumed the input.'
 // explain the result
 return [input
        ,'input length '+input.length
        ,'result: '+result
        ,'tree:\n'+showTree([true,{tree:tree,input:input,names:parser.names}])
        ,'trace analysis:\n'+checkTrace(trace)
        ,'legend:\n'+parser.legend
        ,verbosity>1?'trace:\n'+trace.join('\n'):''
        ,verbosity>2?'parser code:\n'+either_error_parser[1]:''
        ,verbosity>3?'raw tree:\n'+tree.join():''
        ].filter(function(x){return x!=''})
         .join('\n\n')

 // helpers
 function memoized(grammar){var cache,cached
  cache = explain.cache = explain.cache || {}
  cached = cache[grammar]
  if(!cached || !deepEq(cached[0],opts)) cached = cache[grammar] = [opts,generateParserAlt(grammar,opts)]
  return cached[1]}
 function extend(a,b){for(var p in b)a[p]=b[p];return a}
 function deepEq(x,y){var p
  if(x===y)return true
  if(typeof x!='object' || typeof y!='object')return false
  for(p in x)if(!deepEq(x[p],y[p]))return false
  for(p in y)if(!(p in x))return false
  return true}}
