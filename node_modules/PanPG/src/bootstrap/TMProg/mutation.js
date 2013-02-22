function _delNode(node,model){node.markForDeletion()}

function _elideNode(node,model){node.markForElision()}

function build_models(opts,prog){var mss=[]
 prog.forEach(function(ruleset){var ms=[]
  ruleset.forEach(function(rule){var m={}
   m.m=rule.sel.m
   m.distinguishedPath=rule.sel.distinguishedPath
   m.f=build_node_mutator(opts,rule)
   ms.push(m)})
  mss.push(ms)})
 return mss}

function sequence(fs){
 if(fs.length==0) return function(){}
 if(fs.length==1) return fs[0]
 return function(){var i,l
  for(i=0,l=fs.length;i<l;++i) fs[i].apply(null,arguments)}}

function build_node_mutator(opts,rule){var i,l,op,fs=[]
 for(i=0,l=rule.ops.length;i<l,op=rule.ops[i];i++){
  switch(op[0]){
   case 'del':
    if(rule.ops.length!=1) throw Error('del stands alone')
    return _delNode
   case 'elide':
    if(rule.ops.length!=1) throw Error('elide stands alone')
    return _elideNode
   case 'define':
    fs.push(_define(opts,op,rule))
    break
   default: throw Error('unknown op: '+op[0])}}
 if(fs.length) return sequence(fs)}

/* At the end of each ruleset, we commit deletions and elisions which have been marked during the matching passes over the tree. */

function commit_deletions_elisions(n){
 function _r(n,i,p){var j,l,cn
  if(n.markedForDeletion()) p.splice(i,1)
  else if(n.markedForElision()){
   p[i]=n.children()[0]
   _r(n.children()[0],i,p)
   return}
  else{
   cn=n.children()
   for(j=cn.length;j--;){_r(cn[j],j,cn)}}}
 _r(n)
}