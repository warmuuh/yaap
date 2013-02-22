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