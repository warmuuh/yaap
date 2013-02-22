/* Character Point Sets */

/* A cset is a subset of integers 0-0x10FFFF, i.e. the set of all Unicode characters. */

/* A cset is stored as an array of ascending integers between 0 and 0x10FFFE.  The first integer in the array is the lowest codepoint included in the set.  The next integer is the next lowest character excluded from the set.  Thus each pair of integers, starting with the first two, defines the low inclusive and high exclusive bounds of a range of codepoints included in the set.  If an array contains an odd number of elements, the final range is extended, as if by appending 0x110000.  Thus in the worst case (a cset containing every second codepoint over the entire range) each codepoint will be appear once and the entire array will have 0x10FFFF or 1114111 elements.  However in typical cases, characters are included or excluded in mostly continuous ranges, so this representation tends to be efficient in practice. */

/* A few related functions are found in cset_unicode_properties.js, including an extra constructor and the code which generates csets from the Unicode character data. */

/* The _CSET function here is not called directly, instead we munge this a bit in src/cset_output.js and the output of that (as found in build/cset_prod.js) is what actually gives the CSET module. */

;(function(exports){

/* O(1) */

var nil=[]
var U=[0]

/* fromChar, fromInt */
function fromChar(c){return fromInt(codepointFromChar(c))}
function fromInt(cp){return [cp,cp+1]}

/* from(Int|Char)Range */
function fromIntRange(from,to){return [from,to+1]}
function fromCharRange(from,to){
 from=codepointFromChar(from);to=codepointFromChar(to)
 return to>from ?[from,to+1] :[to,from+1]}

/* tests */
function empty(cset){return !cset.length}
function singleton(cset){return cset.length==2 && cset[0]+1 == cset[1]}

/* a single Unicode code point, from a character which may be represented by one or two UTF-16 code units. */
function codepointFromChar(s){var hi,lo
 if(/[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(s)){
  hi=s.charCodeAt(0)
  lo=s.charCodeAt(1)
  return 0x10000+(((hi&0x3FF) << 10) | (lo&0x3FF))}
 return s.charCodeAt(0)}

/* Set complement, equivalent to difference(universe,cset) but in constant time. */
function complement(cset){
 return (cset[0]==0) ? cset.slice(1)
                     : [0].concat(cset.slice())}

/* O(n) */

/* From an ascending list of distinct integers, each of which is a code point to include in the set. */
function fromList(a){var i,l,ret=[]
 for(i=0,l=a.length;i<l;){
  ret.push(a[i])
  while(a[i]+1 == a[++i] && i<l);
  if(a[i-1]!==0x10ffff)ret.push(a[i-1]+1)}
 return ret}

/* To a list of ascending integers, each of which is a code point included in the set. */
function toList(cset){var i,l,state=false,ret=[]
 for(i=0,l=cset.length;i<l;i++){
  if(state)fill(cset[i-1],cset[i])
  state=!state}
 if(state)fill(cset[i-1],0x10FFFF)
 return ret
 function fill(a,b){
  for(;a<b;a++)ret.push(a)}}

/* from a string which may contain any Unicode characters in any order and may contain duplicates to the set of distinct characters appearing in the string. */
function fromString(s){var res=[]
 // here using replace as an iterator over Unicode characters
 s.replace(/[\u0000-\uD7FF\uDC00-\uFFFF]|([\uD800-\uDBFF][\uDC00-\uDFFF])|[\uD800-\uDBFF]/g,
  function(m,u){
   if(u)res.push(codepointFromChar(u))
   else res.push(m[0].charCodeAt(0))})
 return fromList(res.sort(function(a,b){return a-b}).filter(function(c,i,a){return !i||a[i-1]!=a[i]}))}

/* test membership of a codepoint c */
function member(cset,c){var state=false,i,l
 if(c>0x10FFFF)return false
 for(i=0,l=cset.length;i<l;i++){
  if(cset[i]>c)return state
  state=!state}
 return state}

/* O(n+m), where n and m are the number of transitions, i.e. the length of the cset array representation rather than the cardinality of the represented set. */

/* equality */
function equal(as,bs){var i,l
 l=as.length
 if(l!=bs.length)return false
 for(i=0;i<l;i++)if(as[i]!=bs[i])return false
 return true}

/* set difference */
function difference(as,bs){var
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

/* set intersection implemented as the complement of the union of the complements. */
function intersection(as,bs){return complement(union(complement(as),complement(bs)))}

/* Any character which matches the SourceCharacter production of ECMA-262, except line terminators, ']', '-', '\', horizontal and vertical tab (0x09 and 0x0B), and form feed 0x0C, and most whitespace, may appear as itself in a regular expression character class. */

esc.safe=[32,33]; //ASCII space is special-cased in even if we exclude the rest of Zs
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
 //,'Zs' // XXX some of these are fine, but may be confusing
 ].forEach(function(s){esc.safe=union(esc.safe,cset_unicode_categories[s])})
 esc.safe=intersection(esc.safe,fromIntRange(0,0xFFFF))

function esc(n){var
 x={9:'\\t',10:'\\n',11:'\\v',12:'\\f',13:'\\r',45:'\\-',92:'\\\\',93:'\\]'}[n] //single backslash escapes
 if(x)return x
 if(member(esc.safe,n))return String.fromCharCode(n)
 function fill(s){return ('000'+s).slice(-4)}
 return "\\u"+fill(n.toString(16))}

/* TODO we should at some point have output which does not use a character class when not necessary, for example which outputs 'a' rather than '[a]' for a cset containing only the letter a.  At that point we will need another, slightly different, set of safe characters for non-character-class regex literal contexts.  This set would not need to exclude characters outside the BMP or ']', but would exclude '/' and '['. */

/* Convert a set of BMP code points to an ECMAScript-compatible regex character class of the form [ranges], where ranges use literal Unicode characters where they are safe, single-character backslash escapes like "\n" where they exist, and \uHHHH escapes otherwise. */

function reCC_bmp(cset){var res=[],state=0,i,l,c
 if(singleton(cset)) return esc(cset[0])
 for(i=0,l=cset.length;i<l&&cset[i]<0x10000;i++){
  if(state && cset[i] == c+1){state=0;continue}
  c=cset[i]
  if(state){res.push('-');c--}
  res.push(esc(c))
  state=!state}
 if(state){res.push('-\\uffff')}
 return '['+res.join('')+']'}

/* We have code points in the BMP, which can be expressed as \uxxxx, and others, > 0xFFFF, which must be matched as two successive UTF-16 code units. */

/* Our output is either a character class consisting wholly of code points within the BMP (i.e. below 0x10000), or it is an alternation between one or more alternatives each of which matches either one or two code units.  Code points above 0xFFFF (i.e. supplementary code points, those which are not in the BMP) are matched by matching a high surrogate followed by a low surrogate.  Alternatives that are intended to match supplementary code points are a sequence of either a single high surrogate or a range of high surrogates followed by a single low surrogate or a range of low surrogates. */

/* We may be matching a range of Unicode code points that overlaps the high or low surrogate ranges.  We may even be simultaneously matching individual high or low surrogates while also matching supplementary codepoints that will be represented by a surrogate pair.  In this case we must test for the surrogate pairs before testing for surrogates occurring alone.  In general however, we would like to test against the BMP ranges first to improve performance for the most commonly matched ranges.  So what we return is a regex which first tries to match code units in the BMP but outside the surrogate ranges, then tries to match surrogate pairs, and finally tries single surrogate code units if any are to be matched.  Any of these three sets may be empty.  If no surrogate pairs are to be matched, we may unify any matched surrogate and non-surrogate ranges.  As an example, to match any single code unit, we would want the output "[\u0000-\uffff]".  In general, we may so unify any surrogate ranges which do not overlap high surrogates that are part of surrogate pairs to be matched.  This means any low surrogates which are to be matched directly may be included in the range of BMP code points which comprises the first alternative of our output. */

/* To summarize, then, we return an optional initial character class matching any BMP code points that are not high surrogates of code points in the input cset, followed by zero or more alternatives each of which is a sequence of one high surrogate or a range of high surrogates followed by one low surrogate or a range of low surrogates. */

/* First we split the cset into a set of BMP code points and a set of supplementary code points.  We then calculate a set of high surrogates which covers the supplementary code points, and, for each high surrogate in this set, a set of low surrogates which may follow it.  We then take the difference of the set of BMP code points minus the high surrogate set.  If this result set is not empty, we output a character class which covers this range.  We then output the alternatives for surrogate pairs.  If the the full range of two or more high surrogates may be matched (that is, if any low surrogate may follow any of them), then we combine those high surrogates into a character class.  We output each high surrogate or high surrogate character class, followed by a character class of the low surrogates which may follow it.  Finally we output an alternative for the code points in the high surrogate range which may appear alone and which did not already appear in the first part of our output, viz the initial character class covering the BMP range. */

/* This algorithm described above can be followed in the toRegex function, which is preceded below by other helper functions. */

/* This simply splits a cset into two, the subset within the BMP and one for the supplementary subset. */
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

/* Calculate a surrogate pair from a code point > 0x10000. */
function surrogatePair(n){
 n-=0x10000
 return [0xD800|(n>>10),0xDC00|(n&0x3FF)]}

/* Calculate a surrogate set, which is a set of high surrogates, and, for each, a set of low surrogates.  This is stored as an array of cset pairs, which are arrays in which the first element is a cset of high surrogates and the second is a cset of low surrogates which may follow any one of them. */

/* We also return a cset of all high surrogates to save recalculating this from the primary output. */

/* This function was written all at one go and passed every test.  If it is later found to contain a bug, the author suggests starting over. */

function surrogateSet(cset){var i=0,l=cset.length,state,c,prev,hi,lo,ret=[],prev_hi,prev_lo,full=[],cur,all_hi=[],a
 if(l&1){cset[l++]=0x110000} //normalize
 cset.push(0x110001) //causes the last 'cur' to be pushed
 for(;c=cset[i];i++){
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
 return [fromList(all_hi)
        ,(full.length?[[fromList(full),[0xDC00,0xE000]]]
                     :[]).concat(ret)
        ]}

/* create an alternative to match a surrogate pair. */
function surrogateSetToRE(surr){var ret=[]
 surr.forEach(function(pair){
  ret.push(f(pair[0])+f(pair[1]))})
 return ret.join('|')
 function f(cset){
  return reCC_bmp(cset)}}

/* toRegex is the main driver for the regex output process. */
function toRegex(cset){var a,bmp,sup,all_hi,surr,d,i,ret=[]
 a=splitAtBMP(cset);bmp=a[0];sup=a[1] // poor man's destructuring assignment
 a=surrogateSet(sup);all_hi=a[0];surr=a[1]
 d=difference(bmp,all_hi)
 i=intersection(bmp,all_hi)
 if(!empty(d)) ret.push(reCC_bmp(d))
 if(surr.length) ret.push(surrogateSetToRE(surr))
 if(!empty(i)) ret.push(reCC_bmp(i))
 return ret.join('|')}

/* toSurrogateRepresentation is similar to toRegex but returns an intermediate form (e.g. for constructing a DFA).  toRegex above could be implemented externally in terms of this.  This is for UTF-16 but a UTF-8 version should be added too.  Possibly all of this should be moved into a separate module. */
function toSurrogateRepresentation(cset){var a,bmp,sup,all_hi,surr,d,i
 a=splitAtBMP(cset);bmp=a[0];sup=a[1]
 a=surrogateSet(sup);all_hi=a[0];surr=a[1]
 return {bmp:bmp,surrogate_range_pairs:surr,high_surrogates:all_hi}}

/* return a cset from a Unicode General Category. */
function fromUnicodeGeneralCategory(x){
 var ret=cset_unicode_categories[x]
 if(!ret) throw Error('unknown Unicode General Category '+x)
 return ret}

/* This is useful for debugging */
function show(cset){var i,l,ret=[],c
 if(cset.length % 2) cset.push(0x110000)
 for(i=0,l=cset.length;i<l;i+=2){
  c=cset[i]
  if(cset[i+1]==c+1)ret.push(c.toString(16))
  else ret.push(c.toString(16)+'-'+(cset[i+1]-1).toString(16))}
 return ret.join('\n')}

var i,e,es=
[['fromChar',fromChar] //exports
,['fromInt',fromInt]
,['universe',U]
,['nil',nil]
,['empty',empty]
,['singleton',singleton]
,['fromIntRange',fromIntRange]
,['fromCharRange',fromCharRange]
,['fromUnicodeGeneralCategory',fromUnicodeGeneralCategory]
,['complement',complement]
,['fromList',fromList]
,['toList',toList]
,['fromString',fromString]
,['member',member]
,['equal',equal]
,['difference',difference]
,['union',union]
,['intersection',intersection]
,['toRegex',toRegex]
,['toSurrogateRepresentation',toSurrogateRepresentation]
,['show',show]
]
for(i=0;e=es[i];i++)exports[e[0]]=e[1]

})
