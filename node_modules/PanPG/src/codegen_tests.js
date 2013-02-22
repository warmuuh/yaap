function buildES5_commonjs(es5,stream,opts){
 opts.patches=[stream]
 return generateParser(es5,opts)}

function buildJSParser(es5,streamable,web_compat,opts){
 return showTree(parsePEG(es5))
 return generateParser([es5,streamable,web_compat],opts)}

function showTree_scratch(peg,input){var code
 code=generateParser(peg,{fname:'showTree_scratch_code'})
 eval(code)
 return showTree(showTree_scratch_code(input))}

function explain_scratch(peg,input){
 return explain(peg,{},input,3)}

function xyz(){var x
 x=trace_test('f')
 return pp(x)
      + '\n\n'+log.get()}

function test_drop(peg,input){var opts
 opts={drop:['JSON'],debug:true}
 //return generateParser(peg,opts)
 return explain(peg,opts,input)}

function test_elide(peg,input){var opts
 opts={elide:['JSON','Object','Array','S']}
 return explain(peg,opts,input)}

function test_dfa_json(scratch,ex1,ex2,ex3,ex4,ex5){var s,ret=[],p,tree
 s=['[[]]'
   ]
 //return s.join('')
 //return ex1
 //ex1='{\n"glossary":{\n"title":"example glossary"}}'
 //return ex1.replace(/\s/g,'')
 //ex1=scratch
 //ex1='{"a":0,"f":0}'
 //ex1='{"":["",""],"":{"":0,"":0}}'
 //ex1='{"":""}'
 //ex1='"abc"'
 s=ex5.split(/\n/g)
 tree=[]
 p=parseJSON(function(m,x,y){
  if(m=='tree segment')tree=tree.concat(x)
  ret.push(m+'\t'+x+(y?' '+y:''))})
 s.forEach(function(chunk){p('chunk',chunk)})
 p('eof')
 return s.join('\n')+'\n\n'
      + 'input length '+s.join('').length+'\n\n'
      + showResult([true,{tree:tree,names:parseJSON.names,input:s.join('')}])+'\n\n'
      + parseJSON.legend+'\n\n'
      + pp(parseJSON(s.join('')))+'\n\n'
      + showResult(parseJSON(s.join('')))+'\n\n'
      + checkTrace(ret)+'\n\n'
      + ret.join('\n')}

function DFA_benchmarks(){var out=[],ms,input
 ms=2000
 input='abcde'
 //return DFA_bench_loop('abcdx')()
 out.push(simple(DFA_bench_loop (input),ms,'loop' ,5))
 out.push(simple(DFA_bench_loop2(input),ms,'loop2',5))
 out.push(simple(DFA_bench_loop3(input),ms,'loop3',5))
 out.push(simple(DFA_bench_loop4(input),ms,'loop4',5))
 //out.push(simple(DFA_bench_funcs(input),ms,'funcs',5))
 return out.join('\n')}

function JSON_benchmarks(scratch,ex1,ex2,ex3,ex4,ex5){var out=[],ms
 ms=1000
 out.push(simple(function(){parseJSON(ex1)},ms,'ex1',ex1.length))
 out.push(simple(function(){parseJSON(ex2)},ms,'ex2',ex2.length))
 out.push(simple(function(){parseJSON(ex3)},ms,'ex3',ex3.length))
 out.push(simple(function(){parseJSON(ex4)},ms,'ex4',ex4.length))
 out.push(simple(function(){parseJSON(ex5)},ms,'ex5',ex5.length))
 return out.join('\n')}

// benchmarking several DFA implementations which match only "abcde".

// the equivalence classes are just a-e mapped to 1-5, and everything else onto 0
var DFA_bench_equiv=rle_dec([97,0,1,1,1,2,1,3,1,4,1,5,65434,0])
function rle_dec(a){var r=[],i,l,n,x,ll;for(i=0,l=a.length;i<l;i+=2){n=a[i];x=a[i+1];r.length=ll=r.length+n;for(;n;n--)r[ll-n]=x}return r}

function DFA_bench_loop(input){var states
 states=[[-1, 1,-1,-1,-1,-1] // state 0
        ,[-1,-1, 2,-1,-1,-1] // state 1
        ,[-1,-1,-1, 3,-1,-1] // state 2
        ,[-1,-1,-1,-1, 4,-1] // state 3
        ,[-1,-1,-1,-1,-1, 5] // state 4
        ,true]
 return function(){
  var i=0,state=states[0],eq_class
  while(typeof state=='object'){
   eq_class=DFA_bench_equiv[input.charCodeAt(i++)]
   state=states[state[eq_class]]}
  return !!state}}

function DFA_bench_loop2(input){var states
 states=[[6,1,6,6,6,6] // state 0
        ,[6,6,2,6,6,6] // state 1
        ,[6,6,6,3,6,6] // state 2
        ,[6,6,6,6,4,6] // state 3
        ,[6,6,6,6,6,5] // state 4
        ,true,false]
 return function(){
  var i=0,state=0,eq_class
  while(state<5){
   eq_class=DFA_bench_equiv[input.charCodeAt(i++)]
   state=states[state][eq_class]}
  return states[state]}}

function DFA_bench_loop3(input){var states
 states=[[,1] // state 0
        ,[,,2] // state 1
        ,[,,,3] // state 2
        ,[,,,,4] // state 3
        ,[,,,,,5]]// state 4
 return function(){
  var i=0,state=0,eq_class
  while(state<5){
   eq_class=DFA_bench_equiv[input.charCodeAt(i++)]
   state=states[state][eq_class]}
  return state==5}}

// adds a store of the previous state (for recovery from EOF)
function DFA_bench_loop4(input){var states
 states=[[,1] // state 0
        ,[,,2] // state 1
        ,[,,,3] // state 2
        ,[,,,,4] // state 3
        ,[,,,,,5]]// state 4
 return function(){
  var i=0,state=0,eq_class,prev
  while(state<5){
   eq_class=DFA_bench_equiv[input.charCodeAt(i++)]
   state=states[prev=state][eq_class]}
  return state==5}}

function DFA_bench_funcs(input){
 function s0(s){return s==1?s1:false}
 function s1(s){return s==2?s2:false}
 function s2(s){return s==3?s3:false}
 function s3(s){return s==4?s4:false}
 function s4(s){return s==5}
 return function(){
  var i=0,eq_class,s=s0
  while(typeof s=='function'){
   eq_class=DFA_bench_equiv[input.charCodeAt(i++)]
   s=s(eq_class)}
  return s}}

function benchmarkPEGParsers(peg){var out=[],ms
 ms=2000
 out.push(simple(function(){p_PEG_v5_RuleSet(peg)},ms,'v5'))
 out.push(simple(function(){parsePEG(peg)},ms,'v6'))
 return out.join('\n')}

function peg_v6_test_streaming_arith(){var s,messages=[],parser,parse=[],tree,chunks
 chunks=['1+','2*3']
 chunks=['1+','2','*3']
 parser=p_arith_streaming_v6_Expr(out)
 chunks.forEach(function(chunk){parser('chunk',chunk)})
 parser('eof')
 s=chunks.join('')
 return s + '\n\n'
  + pp(messages) + '\n\n'
  + pp(parse) + '\n\n'
  + showTree({tree:parse,names:p_arith_streaming_v6_Expr.names,input:s})
 function out(m,x){messages.push(m+' '+x)
  if(m=='tree segment')parse=parse.concat(x)}}

function peg_v6_test_streaming_arith_default(){var s,messages=[],parser,parse=[],tree,chunks
 chunks=['1+','2*3']
 chunks=['1+','2','*3']
 chunks=['1+2','*','3']
 //chunks=['4 * 3 + 2']
 s=chunks.join('')
 parser=p_arith_streaming_v6_default_flags_Expr(out)
 chunks.forEach(function(chunk){parser('chunk',chunk)})
 parser('eof')
 return pp(chunks) + '\n\n'
  + pp(messages) + '\n\n'
  + pp(parse) + '\n\n'
  + showTree({tree:parse,names:p_arith_streaming_v6_Expr.names,input:s})
 function out(m,x){messages.push(m+' '+x)
  if(m=='tree segment')parse=parse.concat(x)}}

function test_showTree(){var res,out=[],a,s
 s='{"foo": ["bar", 42, "baz"], "seven": 7}'
 res=parseJSON(s)
 out.push('input: '+s)
 a=showTree(res,{drop:['Number']})
 out.push(a)
 return out.join('\n\n')}

function peg_v6_test_streaming_arith_single_call(){var x
 s='1+2*4'
 x=p_arith_streaming_v6_default_flags_Expr(s)
 return pp(x)}

function peg_v6_hacked(){var s,p,msgs=[],i,l,prof,ls=[]
 s=Array(257).join('1*2+')+'3'
 assert(s.length==1025,'s length')
 p=p_arith_streaming_v6_Expr_hacked(out)
 p('chunk',s)
 p('eof')
 function out(m,x,y){msgs.push(m+' '+x);if(m=='profile')prof=x}
 for(i=0;i<prof.length;i++)
  if(prof[i])
   ls.push(i+': '+prof[i])
 return ls.join('\n')
 }

function PEG_ES5_arith_Expr_test(s){var pt
 pt=p_ES5_arith_Expr(s)[1]
 return showTree(pt)}

function ES5_test(s){var pt
 pt=p_ES5_v5_Program(s)
 //return peg_profile_analyzer(pt[1])
 return JSON.stringify(pt)
 return pt[0]
 return pp(pt)
 return showPTNodeTreeAttrs(pt,[],[])}

function ES5_default_test(s){var p,pt=[],messages=[],tree
 p=p_ES5_v6_default(function(m,x){
  messages.push(m+' '+x)
  if(m=='tree segment')pt=pt.concat(x)})
 p('chunk',s)
 p('eof')
 return s + '\n\n'
      + pp(messages) + '\n\n'
      + showTree({tree:pt,names:p_ES5_v6_default.names,input:s})}

function ES5_default_test_identifier(s){var p,pt=[],messages=[],tree,failed=false
 s='foo_$xxx'
 p=p_ES5_v6_default_identifier(function(m,x){
  messages.push(m+' '+x)
  if(m=='tree segment')pt=pt.concat(x)
  if(m=='fail')failed=true})
 p('chunk',s)
 p('eof')
 if(!failed)tree=treeFromEvents(pt)
 else return pp(messages)
 return s + '\n\n'
      + pp(messages) + '\n\n'
 //     + pp(tree) + '\n\n'
      + showTree(tree,p_ES5_v6_default_identifier.names,s)}

// here we create a 1024-character string, read each character from it, and compare this to an existing character.
// this gives us a theoretical maximum for any parser (assuming this is the fastest way to read the characters from a string)
function peg_benchmarks_upper_bound(){var ret=[],l,ms
 l=8192 // length in chars
 ms=8000 // ms to run test
 //l=4096,ms=4000
 //l=2048,ms=2000
 l=1024,ms=1000
 //l=128,ms=125
 // a ratio of 1024 : 1000 means that the results are in KiB/s
 ret.push(simple(peg_benchmarks_test_chars(l),ms,"test chars (charCodeAt)"))
 //ret.push(simple(peg_benchmarks_test_chars_bkt(l),ms,"test chars (bracket notation)"))
 //ret.push(simple(peg_benchmarks_test_chars_charat(l),ms,"test chars (charAt)"))
 ret.push(simple(peg_benchmarks_test_chars_re(l),ms,"test chars (regex)"))
 //ret.push(simple(peg_benchmarks_test_arith_streaming(l),ms,"streaming revisited"))
 ret.push(simple(peg_benchmarks_test_arith_v6(l),ms,"streaming v6"))
 ret.push(simple(peg_benchmarks_test_arith_v6_hacked(l),ms,"streaming v6 hacked"))
 ret.push(simple(peg_benchmarks_test_arith_v6_default(l),ms,"v6 default"))
 ret.push(simple(peg_benchmarks_test_arith_pushpop(l),ms,"state pushes and pops"))
 return ret.join('\n')}

function peg_benchmarks_test_chars(n){return function(){var s,l,i,x
 s=Array(n/2+1).join('ab')
 for(i=0,l=s.length;i<l;i++){
  x=s.charCodeAt(i)==0x61}}}

function peg_benchmarks_test_chars_bkt(n){return function(){var s,l,i,x
 s=Array(n/2+1).join('ab')
 for(i=0,l=s.length;i<l;i++){
  x=s[i]=='a'}}}

function peg_benchmarks_test_chars_charat(n){return function(){var s,l,i,x
 s=Array(n/2+1).join('ab')
 for(i=0,l=s.length;i<l;i++){
  x=s.charAt(i)=='a'}}}

function peg_benchmarks_test_chars_re(n){return function(){var s,l,i,x
 s=Array(n/2+1).join('ab')
 for(i=0,l=s.length;i<l;i++){
  s.slice(i).match(/^ab/)}}}

function peg_benchmarks_test_arith_v6(n){var s,p,x=[]
 s=Array(n/8+1).join('1*2+')+'3'
 assert(s.length==n/2+1,'string length '+n)
 return function(){
  p=p_arith_streaming_v6_Expr(function(m,a){})
  p('chunk',s)
  p('chunk',s)
  return s}}

function peg_benchmarks_test_arith_v6_hacked(n){var s,p,x=[]
 s=Array(n/8+1).join('1*2+')+'3'
 assert(s.length==n/2+1,'string length '+n)
 return function(){
  p=p_arith_streaming_v6_Expr_hacked(function(m,a){})
  p('chunk',s)
  p('chunk',s)
  return s}}

function peg_benchmarks_test_arith_v6_default(n){var s,p,x=[]
 s=Array(n/8+1).join('1*2+')+'3'
 assert(s.length==n/2+1,'string length '+n)
 return function(){
  p=p_arith_streaming_v6_default_flags_Expr(function(m,a){})
  p('chunk',s)
  p('chunk',s)
  return s}}

function peg_benchmarks_test_arith_pushpop(n){return function(){var npushes,a=[],depth=16,i,j,total=0
  npushes=n*13 // the arithmetic parser does about 13 state pushes and pops per input character on the test input we use
  for(i=0;i<npushes;i+=depth){
   for(j=0;j<depth;j++) total++,a.push(42)
   for(j=0;j<depth;j++) a.pop()}
  //throw new Error('total: '+total)
  }}

function peg_benchmarks_array_push(){var ret=[],ms,n
 n=40960
 ms=16000
 ret.push(simple(peg_benchmarks_array_push_push(n),ms,"a.push(x)"))
 ret.push(simple(peg_benchmarks_array_push_index(n),ms,"a[a.length]=x"))
 return ret.join('\n')}

function peg_benchmarks_array_push_push(n){return function(){var a=[],i
 for(i=0;i<n;i++) a.push(42)}}

function peg_benchmarks_array_push_index(n){return function(){var a=[],i
 for(i=0;i<n;i++) a[a.length]=42}}

/**************************/
/* DFA-related benchmarks */
/**************************/

// test a function which maps the entire UTF-16 codepoint range onto four integers (for the value ranges that are treated differently by any part of the grammar).

function peg_benchmarks_map_ifs(cp){
 // from doc/dfa:
 // "In this case we have [\], [ftnrv], [0-9A-Z], and all others, for a total of four classes."
 // 0: all others
 // 1: [92,93]
 // 2: [48,58,65,71]
 // 3: [102,103,110,111,114,115,116,117,118,119]
 if(cp<48||cp>118)return 0
 // range now 48 - 118, midpoint 83
 // nearest interesting value is 92
 if(cp<92){ // mid(48,92) = 70
  if(cp>70) return 0 // 71-91 -> 0
  // range 48-70, mid 59, nearest 58
  if(cp<58||cp>64)return 2
  return 0}
 // 91 < cp < 119
 if(cp<103){ // 92-102
  if(cp==102)return 3
  if(cp==92)return 1
  return 0}
 // range now 103-118
 if(cp<110)return 0
 // range now 110-118, and 110, 114, 116, 118 are allowed
 if(cp%2 || cp==112) return 0
 return 3}

function peg_benchmarks_map_array(){var x
 x=
// 0 1 2 3 4 5 6 7 8 9
 [ 0,0,0,0,0,0,0,0,0,0 
 , 0,0,0,0,0,0,0,0,0,0 // + 10
 , 0,0,0,0,0,0,0,0,0,0 // + 20
 , 0,0,0,0,0,0,0,0,0,0 // + 30
 , 0,0,0,0,0,0,0,0,2,2 // + 40
 , 2,2,2,2,2,2,2,2,0,0 // + 50
 , 0,0,0,0,0,2,2,2,2,2 // + 60
 , 2,0,0,0,0,0,0,0,0,0 // + 70
 , 0,0,0,0,0,0,0,0,0,0 // + 80
 , 0,0,1,0,0,0,0,0,0,0 // + 90
 , 0,0,3,0,0,0,0,0,0,0 // + 100
 , 3,0,0,0,3,0,3,0,3]  // + 110
 return function(cp){
  if(cp>118)return 0
  return x[cp]}}

// turn the above into a string of \u0000 - \u0003 characters, of length 118
function peg_benchmarks_map_string(){var s
 s=
 [ 0,0,0,0,0,0,0,0,0,0 
 , 0,0,0,0,0,0,0,0,0,0 // + 10
 , 0,0,0,0,0,0,0,0,0,0 // + 20
 , 0,0,0,0,0,0,0,0,0,0 // + 30
 , 0,0,0,0,0,0,0,0,2,2 // + 40
 , 2,2,2,2,2,2,2,2,0,0 // + 50
 , 0,0,0,0,0,2,2,2,2,2 // + 60
 , 2,0,0,0,0,0,0,0,0,0 // + 70
 , 0,0,0,0,0,0,0,0,0,0 // + 80
 , 0,0,1,0,0,0,0,0,0,0 // + 90
 , 0,0,3,0,0,0,0,0,0,0 // + 100
 , 3,0,0,0,3,0,3,0,3]  // + 110
 .map(function(x){return String.fromCharCode(x)}).join('')
 return function(cp){
  if(cp>118)return 0
  return s.charCodeAt(cp)}}

 // 0: all others
 // 1: [92,93]
 // 2: [48,58,65,71]
 // 3: [102,103,110,111,114,115,116,117,118,119]
function peg_benchmarks_map_switch(cp){
 if(cp>118)return 0
 switch(cp){
  case 0:
  case 1:
  case 2:
  case 3:
  case 4:
  case 5:
  case 6:
  case 7:
  case 8:
  case 9:
  case 10:
  case 11:
  case 12:
  case 13:
  case 14:
  case 15:
  case 16:
  case 17:
  case 18:
  case 19:
  case 20:
  case 21:
  case 22:
  case 23:
  case 24:
  case 25:
  case 26:
  case 27:
  case 28:
  case 29:
  case 30:
  case 31:
  case 32:
  case 33:
  case 34:
  case 35:
  case 36:
  case 37:
  case 38:
  case 39:
  case 40:
  case 41:
  case 42:
  case 43:
  case 44:
  case 45:
  case 46:
  case 47: return 0
  case 48:
  case 49:
  case 50:
  case 51:
  case 52:
  case 53:
  case 54:
  case 55:
  case 56:
  case 57: return 2
  case 58:
  case 59:
  case 60:
  case 61:
  case 62:
  case 63:
  case 64: return 0
  case 65:
  case 66:
  case 67:
  case 68:
  case 69:
  case 70: return 2
  case 71:
  case 72:
  case 73:
  case 74:
  case 75:
  case 76:
  case 77:
  case 78:
  case 79:
  case 80:
  case 81:
  case 82:
  case 83:
  case 84:
  case 85:
  case 86:
  case 87:
  case 88:
  case 89:
  case 90:
  case 91: return 0
  case 92: return 1
  case 93:
  case 94:
  case 95:
  case 96:
  case 97:
  case 98:
  case 99:
  case 100:
  case 101: return 0
  case 102: return 3
  case 103:
  case 104:
  case 105:
  case 106:
  case 107:
  case 108:
  case 109: return 0
  case 110: return 3
  case 111:
  case 112:
  case 113:
  case 115:
  case 117: return 0
  case 114:
  case 116:
  case 118: return 3}}

function peg_benchmarks_map_array_huge(){var x
 x=v6_rle_dec(
[97,0,26,4,47,0,1,4,10,0,1,4,4,0,1,4,36,0,24,4,1,0,8,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,2,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,2,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,2,0,1,4,1,0,1,4,1,0,3,4,2,0,1,4,1,0,1,4,2,0,1,4,3
,0,2,4,4,0,1,4,2,0,1,4,3,0,3,4,2,0,1,4,2,0,1,4,1,0,1,4,1,0,1,4,2,0,1,4,1
,0,2,4,1,0,1,4,2,0,1,4,3,0,1,4,1,0,1,4,2,0,2,4,2,0,3,4,6,0,1,4,2,0,1,4,2
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,2,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,2,4,2
,0,1,4,1,0,1,4,3,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,7,4,2,0,1,4,2,0,2,4,1,0,1,4,4,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,69,4,1,0,27,4,193,0,1,4,1,0,1,4,3,0,1,4,3,0,3
,4,18,0,1,4,27,0,35,4,1,0,2,4,3,0,3,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,5,4,1,0,1,4,2
,0,1,4,2,0,2,4,51,0,48,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4
,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4
,1,0,1,4,1,0,1,4,9,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4
,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4
,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4
,1,0,1,4,1,0,1,4,2,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,2,4
,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4
,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4
,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4
,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4
,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,61,0,39,4,6008,0,44,4
,54,0,22,4,1,0,34,4,102,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,9,4,1,0,1,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1
,0,9,4,8,0,6,4,10,0,8,4,8,0,8,4,8,0,6,4,10,0,8,4,8,0,8,4,8,0,14,4,2,0,8
,4,8,0,8,4,8,0,8,4,8,0,5,4,1,0,2,4,6,0,1,4,3,0,3,4,1,0,2,4,8,0,4,4,2,0,2
,4,8,0,8,4,10,0,3,4,1,0,2,4,121,0,1,4,13,0,1,4,138,0,1,4,3,0,2,4,3,0,1,4
,27,0,1,4,4,0,1,4,4,0,1,4,2,0,2,4,8,0,4,4,4,0,1,4,53,0,1,4,2731,0,47,4,2
,0,1,4,3,0,2,4,1,0,1,4,1,0,1,4,1,0,1,4,4,0,1,4,1,0,2,4,1,0,7,4,4,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,2,4,27,0,38,4,31003,0,1,4,1,0,1,4,1,0,1,4,1,0
,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0
,1,4,1,0,1,4,1,0,1,4,1,0,1,4,3,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0
,1,4,19,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1
,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,139,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4
,1,0,1,4,1,0,3,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4
,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4
,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4
,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,8,4,1,0,1,4,1,0,1,4
,2,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,1,0,1,4,4,0,1,4,21363,0,7,4,12,0,5,4
,1065,0,26,4,165,0])
 return function(cp){return x[cp]}}

function peg_benchmarks_dfa_cset_maps(){var ret=[],ms,s,x,slen
 //ms=240000;n=1024;slen=n
 //ms=16000;n=1024;slen=n
 //ms=8000;n=1024;slen=1024
 ms=4000;n=1024;slen=256
 //ms=1000;n=4096;slen=1024
 // use one of the functions itself as our test string
 s=peg_benchmarks_map_ifs.toString()
 s=Array(2+Math.round(slen/s.length)).join(s).slice(0,slen)
 function bench(f){return function(){var i,j
   x=0
   for(i=0;i<n/slen;i++) for(j=0;j<slen;j++){
    x+=f(s.charCodeAt(j))}}}
 function go(desc,f){
  ret.push(simple(bench(f),ms,desc,n))
  ret.push('checksum: '+x)}
 go('nested ifs',peg_benchmarks_map_ifs)
 go('array of int',peg_benchmarks_map_array())
 //go('string',peg_benchmarks_map_string())
 go('crazy switch',peg_benchmarks_map_switch)
 go('ridiculous array',peg_benchmarks_map_array_huge())
 return ret.join('\n')}

function peg_benchmarks_re_vs_loop(s){var t,i,l,re,re2,res=[],res2=[],s2,ret=[],x
 //s=Array(9).join(s)
 t=new Date
 re=/^[a-z]/
 re2=/^[a-z]/g
 function push(msg,res){
  ret.push(msg+(new Date-t))
  t=new Date
  //ret.push(res.map(function(x){return x?'T':'F'}))
  }
 ret.push('string length: '+s.length)
 for(i=0,l=s.length;i<l;i++){
  s2=s.slice(i)
  res[i]=re.test(s2)}
 push('new strings: ',res)
 for(i=0,l=s.length;i<l;i++){
  s2=s.slice(i)
  res[i]=re.test(s2)}
 push('new strings: ',res)
 for(i=0,l=s.length;i<l;i++){
  s2=s.slice(i)
  res[i]=re.test(s2)}
 push('new strings: ',res)
 for(i=0,l=s.length;i<l;i++){
  x=s.charCodeAt(i)
  res[i]=x<123&&x>96}
 push('comparison ops: ',res)
 for(i=0,l=s.length;i<l;i++){
  x=s.charCodeAt(i)
  res[i]=x<123&&x>96}
 push('comparison ops: ',res)
 try{(function f(s,i,l){
   x=s.charCodeAt(i)
   res[i]=x<123&&x>96
   if(i<l)f(s,i+1,l)})(s,0,s.length-1)
 push('recursive function: ',res)}catch(e){}
 try{(function f(s,i,l){
   x=s.charCodeAt(i)
   res[i]=x<123&&x>96
   if(i<l)f(s,i+1,l)})(s,0,s.length-1)
 push('recursive function: ',res)}catch(e){}
 return ret.join('\n')}

function peg_benchmarks_fcall_vs_loop(){var d,n,ret=[]
 d=new Date
 n=1000
 for(;;){
  if(!n--)break}
 ret.push('1000 loops: '+(new Date-d));d=new Date
 for(n=10000000;n--;){}
 ret.push('10000000 loops: '+(new Date-d));d=new Date
 f(500)
 ret.push('1000 fcalls: '+(new Date-d))
 return ret.join('\n')
 function f(n){if(n)g(--n)}
 function g(n){f(n)}}

function peg_profile_analyzer(profile){var res={},ret=[],totals={puts:0,hits:0,pos:0,neg:0},zeros=[]
 profile.forEach(function(entry){var name,event
  event=entry[0],name=entry[1]
  if(!res[name])res[name]={name:name,puts:0,hits:0,pos:0,neg:0}
  switch(event){
   case 0:
    res[name].puts++;break
   case 1:
    res[name].hits++
    res[name].pos++;break
   case 2:
    res[name].hits++
    res[name].neg++;break}})
 for(var p in res){
  res[p].ratio=res[p].hits/res[p].puts
  totals.puts+=res[p].puts
  totals.hits+=res[p].hits
  totals.pos+=res[p].pos
  totals.neg+=res[p].neg
  ret.push(res[p])
  if(res[p].hits==0)zeros.push([p,res[p].puts])}
 ret.sort(function(a,b){
  if(a.ratio<b.ratio)return -1
  if(a.ratio>b.ratio)return 1
  return 0})
 zeros.sort(function(a,b){return a[1]<b[1]?1:a[1]>b[1]?-1:0})
 return pp(ret)
      + '\n\nTotals:\n'
      + pp(totals)
      + '\n\nZeros:\n'
      + zeros.map(function(x){return x[0]+' ('+x[1]+')'}).join('\n')}

function abc_test(peg){var parser
 parser=generateParser(peg)
 return parser
 eval(parser)
 return parser
      + '\n\n'
      + TestABC('abc')}
