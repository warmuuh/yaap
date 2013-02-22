function mapSelectors(mss,t){
 mss.forEach(function(ms){
  mapStructSel_tmp_r(ms,t,[])
  commit_deletions_elisions(t)})
 return t}

/* mapStructSel_tmp_r is called once for each node in the course of the depth-first primary tree traversal. 

ms is the set of structural models to be matched.
n is the current object node in the tree traversal.
parent_test_set is the test set for the current node.
*/

function mapStructSel_tmp_r(ms,n,parent_test_set){
 var anchors=[],model_copy,desc_test_set=[]
 ms.forEach(function(m){
  anchors.push({m:m.m
               ,objectRoot:n
               ,distinguishedPath:m.distinguishedPath
               ,anchorPath:[]
               ,f:m.f})})
 parent_test_set.concat(anchors).forEach(function(m){
  if(model_copy=anchor(m,n))
   desc_test_set.push(model_copy)})

 n.children().forEach(function(n){
  mapStructSel_tmp_r(ms,n,desc_test_set)})

 return n}

/* anchor handles the Anchoring algorithm step.
In the case of outcome 3, anchor() returns the new model copy to be added to the test set, otherwise it returns nothing.
*/

function anchor(m,n){var next_anchor,model_copy
 next_anchor=nodeAt(m.m,m.distinguishedPath.slice(0,m.anchorPath.length))
 if(!bindingNodeMatch(next_anchor,n)) return
 if(m.distinguishedPath.length>m.anchorPath.length)
  return {m:m.m
         ,distinguishedPath:m.distinguishedPath
         ,anchorPath:m.anchorPath.concat([n])
         ,objectRoot:m.objectRoot
         ,f:m.f}
 completeModelCorrespondence(m,n)}

/* See doc/treeMutationImplementation before trying to read the following. */

function completeModelCorrespondence(m,n){
 m={m:m.m
   ,distinguishedPath:m.distinguishedPath
   ,anchorPath:m.anchorPath.concat([n])
   ,objectRoot:m.objectRoot
   ,f:m.f}

/* NB: we re-use the model so there might be some garbage object node references attached to it from a previous sibling.
That's ok since we set them all again before succeeding.
*/

 if(
 _r(m
   ,m.m
   ,m.objectRoot
   ,nonDistChildrenOf_mdl(m,m.m)
   ,nonDistChildrenOf_obj(m,m.objectRoot))
 ) m.f(n,m)
 //else log('r_ returns false')

 function _r(m,a,b,m_nodes,o_nodes){var mdl_node,obj_node,i,j,next_a,next_b,tmp
  //if(log.count()<13)log(['_r',m.distinguishedPath,a,b[0],m_nodes,pp(o_nodes,3)])
m:for(i=0;i<1;i++){
   if(!m_nodes.length) break m                      // Step 1.
   mdl_node=m_nodes[0]
 o:for(j=0;j<o_nodes.length;j++){obj_node=o_nodes[j]     // 2.
    if(bindingNodeMatch(mdl_node,obj_node)               // 3.
    && _r(m
         ,mdl_node
         ,obj_node
         ,nonDistChildrenOf_mdl(m,mdl_node)
         ,nonDistChildrenOf_obj(m,obj_node))
    && _r(m                                              // 4.
         ,a
         ,b
         ,m_nodes.slice(1)
         ,o_nodes.slice(0,j).concat(o_nodes.slice(j+1)))){
     break m}
   } // o
   return false                                          // 2.
  } // m
  if((next_a=distChildOf_mdl(m,a))==undefined)           // 5.
   return true
  next_b=distChildOf_obj(m,b)
  return _r(m
           ,next_a
           ,next_b
           ,nonDistChildrenOf_mdl(m,next_a)
           ,nonDistChildrenOf_obj(m,next_b)) 
 } // _r
}

function distChildOf_mdl(m,m_node){var
 i=0,dp=m.distinguishedPath
 m=m.m
 //log(['dCO_m',pp(m_node,2)])
 do if(m==m_node && (dp[i]!==undefined))
  {log(dp[i]);return m[1][dp[i]]}
 while (m=m[1][dp[i++]])}

function distChildOf_obj(m,o_node){var i,l,
 ap=m.anchorPath
 for(i=0,l=ap.length-1;i<l;i++)
  if(o_node==ap[i]) return ap[i+1]}

function nonDistChildrenOf_mdl(m,m_node){var
 i=0,ret=m_node[1].slice(),dp=m.distinguishedPath
 m=m.m
 do if(m===m_node && (dp[i]!==undefined))
  {ret.splice(dp[i],1); return ret}
 while (m=m[1][dp[i++]])
 return ret}

function nonDistChildrenOf_obj(m,o_node){var
 ret=o_node.children().slice(),ap=m.anchorPath
 for(i=0,l=ap.length-1;i<l;i++)
  if(o_node===ap[i]) ret.splice(ret.indexOf(ap[i+1]),1)
 return ret}

function bindingNodeMatch(m,n){
 if(!nonBindingNodeMatch(m,n))return false
 //if(m.length>2) log('binding overwrite: '+m[2][0])
 m[2]=n
 return true}