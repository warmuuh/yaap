function run_JSON_tests(){var i,l,res,out=[]
 for(i=0,l=JSON_tests.length;i<l;i++){
  res=JSON_tests[i]()
  out.push('JSON test '+i+(res?' PASS':' FAIL'))}
 return out.join('\n')}

function parseJSON_as_object(s){var tree,dict
 tree=parseJSON(s)
 if(!tree[0]) return showError(tree)
 dict=
  {True:function(){return true}
  ,False:function(){return false}
  ,Null:function(){return null}
  ,Number:function(m){return parseFloat(m.text())}
  ,String:function(m){return m.text().slice(1,-1)}
  ,Array:function(m,cn){return cn}
  ,Object:function(m,cn){var o={},i,l
    for(i=1,l=cn.length;i<l;i+=2){
     o[cn[i-1]]=cn[i]}
    return o}
  ,JSON:function(m,cn){return cn[0]}
  }
 return treeWalker(dict,tree)}

var JSON_tests_input_1=
'["","a",null,true,false,0,-1,1,1.7,-1.7,1e3,-1e3,5.2e8,-5.2e8,{"a":"a","":"","true":true,"false":false,"null":null,"0":0},{},{"":{"":{}}},[],[[[]]]]'

var JSON_tests=
[function(){
  return JSON.stringify(parseJSON_as_object(JSON_tests_input_1))
      == JSON.stringify(JSON.parse(JSON_tests_input_1))
}
]