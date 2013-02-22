/* A structural selector model is a root model-node, where a model-node is defined as a (tests, children) pair.  The tests are primitive node predicates, all of which must be true for the model-node or any of its children to match an object node.  If all tests match, then the children, which are again model-nodes, are matched against the children of the matching object node.  The model-node which is distinguished (here by a 0) corresponds to the object node which is matched by (and corresponds to the start position of) the selector expression. */

function parseStructSel(s){var i,l,n
 ,stack=[] //stack available to B
 ,popped=[] //no longer on the stack; has been visited
 ,root=[[],[],0,'']
 ,current=root
 ,skel=''
 for(i=0,l=s.length;i<l;i++)
  switch(s[i]){
  case 'U': /* U is only meaningful from the current root */
   if(root!=current)throw Error("U from non-topmost node.") //comment this out for a more expressive language (effectively replacing U with B*U.)
   stack.push(current)
   current=root=[[],[root]]
   skel+='U';current[3]=skel
   break
  case 'D':
   n=current[1].push([[],[]])
   stack.push(current)
   current=current[1][n-1]
   skel+='D';current[3]=skel
   break
  case 'B':
   popped.push(current)
   current=stack.pop()
   skel+='B';current[3]+='|'+skel
   break
  case ' ': break;
  case '[':
   n=s.indexOf(']',i);if(n==-1)throw Error('unmatched [')
   current[0].push(s.substring(i+1,n))
   i=n
   break
  default: throw Error('"'+s[i]+'"!?')
  }
 return root}

/* this could be done more efficiently by a straightforward transformation of UBD strings into index paths, however the approach here might make it easier to permute the structural model later (even though we delete the very data that would be required) */
function fixupSelModel(m){var s=[],key=[]
 ,dp=findDistinguishedPath(m)
 function _r(m,i){
  if(i>-1)s.push(i)
  m[1].forEach(_r)
  m[3].split('|').forEach(function(m){
   key.push([m,s.slice()])})
  m.length=2
  if(i>-1)s.pop()}
 _r(m,-1)
 key.sort(function(a,b){return a[0].length>b[0].length})
 return {m:m,key:key,distinguishedPath:dp}}

/* walk a model and return the distinguished path as an array of integers each of which is the index into the children of the previous node on the path */

function findDistinguishedPath(m){var i,the_rest
 if(m[2]==0)return []
 for(i=0;i<m[1].length,mm=m[1][i];i++){
  if(the_rest=findDistinguishedPath(mm))
  return [i].concat(the_rest)}}

function modelStructSel(s){
 return fixupSelModel(parseStructSel(s))}

function nodeAt(m,pos){
 pos.forEach(function(i){m=m[1][i]})
 return m}