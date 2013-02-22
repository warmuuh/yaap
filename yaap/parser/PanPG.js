/* PanPG 0.0.11pre
 * PEG → JavaScript parser generator, with its dependencies.
 * built on Sun, 11 Sep 2011 01:31:17 GMT
 * See http://boshi.inimino.org/3box/PanPG/about.html
 * MIT Licensed
 */

;(function(exports){

function generateParser(peg,opts,_opts){var x
 x=generateParserAlt(peg,opts,_opts)
 if(!x[0])throw x[1]
 return x[1]}

function generateParserAlt(peg,opts,_opts){var parse_result,named_res,i,l,patch,pr,nr
 opts=opts||{}
 if(peg instanceof Array){
  opts.patches=peg.slice(1)
  peg=peg[0]}
 parse_result=parsePEG(peg)
 if(!parse_result[0])return [0,new Error(showError(parse_result))]
 named_res=v6_named_res(parse_result)
 if(opts.patches)
  for(i=0,l=opts.patches.length;i<l;i++){patch=opts.patches[i]
   pr=parsePEG(patch)
   if(!pr[0])return pr
   nr=v6_named_res(pr)
   named_res=apply_patch(named_res,nr)}
 try{return [1,codegen_v6(opts,named_res,_opts)]}
 catch(e){return [0,e]}
 function apply_patch(nr1,nr2){var o={},i,l,name,rule,ret=[]
  for(i=0,l=nr1.length;i<l;i++){
   name=nr1[i][0]
   ret[i]=nr1[i]
   o[name]=i}
  for(i=0,l=nr2.length;i<l;i++){
   name=nr2[i][0]
   // if it was already there, replace it
   if(o.hasOwnProperty(name)) ret[o[name]]=nr2[i]
   // otherwise add it at the end
   else ret.push(nr2[i])}
  return ret}}

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

function explain(grammar,opts,input,verbosity){var either_error_parser,parser,trace,streaming_parser,tree,e,result,fail,fail_msg,code
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
 code='(function(){\n'+either_error_parser[1]+'\n;'
     +'return '+opts.fname+'})()'
 try{parser=eval(code)}
 catch(e){return 'The parser did not eval() cleanly (shouldn\'t happen): '+e.toString()+'\n\n'+code}

 // parse the input
 trace=[],tree=[]
 streaming_parser=parser(message_handler)
 function message_handler(m,x,y,z){var spaces
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

// (event array (can be partial), [name array], [input string], [state]) → [ascii-art tree, state]
// -or-
// (complete event array, [name array], [input string]) → ascii-art
// if the event array doesn't describe a complete, finished tree, or if the state value argument is provided, then the ascii-art and the state value will be returned as an array
// this is for examining partial tree fragments as they are generated by a streaming parser

function showTree(res,opts,state){var names,str,a,i,l,indent,name,x,y,out=[],output_positions=[],node,out_pos,state_was_passed
 if(!res[0])return showError(res)
 res=res[1]
 names=res.names
 a=res.tree
 str=res.input
 opts=opts||{}
 opts.elide=opts.elide||['anonymous']
 opts.drop=opts.drop||[]
 state_was_passed=!!state
 state=state||{stack:[],indent:'',pos:0,drop_depth:0}
 for(i=0,l=a.length;i<l;i++){x=a[i]
  if(x>0){
   if(names){
    name=names[x]
    if(!name) return err('no such rule index in name array: '+x)}
   else name=''+x
   output_positions[state.stack.length]=out.length
   node={index:x,name:name,start:state.pos}
   if(opts.drop.indexOf(name)>-1)state.drop_depth++
   out.push(show(state,node))
   state.indent+=' '
   state.stack.push(node)}
  else if(x==-1){
   i++
   if(i==l){i--;return}
   node={name:'anonymous',start:state.pos,end:state.pos+a[i]}
   state.pos=node.end
   out.push(show(state,node))
   }
  else if(x==-2){
   i++
   if(i==l)return err('incomplete close event, expected length at position '+i+' but found end of input array')
   y=state.stack.pop()
   state.pos=y.end=y.start+a[i]
   out_pos=output_positions[state.stack.length]
   state.indent=state.indent.slice(0,-1)
   if(out_pos!=undefined){
    out[out_pos]=show(state,y)}
   if(opts.drop.indexOf(y.name)>-1)state.drop_depth--}
  else return err('invalid event '+x+' at position '+i)}
 if(state_was_passed || state.stack.length) return [out.join(''),state]
 else return out.join('')
 function err(s){return ['showTree: '+s]}
 function show(state,node){var text='',main,indent,l
  if(opts.elide.indexOf(node.name)>-1)return ''
  if(state.drop_depth)return ''
  if(node.end!=undefined && str){
   text=show_str(str.slice(node.start,node.end))}
  main=state.indent+node.name+' '+node.start+'-'+(node.end==undefined?'?':node.end)
  l=main.length
  indent=Array(32*Math.ceil((l+2)/32)-l).join(' ')
  return main+indent+text+'\n'}
 function show_str(s){
  return '»'+s.replace(/\n/g,'\\n').replace(/\r/g,'\\r').replace(/(.{16}).{8,}/,"$1…")+'«'}}

// inspired by: http://gist.github.com/312863
function showError(res){var line_number,col,lines,line,start,end,prefix,suffix,arrow,pos,msg,str
 pos=res[1];msg=res[2];str=res[3]
 msg=msg||'Parse error'
 if(str==undefined)return msg+' at position '+pos
 prefix=str.slice(0,pos)
 suffix=str.slice(pos)
 line_number=prefix.split('\n').length
 start=prefix.lastIndexOf('\n')+1
 end=suffix.indexOf('\n')
 if(end==-1) end=str.length
 else end=prefix.length+end
 line=str.slice(start,end)
 line=line.replace(/\t/g,' ')
 col=pos-start
 arrow=Array(col).join('-')+'^'
 return msg+' at line '+line_number+' column '+col+'\n'+line+'\n'+arrow}

function showResult(r,opts){
 if(typeof r!='object' || !("0" in r)) throw new Error("showResult: argument is not a parser result object")
 if(r[0])return showTree(r,opts)
 return showError(r)}

function treeWalker(dict,result){var p,any,anon,other,fail,except,index,cb=[],stack=[],frame,pos=0,i,l,x,retval,names,events,begin=[],match,target,msg
 fail=dict.fail
 except=dict.exception
 if(!result[0]){
  msg='parse failed: '+result[1]+' '+(result[2]||'')
  if(fail)return fail(result)||msg
  return err(msg)}
 result=result[1]
 names=result.names
 events=result.tree
 for(p in dict) if(dict.hasOwnProperty(p)){
  if(p=='any'){any=dict[p];throw new Error('unimplemented, use `other` instead')}
  if(p=='anonymous'||p=='anon'){anon=dict[p];continue}
  if(p=='other'){other=dict[p];continue}
  if(p=='fail'){fail=dict[p];continue}
  if(p=='exception'){except=dict[p];continue}
  if(p=='warn'){continue}
  target=cb
  if(match=/(.*) start/.exec(p)){p=m[1];target=begin}
  index=names.indexOf(p)
  if(index==-1)return err('rule not found in rule names: '+p)
  target[index]=dict[p]}
 frame={cn:[]}
 for(i=0,l=events.length;i<l;i++){x=events[i]
  if(x>0){ // named rule start
   stack.push(frame)
   frame={index:x,start:pos}
   if(begin[x]){
    try{retval=begin[x](pos)}
    // here we call err() but continue iff `except` returns true
    catch(e){if(!err('exception in '+names[x]+' start:'+e))return}}
   if(cb[x]||any||other) frame.cn=[]}
  else if(x==-1){ // anonymous node
   i++
   if(i==l)return err('incomplete anonymous node')
   if(anon)anon(m(pos,pos+events[i]))
   pos+=events[i]}
  else if(x==-2){ // node close
   i++
   if(i==l)return err('incomplete rule close')
   pos=frame.start+events[i]
   x=frame.index
   match=m(frame.start,pos)
   try{
    if(cb[x])     retval=cb[x](match,frame.cn)
    else if(other)retval=cb[x](match,frame.cn,names[x])}
   catch(e){return err('exception in '+names[x]+': '+e+' (on node at char '+match.start+'-'+match.end+')')}
   frame=stack.pop() // the parent node
   if(cb[x] && retval!==undefined)
    if(frame.cn)frame.cn.push(retval)
    else warn('ignored return value of '+names[x]+' in '+names[frame.index])}
  else return err('invalid event stream (saw '+x+' at position '+i+')')}
 if(frame.cn)return frame.cn[0]
 function m(s,e){
  return {start:s
         ,end:e
         ,text:function(){return result.input.slice(s,e)}}}
 function err(s){
  if(except)return except(s)
  throw new Error('treeWalker: '+s)}
 function warn(s){
  if(dict.warn)dict.warn(s)}}


 /* parsePEG.js */ 

parsePEG.names=['','RuleSet','Comment','Rule','PropSpec','UPlusCodePoint','PositiveSpec','NegativeSpec','CodePoint','CodePointLit','CodePointFrom','CodePointTo','CodePointRange','UnicodePropSpec','CodePointExpr','CharSetUnion','HEXDIG','CharSetDifference','CharEscape','CharSetExpr','StrLit','CharSet','PosCharSet','NegCharSet','Epsilon','AtomicExpr','ParenthExpr','Replicand','N','M','Optional','MNRep','PosRep','AnyRep','SeqUnit','Sequence','IdentChar','IdentStartChar','OrdChoice','S','SpaceAtom','LB','NonTerminal','PosLookahead','NegLookahead','_']
function parsePEG(out){var eof=false,s='',l=0,S=184320,T,M,F,D,R,tbl=[],x,pos=0,offset=0,buf=[],bufs=[],states=[],posns=[],c,equiv,ds,dp,failed=0,emp=0,emps=[];
equiv=rle_dec([10,0,1,1,2,0,1,2,18,0,1,3,1,4,1,5,3,0,1,6,1,0,1,7,1,8,1,9,1,10,1,11,1,12,1,0,1,13,10,14,1,15,1,16,1,17,2,0,1,18,1,0,6,19,14,20,1,21,5,20,1,22,1,23,1,24,1,25,1,26,1,0,2,26,1,27,1,26,1,28,1,29,7,26,1,29,1,26,1,30,1,26,1,29,1,26,1,31,1,26,1,29,1,26,1,32,2,26,1,33,1,0,1,34,34,0,1,35,852,0,1,36,4746,0,1,35,397,0,1,35,2033,0,11,35,36,0,1,35,47,0,1,35,304,0,1,37,129,0,1,38,3565,0,1,35,43007,0,2048,39,8192,0])
function rle_dec(a){var r=[],i,l,n,x,ll;for(i=0,l=a.length;i<l;i+=2){n=a[i];x=a[i+1];r.length=ll=r.length+n;for(;n;n--)r[ll-n]=x}return r}
T=[,188416,266240,299008,949254,818182,965638,916486,765952,780806,892928,897024,880640,901120,749568,720896,,659456,1052672,643072,1028096,589824,991232,605190,,569344,1114112,557056,1171456,1163264,1187840,1126400,1204224,548864,512000,465926,,,356352,429062,442368,278528,335872,1196032,1179648,1212416,195590,196608,200704,171015,208896,11439,15535,224262,228358,229376,171015,237568,171015,245760,11439,15535,258048,171015,301,,274432,,285702,,,,,175279,162823,311296,,,,,162823,158895,154631,344064,150535,,,360448,162823,301,146607,376832,162823,301,392198,393216,,401408,162823,301,146607,417792,162823,301,430080,166919,438272,166919,446464,,454656,171015,,470022,471040,142511,479232,162823,301,494598,495616,142511,503808,162823,301,516096,138415,134319,130223,126127,109743,179375,183471,105647,113839,,561152,109743,105647,573440,101551,89263,175279,85167,593920,97455,93359,,,,618496,162823,301,630784,81071,301,,72879,651264,162823,301,64687,670726,671744,162823,679936,,,,,,,,,162823,64687,60591,732166,733184,737280,162823,301,60591,753664,56495,52399,36015,770048,23727,40111,785414,,,,,,,,,,,,831488,68615,68615,68615,68615,855046,856064,68615,864256,68615,301,301,,44207,,48303,36015,36015,905216,27823,31919,,,,,19631,,,,950272,,958464,,,,,19631,,,,,999424,162823,301,1011712,81071,301,,,,1036288,1040384,76975,,,1059846,1060864,,1069056,68615,68615,68615,68615,301,,,,,,,,158895,,113839,,122031,1145862,1146880,,117935,301,,1167360,,1175552,,,142511,113839,,,142511,113839,,7343,1220608,]
M=rle_dec([1,,47,299,1,204800,1,200704,1,217088,2,299,1,253952,1,224262,1,241664,1,233472,1,299,1,237568,4,299,1,258048,1,299,1,270336,1,299,1,274432,2,299,2,,1,299,1,303104,1,307200,1,327680,2,299,2,,1,331776,1,299,1,339968,1,299,1,344064,2,,1,368640,2,299,1,372736,1,385024,3,299,1,392198,1,397312,1,409600,2,299,1,413696,4,299,1,434176,1,299,1,438272,3,299,1,458752,2,299,1,487424,1,475136,4,299,1,494598,1,499712,12,299,1,552960,12,299,1,614400,2,,1,626688,2,299,1,638976,3,299,1,647168,3,299,1,663552,1,299,1,670726,1,675840,1,712704,2,299,6,,1,716800,1,299,1,724992,1,299,1,732166,1,745472,10,299,1,811008,1,300,6,,1,299,1,830470,2,,1,299,1,835584,1,839680,1,843776,1,847872,2,299,1,860160,4,299,1,,1,884736,1,888832,6,299,1,929792,3,,1,936966,1,299,2,,1,299,1,954368,1,299,1,958464,1,974848,2,,1,982022,1,299,2,,1,995328,1,1007616,2,299,1,1019904,3,299,1,,1,1032192,1,1048576,1,1036288,5,299,1,1068038,1,299,1,1073152,1,1077248,1,1081344,1,1085440,2,299,2,,1,299,2,,1,1118208,1,1122304,1,299,1,1130496,1,1134592,1,1138688,1,1159168,1,299,1,1150976,4,299,1,1167360,1,299,1,1175552,1,1183744,1,299,1,1191936,1,299,1,1200128,1,299,1,1208320,1,299,1,1216512,1,299,1,300])
F=rle_dec([1,,46,300,1,262144,1,300,1,299,1,300,1,212992,2,300,1,299,3,300,1,299,1,300,1,249856,2,300,1,299,3,300,1,299,1,300,1,294912,2,,4,300,1,318470,1,300,2,,4,300,1,299,2,,1,300,1,364544,3,300,1,380928,2,300,1,299,2,300,1,405504,3,300,1,421888,4,300,1,299,1,300,1,453638,7,300,1,483328,2,300,1,299,2,300,1,507904,2,300,1,520192,1,524288,1,528384,1,532480,1,536576,1,540672,1,544768,4,300,1,565248,2,300,1,577536,1,581632,1,585728,2,300,1,598016,2,300,2,,1,300,1,622592,2,300,1,634880,4,300,1,655360,3,300,1,299,2,300,1,687110,1,300,6,,4,300,1,299,1,300,1,741376,3,300,1,757760,1,761856,2,300,1,774144,2,300,1,299,6,,2,300,2,,6,300,1,872448,2,300,1,868352,2,300,1,,6,300,1,909312,2,300,3,,2,300,2,,3,300,1,299,1,300,2,,2,300,2,,2,300,1,1003520,2,300,1,1015808,2,300,1,,2,300,1,299,1,1044480,3,300,1,1092614,7,300,1,1104902,2,,1,300,2,,7,300,1,1155072,5,300,1,299,1,300,1,299,10,300,1,299])
D=function(a,i,l,b){for(i=0,l=a.length,b=[];i<l;i++)b[i]=a[i]&&revive(a[i]);return b}([,,,,,,,,,,,,,,,,[[[[14,19]]]],,,,,,,,[[[[36]]]],,,,,,,,,,,,[[[[14,19,20,21,26,27,28,29,30,31,32]]]],[[[[19,20,21]]]],,,,,,,,,,,,,,,,,,,,,,,,,,,,[[[[16]]]],,[[[[0,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38]]]],,[[[[2]]],[[[1]]]],,,[[[[1,2]]]],,,,[[[[37]]]],[[[[17]]],[[[12]]]],,,,,,,,,,,,,,,,,,,[[[[13]]]],,,,,,,,,,,,,[[[[3]]]],,,[[[[3]]]],,,,,,,,,,,,,,,,,,,,,,,[[[[9]]]],,,,,,,,,,,,[[[[22]]],[[[25]]]],,,,,,,,,[[[[24]]]],,,,,,,,,,[[[[38]]]],[[[[28]]],[[[32]]],[[[27]]],[[[28]]],[[[30]]],[[[31]]]],,,,,,,,,,,,,,,,,,,,,,,,[[[[28]]],[[[32]]],[[[27]]],[[[28]]],[[[30]]],[[[31]]]],,,,,,,[[[[0,1,2,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,25,26,27,28,29,30,31,32,33,34,36,37]]]],[[[[21]]],[[[10]]]],,,,,,,,,,,,,,,,,[[[[12]]]],,,,,,,[[[[22]]],[[[15]]],[[[25]]]],,,,,[[[[15]]],[[[24]]]],,,,[[[[3,12,19,20,21,26,27,28,29,30,31,32]]]],,[[[[3,12,19,20,21,26,27,28,29,30,31,32]]]],[[[[22]]],[[[15]]]],,,,[[[[15]]],[[[24]]]],,,[[[[22]]]],,,,,,,[[[[24]]]],,[[[[5]]]],,,,[[[[0,1,2,3,4,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38]]]],[[[[5]]]],,,[[[[23]]]],,,,,,,[[[[23]]],[[[29,31]]]],,,[[[[23]]],[[[5]]]],,,[[[[7]]]],,[[[[8]]]],,[[[[33]]]],,,,[[[[11]]]],,,[[[[34]]]],,[[[[14]]]],,[[[[14]]]],[[[[4]]]],,,[[[[18]]]],[[[[6]]]],,,[[[[10]]]],,,[[[[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38]]]]])
function revive(x){var i,l,state,j,l2,all=[],t,ts;if(!x)return;for(i=0,l=x.length;i<l;i++){state=x[i];ts=[];for(j=0,l2=state.length;j<l2;j++){t=state[j];if(t[1]==l) ts.push([t[0],true]);else ts.push([t[0],t[1]==undefined?i+1:t[1]])}all.push(ts)}return dfa(all)
 function dfa(ss){var i,l_ss,st,l_s,t,l_t,a,d=[],j,k,l;for(i=0,l_ss=ss.length;i<l_ss;i++){st=ss[i];a=[];for(j=0,l_s=st.length;j<l_s;j++){t=st[j];for(k=0,l_t=t[0].length;k<l_t;k++){a[t[0][k]]=t[1]===true?l_ss:t[1]}}for(j=0,l=a.length;j<l;j++)if(a[j]==undefined)a[j]=l_ss+1;d[i]=a}
  return function _dfa(st,i){var eq,pr;while(st<l_ss){eq=equiv[s.charCodeAt(i++)];st=d[pr=st][eq]}if(eq==undefined&&i>=s.length){ds=pr;dp=i-1;return}ds=0;dp=undefined;if(st==l_ss){pos=i;return true}return false}}}
if(typeof out=='string'){s=out;out=[];x=parsePEG(function(m,x,y){if(m=='fail')out=[false,x,y,s];if(m=='tree segment')out=out.concat(x)});x('chunk',s);x('eof');return out[0]===false?out:[true,{names:parsePEG.names,tree:out,input:s}]}
return function(m,x){if(failed){out('fail',pos,'parse already failed');return}
switch(m){
case 'chunk':s+=x;l=s.length;while(tbl.length<l+1)tbl.push([]);mainloop();break
case 'eof':eof=true;mainloop();break
default:throw new Error('unhandled message: '+m)}}
//mainloop
function mainloop(){for(;;){
if(dp==undefined&&(S>328||S<301))
t_block:{
if(S&4/*pushpos*/)posns.push(pos)
if(S&2/*t_bufferout*/){bufs.push(buf);buf=[]}
if(S&8/*t_emitstate*/){emps.push(emp);emp=pos;buf.push(S>>>12)}
if(S&1/*cache*/&&(x=tbl[pos-offset][S])!=undefined){if(x){R=true;pos=x[0];buf=x[1];if(emp<x[2])emp=x[2]}else{R=false}}
}
if(R==undefined){
if(D[S>>>12]){R=D[S>>>12](ds||0,dp||pos);if(R==undefined){if(eof){ds=dp=undefined;R=false}else{out('ready');return}}}
else{states.push(S);S=T[S>>>12]}
if(S==301){R=true;S=states.pop()}}
while(R!=undefined){
if(S==184320){(R?emit:fail)();return}if(R){
if(S&1/*cache*/){tbl[posns[posns.length-1]][S]=[pos,buf,emp];buf=buf.slice()}
if(S&8/*t_emitstate*/){if(pos!=emp&&emp!=posns[posns.length-1]){buf.push(-1,pos-emp)}emp=emps.pop();if(emp!=posns[posns.length-1]){buf=[-1,posns[posns.length-1]-emp].concat(buf)}}
if(S&16/*m_emitstate*/)buf.push(S>>>12)
if(S&32/*m_emitclose*/)buf.push(-2)
if(S&128/*m_emitlength*/)buf.push(pos-posns[posns.length-1])
if(S&8/*t_emitstate*/){emp=pos}
if(S&256/*m_resetpos*/)pos=posns[posns.length-1]
if(S&4/*pushpos*/)posns.pop()
if(S&512/*m_tossbuf*/)buf=bufs.pop()
if(S&1024/*m_emitbuf*/){buf=bufs.pop().concat(buf);}
if(!bufs.length&&buf.length>64)emit()
S=M[S>>>12]}
else{
if(S&1/*cache*/)tbl[posns[posns.length-1]][S]=false
if(S&4/*pushpos*/)pos=posns.pop()
if(S&2048/*f_tossbuf*/)buf=bufs.pop()
if(S&8/*t_emitstate*/){emp=emps.pop()}
if(emp>pos){emp=pos}
S=F[S>>>12]}
if(S==299){R=true;S=states.pop()}else if(S==300){R=false;S=states.pop()}else R=undefined;}}}
function emit(){var x=bufs.length?bufs[0]:buf;if(x.length){out('tree segment',x);if(bufs.length)bufs[0]=[];else buf=[]}}
function fail(s){out('fail',pos,s);failed=1}}


/* re.js */

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



/* lists.js */

function foldl1(f,a){var x,i,l
 x=a[0]
 for(i=1,l=a.length;i<l;i++)x=f(x,a[i])
 return x}

function foldl(f,a,x){var i,l
 for(i=0,l=a.length;i<l;i++)x=f(x,a[i])
 return x}

// [[a]] → [a]
function concat(as){var i,l,a=[]
 for(i=0,l=as.length;i<l;i++)
  a.push.apply(a,as[i])
 return a}

function uniq(a){
 return a.filter(function(e,i,a){return !i||e!==a[i-1]})}

function max(a){
 return foldl(f,a,-Infinity)
 function f(a,b){return Math.max(a,b)}}

function min(a){
 return foldl(f,a,Infinity)
 function f(a,b){return Math.min(a,b)}}

function sum(a){
 return foldl(f,a,0)
 function f(a,b){return a+b}}

function product(a){
 return foldl(f,a,1)
 function f(a,b){return a*b}}

// String → Object → a
function access(prop){return function(o){return o[prop]}}

/* [[name,value]] → Object */
function objectFromList(a){var o={}
 a.forEach(function(e){
  o[e[0]]=e[1]})
 return o}

/* [a], [b] → [[a,b]] */
function zip(a,b){var r=[],i,l
 l=Math.min(a.length,b.length)
 for(i=0;i<l;i++) r.push([a[i],b[i]])
 return r}

/* [a] → a */
function last(a){return a[a.length-1]}

function fst(a){return a[0]}
function snd(a){return a[1]}

/* assert.js */

function assert(x,msg){if(!x)throw new Error('assertion failed'+(msg?': '+msg:''))}

/* CSET */

if(!Array.prototype.forEach)
 Array.prototype.forEach=function(f){var i,l=this.length>>>0,thisp=arguments[1]
  for(i=0;i<l;i++)
   if(i in this)
    f.call(thisp,this[i],i,this)}
if(!Array.prototype.filter)
 Array.prototype.filter=function(f){var i,l=this.length>>>0,res=[],thisp=arguments[1],v
  for(i=0;i<l;i++){
   v=this[i]
   if(i in this&&f.call(thisp,v,i,this))res.push(v)}
  return res}
;(function(exports){
cUC=
{Cc:[0,0x20,0x7F,0xA0]
,Zs:[0x20,0x21,0xA0,0xA1,0x1680,0x1681,0x180E,0x180F,0x2000,0x200B,0x202F,0x2030,0x205F,0x2060,0x3000,0x3001]
,Po:[0x21,0x24,0x25,0x28,0x2A,0x2B,0x2C,0x2D,0x2E,0x30,0x3A,0x3C,0x3F,0x41,0x5C,0x5D,0xA1,0xA2,0xB7,0xB8,0xBF,0xC0,0x37E,0x37F,0x387,0x388,0x55A,0x560,0x589,0x58A,0x5C0,0x5C1,0x5C3,0x5C4,0x5C6,0x5C7,0x5F3,0x5F5,0x609,0x60B,0x60C,0x60E,0x61B,0x61C,0x61E,0x620,0x66A,0x66E,0x6D4,0x6D5,0x700,0x70E,0x7F7,0x7FA,0x964,0x966,0x970,0x971,0xDF4,0xDF5,0xE4F,0xE50,0xE5A,0xE5C,0xF04,0xF13,0xF85,0xF86,0xFD0,0xFD5,0x104A,0x1050,0x10FB,0x10FC,0x1361,0x1369,0x166D,0x166F,0x16EB,0x16EE,0x1735,0x1737,0x17D4,0x17D7,0x17D8,0x17DB,0x1800,0x1806,0x1807,0x180B,0x1944,0x1946,0x19DE,0x19E0,0x1A1E,0x1A20,0x1B5A,0x1B61,0x1C3B,0x1C40,0x1C7E,0x1C80,0x2016,0x2018,0x2020,0x2028,0x2030,0x2039,0x203B,0x203F,0x2041,0x2044,0x2047,0x2052,0x2053,0x2054,0x2055,0x205F,0x2CF9,0x2CFD,0x2CFE,0x2D00,0x2E00,0x2E02,0x2E06,0x2E09,0x2E0B,0x2E0C,0x2E0E,0x2E17,0x2E18,0x2E1A,0x2E1B,0x2E1C,0x2E1E,0x2E20,0x2E2A,0x2E2F,0x2E30,0x2E31,0x3001,0x3004,0x303D,0x303E,0x30FB,0x30FC,0xA60D,0xA610,0xA673,0xA674,0xA67E,0xA67F,0xA874,0xA878,0xA8CE,0xA8D0,0xA92E,0xA930,0xA95F,0xA960,0xAA5C,0xAA60,0xFE10,0xFE17,0xFE19,0xFE1A,0xFE30,0xFE31,0xFE45,0xFE47,0xFE49,0xFE4D,0xFE50,0xFE53,0xFE54,0xFE58,0xFE5F,0xFE62,0xFE68,0xFE69,0xFE6A,0xFE6C,0xFF01,0xFF04,0xFF05,0xFF08,0xFF0A,0xFF0B,0xFF0C,0xFF0D,0xFF0E,0xFF10,0xFF1A,0xFF1C,0xFF1F,0xFF21,0xFF3C,0xFF3D,0xFF61,0xFF62,0xFF64,0xFF66,0x10100,0x10102,0x1039F,0x103A0,0x103D0,0x103D1,0x1091F,0x10920,0x1093F,0x10940,0x10A50,0x10A59,0x12470,0x12474]
,Sc:[0x24,0x25,0xA2,0xA6,0x60B,0x60C,0x9F2,0x9F4,0xAF1,0xAF2,0xBF9,0xBFA,0xE3F,0xE40,0x17DB,0x17DC,0x20A0,0x20B6,0xFDFC,0xFDFD,0xFE69,0xFE6A,0xFF04,0xFF05,0xFFE0,0xFFE2,0xFFE5,0xFFE7]
,Ps:[0x28,0x29,0x5B,0x5C,0x7B,0x7C,0xF3A,0xF3B,0xF3C,0xF3D,0x169B,0x169C,0x201A,0x201B,0x201E,0x201F,0x2045,0x2046,0x207D,0x207E,0x208D,0x208E,0x2329,0x232A,0x2768,0x2769,0x276A,0x276B,0x276C,0x276D,0x276E,0x276F,0x2770,0x2771,0x2772,0x2773,0x2774,0x2775,0x27C5,0x27C6,0x27E6,0x27E7,0x27E8,0x27E9,0x27EA,0x27EB,0x27EC,0x27ED,0x27EE,0x27EF,0x2983,0x2984,0x2985,0x2986,0x2987,0x2988,0x2989,0x298A,0x298B,0x298C,0x298D,0x298E,0x298F,0x2990,0x2991,0x2992,0x2993,0x2994,0x2995,0x2996,0x2997,0x2998,0x29D8,0x29D9,0x29DA,0x29DB,0x29FC,0x29FD,0x2E22,0x2E23,0x2E24,0x2E25,0x2E26,0x2E27,0x2E28,0x2E29,0x3008,0x3009,0x300A,0x300B,0x300C,0x300D,0x300E,0x300F,0x3010,0x3011,0x3014,0x3015,0x3016,0x3017,0x3018,0x3019,0x301A,0x301B,0x301D,0x301E,0xFD3E,0xFD3F,0xFE17,0xFE18,0xFE35,0xFE36,0xFE37,0xFE38,0xFE39,0xFE3A,0xFE3B,0xFE3C,0xFE3D,0xFE3E,0xFE3F,0xFE40,0xFE41,0xFE42,0xFE43,0xFE44,0xFE47,0xFE48,0xFE59,0xFE5A,0xFE5B,0xFE5C,0xFE5D,0xFE5E,0xFF08,0xFF09,0xFF3B,0xFF3C,0xFF5B,0xFF5C,0xFF5F,0xFF60,0xFF62,0xFF63]
,Pe:[0x29,0x2A,0x5D,0x5E,0x7D,0x7E,0xF3B,0xF3C,0xF3D,0xF3E,0x169C,0x169D,0x2046,0x2047,0x207E,0x207F,0x208E,0x208F,0x232A,0x232B,0x2769,0x276A,0x276B,0x276C,0x276D,0x276E,0x276F,0x2770,0x2771,0x2772,0x2773,0x2774,0x2775,0x2776,0x27C6,0x27C7,0x27E7,0x27E8,0x27E9,0x27EA,0x27EB,0x27EC,0x27ED,0x27EE,0x27EF,0x27F0,0x2984,0x2985,0x2986,0x2987,0x2988,0x2989,0x298A,0x298B,0x298C,0x298D,0x298E,0x298F,0x2990,0x2991,0x2992,0x2993,0x2994,0x2995,0x2996,0x2997,0x2998,0x2999,0x29D9,0x29DA,0x29DB,0x29DC,0x29FD,0x29FE,0x2E23,0x2E24,0x2E25,0x2E26,0x2E27,0x2E28,0x2E29,0x2E2A,0x3009,0x300A,0x300B,0x300C,0x300D,0x300E,0x300F,0x3010,0x3011,0x3012,0x3015,0x3016,0x3017,0x3018,0x3019,0x301A,0x301B,0x301C,0x301E,0x3020,0xFD3F,0xFD40,0xFE18,0xFE19,0xFE36,0xFE37,0xFE38,0xFE39,0xFE3A,0xFE3B,0xFE3C,0xFE3D,0xFE3E,0xFE3F,0xFE40,0xFE41,0xFE42,0xFE43,0xFE44,0xFE45,0xFE48,0xFE49,0xFE5A,0xFE5B,0xFE5C,0xFE5D,0xFE5E,0xFE5F,0xFF09,0xFF0A,0xFF3D,0xFF3E,0xFF5D,0xFF5E,0xFF60,0xFF61,0xFF63,0xFF64]
,Sm:[0x2B,0x2C,0x3C,0x3F,0x7C,0x7D,0x7E,0x7F,0xAC,0xAD,0xB1,0xB2,0xD7,0xD8,0xF7,0xF8,0x3F6,0x3F7,0x606,0x609,0x2044,0x2045,0x2052,0x2053,0x207A,0x207D,0x208A,0x208D,0x2140,0x2145,0x214B,0x214C,0x2190,0x2195,0x219A,0x219C,0x21A0,0x21A1,0x21A3,0x21A4,0x21A6,0x21A7,0x21AE,0x21AF,0x21CE,0x21D0,0x21D2,0x21D3,0x21D4,0x21D5,0x21F4,0x2300,0x2308,0x230C,0x2320,0x2322,0x237C,0x237D,0x239B,0x23B4,0x23DC,0x23E2,0x25B7,0x25B8,0x25C1,0x25C2,0x25F8,0x2600,0x266F,0x2670,0x27C0,0x27C5,0x27C7,0x27CB,0x27CC,0x27CD,0x27D0,0x27E6,0x27F0,0x2800,0x2900,0x2983,0x2999,0x29D8,0x29DC,0x29FC,0x29FE,0x2B00,0x2B30,0x2B45,0x2B47,0x2B4D,0xFB29,0xFB2A,0xFE62,0xFE63,0xFE64,0xFE67,0xFF0B,0xFF0C,0xFF1C,0xFF1F,0xFF5C,0xFF5D,0xFF5E,0xFF5F,0xFFE2,0xFFE3,0xFFE9,0xFFED,0x1D6C1,0x1D6C2,0x1D6DB,0x1D6DC,0x1D6FB,0x1D6FC,0x1D715,0x1D716,0x1D735,0x1D736,0x1D74F,0x1D750,0x1D76F,0x1D770,0x1D789,0x1D78A,0x1D7A9,0x1D7AA,0x1D7C3,0x1D7C4]
,Pd:[0x2D,0x2E,0x58A,0x58B,0x5BE,0x5BF,0x1806,0x1807,0x2010,0x2016,0x2E17,0x2E18,0x2E1A,0x2E1B,0x301C,0x301D,0x3030,0x3031,0x30A0,0x30A1,0xFE31,0xFE33,0xFE58,0xFE59,0xFE63,0xFE64,0xFF0D,0xFF0E]
,Nd:[0x30,0x3A,0x660,0x66A,0x6F0,0x6FA,0x7C0,0x7CA,0x966,0x970,0x9E6,0x9F0,0xA66,0xA70,0xAE6,0xAF0,0xB66,0xB70,0xBE6,0xBF0,0xC66,0xC70,0xCE6,0xCF0,0xD66,0xD70,0xE50,0xE5A,0xED0,0xEDA,0xF20,0xF2A,0x1040,0x104A,0x1090,0x109A,0x17E0,0x17EA,0x1810,0x181A,0x1946,0x1950,0x19D0,0x19DA,0x1B50,0x1B5A,0x1BB0,0x1BBA,0x1C40,0x1C4A,0x1C50,0x1C5A,0xA620,0xA62A,0xA8D0,0xA8DA,0xA900,0xA90A,0xAA50,0xAA5A,0xFF10,0xFF1A,0x104A0,0x104AA,0x1D7CE,0x1D800]
,Lu:[0x41,0x5B,0xC0,0xD7,0xD8,0xDF,0x100,0x101,0x102,0x103,0x104,0x105,0x106,0x107,0x108,0x109,0x10A,0x10B,0x10C,0x10D,0x10E,0x10F,0x110,0x111,0x112,0x113,0x114,0x115,0x116,0x117,0x118,0x119,0x11A,0x11B,0x11C,0x11D,0x11E,0x11F,0x120,0x121,0x122,0x123,0x124,0x125,0x126,0x127,0x128,0x129,0x12A,0x12B,0x12C,0x12D,0x12E,0x12F,0x130,0x131,0x132,0x133,0x134,0x135,0x136,0x137,0x139,0x13A,0x13B,0x13C,0x13D,0x13E,0x13F,0x140,0x141,0x142,0x143,0x144,0x145,0x146,0x147,0x148,0x14A,0x14B,0x14C,0x14D,0x14E,0x14F,0x150,0x151,0x152,0x153,0x154,0x155,0x156,0x157,0x158,0x159,0x15A,0x15B,0x15C,0x15D,0x15E,0x15F,0x160,0x161,0x162,0x163,0x164,0x165,0x166,0x167,0x168,0x169,0x16A,0x16B,0x16C,0x16D,0x16E,0x16F,0x170,0x171,0x172,0x173,0x174,0x175,0x176,0x177,0x178,0x17A,0x17B,0x17C,0x17D,0x17E,0x181,0x183,0x184,0x185,0x186,0x188,0x189,0x18C,0x18E,0x192,0x193,0x195,0x196,0x199,0x19C,0x19E,0x19F,0x1A1,0x1A2,0x1A3,0x1A4,0x1A5,0x1A6,0x1A8,0x1A9,0x1AA,0x1AC,0x1AD,0x1AE,0x1B0,0x1B1,0x1B4,0x1B5,0x1B6,0x1B7,0x1B9,0x1BC,0x1BD,0x1C4,0x1C5,0x1C7,0x1C8,0x1CA,0x1CB,0x1CD,0x1CE,0x1CF,0x1D0,0x1D1,0x1D2,0x1D3,0x1D4,0x1D5,0x1D6,0x1D7,0x1D8,0x1D9,0x1DA,0x1DB,0x1DC,0x1DE,0x1DF,0x1E0,0x1E1,0x1E2,0x1E3,0x1E4,0x1E5,0x1E6,0x1E7,0x1E8,0x1E9,0x1EA,0x1EB,0x1EC,0x1ED,0x1EE,0x1EF,0x1F1,0x1F2,0x1F4,0x1F5,0x1F6,0x1F9,0x1FA,0x1FB,0x1FC,0x1FD,0x1FE,0x1FF,0x200,0x201,0x202,0x203,0x204,0x205,0x206,0x207,0x208,0x209,0x20A,0x20B,0x20C,0x20D,0x20E,0x20F,0x210,0x211,0x212,0x213,0x214,0x215,0x216,0x217,0x218,0x219,0x21A,0x21B,0x21C,0x21D,0x21E,0x21F,0x220,0x221,0x222,0x223,0x224,0x225,0x226,0x227,0x228,0x229,0x22A,0x22B,0x22C,0x22D,0x22E,0x22F,0x230,0x231,0x232,0x233,0x23A,0x23C,0x23D,0x23F,0x241,0x242,0x243,0x247,0x248,0x249,0x24A,0x24B,0x24C,0x24D,0x24E,0x24F,0x370,0x371,0x372,0x373,0x376,0x377,0x386,0x387,0x388,0x38B,0x38C,0x38D,0x38E,0x390,0x391,0x3A2,0x3A3,0x3AC,0x3CF,0x3D0,0x3D2,0x3D5,0x3D8,0x3D9,0x3DA,0x3DB,0x3DC,0x3DD,0x3DE,0x3DF,0x3E0,0x3E1,0x3E2,0x3E3,0x3E4,0x3E5,0x3E6,0x3E7,0x3E8,0x3E9,0x3EA,0x3EB,0x3EC,0x3ED,0x3EE,0x3EF,0x3F4,0x3F5,0x3F7,0x3F8,0x3F9,0x3FB,0x3FD,0x430,0x460,0x461,0x462,0x463,0x464,0x465,0x466,0x467,0x468,0x469,0x46A,0x46B,0x46C,0x46D,0x46E,0x46F,0x470,0x471,0x472,0x473,0x474,0x475,0x476,0x477,0x478,0x479,0x47A,0x47B,0x47C,0x47D,0x47E,0x47F,0x480,0x481,0x48A,0x48B,0x48C,0x48D,0x48E,0x48F,0x490,0x491,0x492,0x493,0x494,0x495,0x496,0x497,0x498,0x499,0x49A,0x49B,0x49C,0x49D,0x49E,0x49F,0x4A0,0x4A1,0x4A2,0x4A3,0x4A4,0x4A5,0x4A6,0x4A7,0x4A8,0x4A9,0x4AA,0x4AB,0x4AC,0x4AD,0x4AE,0x4AF,0x4B0,0x4B1,0x4B2,0x4B3,0x4B4,0x4B5,0x4B6,0x4B7,0x4B8,0x4B9,0x4BA,0x4BB,0x4BC,0x4BD,0x4BE,0x4BF,0x4C0,0x4C2,0x4C3,0x4C4,0x4C5,0x4C6,0x4C7,0x4C8,0x4C9,0x4CA,0x4CB,0x4CC,0x4CD,0x4CE,0x4D0,0x4D1,0x4D2,0x4D3,0x4D4,0x4D5,0x4D6,0x4D7,0x4D8,0x4D9,0x4DA,0x4DB,0x4DC,0x4DD,0x4DE,0x4DF,0x4E0,0x4E1,0x4E2,0x4E3,0x4E4,0x4E5,0x4E6,0x4E7,0x4E8,0x4E9,0x4EA,0x4EB,0x4EC,0x4ED,0x4EE,0x4EF,0x4F0,0x4F1,0x4F2,0x4F3,0x4F4,0x4F5,0x4F6,0x4F7,0x4F8,0x4F9,0x4FA,0x4FB,0x4FC,0x4FD,0x4FE,0x4FF,0x500,0x501,0x502,0x503,0x504,0x505,0x506,0x507,0x508,0x509,0x50A,0x50B,0x50C,0x50D,0x50E,0x50F,0x510,0x511,0x512,0x513,0x514,0x515,0x516,0x517,0x518,0x519,0x51A,0x51B,0x51C,0x51D,0x51E,0x51F,0x520,0x521,0x522,0x523,0x531,0x557,0x10A0,0x10C6,0x1E00,0x1E01,0x1E02,0x1E03,0x1E04,0x1E05,0x1E06,0x1E07,0x1E08,0x1E09,0x1E0A,0x1E0B,0x1E0C,0x1E0D,0x1E0E,0x1E0F,0x1E10,0x1E11,0x1E12,0x1E13,0x1E14,0x1E15,0x1E16,0x1E17,0x1E18,0x1E19,0x1E1A,0x1E1B,0x1E1C,0x1E1D,0x1E1E,0x1E1F,0x1E20,0x1E21,0x1E22,0x1E23,0x1E24,0x1E25,0x1E26,0x1E27,0x1E28,0x1E29,0x1E2A,0x1E2B,0x1E2C,0x1E2D,0x1E2E,0x1E2F,0x1E30,0x1E31,0x1E32,0x1E33,0x1E34,0x1E35,0x1E36,0x1E37,0x1E38,0x1E39,0x1E3A,0x1E3B,0x1E3C,0x1E3D,0x1E3E,0x1E3F,0x1E40,0x1E41,0x1E42,0x1E43,0x1E44,0x1E45,0x1E46,0x1E47,0x1E48,0x1E49,0x1E4A,0x1E4B,0x1E4C,0x1E4D,0x1E4E,0x1E4F,0x1E50,0x1E51,0x1E52,0x1E53,0x1E54,0x1E55,0x1E56,0x1E57,0x1E58,0x1E59,0x1E5A,0x1E5B,0x1E5C,0x1E5D,0x1E5E,0x1E5F,0x1E60,0x1E61,0x1E62,0x1E63,0x1E64,0x1E65,0x1E66,0x1E67,0x1E68,0x1E69,0x1E6A,0x1E6B,0x1E6C,0x1E6D,0x1E6E,0x1E6F,0x1E70,0x1E71,0x1E72,0x1E73,0x1E74,0x1E75,0x1E76,0x1E77,0x1E78,0x1E79,0x1E7A,0x1E7B,0x1E7C,0x1E7D,0x1E7E,0x1E7F,0x1E80,0x1E81,0x1E82,0x1E83,0x1E84,0x1E85,0x1E86,0x1E87,0x1E88,0x1E89,0x1E8A,0x1E8B,0x1E8C,0x1E8D,0x1E8E,0x1E8F,0x1E90,0x1E91,0x1E92,0x1E93,0x1E94,0x1E95,0x1E9E,0x1E9F,0x1EA0,0x1EA1,0x1EA2,0x1EA3,0x1EA4,0x1EA5,0x1EA6,0x1EA7,0x1EA8,0x1EA9,0x1EAA,0x1EAB,0x1EAC,0x1EAD,0x1EAE,0x1EAF,0x1EB0,0x1EB1,0x1EB2,0x1EB3,0x1EB4,0x1EB5,0x1EB6,0x1EB7,0x1EB8,0x1EB9,0x1EBA,0x1EBB,0x1EBC,0x1EBD,0x1EBE,0x1EBF,0x1EC0,0x1EC1,0x1EC2,0x1EC3,0x1EC4,0x1EC5,0x1EC6,0x1EC7,0x1EC8,0x1EC9,0x1ECA,0x1ECB,0x1ECC,0x1ECD,0x1ECE,0x1ECF,0x1ED0,0x1ED1,0x1ED2,0x1ED3,0x1ED4,0x1ED5,0x1ED6,0x1ED7,0x1ED8,0x1ED9,0x1EDA,0x1EDB,0x1EDC,0x1EDD,0x1EDE,0x1EDF,0x1EE0,0x1EE1,0x1EE2,0x1EE3,0x1EE4,0x1EE5,0x1EE6,0x1EE7,0x1EE8,0x1EE9,0x1EEA,0x1EEB,0x1EEC,0x1EED,0x1EEE,0x1EEF,0x1EF0,0x1EF1,0x1EF2,0x1EF3,0x1EF4,0x1EF5,0x1EF6,0x1EF7,0x1EF8,0x1EF9,0x1EFA,0x1EFB,0x1EFC,0x1EFD,0x1EFE,0x1EFF,0x1F08,0x1F10,0x1F18,0x1F1E,0x1F28,0x1F30,0x1F38,0x1F40,0x1F48,0x1F4E,0x1F59,0x1F5A,0x1F5B,0x1F5C,0x1F5D,0x1F5E,0x1F5F,0x1F60,0x1F68,0x1F70,0x1FB8,0x1FBC,0x1FC8,0x1FCC,0x1FD8,0x1FDC,0x1FE8,0x1FED,0x1FF8,0x1FFC,0x2102,0x2103,0x2107,0x2108,0x210B,0x210E,0x2110,0x2113,0x2115,0x2116,0x2119,0x211E,0x2124,0x2125,0x2126,0x2127,0x2128,0x2129,0x212A,0x212E,0x2130,0x2134,0x213E,0x2140,0x2145,0x2146,0x2183,0x2184,0x2C00,0x2C2F,0x2C60,0x2C61,0x2C62,0x2C65,0x2C67,0x2C68,0x2C69,0x2C6A,0x2C6B,0x2C6C,0x2C6D,0x2C70,0x2C72,0x2C73,0x2C75,0x2C76,0x2C80,0x2C81,0x2C82,0x2C83,0x2C84,0x2C85,0x2C86,0x2C87,0x2C88,0x2C89,0x2C8A,0x2C8B,0x2C8C,0x2C8D,0x2C8E,0x2C8F,0x2C90,0x2C91,0x2C92,0x2C93,0x2C94,0x2C95,0x2C96,0x2C97,0x2C98,0x2C99,0x2C9A,0x2C9B,0x2C9C,0x2C9D,0x2C9E,0x2C9F,0x2CA0,0x2CA1,0x2CA2,0x2CA3,0x2CA4,0x2CA5,0x2CA6,0x2CA7,0x2CA8,0x2CA9,0x2CAA,0x2CAB,0x2CAC,0x2CAD,0x2CAE,0x2CAF,0x2CB0,0x2CB1,0x2CB2,0x2CB3,0x2CB4,0x2CB5,0x2CB6,0x2CB7,0x2CB8,0x2CB9,0x2CBA,0x2CBB,0x2CBC,0x2CBD,0x2CBE,0x2CBF,0x2CC0,0x2CC1,0x2CC2,0x2CC3,0x2CC4,0x2CC5,0x2CC6,0x2CC7,0x2CC8,0x2CC9,0x2CCA,0x2CCB,0x2CCC,0x2CCD,0x2CCE,0x2CCF,0x2CD0,0x2CD1,0x2CD2,0x2CD3,0x2CD4,0x2CD5,0x2CD6,0x2CD7,0x2CD8,0x2CD9,0x2CDA,0x2CDB,0x2CDC,0x2CDD,0x2CDE,0x2CDF,0x2CE0,0x2CE1,0x2CE2,0x2CE3,0xA640,0xA641,0xA642,0xA643,0xA644,0xA645,0xA646,0xA647,0xA648,0xA649,0xA64A,0xA64B,0xA64C,0xA64D,0xA64E,0xA64F,0xA650,0xA651,0xA652,0xA653,0xA654,0xA655,0xA656,0xA657,0xA658,0xA659,0xA65A,0xA65B,0xA65C,0xA65D,0xA65E,0xA65F,0xA662,0xA663,0xA664,0xA665,0xA666,0xA667,0xA668,0xA669,0xA66A,0xA66B,0xA66C,0xA66D,0xA680,0xA681,0xA682,0xA683,0xA684,0xA685,0xA686,0xA687,0xA688,0xA689,0xA68A,0xA68B,0xA68C,0xA68D,0xA68E,0xA68F,0xA690,0xA691,0xA692,0xA693,0xA694,0xA695,0xA696,0xA697,0xA722,0xA723,0xA724,0xA725,0xA726,0xA727,0xA728,0xA729,0xA72A,0xA72B,0xA72C,0xA72D,0xA72E,0xA72F,0xA732,0xA733,0xA734,0xA735,0xA736,0xA737,0xA738,0xA739,0xA73A,0xA73B,0xA73C,0xA73D,0xA73E,0xA73F,0xA740,0xA741,0xA742,0xA743,0xA744,0xA745,0xA746,0xA747,0xA748,0xA749,0xA74A,0xA74B,0xA74C,0xA74D,0xA74E,0xA74F,0xA750,0xA751,0xA752,0xA753,0xA754,0xA755,0xA756,0xA757,0xA758,0xA759,0xA75A,0xA75B,0xA75C,0xA75D,0xA75E,0xA75F,0xA760,0xA761,0xA762,0xA763,0xA764,0xA765,0xA766,0xA767,0xA768,0xA769,0xA76A,0xA76B,0xA76C,0xA76D,0xA76E,0xA76F,0xA779,0xA77A,0xA77B,0xA77C,0xA77D,0xA77F,0xA780,0xA781,0xA782,0xA783,0xA784,0xA785,0xA786,0xA787,0xA78B,0xA78C,0xFF21,0xFF3B,0x10400,0x10428,0x1D400,0x1D41A,0x1D434,0x1D44E,0x1D468,0x1D482,0x1D49C,0x1D49D,0x1D49E,0x1D4A0,0x1D4A2,0x1D4A3,0x1D4A5,0x1D4A7,0x1D4A9,0x1D4AD,0x1D4AE,0x1D4B6,0x1D4D0,0x1D4EA,0x1D504,0x1D506,0x1D507,0x1D50B,0x1D50D,0x1D515,0x1D516,0x1D51D,0x1D538,0x1D53A,0x1D53B,0x1D53F,0x1D540,0x1D545,0x1D546,0x1D547,0x1D54A,0x1D551,0x1D56C,0x1D586,0x1D5A0,0x1D5BA,0x1D5D4,0x1D5EE,0x1D608,0x1D622,0x1D63C,0x1D656,0x1D670,0x1D68A,0x1D6A8,0x1D6C1,0x1D6E2,0x1D6FB,0x1D71C,0x1D735,0x1D756,0x1D76F,0x1D790,0x1D7A9,0x1D7CA,0x1D7CB]
,Sk:[0x5E,0x5F,0x60,0x61,0xA8,0xA9,0xAF,0xB0,0xB4,0xB5,0xB8,0xB9,0x2C2,0x2C6,0x2D2,0x2E0,0x2E5,0x2EC,0x2ED,0x2EE,0x2EF,0x300,0x375,0x376,0x384,0x386,0x1FBD,0x1FBE,0x1FBF,0x1FC2,0x1FCD,0x1FD0,0x1FDD,0x1FE0,0x1FED,0x1FF0,0x1FFD,0x1FFF,0x309B,0x309D,0xA700,0xA717,0xA720,0xA722,0xA789,0xA78B,0xFF3E,0xFF3F,0xFF40,0xFF41,0xFFE3,0xFFE4]
,Pc:[0x5F,0x60,0x203F,0x2041,0x2054,0x2055,0xFE33,0xFE35,0xFE4D,0xFE50,0xFF3F,0xFF40]
,Ll:[0x61,0x7B,0xAA,0xAB,0xB5,0xB6,0xBA,0xBB,0xDF,0xF7,0xF8,0x100,0x101,0x102,0x103,0x104,0x105,0x106,0x107,0x108,0x109,0x10A,0x10B,0x10C,0x10D,0x10E,0x10F,0x110,0x111,0x112,0x113,0x114,0x115,0x116,0x117,0x118,0x119,0x11A,0x11B,0x11C,0x11D,0x11E,0x11F,0x120,0x121,0x122,0x123,0x124,0x125,0x126,0x127,0x128,0x129,0x12A,0x12B,0x12C,0x12D,0x12E,0x12F,0x130,0x131,0x132,0x133,0x134,0x135,0x136,0x137,0x139,0x13A,0x13B,0x13C,0x13D,0x13E,0x13F,0x140,0x141,0x142,0x143,0x144,0x145,0x146,0x147,0x148,0x14A,0x14B,0x14C,0x14D,0x14E,0x14F,0x150,0x151,0x152,0x153,0x154,0x155,0x156,0x157,0x158,0x159,0x15A,0x15B,0x15C,0x15D,0x15E,0x15F,0x160,0x161,0x162,0x163,0x164,0x165,0x166,0x167,0x168,0x169,0x16A,0x16B,0x16C,0x16D,0x16E,0x16F,0x170,0x171,0x172,0x173,0x174,0x175,0x176,0x177,0x178,0x17A,0x17B,0x17C,0x17D,0x17E,0x181,0x183,0x184,0x185,0x186,0x188,0x189,0x18C,0x18E,0x192,0x193,0x195,0x196,0x199,0x19C,0x19E,0x19F,0x1A1,0x1A2,0x1A3,0x1A4,0x1A5,0x1A6,0x1A8,0x1A9,0x1AA,0x1AC,0x1AD,0x1AE,0x1B0,0x1B1,0x1B4,0x1B5,0x1B6,0x1B7,0x1B9,0x1BB,0x1BD,0x1C0,0x1C6,0x1C7,0x1C9,0x1CA,0x1CC,0x1CD,0x1CE,0x1CF,0x1D0,0x1D1,0x1D2,0x1D3,0x1D4,0x1D5,0x1D6,0x1D7,0x1D8,0x1D9,0x1DA,0x1DB,0x1DC,0x1DE,0x1DF,0x1E0,0x1E1,0x1E2,0x1E3,0x1E4,0x1E5,0x1E6,0x1E7,0x1E8,0x1E9,0x1EA,0x1EB,0x1EC,0x1ED,0x1EE,0x1EF,0x1F1,0x1F3,0x1F4,0x1F5,0x1F6,0x1F9,0x1FA,0x1FB,0x1FC,0x1FD,0x1FE,0x1FF,0x200,0x201,0x202,0x203,0x204,0x205,0x206,0x207,0x208,0x209,0x20A,0x20B,0x20C,0x20D,0x20E,0x20F,0x210,0x211,0x212,0x213,0x214,0x215,0x216,0x217,0x218,0x219,0x21A,0x21B,0x21C,0x21D,0x21E,0x21F,0x220,0x221,0x222,0x223,0x224,0x225,0x226,0x227,0x228,0x229,0x22A,0x22B,0x22C,0x22D,0x22E,0x22F,0x230,0x231,0x232,0x233,0x23A,0x23C,0x23D,0x23F,0x241,0x242,0x243,0x247,0x248,0x249,0x24A,0x24B,0x24C,0x24D,0x24E,0x24F,0x294,0x295,0x2B0,0x371,0x372,0x373,0x374,0x377,0x378,0x37B,0x37E,0x390,0x391,0x3AC,0x3CF,0x3D0,0x3D2,0x3D5,0x3D8,0x3D9,0x3DA,0x3DB,0x3DC,0x3DD,0x3DE,0x3DF,0x3E0,0x3E1,0x3E2,0x3E3,0x3E4,0x3E5,0x3E6,0x3E7,0x3E8,0x3E9,0x3EA,0x3EB,0x3EC,0x3ED,0x3EE,0x3EF,0x3F4,0x3F5,0x3F6,0x3F8,0x3F9,0x3FB,0x3FD,0x430,0x460,0x461,0x462,0x463,0x464,0x465,0x466,0x467,0x468,0x469,0x46A,0x46B,0x46C,0x46D,0x46E,0x46F,0x470,0x471,0x472,0x473,0x474,0x475,0x476,0x477,0x478,0x479,0x47A,0x47B,0x47C,0x47D,0x47E,0x47F,0x480,0x481,0x482,0x48B,0x48C,0x48D,0x48E,0x48F,0x490,0x491,0x492,0x493,0x494,0x495,0x496,0x497,0x498,0x499,0x49A,0x49B,0x49C,0x49D,0x49E,0x49F,0x4A0,0x4A1,0x4A2,0x4A3,0x4A4,0x4A5,0x4A6,0x4A7,0x4A8,0x4A9,0x4AA,0x4AB,0x4AC,0x4AD,0x4AE,0x4AF,0x4B0,0x4B1,0x4B2,0x4B3,0x4B4,0x4B5,0x4B6,0x4B7,0x4B8,0x4B9,0x4BA,0x4BB,0x4BC,0x4BD,0x4BE,0x4BF,0x4C0,0x4C2,0x4C3,0x4C4,0x4C5,0x4C6,0x4C7,0x4C8,0x4C9,0x4CA,0x4CB,0x4CC,0x4CD,0x4CE,0x4D0,0x4D1,0x4D2,0x4D3,0x4D4,0x4D5,0x4D6,0x4D7,0x4D8,0x4D9,0x4DA,0x4DB,0x4DC,0x4DD,0x4DE,0x4DF,0x4E0,0x4E1,0x4E2,0x4E3,0x4E4,0x4E5,0x4E6,0x4E7,0x4E8,0x4E9,0x4EA,0x4EB,0x4EC,0x4ED,0x4EE,0x4EF,0x4F0,0x4F1,0x4F2,0x4F3,0x4F4,0x4F5,0x4F6,0x4F7,0x4F8,0x4F9,0x4FA,0x4FB,0x4FC,0x4FD,0x4FE,0x4FF,0x500,0x501,0x502,0x503,0x504,0x505,0x506,0x507,0x508,0x509,0x50A,0x50B,0x50C,0x50D,0x50E,0x50F,0x510,0x511,0x512,0x513,0x514,0x515,0x516,0x517,0x518,0x519,0x51A,0x51B,0x51C,0x51D,0x51E,0x51F,0x520,0x521,0x522,0x523,0x524,0x561,0x588,0x1D00,0x1D2C,0x1D62,0x1D78,0x1D79,0x1D9B,0x1E01,0x1E02,0x1E03,0x1E04,0x1E05,0x1E06,0x1E07,0x1E08,0x1E09,0x1E0A,0x1E0B,0x1E0C,0x1E0D,0x1E0E,0x1E0F,0x1E10,0x1E11,0x1E12,0x1E13,0x1E14,0x1E15,0x1E16,0x1E17,0x1E18,0x1E19,0x1E1A,0x1E1B,0x1E1C,0x1E1D,0x1E1E,0x1E1F,0x1E20,0x1E21,0x1E22,0x1E23,0x1E24,0x1E25,0x1E26,0x1E27,0x1E28,0x1E29,0x1E2A,0x1E2B,0x1E2C,0x1E2D,0x1E2E,0x1E2F,0x1E30,0x1E31,0x1E32,0x1E33,0x1E34,0x1E35,0x1E36,0x1E37,0x1E38,0x1E39,0x1E3A,0x1E3B,0x1E3C,0x1E3D,0x1E3E,0x1E3F,0x1E40,0x1E41,0x1E42,0x1E43,0x1E44,0x1E45,0x1E46,0x1E47,0x1E48,0x1E49,0x1E4A,0x1E4B,0x1E4C,0x1E4D,0x1E4E,0x1E4F,0x1E50,0x1E51,0x1E52,0x1E53,0x1E54,0x1E55,0x1E56,0x1E57,0x1E58,0x1E59,0x1E5A,0x1E5B,0x1E5C,0x1E5D,0x1E5E,0x1E5F,0x1E60,0x1E61,0x1E62,0x1E63,0x1E64,0x1E65,0x1E66,0x1E67,0x1E68,0x1E69,0x1E6A,0x1E6B,0x1E6C,0x1E6D,0x1E6E,0x1E6F,0x1E70,0x1E71,0x1E72,0x1E73,0x1E74,0x1E75,0x1E76,0x1E77,0x1E78,0x1E79,0x1E7A,0x1E7B,0x1E7C,0x1E7D,0x1E7E,0x1E7F,0x1E80,0x1E81,0x1E82,0x1E83,0x1E84,0x1E85,0x1E86,0x1E87,0x1E88,0x1E89,0x1E8A,0x1E8B,0x1E8C,0x1E8D,0x1E8E,0x1E8F,0x1E90,0x1E91,0x1E92,0x1E93,0x1E94,0x1E95,0x1E9E,0x1E9F,0x1EA0,0x1EA1,0x1EA2,0x1EA3,0x1EA4,0x1EA5,0x1EA6,0x1EA7,0x1EA8,0x1EA9,0x1EAA,0x1EAB,0x1EAC,0x1EAD,0x1EAE,0x1EAF,0x1EB0,0x1EB1,0x1EB2,0x1EB3,0x1EB4,0x1EB5,0x1EB6,0x1EB7,0x1EB8,0x1EB9,0x1EBA,0x1EBB,0x1EBC,0x1EBD,0x1EBE,0x1EBF,0x1EC0,0x1EC1,0x1EC2,0x1EC3,0x1EC4,0x1EC5,0x1EC6,0x1EC7,0x1EC8,0x1EC9,0x1ECA,0x1ECB,0x1ECC,0x1ECD,0x1ECE,0x1ECF,0x1ED0,0x1ED1,0x1ED2,0x1ED3,0x1ED4,0x1ED5,0x1ED6,0x1ED7,0x1ED8,0x1ED9,0x1EDA,0x1EDB,0x1EDC,0x1EDD,0x1EDE,0x1EDF,0x1EE0,0x1EE1,0x1EE2,0x1EE3,0x1EE4,0x1EE5,0x1EE6,0x1EE7,0x1EE8,0x1EE9,0x1EEA,0x1EEB,0x1EEC,0x1EED,0x1EEE,0x1EEF,0x1EF0,0x1EF1,0x1EF2,0x1EF3,0x1EF4,0x1EF5,0x1EF6,0x1EF7,0x1EF8,0x1EF9,0x1EFA,0x1EFB,0x1EFC,0x1EFD,0x1EFE,0x1EFF,0x1F08,0x1F10,0x1F16,0x1F20,0x1F28,0x1F30,0x1F38,0x1F40,0x1F46,0x1F50,0x1F58,0x1F60,0x1F68,0x1F70,0x1F7E,0x1F80,0x1F88,0x1F90,0x1F98,0x1FA0,0x1FA8,0x1FB0,0x1FB5,0x1FB6,0x1FB8,0x1FBE,0x1FBF,0x1FC2,0x1FC5,0x1FC6,0x1FC8,0x1FD0,0x1FD4,0x1FD6,0x1FD8,0x1FE0,0x1FE8,0x1FF2,0x1FF5,0x1FF6,0x1FF8,0x2071,0x2072,0x207F,0x2080,0x210A,0x210B,0x210E,0x2110,0x2113,0x2114,0x212F,0x2130,0x2134,0x2135,0x2139,0x213A,0x213C,0x213E,0x2146,0x214A,0x214E,0x214F,0x2184,0x2185,0x2C30,0x2C5F,0x2C61,0x2C62,0x2C65,0x2C67,0x2C68,0x2C69,0x2C6A,0x2C6B,0x2C6C,0x2C6D,0x2C71,0x2C72,0x2C73,0x2C75,0x2C76,0x2C7D,0x2C81,0x2C82,0x2C83,0x2C84,0x2C85,0x2C86,0x2C87,0x2C88,0x2C89,0x2C8A,0x2C8B,0x2C8C,0x2C8D,0x2C8E,0x2C8F,0x2C90,0x2C91,0x2C92,0x2C93,0x2C94,0x2C95,0x2C96,0x2C97,0x2C98,0x2C99,0x2C9A,0x2C9B,0x2C9C,0x2C9D,0x2C9E,0x2C9F,0x2CA0,0x2CA1,0x2CA2,0x2CA3,0x2CA4,0x2CA5,0x2CA6,0x2CA7,0x2CA8,0x2CA9,0x2CAA,0x2CAB,0x2CAC,0x2CAD,0x2CAE,0x2CAF,0x2CB0,0x2CB1,0x2CB2,0x2CB3,0x2CB4,0x2CB5,0x2CB6,0x2CB7,0x2CB8,0x2CB9,0x2CBA,0x2CBB,0x2CBC,0x2CBD,0x2CBE,0x2CBF,0x2CC0,0x2CC1,0x2CC2,0x2CC3,0x2CC4,0x2CC5,0x2CC6,0x2CC7,0x2CC8,0x2CC9,0x2CCA,0x2CCB,0x2CCC,0x2CCD,0x2CCE,0x2CCF,0x2CD0,0x2CD1,0x2CD2,0x2CD3,0x2CD4,0x2CD5,0x2CD6,0x2CD7,0x2CD8,0x2CD9,0x2CDA,0x2CDB,0x2CDC,0x2CDD,0x2CDE,0x2CDF,0x2CE0,0x2CE1,0x2CE2,0x2CE3,0x2CE5,0x2D00,0x2D26,0xA641,0xA642,0xA643,0xA644,0xA645,0xA646,0xA647,0xA648,0xA649,0xA64A,0xA64B,0xA64C,0xA64D,0xA64E,0xA64F,0xA650,0xA651,0xA652,0xA653,0xA654,0xA655,0xA656,0xA657,0xA658,0xA659,0xA65A,0xA65B,0xA65C,0xA65D,0xA65E,0xA65F,0xA660,0xA663,0xA664,0xA665,0xA666,0xA667,0xA668,0xA669,0xA66A,0xA66B,0xA66C,0xA66D,0xA66E,0xA681,0xA682,0xA683,0xA684,0xA685,0xA686,0xA687,0xA688,0xA689,0xA68A,0xA68B,0xA68C,0xA68D,0xA68E,0xA68F,0xA690,0xA691,0xA692,0xA693,0xA694,0xA695,0xA696,0xA697,0xA698,0xA723,0xA724,0xA725,0xA726,0xA727,0xA728,0xA729,0xA72A,0xA72B,0xA72C,0xA72D,0xA72E,0xA72F,0xA732,0xA733,0xA734,0xA735,0xA736,0xA737,0xA738,0xA739,0xA73A,0xA73B,0xA73C,0xA73D,0xA73E,0xA73F,0xA740,0xA741,0xA742,0xA743,0xA744,0xA745,0xA746,0xA747,0xA748,0xA749,0xA74A,0xA74B,0xA74C,0xA74D,0xA74E,0xA74F,0xA750,0xA751,0xA752,0xA753,0xA754,0xA755,0xA756,0xA757,0xA758,0xA759,0xA75A,0xA75B,0xA75C,0xA75D,0xA75E,0xA75F,0xA760,0xA761,0xA762,0xA763,0xA764,0xA765,0xA766,0xA767,0xA768,0xA769,0xA76A,0xA76B,0xA76C,0xA76D,0xA76E,0xA76F,0xA770,0xA771,0xA779,0xA77A,0xA77B,0xA77C,0xA77D,0xA77F,0xA780,0xA781,0xA782,0xA783,0xA784,0xA785,0xA786,0xA787,0xA788,0xA78C,0xA78D,0xFB00,0xFB07,0xFB13,0xFB18,0xFF41,0xFF5B,0x10428,0x10450,0x1D41A,0x1D434,0x1D44E,0x1D455,0x1D456,0x1D468,0x1D482,0x1D49C,0x1D4B6,0x1D4BA,0x1D4BB,0x1D4BC,0x1D4BD,0x1D4C4,0x1D4C5,0x1D4D0,0x1D4EA,0x1D504,0x1D51E,0x1D538,0x1D552,0x1D56C,0x1D586,0x1D5A0,0x1D5BA,0x1D5D4,0x1D5EE,0x1D608,0x1D622,0x1D63C,0x1D656,0x1D670,0x1D68A,0x1D6A6,0x1D6C2,0x1D6DB,0x1D6DC,0x1D6E2,0x1D6FC,0x1D715,0x1D716,0x1D71C,0x1D736,0x1D74F,0x1D750,0x1D756,0x1D770,0x1D789,0x1D78A,0x1D790,0x1D7AA,0x1D7C3,0x1D7C4,0x1D7CA,0x1D7CB,0x1D7CC]
,So:[0xA6,0xA8,0xA9,0xAA,0xAE,0xAF,0xB0,0xB1,0xB6,0xB7,0x482,0x483,0x60E,0x610,0x6E9,0x6EA,0x6FD,0x6FF,0x7F6,0x7F7,0x9FA,0x9FB,0xB70,0xB71,0xBF3,0xBF9,0xBFA,0xBFB,0xC7F,0xC80,0xCF1,0xCF3,0xD79,0xD7A,0xF01,0xF04,0xF13,0xF18,0xF1A,0xF20,0xF34,0xF35,0xF36,0xF37,0xF38,0xF39,0xFBE,0xFC6,0xFC7,0xFCD,0xFCE,0xFD0,0x109E,0x10A0,0x1360,0x1361,0x1390,0x139A,0x1940,0x1941,0x19E0,0x1A00,0x1B61,0x1B6B,0x1B74,0x1B7D,0x2100,0x2102,0x2103,0x2107,0x2108,0x210A,0x2114,0x2115,0x2116,0x2119,0x211E,0x2124,0x2125,0x2126,0x2127,0x2128,0x2129,0x212A,0x212E,0x212F,0x213A,0x213C,0x214A,0x214B,0x214C,0x214E,0x214F,0x2150,0x2195,0x219A,0x219C,0x21A0,0x21A1,0x21A3,0x21A4,0x21A6,0x21A7,0x21AE,0x21AF,0x21CE,0x21D0,0x21D2,0x21D3,0x21D4,0x21D5,0x21F4,0x2300,0x2308,0x230C,0x2320,0x2322,0x2329,0x232B,0x237C,0x237D,0x239B,0x23B4,0x23DC,0x23E2,0x23E8,0x2400,0x2427,0x2440,0x244B,0x249C,0x24EA,0x2500,0x25B7,0x25B8,0x25C1,0x25C2,0x25F8,0x2600,0x266F,0x2670,0x269E,0x26A0,0x26BD,0x26C0,0x26C4,0x2701,0x2705,0x2706,0x270A,0x270C,0x2728,0x2729,0x274C,0x274D,0x274E,0x274F,0x2753,0x2756,0x2757,0x2758,0x275F,0x2761,0x2768,0x2794,0x2795,0x2798,0x27B0,0x27B1,0x27BF,0x2800,0x2900,0x2B00,0x2B30,0x2B45,0x2B47,0x2B50,0x2B55,0x2CE5,0x2CEB,0x2E80,0x2E9A,0x2E9B,0x2EF4,0x2F00,0x2FD6,0x2FF0,0x2FFC,0x3004,0x3005,0x3012,0x3014,0x3020,0x3021,0x3036,0x3038,0x303E,0x3040,0x3190,0x3192,0x3196,0x31A0,0x31C0,0x31E4,0x3200,0x321F,0x322A,0x3244,0x3250,0x3251,0x3260,0x3280,0x328A,0x32B1,0x32C0,0x32FF,0x3300,0x3400,0x4DC0,0x4E00,0xA490,0xA4C7,0xA828,0xA82C,0xFDFD,0xFDFE,0xFFE4,0xFFE5,0xFFE8,0xFFE9,0xFFED,0xFFEF,0xFFFC,0xFFFE,0x10102,0x10103,0x10137,0x10140,0x10179,0x1018A,0x10190,0x1019C,0x101D0,0x101FD,0x1D000,0x1D0F6,0x1D100,0x1D127,0x1D129,0x1D165,0x1D16A,0x1D16D,0x1D183,0x1D185,0x1D18C,0x1D1AA,0x1D1AE,0x1D1DE,0x1D200,0x1D242,0x1D245,0x1D246,0x1D300,0x1D357,0x1F000,0x1F02C,0x1F030,0x1F094]
,Pi:[0xAB,0xAC,0x2018,0x2019,0x201B,0x201D,0x201F,0x2020,0x2039,0x203A,0x2E02,0x2E03,0x2E04,0x2E05,0x2E09,0x2E0A,0x2E0C,0x2E0D,0x2E1C,0x2E1D,0x2E20,0x2E21]
,Cf:[0xAD,0xAE,0x600,0x604,0x6DD,0x6DE,0x70F,0x710,0x17B4,0x17B6,0x200B,0x2010,0x202A,0x202F,0x2060,0x2065,0x206A,0x2070,0xFEFF,0xFF00,0xFFF9,0xFFFC,0x1D173,0x1D17B,0xE0001,0xE0002,0xE0020,0xE0080]
,No:[0xB2,0xB4,0xB9,0xBA,0xBC,0xBF,0x9F4,0x9FA,0xBF0,0xBF3,0xC78,0xC7F,0xD70,0xD76,0xF2A,0xF34,0x1369,0x137D,0x17F0,0x17FA,0x2070,0x2071,0x2074,0x207A,0x2080,0x208A,0x2153,0x2160,0x2460,0x249C,0x24EA,0x2500,0x2776,0x2794,0x2CFD,0x2CFE,0x3192,0x3196,0x3220,0x322A,0x3251,0x3260,0x3280,0x328A,0x32B1,0x32C0,0x10107,0x10134,0x10175,0x10179,0x1018A,0x1018B,0x10320,0x10324,0x10916,0x1091A,0x10A40,0x10A48,0x1D360,0x1D372]
,Pf:[0xBB,0xBC,0x2019,0x201A,0x201D,0x201E,0x203A,0x203B,0x2E03,0x2E04,0x2E05,0x2E06,0x2E0A,0x2E0B,0x2E0D,0x2E0E,0x2E1D,0x2E1E,0x2E21,0x2E22]
,Lo:[0x1BB,0x1BC,0x1C0,0x1C4,0x294,0x295,0x5D0,0x5EB,0x5F0,0x5F3,0x621,0x640,0x641,0x64B,0x66E,0x670,0x671,0x6D4,0x6D5,0x6D6,0x6EE,0x6F0,0x6FA,0x6FD,0x6FF,0x700,0x710,0x711,0x712,0x730,0x74D,0x7A6,0x7B1,0x7B2,0x7CA,0x7EB,0x904,0x93A,0x93D,0x93E,0x950,0x951,0x958,0x962,0x972,0x973,0x97B,0x980,0x985,0x98D,0x98F,0x991,0x993,0x9A9,0x9AA,0x9B1,0x9B2,0x9B3,0x9B6,0x9BA,0x9BD,0x9BE,0x9CE,0x9CF,0x9DC,0x9DE,0x9DF,0x9E2,0x9F0,0x9F2,0xA05,0xA0B,0xA0F,0xA11,0xA13,0xA29,0xA2A,0xA31,0xA32,0xA34,0xA35,0xA37,0xA38,0xA3A,0xA59,0xA5D,0xA5E,0xA5F,0xA72,0xA75,0xA85,0xA8E,0xA8F,0xA92,0xA93,0xAA9,0xAAA,0xAB1,0xAB2,0xAB4,0xAB5,0xABA,0xABD,0xABE,0xAD0,0xAD1,0xAE0,0xAE2,0xB05,0xB0D,0xB0F,0xB11,0xB13,0xB29,0xB2A,0xB31,0xB32,0xB34,0xB35,0xB3A,0xB3D,0xB3E,0xB5C,0xB5E,0xB5F,0xB62,0xB71,0xB72,0xB83,0xB84,0xB85,0xB8B,0xB8E,0xB91,0xB92,0xB96,0xB99,0xB9B,0xB9C,0xB9D,0xB9E,0xBA0,0xBA3,0xBA5,0xBA8,0xBAB,0xBAE,0xBBA,0xBD0,0xBD1,0xC05,0xC0D,0xC0E,0xC11,0xC12,0xC29,0xC2A,0xC34,0xC35,0xC3A,0xC3D,0xC3E,0xC58,0xC5A,0xC60,0xC62,0xC85,0xC8D,0xC8E,0xC91,0xC92,0xCA9,0xCAA,0xCB4,0xCB5,0xCBA,0xCBD,0xCBE,0xCDE,0xCDF,0xCE0,0xCE2,0xD05,0xD0D,0xD0E,0xD11,0xD12,0xD29,0xD2A,0xD3A,0xD3D,0xD3E,0xD60,0xD62,0xD7A,0xD80,0xD85,0xD97,0xD9A,0xDB2,0xDB3,0xDBC,0xDBD,0xDBE,0xDC0,0xDC7,0xE01,0xE31,0xE32,0xE34,0xE40,0xE46,0xE81,0xE83,0xE84,0xE85,0xE87,0xE89,0xE8A,0xE8B,0xE8D,0xE8E,0xE94,0xE98,0xE99,0xEA0,0xEA1,0xEA4,0xEA5,0xEA6,0xEA7,0xEA8,0xEAA,0xEAC,0xEAD,0xEB1,0xEB2,0xEB4,0xEBD,0xEBE,0xEC0,0xEC5,0xEDC,0xEDE,0xF00,0xF01,0xF40,0xF48,0xF49,0xF6D,0xF88,0xF8C,0x1000,0x102B,0x103F,0x1040,0x1050,0x1056,0x105A,0x105E,0x1061,0x1062,0x1065,0x1067,0x106E,0x1071,0x1075,0x1082,0x108E,0x108F,0x10D0,0x10FB,0x1100,0x115A,0x115F,0x11A3,0x11A8,0x11FA,0x1200,0x1249,0x124A,0x124E,0x1250,0x1257,0x1258,0x1259,0x125A,0x125E,0x1260,0x1289,0x128A,0x128E,0x1290,0x12B1,0x12B2,0x12B6,0x12B8,0x12BF,0x12C0,0x12C1,0x12C2,0x12C6,0x12C8,0x12D7,0x12D8,0x1311,0x1312,0x1316,0x1318,0x135B,0x1380,0x1390,0x13A0,0x13F5,0x1401,0x166D,0x166F,0x1677,0x1681,0x169B,0x16A0,0x16EB,0x1700,0x170D,0x170E,0x1712,0x1720,0x1732,0x1740,0x1752,0x1760,0x176D,0x176E,0x1771,0x1780,0x17B4,0x17DC,0x17DD,0x1820,0x1843,0x1844,0x1878,0x1880,0x18A9,0x18AA,0x18AB,0x1900,0x191D,0x1950,0x196E,0x1970,0x1975,0x1980,0x19AA,0x19C1,0x19C8,0x1A00,0x1A17,0x1B05,0x1B34,0x1B45,0x1B4C,0x1B83,0x1BA1,0x1BAE,0x1BB0,0x1C00,0x1C24,0x1C4D,0x1C50,0x1C5A,0x1C78,0x2135,0x2139,0x2D30,0x2D66,0x2D80,0x2D97,0x2DA0,0x2DA7,0x2DA8,0x2DAF,0x2DB0,0x2DB7,0x2DB8,0x2DBF,0x2DC0,0x2DC7,0x2DC8,0x2DCF,0x2DD0,0x2DD7,0x2DD8,0x2DDF,0x3006,0x3007,0x303C,0x303D,0x3041,0x3097,0x309F,0x30A0,0x30A1,0x30FB,0x30FF,0x3100,0x3105,0x312E,0x3131,0x318F,0x31A0,0x31B8,0x31F0,0x3200,0x3400,0x4DB6,0x4E00,0x9FC4,0xA000,0xA015,0xA016,0xA48D,0xA500,0xA60C,0xA610,0xA620,0xA62A,0xA62C,0xA66E,0xA66F,0xA7FB,0xA802,0xA803,0xA806,0xA807,0xA80B,0xA80C,0xA823,0xA840,0xA874,0xA882,0xA8B4,0xA90A,0xA926,0xA930,0xA947,0xAA00,0xAA29,0xAA40,0xAA43,0xAA44,0xAA4C,0xAC00,0xD7A4,0xF900,0xFA2E,0xFA30,0xFA6B,0xFA70,0xFADA,0xFB1D,0xFB1E,0xFB1F,0xFB29,0xFB2A,0xFB37,0xFB38,0xFB3D,0xFB3E,0xFB3F,0xFB40,0xFB42,0xFB43,0xFB45,0xFB46,0xFBB2,0xFBD3,0xFD3E,0xFD50,0xFD90,0xFD92,0xFDC8,0xFDF0,0xFDFC,0xFE70,0xFE75,0xFE76,0xFEFD,0xFF66,0xFF70,0xFF71,0xFF9E,0xFFA0,0xFFBF,0xFFC2,0xFFC8,0xFFCA,0xFFD0,0xFFD2,0xFFD8,0xFFDA,0xFFDD,0x10000,0x1000C,0x1000D,0x10027,0x10028,0x1003B,0x1003C,0x1003E,0x1003F,0x1004E,0x10050,0x1005E,0x10080,0x100FB,0x10280,0x1029D,0x102A0,0x102D1,0x10300,0x1031F,0x10330,0x10341,0x10342,0x1034A,0x10380,0x1039E,0x103A0,0x103C4,0x103C8,0x103D0,0x10450,0x1049E,0x10800,0x10806,0x10808,0x10809,0x1080A,0x10836,0x10837,0x10839,0x1083C,0x1083D,0x1083F,0x10840,0x10900,0x10916,0x10920,0x1093A,0x10A00,0x10A01,0x10A10,0x10A14,0x10A15,0x10A18,0x10A19,0x10A34,0x12000,0x1236F,0x20000,0x2A6D7,0x2F800,0x2FA1E]
,Lt:[0x1C5,0x1C6,0x1C8,0x1C9,0x1CB,0x1CC,0x1F2,0x1F3,0x1F88,0x1F90,0x1F98,0x1FA0,0x1FA8,0x1FB0,0x1FBC,0x1FBD,0x1FCC,0x1FCD,0x1FFC,0x1FFD]
,Lm:[0x2B0,0x2C2,0x2C6,0x2D2,0x2E0,0x2E5,0x2EC,0x2ED,0x2EE,0x2EF,0x374,0x375,0x37A,0x37B,0x559,0x55A,0x640,0x641,0x6E5,0x6E7,0x7F4,0x7F6,0x7FA,0x7FB,0x971,0x972,0xE46,0xE47,0xEC6,0xEC7,0x10FC,0x10FD,0x17D7,0x17D8,0x1843,0x1844,0x1C78,0x1C7E,0x1D2C,0x1D62,0x1D78,0x1D79,0x1D9B,0x1DC0,0x2090,0x2095,0x2C7D,0x2C7E,0x2D6F,0x2D70,0x2E2F,0x2E30,0x3005,0x3006,0x3031,0x3036,0x303B,0x303C,0x309D,0x309F,0x30FC,0x30FF,0xA015,0xA016,0xA60C,0xA60D,0xA67F,0xA680,0xA717,0xA720,0xA770,0xA771,0xA788,0xA789,0xFF70,0xFF71,0xFF9E,0xFFA0]
,Mn:[0x300,0x370,0x483,0x488,0x591,0x5BE,0x5BF,0x5C0,0x5C1,0x5C3,0x5C4,0x5C6,0x5C7,0x5C8,0x610,0x61B,0x64B,0x65F,0x670,0x671,0x6D6,0x6DD,0x6DF,0x6E5,0x6E7,0x6E9,0x6EA,0x6EE,0x711,0x712,0x730,0x74B,0x7A6,0x7B1,0x7EB,0x7F4,0x901,0x903,0x93C,0x93D,0x941,0x949,0x94D,0x94E,0x951,0x955,0x962,0x964,0x981,0x982,0x9BC,0x9BD,0x9C1,0x9C5,0x9CD,0x9CE,0x9E2,0x9E4,0xA01,0xA03,0xA3C,0xA3D,0xA41,0xA43,0xA47,0xA49,0xA4B,0xA4E,0xA51,0xA52,0xA70,0xA72,0xA75,0xA76,0xA81,0xA83,0xABC,0xABD,0xAC1,0xAC6,0xAC7,0xAC9,0xACD,0xACE,0xAE2,0xAE4,0xB01,0xB02,0xB3C,0xB3D,0xB3F,0xB40,0xB41,0xB45,0xB4D,0xB4E,0xB56,0xB57,0xB62,0xB64,0xB82,0xB83,0xBC0,0xBC1,0xBCD,0xBCE,0xC3E,0xC41,0xC46,0xC49,0xC4A,0xC4E,0xC55,0xC57,0xC62,0xC64,0xCBC,0xCBD,0xCBF,0xCC0,0xCC6,0xCC7,0xCCC,0xCCE,0xCE2,0xCE4,0xD41,0xD45,0xD4D,0xD4E,0xD62,0xD64,0xDCA,0xDCB,0xDD2,0xDD5,0xDD6,0xDD7,0xE31,0xE32,0xE34,0xE3B,0xE47,0xE4F,0xEB1,0xEB2,0xEB4,0xEBA,0xEBB,0xEBD,0xEC8,0xECE,0xF18,0xF1A,0xF35,0xF36,0xF37,0xF38,0xF39,0xF3A,0xF71,0xF7F,0xF80,0xF85,0xF86,0xF88,0xF90,0xF98,0xF99,0xFBD,0xFC6,0xFC7,0x102D,0x1031,0x1032,0x1038,0x1039,0x103B,0x103D,0x103F,0x1058,0x105A,0x105E,0x1061,0x1071,0x1075,0x1082,0x1083,0x1085,0x1087,0x108D,0x108E,0x135F,0x1360,0x1712,0x1715,0x1732,0x1735,0x1752,0x1754,0x1772,0x1774,0x17B7,0x17BE,0x17C6,0x17C7,0x17C9,0x17D4,0x17DD,0x17DE,0x180B,0x180E,0x18A9,0x18AA,0x1920,0x1923,0x1927,0x1929,0x1932,0x1933,0x1939,0x193C,0x1A17,0x1A19,0x1B00,0x1B04,0x1B34,0x1B35,0x1B36,0x1B3B,0x1B3C,0x1B3D,0x1B42,0x1B43,0x1B6B,0x1B74,0x1B80,0x1B82,0x1BA2,0x1BA6,0x1BA8,0x1BAA,0x1C2C,0x1C34,0x1C36,0x1C38,0x1DC0,0x1DE7,0x1DFE,0x1E00,0x20D0,0x20DD,0x20E1,0x20E2,0x20E5,0x20F1,0x2DE0,0x2E00,0x302A,0x3030,0x3099,0x309B,0xA66F,0xA670,0xA67C,0xA67E,0xA802,0xA803,0xA806,0xA807,0xA80B,0xA80C,0xA825,0xA827,0xA8C4,0xA8C5,0xA926,0xA92E,0xA947,0xA952,0xAA29,0xAA2F,0xAA31,0xAA33,0xAA35,0xAA37,0xAA43,0xAA44,0xAA4C,0xAA4D,0xFB1E,0xFB1F,0xFE00,0xFE10,0xFE20,0xFE27,0x101FD,0x101FE,0x10A01,0x10A04,0x10A05,0x10A07,0x10A0C,0x10A10,0x10A38,0x10A3B,0x10A3F,0x10A40,0x1D167,0x1D16A,0x1D17B,0x1D183,0x1D185,0x1D18C,0x1D1AA,0x1D1AE,0x1D242,0x1D245,0xE0100,0xE01F0]
,Me:[0x488,0x48A,0x6DE,0x6DF,0x20DD,0x20E1,0x20E2,0x20E5,0xA670,0xA673]
,Mc:[0x903,0x904,0x93E,0x941,0x949,0x94D,0x982,0x984,0x9BE,0x9C1,0x9C7,0x9C9,0x9CB,0x9CD,0x9D7,0x9D8,0xA03,0xA04,0xA3E,0xA41,0xA83,0xA84,0xABE,0xAC1,0xAC9,0xACA,0xACB,0xACD,0xB02,0xB04,0xB3E,0xB3F,0xB40,0xB41,0xB47,0xB49,0xB4B,0xB4D,0xB57,0xB58,0xBBE,0xBC0,0xBC1,0xBC3,0xBC6,0xBC9,0xBCA,0xBCD,0xBD7,0xBD8,0xC01,0xC04,0xC41,0xC45,0xC82,0xC84,0xCBE,0xCBF,0xCC0,0xCC5,0xCC7,0xCC9,0xCCA,0xCCC,0xCD5,0xCD7,0xD02,0xD04,0xD3E,0xD41,0xD46,0xD49,0xD4A,0xD4D,0xD57,0xD58,0xD82,0xD84,0xDCF,0xDD2,0xDD8,0xDE0,0xDF2,0xDF4,0xF3E,0xF40,0xF7F,0xF80,0x102B,0x102D,0x1031,0x1032,0x1038,0x1039,0x103B,0x103D,0x1056,0x1058,0x1062,0x1065,0x1067,0x106E,0x1083,0x1085,0x1087,0x108D,0x108F,0x1090,0x17B6,0x17B7,0x17BE,0x17C6,0x17C7,0x17C9,0x1923,0x1927,0x1929,0x192C,0x1930,0x1932,0x1933,0x1939,0x19B0,0x19C1,0x19C8,0x19CA,0x1A19,0x1A1C,0x1B04,0x1B05,0x1B35,0x1B36,0x1B3B,0x1B3C,0x1B3D,0x1B42,0x1B43,0x1B45,0x1B82,0x1B83,0x1BA1,0x1BA2,0x1BA6,0x1BA8,0x1BAA,0x1BAB,0x1C24,0x1C2C,0x1C34,0x1C36,0xA823,0xA825,0xA827,0xA828,0xA880,0xA882,0xA8B4,0xA8C4,0xA952,0xA954,0xAA2F,0xAA31,0xAA33,0xAA35,0xAA4D,0xAA4E,0x1D165,0x1D167,0x1D16D,0x1D173]
,Nl:[0x16EE,0x16F1,0x2160,0x2183,0x2185,0x2189,0x3007,0x3008,0x3021,0x302A,0x3038,0x303B,0x10140,0x10175,0x10341,0x10342,0x1034A,0x1034B,0x103D1,0x103D6,0x12400,0x12463]
,Zl:[0x2028,0x2029]
,Zp:[0x2029,0x202A]
,Cs:[0xD800,0xE000]
,Co:[0xE000,0xF900,0xF0000,0xFFFFE,0x100000,0x10FFFE]
};
var nil=[]
var U=[0]

function fC(c){return fI(cpFC(c))}
function fI(cp){return [cp,cp+1]}

function fIR(from,to){return [from,to+1]}
function fCR(from,to){
 from=cpFC(from);to=cpFC(to)
 return to>from ?[from,to+1] :[to,from+1]}

function empty(cset){return !cset.length}
function one(cset){return cset.length==2 && cset[0]+1 == cset[1]}

function cpFC(s){var hi,lo
 if(/[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(s)){
  hi=s.charCodeAt(0)
  lo=s.charCodeAt(1)
  return 0x10000+(((hi&0x3FF) << 10) | (lo&0x3FF))}
 return s.charCodeAt(0)}

function comp(cset){
 return (cset[0]==0) ? cset.slice(1)
                     : [0].concat(cset.slice())}

function fL(a){var i,l,ret=[]
 for(i=0,l=a.length;i<l;){
  ret.push(a[i])
  while(a[i]+1 == a[++i] && i<l);
  if(a[i-1]!==0x10ffff)ret.push(a[i-1]+1)}
 return ret}

function tL(cset){var i,l,state=false,ret=[]
 for(i=0,l=cset.length;i<l;i++){
  if(state)fill(cset[i-1],cset[i])
  state=!state}
 if(state)fill(cset[i-1],0x10FFFF)
 return ret
 function fill(a,b){
  for(;a<b;a++)ret.push(a)}}

function fS(s){var res=[]
 s.replace(/[\u0000-\uD7FF\uDC00-\uFFFF]|([\uD800-\uDBFF][\uDC00-\uDFFF])|[\uD800-\uDBFF]/g,
  function(m,u){
   if(u)res.push(cpFC(u))
   else res.push(m[0].charCodeAt(0))})
 return fL(res.sort(function(a,b){return a-b}).filter(function(c,i,a){return !i||a[i-1]!=a[i]}))}

function member(cset,c){var state=false,i,l
 if(c>0x10FFFF)return false
 for(i=0,l=cset.length;i<l;i++){
  if(cset[i]>c)return state
  state=!state}
 return state}

function eq(as,bs){var i,l
 l=as.length
 if(l!=bs.length)return false
 for(i=0;i<l;i++)if(as[i]!=bs[i])return false
 return true}

function diff(as,bs){var
 ret=[],i=0,j=0,a,b,al=as.length,bl=bs.length,last,state=0
 if(!al)return []
 if(!bl)return as
 a=as[0]
 b=bs[0]
 if(isNaN(a)||isNaN(b))throw Error('cset_difference: bad input')
 for(;;){
  if(a < b){
   if(!(state & 1)){
    if(a==last) ret.pop(); else ret.push(a)
    last=a}
   state ^= 2
   a=(++i<al)?as[i]:0x110000}
  else{
   if(a==0x110000 && b==0x110000) return ret
   if(state & 2){
    if(b==last) ret.pop(); else ret.push(b)
    last=b}
   state ^= 1
   b=(++j<bl)?bs[j]:0x110000}}}

function union(as,bs){var
 ret=[],i=0,j=0,a,b,al=as.length,bl=bs.length,last,state=0
 if(!al)return bs
 if(!bl)return as
 a=as[0]
 b=bs[0]
 if(isNaN(a)||isNaN(b))throw Error('cset_union: bad input')
 for(;;){
  if(a < b){
   if(!(state & 1)){
    if(a==last) ret.pop(); else ret.push(a)
    last=a}
   state ^= 2
   a=(++i<al)?as[i]:0x110000}
  else{
   if(a==0x110000 && b==0x110000) return ret
   if(!(state & 2)){
    if(b==last) ret.pop(); else ret.push(b)
    last=b}
   state ^= 1
   b=(++j<bl)?bs[j]:0x110000}}}

function inter(as,bs){return comp(union(comp(as),comp(bs)))}
esc.safe=[32,33];
 ['Lu'
 ,'Ll'
 ,'Lt'
 ,'Lm'
 ,'Lo'
 ,'Nd'
 ,'No'
 ,'Pc'
 ,'Pd'
 ,'Ps'
 ,'Pe'
 ,'Pi'
 ,'Pf'
 ,'Po'
 ,'Sm'
 ,'Sc'
 ,'Sk'
 ,'So'
 ].forEach(function(s){esc.safe=union(esc.safe,cUC[s])})
 esc.safe=inter(esc.safe,fIR(0,0xFFFF))

function esc(n){var
 x={9:'\\t',10:'\\n',11:'\\v',12:'\\f',13:'\\r',45:'\\-',92:'\\\\',93:'\\]'}[n]
 if(x)return x
 if(member(esc.safe,n))return String.fromCharCode(n)
 function fill(s){return ('000'+s).slice(-4)}
 return "\\u"+fill(n.toString(16))}

function reCC_bmp(cset){var res=[],state=0,i,l,c
 if(one(cset)) return esc(cset[0])
 for(i=0,l=cset.length;i<l,cset[i]<0x10000;i++){
  if(state && cset[i] == c+1){state=0;continue}
  c=cset[i]
  if(state){res.push('-');c--}
  res.push(esc(c))
  state=!state}
 if(state){res.push('-\\uffff')}
 return '['+res.join('')+']'}

function splitAtBMP(cset){var bmp=[],i=0,l=cset.length,c,state
 for(;i<l;i++){
  c=cset[i]
  if(c>0xFFFF){
   state=i&1
   if(state)bmp.push(0x10000)
   if(state&&c===0x10000){i++;state=0}
   return [bmp
          ,(state?[0x10000]:[]).concat(cset.slice(i))]}
  bmp.push(c)}
 state=l&1
 if(state)bmp.push(0x10000)
 return [bmp
        ,(state?[0x10000]:[])]}

function surrogatePair(n){
 n-=0x10000
 return [0xD800|(n>>10),0xDC00|(n&0x3FF)]}

function surrogateSet(cset){var i=0,l=cset.length,state,c,prev,hi,lo,ret=[],prev_hi,prev_lo,full=[],cur,all_hi=[],a
 if(l&1){cset[l++]=0x110000}
 cset.push(0x110001)
 for(;i<l,c=cset[i];i++){
  if(c<0x10000)continue
  state=i&1
  if(state){
   a=surrogatePair(c);hi=a[0];lo=a[1]
   if(!cur){prev_hi=0xD800;prev_lo=0xDC00;cur=[[0xD800,0xD801],[0xDC00]]}
   if(hi===prev_hi) cur[1].push(lo)
   else{
    if(prev_lo===0xDC00){full.push(prev_hi);all_hi.push(prev_hi)}
    else{cur[1].push(0xE000);ret.push(cur);all_hi.push(prev_hi)}
    while(++prev_hi < hi){full.push(prev_hi);all_hi.push(prev_hi)}
    if(lo===0xDC00) cur=[[hi,hi+1],[]]
    else cur=[[hi,hi+1],[0xDC00,lo]]}
   prev_lo=lo}
  else{
   a=surrogatePair(c);hi=a[0];lo=a[1]
   if(cur && hi===prev_hi) cur[1].push(lo)
   else{
    if(cur && cur[1].length){ret.push(cur);all_hi.push(prev_hi)}
    prev_hi=hi
    cur=[[hi,hi+1],[lo]]}
   prev_lo=lo}}
 return [fL(all_hi)
        ,(full.length?[[fL(full),[0xDC00,0xE000]]]
                     :[]).concat(ret)
        ]}

function sS2RE(surr){var ret=[]
 surr.forEach(function(pair){
  ret.push(f(pair[0])+f(pair[1]))})
 return ret.join('|')
 function f(cset){
  return reCC_bmp(cset)}}

function reCC(cset){var a,bmp,sup,all_hi,surr,d,i,ret=[]
 a=splitAtBMP(cset);bmp=a[0];sup=a[1]
 a=surrogateSet(sup);all_hi=a[0];surr=a[1]
 d=diff(bmp,all_hi)
 i=inter(bmp,all_hi)
 if(!empty(d)) ret.push(reCC_bmp(d))
 if(surr.length) ret.push(sS2RE(surr))
 if(!empty(i)) ret.push(reCC_bmp(i))
 return ret.join('|')}

function tSR(cset){var a,bmp,sup,all_hi,surr,d,i
 a=splitAtBMP(cset);bmp=a[0];sup=a[1]
 a=surrogateSet(sup);all_hi=a[0];surr=a[1]
 return {bmp:bmp,surrogate_range_pairs:surr,high_surrogates:all_hi}}

function fGC(x){
 var ret=cUC[x]
 if(!ret) throw Error('unknown Unicode General Category '+x)
 return ret}

function show(cset){var i,l,ret=[],c
 if(cset.length % 2) cset.push(0x110000)
 for(i=0,l=cset.length;i<l;i+=2){
  c=cset[i]
  if(cset[i+1]==c+1)ret.push(c.toString(16))
  else ret.push(c.toString(16)+'-'+(cset[i+1]-1).toString(16))}
 return ret.join('\n')}
var i,l,e,es=
[['fromChar',fC]
,['fromInt',fI]
,['universe',U]
,['nil',nil]
,['empty',empty]
,['singleton',one]
,['fromIntRange',fIR]
,['fromCharRange',fCR]
,['fromUnicodeGeneralCategory',fGC]
,['complement',comp]
,['fromList',fL]
,['toList',tL]
,['fromString',fS]
,['member',member]
,['equal',eq]
,['difference',diff]
,['union',union]
,['intersection',inter]
,['toRegex',reCC]
,['toSurrogateRepresentation',tSR]
,['show',show]
]
for(i=0,l=es.length;i<l,e=es[i];i++)exports[e[0]]=e[1]
})(CSET={});

/* PEG_codegen_6_attr.js */ 

function v6_named_res(result){var dict,ret,hide,warnings,st
 hide=
  ['anonymous']
 //st=showTree(result,{hide:hide})
 dict={
RuleSet:
  function(_,cn){ret=cn},

Rule:
  function(_,cn){return [cn[0][1],cn[1]]},

NonTerminal:
  function(m){return re_reference(m.text())},

OrdChoice:
  function(_,cn){return re_union(cn)},

AtomicExpr:transparent,
SeqUnit:transparent,
Replicand:transparent,
ParenthExpr:transparent,

AnyRep:
  function(_,cn){return re_rep(0,0,cn[0])},
M: function(m){return parseInt(m.text(),10)},
N: function(m){return parseInt(m.text(),10)},
MNRep:
  function(_,cn){
   if(cn.length==2)return re_rep(cn[1],cn[1],cn[0])
   else return re_rep(cn[1],cn[2],cn[0])},
Optional:
  function(_,cn){return re_rep(0,1,cn[0])},
PosRep:
  function(_,cn){return re_rep(1,0,cn[0])},

Sequence:
  function(_,cn){return re_sequence(cn)},

StrLit:
  function(m){return re_from_str(m.text().slice(1,-1))},

Epsilon:
  function(){return re_from_str('')},

NegLookahead:
  function(_,cn){return re_neg_lookahead(cn[0])},

PosLookahead:
  function(_,cn){return re_pos_lookahead(cn[0])},

PropSpec:
  function(m){return CSET.fromUnicodeGeneralCategory(m.text())},

NegativeSpec:
  function(_,cn){return CSET.complement(cn[0])},
PositiveSpec:
  function(_,cn){return cn[0]},
UnicodePropSpec:
  function(_,cn){return cn[0]},
CodePointExpr:
  function(_,cn){return cn[0]},

CharSet:
  function(_,cn){return re_from_cset(cn[0])},
CharSetUnion:
  function(_,cn){return foldl1(CSET.union,cn)},
//CharSetIntersection:
//  function(_,cn){return foldl1(CSET.intersection,cn)},
CharSetDifference:
  function(_,cn){return foldl1(CSET.difference,cn)},
CharSetExpr:transparent,
PosCharSet:
  function(_,cn){return cn[0]||CSET.nil},
NegCharSet:
  function(_,cn){return CSET.complement(cn[0]||CSET.nil)},

UPlusCodePoint:
  function(m){return parseInt(m.text().slice(2),16)},

CodePointLit:
  function(m){return cpFC(m.text())},

CodePoint:
  function(_,cn){return CSET.fromInt(cn[0])},

CodePointRange:
  function(_,cn){return CSET.fromIntRange(cn[0][0],cn[1][0])},

CodePointFrom:transparent,
CodePointTo:transparent,

warn:function(s){warnings.push(s)}

}
 warnings=[]
 treeWalker(dict,result)
 if(warnings.length)throw warnings
 return ret
 return pp(ret)+'\n\n'+pp(warnings.slice(0,8))+'\n\n'+st
 function transparent(_,cn){return cn[0]}

 // from CSET
 function cpFC(s){var hi,lo
  if(/[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(s)){
   hi=s.charCodeAt(0)
   lo=s.charCodeAt(1)
   return 0x10000+(((hi&0x3FF) << 10) | (lo&0x3FF))}
  return s.charCodeAt(0)}}


/* PEG_codegen_6.js */ 

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
              +
              js_comment_esc(''
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
              )
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

// XXX move this
function js_comment_esc(s){
 return s.replace(/\*\//g,'\\*\\/')}

function v6_dbg(opts,rules){return function(msg){
  return 'dbg("'+msg+'")'}}

function v6_legend(opts,rules){
 return opts.fname+'.legend="'+v6_sexp(rules).replace(/\n/g,'\\n')+'";'}

function v6_sexp(res){var name,ret=[],re_shortnames
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

// v6_leaf_dfas generates DFA objects for "leaf" expressions, i.e. simple expressions that we can determine to be regular.
// It attaches DFA objects to the expr objects, they are then used later to output code that will parse according to that DFA.

function v6_leaf_dfas(opts,rules){var p
 for(p in rules){
  //log('v6_leaf_dfas rule: '+p)
  go(rules[p].expr)}
 return rules
 function go(expr){var dfa
  if(dfa=v6_leaf_dfa(opts,expr))expr.dfa=dfa
  expr.subexprs.map(go)}}

// Currently we only generate DFAs for string literals (2) and character classes (0).
function v6_leaf_dfa(opts,expr){
 switch(expr.type){
 case 0:
  return v6_dfa_cset(expr.cset)
 case 2:
  return v6_dfa_seq(expr.subexprs,{})}}

function v6_dfa(opts,rules,rule){var next_dep,re
 re=rule.re
 while(next_dep=re_dependency(re))
  re=v6_substitute(next_dep,rules[next_dep].re)(re)
 return v6_dfa_2(re,{})
 //return pp(re)+'\n'+v6_dfa_2(re,{})+log.get()
 }

function v6_dfa_2(expr,state){
 switch(expr.type){
 case 0:
  return v6_dfa_cset(expr.cset,state)
 case 1:
  return //v6_dfa_2(v6_strLit2seq(expr.subexprs),state)
 case 2:
  return v6_dfa_seq(expr.subexprs,state)
 case 3:
  return v6_dfa_ordC(expr.subexprs,state)
 case 4:
  return v6_dfa_rep(only_sub(expr),state)
 case 5:
  return //throw new Error('no named references here')
 case 6:
  return v6_dfa_neg(only_sub(expr),state)
 case 7:
  return v6_dfa_pos(only_sub(expr),state)
 case 8:
  return //v6_dfa_2([2,[]],state)
 default:
  throw new Error('v6_dfa: unexpected re type '+expr.type)}
 function only_sub(expr){
  assert(expr.subexprs.length==1,'exactly one subexpression')
  return expr.subexprs[0]}}

function v6_dfa_cset(cset,state){var sr,surrogates,bmp,i,l,srps,hi_cset,lo_cset,trans
 sr=CSET.toSurrogateRepresentation(cset)
 if(sr.surrogate_range_pairs.length == 0)
  return {type:'transition'
         ,transition:[[cset,{type:'match'}]]}
 surrogates=CSET.fromIntRange(0xD800,0xDFFF)
 // here we take the position that unmatched surrogates simply can never be accepted by a PanPG parser; this is the same as the v5 codegen and the v6 codegen without DFAs.  Other alternatives exist, however, and there are cases where searching for unmatched surrogates specifically is what is desired, so we might need to have some kind of optional behavior in the future.
 bmp=CSET.difference(sr.bmp,surrogates)
 srps=sr.surrogate_range_pairs
 trans=[[bmp,{type:'match'}]]
 for(i=0,l=srps;i<l;i++){
  hi_cset=srps[i][0];lo_cset=srps[i][1]
  trans.push([hi_cset,{type:'transition'
                      ,transition:[[lo_cset,{type:'match'}]]}])}
 return {type:'transition'
        ,transition:trans}}

function v6_dfa_seq(seq,state){var d1,d2
 //log('seq '+pp(seq))
 if(!seq.length)return {type:'match'}
 d1=v6_dfa_2(seq[0],state)
 //assert(d1,'d1 from seq[0]: '+pp(seq[0]))
 d2=v6_dfa_seq(seq.slice(1),state)
 //log({seq_d1:d1})
 //log({seq_d2:d2})
 return go(d1,d2)
 function go(d1,d2){
  if(!d1 || !d2) return
  if(d1.type=='fail')return d1
  if(d2.type=='fail')return d2
  if(d1.type=='match')return d2
  if(d2.type=='match')return d1
  return v6_dfa_transition_map(d1,function(d){return go(d,d2)})}}

function v6_dfa_transition_map(d,f){var i,l,ret=[],existing
 assert(d.type=='transition','DFA type is transition')
 for(i=0,l=d.transition.length;i<l;i++){existing=d.transition[i]
  ret[i]=[existing[0],f(existing[1])]}
 return {type:'transition'
        ,transition:ret}}

function v6_dfa_ordC(exprs,state){var d1,d2,merged
 //log('ordC '+pp(exprs))
 if(!exprs.length)return {type:'fail'}
 d1=v6_dfa_2(exprs[0],state)
 d2=v6_dfa_ordC(exprs.slice(1),state)
 //log({ordc_d1:d1})
 //log({ordc_d2:d2})
 return go(d1,d2)
 function go(d1,d2){
  if(!d1 || !d2)return
  if(d1.type=='fail')return d2
  if(d2.type=='fail')return d1
  if(d1.type=='match')return d1
  if(d2.type=='match')return v6_dfa_opt(d1,state)
  return v6_dfa_ordC_(v6_dfa_merge_transitions(d1,d2))}}

function v6_dfa_ordC_(x){var i,l,cset,t1,t2,ret,res,res2,cache,j
 ret=[]
 cache=[[],[]]
 for(i=0,l=x.length;i<l;i++){
  cset=x[i][0];t1=x[i][1];t2=x[i][2]
  //log([t1&&t1.type,t2&&t2.type])
  if(t1.type=='fail')res=t2; else
  if(t2.type=='fail')res=t1; else
  if(t1.type=='match')res=t1; else
  if(t2.type=='match'){/*log('118 return');*/return} // decline
  else{ // both are transition states
   res=v6_dfa_ordC_(v6_dfa_merge_transitions(t1,t2))}
  //log({i:i,res:res})
  if(!res)return
  assert(res,'v6_dfa_ordC_ has a value')
  if(res.type=='fail')continue
  res2=[cset,res]
  if((j=cache[0].indexOf(res))>-1){
   cache[1][j][0]=CSET.union(cache[1][j][0],cset)
   continue}
  cache[0].push(res);cache[1].push(res2)
  ret.push(res2)}
 return {type:'transition',transition:ret}}

function v6_dfa_merge_transitions(d1,d2){var i,l1,l2,j1s,j2s,t1,t2,fail,low1,low2,low1i,low2i,states1,states2,a,t1_next,t2_next,ret,prev,low,cset
 assert(d1.type=='transition'&&d2.type=='transition','called with transitions')
 fail={type:'fail'}
 t1=d1.transition;t2=d2.transition
 l1=t1.length;l2=t2.length
 states1=[];j1s=[];for(i=l1;i--;)states1[i]=j1s[i]=0
 states2=[];j2s=[];for(i=l2;i--;)states2[i]=j2s[i]=0
 prev=0
 ret=[]
 for(;;){
  a=lowest(t1,j1s);low1=a[0];low1i=a[1]
  a=lowest(t2,j2s);low2=a[0];low2i=a[1]
  t1_next=get_state(get_index(states1),t1)
  t2_next=get_state(get_index(states2),t2)
  if (low1 <= low2) {bump(states1,j1s,low1i);low=low1}
  if (low2 <= low1) {bump(states2,j2s,low2i);low=low2}
  if(low>0){
   // here we only produce single-range csets
   // a subsequent step could combine them
   cset= low==Infinity ? [prev] : [prev,low]
   ret.push([cset,t1_next,t2_next])}
  prev=low
  if(low1==Infinity && low2==Infinity)break}
 return ret
 // find the lowest unseen values in all csets in a transition
 // these represent flips between on and off, initially off
 // there may be more than one cset that flips on the same code point, so we use an array to store the i indices of the low values
 function lowest(transition,indices){var i,l,low_water_mark,val,j,ret_i
  low_water_mark=Infinity
  for(i=transition.length;i--;){
   j=indices[i]
   val=transition[i][0][j] // the jth value of the cset of the ith (cset,state) pair in the transition
   if(val<low_water_mark){
    low_water_mark=val
    ret_i=[i]}
   else if(val==low_water_mark){
    ret_i.push(i)}}
  return [low_water_mark,ret_i]}
 function bump(states,indices,is){var k,i
  if(!is)return
  for(k=0;k<is.length;k++){
   i=is[k]
   indices[i]++
   states[i]=!states[i]}}
 // get the active cset, assert at most one
 function get_index(states){var i,x
  for(i=states.length;i--;) if(states[i]){
   assert(x==undefined,'no overlapping csets in DLO')
   x=i}
  return x}
 function get_state(index,transition){
  if(index==undefined)return fail
  return transition[index][1]}}

// from an expression of the form α / ε, where d1 is a DFA-like corresponding to α
// here we currently only handle the case where α is determinate in one character, i.e. where d1 is a cset type, i.e. a transition which transitions only to fail or match states, not to any other transition state.
// other cases would require lookahead or backtracking, which we do not yet handle here
// actually, even this case involves lookahead, because the match needs to happen at the previous position, i.e. the position has already been advanced once by the time we read the next character.
// so we just decline here for now
function v6_dfa_opt(d1,state){}

function v6_dfa_rep(re,state){}

function v6_dfa_neg(re,state){}

function v6_dfa_pos(re,state){}

function v6_dfa_table(opts,rules){return function(id_D,id_s,id_pos,id_equiv,id_dfa_state,id_dfa_pos){
  return id_D+'='+map_reviver(v6_dfa_table_2(opts,rules))+'\n'
       + v6_dfa_reviver(id_s,id_pos,id_equiv,id_dfa_state,id_dfa_pos)}}

// generate the actual D table
function v6_dfa_table_2(opts,rules){
 return '['+opts.dfa_table.map(v6_dfa_encode(opts)).join(',')+']'}

// wrap the encoded array in a function call that will map revive() over it
// we cannot use [].map(revive) because IE (up to at least 7) does not support it
function map_reviver(array_literal){
 return 'function(a,i,l,b){for(i=0,l=a.length,b=[];i<l;i++)b[i]=a[i]&&revive(a[i]);return b}'
      + '('+array_literal+')'}

// example
// in:  {type:'transition',transition:[[[48,58],{type:'match'}]]}
// out: [[[[1]]]]
// a list of states, each of which is
//  a list of transitions, each of which is a tuple of
//   a list of equivalence class ids, and
//   a state id, omitted when = current + 1
function v6_dfa_encode(opts){return function _v6_dfa_encode(dfa){var key,i,l,match={},slots=[],indices=[],index=0,keys=[],equiv_states=[],parents=[],ret=[],equiv_count=0
  // state cache maps state keys onto slots
  //log(dfa)
  go(dfa)
  //log(slots)
  //log(keys)
  //log({indices:indices})
  //log({equiv_states:equiv_states})
  go2()
  //log({ret:ret})
  return v6_stringify(ret)
  function go(state){var i,l,a,cset,substate,equiv_classes,tr_keys,slot,st_key,n,our_index
   // if the state already has been assigned a slot, return it
   n=parents.indexOf(state)
   slot=slots.indexOf(state)
   if(n>-1)return '{'+(n-parents.length)+'}'
   if(slot>-1)return slot
   if(state.type=='match') key='[m]'
   if(state.type=='fail') key='[f]'
   if(state.type=='transition'){
    our_index=index++
    slot=slots.length
    slots[slot]=state
    tr_keys=[]
    for(i=0,l=state.transition.length;i<l;i++){a=state.transition[i]
     cset=a[0];substate=a[1]
     equiv_classes=v6_cset_equiv_lookup(opts)(cset)
     st_key=go(substate)
     tr_keys.push(equiv_classes+'→'+st_key)}
    key='['+tr_keys.join(';')+']'}
   n=keys.indexOf(key)
   if(n>-1){
    equiv_states[slot]=n
    equiv_count++}
   else{
    keys[slot]=key
    indices[slot]=our_index
    ret[our_index]=state}
   return key}
  function go2(){var trs,i,l,j,l2,a,state,tr,index,target,equiv_classes
   for(i=0,l=slots.length;i<l;i++){state=slots[i]
    assert(state.type='transition')
    if(equiv_states[i])continue
    index=indices[i]
    trs=[]
    for(j=0,l2=state.transition.length;j<l2;j++){tr=state.transition[j]
     target=id(tr[1])
     equiv_classes=v6_cset_equiv_lookup(opts)(tr[0])
     if(target==index+1) trs.push([equiv_classes])
     else                trs.push([equiv_classes,target])}
    ret[index]=trs}}
  function id(state){var slot
   if(state.type=='match')return ret.length
   if(state.type=='fail')throw new Error('v6_dfa_encode: unhandled type')
   assert(state.type=='transition')
   slot=slots.indexOf(state)
   if(equiv_states[slot])slot=equiv_states[slot]
   return indices[slot]}}}

function v6_stringify(x){var a=[],p
 if(x instanceof Array){
  return '['+x.map(v6_stringify).join(',')+']'}
 if(typeof x=='object'){
  for(p in x)a.push(p+':'+v6_stringify(x[p]))
  return '{'+a.join(',')+'}'}
 return String(x)}

function v6_dfa_reviver(id_s,id_pos,id_equiv,id_dfa_state,id_dfa_pos){var function_dfa
 function_dfa=
  // ss     states
  // l_ss   length of ss
  // st     state
  // t      transition
  // a      intermediate array created per state
  // d      dfa array (of states)
    'function dfa(ss){var i,l_ss,st,l_s,t,l_t,a,d=[],j,k,l;'
  +  'for(i=0,l_ss=ss.length;i<l_ss;i++){st=ss[i];'
  +   'a=[];'
  +   'for(j=0,l_s=st.length;j<l_s;j++){t=st[j];'
  +    'for(k=0,l_t=t[0].length;k<l_t;k++){'
  +     'a[t[0][k]]=t[1]===true?l_ss:t[1]}}'
  +   'for(j=0,l=a.length;j<l;j++)if(a[j]==undefined)a[j]=l_ss+1;'
  +   'd[i]=a}' + '\n  '
  +  'return function _dfa(st,i){var eq,pr;'
  +   'while(st<l_ss){'
  +    'eq='+id_equiv+'['+id_s+'.charCodeAt(i++)];'
  +    'st=d[pr=st][eq]}'
      // only after the state transition fails do we test for end-of-chunk
      // if at EOC, then s.charCodeAt(i) == NaN and equiv[NaN] == undefined
  +   'if(eq==undefined&&i>='+id_s+'.length){'
      // we store the previous state (current state is undefined) and position
  +    id_dfa_state+'=pr;'+id_dfa_pos+'=i-1;'
      // return undefined to signal that we need more data
  +    'return'
  +   '}' // close if EOS
  +   id_dfa_state+'=0;'
  +   id_dfa_pos+'=undefined;'
  +   'if(st==l_ss){'+id_pos+'=i;return true}'
  +   'return false'
  +  '}' // close function _dfa()
  + '}' // close function dfa()
 return ''
  + 'function revive(x){var i,l,state,j,l2,all=[],t,ts;'
  +  'if(!x)return;'
  +  'for(i=0,l=x.length;i<l;i++){state=x[i];'
  +   'ts=[];' // transitions
  +   'for(j=0,l2=state.length;j<l2;j++){t=state[j];'
  +    'if(t[1]==l) ts.push([t[0],true]);'
  +    'else ts.push([t[0],t[1]==undefined?i+1:t[1]])}'
  +   'all.push(ts)}'
  +  'return dfa(all)'
  +  '\n '+function_dfa
  + '}'}


function v6_cset_equiv(opts,rules){var p,cgroup_set,big_arr,all_csets,cset_cache,i,char_count,cset_id,equiv_class,equiv_classes,equiv_class_id
 // here we "condense" or collapse the csets into a single array which maps code units which are treated the same in every case in the grammar onto a single value
 cgroup_set=[]
 char_count=65536 // 2^16 distinct UTF-16 code units
 all_csets=[],cset_cache={}
 // first we construct a big array which contains, for each UTF-16 code unit, a list of csets in which it is included.
 big_arr=Array(char_count)
 for(i=0;i<char_count;i++)big_arr[i]=[]
 // collect all the csets in all_csets, and cache them in cset_cache, keyed by canonical string representation
 cset_id=0
 for(p in rules)go(rules[p])
 //log({cset_cache:cset_cache})
 opts.cset_equiv_class_array=big_arr
 // we fill the big_arr by iterating over each character in each cset
 for(p in cset_cache) populate_big_arr(cset_cache[p])
 //log(v6_rle_enc(concat(big_arr)))
 // we then iterate over the big array and calculate the quotient set and equivalence relation, character by character
 // in the big array, we replace each character's list of csets with the id of its equivalence class
 // in each cached cset object, we store the id of each equivalence class that contributes to that cset
 equiv_classes={}
 equiv_class_id=0
 for(i=0;i<char_count;i++){
  equiv_class=get_equiv_class(big_arr[i])
  big_arr[i]=equiv_class.id}
 opts.cset_cache=cset_cache
 opts.equiv_classes=equiv_classes
 opts.cset_equiv_class_array=big_arr
 //log(v6_rle_enc(big_arr))
 return rules
 function populate_big_arr(cset){var arr,i,l,subset
  subset=CSET.intersection(CSET.fromIntRange(0,char_count-1),cset.cset)
  arr=CSET.toList(subset)
  //log({arr:arr})
  for(i=0,l=arr.length;i<l;i++){
   big_arr[arr[i]].push(cset.id)}}
 function get_equiv_class(cset_ids){var key
  key='equiv_class_'+cset_ids.join(',')
  if(key in equiv_classes)return equiv_classes[key]
  cset_ids.forEach(function(cset_id){all_csets[cset_id].equivs.push(equiv_class_id)})
  return equiv_classes[key]={id:equiv_class_id++,key:key,member_cset_ids:cset_ids}}
 function go(rule){
  rule.all_csets.forEach(go_cset)
  function go_cset(cset){var key
   key='cset_'+cset.join(',')
   if(key in cset_cache)return
   all_csets[cset_id]=cset_cache[key]={key:key,cset:cset,equivs:[],id:cset_id}
   cset_id++}}}

function v6_cset_equiv_array(opts,rules,varname){
 return varname+'='+v6_rle_if_shorter(opts.cset_equiv_class_array)+ '\n'
      + v6_function_rle_dec+'\n'}

function v6_cset_equiv_lookup(opts){return function _v6_cset_equiv_lookup(cset){var key
  key='cset_'+cset.join(',')
  if(!(key in opts.cset_cache))throw new Error('unknown cset '+key)
  return opts.cset_cache[key].equivs}}

function v6_rle_enc(arr){var i,l,count,x,ret=[]
 for(x=arr[0],count=1,i=1,l=arr.length;i<l;i++){
  if(arr[i]==x){count++;continue}
  ret.push(count,x)
  x=arr[i]
  count=1}
 ret.push(count,x)
 return ret}

function v6_rle_dec(){}

// RLE encode if the result is shorter by at least 16 chars
function v6_rle_if_shorter(arr){var x,y
 x='rle_dec(['+v6_rle_enc(arr).join(',')+'])'
 y='['+arr.join(',')+']'
 if(y.length - x.length > 16) return x
 return y}

// the decode function as a string literal
var v6_function_rle_dec=
 'function rle_dec(a){var r=[],i,l,n,x,ll;'+
  'for(i=0,l=a.length;i<l;i+=2){'+
   'n=a[i];x=a[i+1];'+
   'r.length=ll=r.length+n;'+
   'for(;n;n--)r[ll-n]=x}'+
  'return r}'

// the decode function is used in some of our tests so let's add a shim for it
function v6_rle_dec(a){
 v6_rle_dec=eval('('+v6_function_rle_dec+')')
 return v6_rle_dec(a)}

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

exports.generateParser=generateParser
exports.explain=explain

})(typeof exports=='object'?exports:PanPG={});