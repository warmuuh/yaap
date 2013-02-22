// produce an AST based on https://developer.mozilla.org/en/SpiderMonkey/Parser_API
// differences:
// - no 'loc' property on nodes (may add separate start, end integers later)
// - Function body is always BlockStatement, never Expression (which is moz-specific)
// - no generators (also moz-specific)
// - no multiple catch clauses (also moz-specific)
// - no 'meta' property on FunctionDeclaration or FunctionExpression
// - no "for each ... in" support (moz-specific)
// - formal parameters must be identifiers, not destructuring patterns (which again is moz-specific)
// - wherever Pattern would appear, Identifier is used instead
// - VariableStatement is used instead of VariableDeclaration (since VariableStatement is the name of the production used in the spec)
// - There is no VariableDeclaration nodes in the output (though they are generated as an intermediate form)
// - VariableStatement (nee VariableDeclaration) lacks "kind" (let, var, or const)
// - the name VariableDaclaration is used for something else in the spec, perhaps it should be changed here.
// - There is no separate object for UnaryOperator or BinaryOperator, with a "token" property carrying the actual payload, instead, the operator appears directly as a string where a UnaryOperator or BinaryOperator object would appear in the spidermonkey AST.
// - I think it is odd that there is a separate UpdateExpression type given that there is already a UnaryExpression (and it has a prefix Boolean property)
// - There is no 'prefix' property on the UnaryExpression, since in every case it is true.
// - I can see no reason for LogicalOperator to be a separate type from BinaryOperator, so I have handled "||" and "&&" as binary operators like any other, i.e. they generate a BinaryExpression node.
// - no yield expressions
// - no generator expressions
// - no array comprehensions
// - no graph expressions (sharp variables, sharp expressions)
// - no guard on CatchClause; param is Identifier, not Pattern
// - it is odd that all literals map to the Literal type which has no 'kind' or other property to indicate type, necessitates type checking of the value
// - added a 'kind' : 'number' | 'string' | 'Boolean' | 'regexp' property to Literal

// Comments can come anywhere in the grammar, and if a comment appears, it is attached literally as a 'comment' property on the AST node that follows it (actually somewhere "nearby"); on the Program node there can additionally be a commentAfter property

// Many of the places where Identifier is used could just have a string rather than an Identifier node in the AST (e.g. as the label of a LabelledStatement)

// It might be useful to have a 'literal' property on string literals to store the literal as it appeared in the source, which may differ from 'value' which would be the string value after unescaping

// The full [incomplete] list of node types returned in parse trees:
// (N.B. there are other node types created below but which do not end up in the final tree)
// Program, EmptyStatement, BlockStatement, ExpressionStatement, IfStatement, LabelledStatement, BreakStatement, ContinueStatement, WithStatement, SwitchStatement, ReturnStatement, ThrowStatement, TryStatement, DoWhileStatement, WhileStatement, ForStatement, ForInStatement, DebuggerStatement

function js_ast(s){var dict,pending_comment
 //return PanPG_util.showTree(JSParser.parse(s),{drop:['WhiteSpace','anonymous','IdentifierStart','IdentifierPart','FunctionTok','LineTerminatorSequence','SourceCharacter']})

 function assert(x,m){if(!x)throw new Error('assertion failed: '+m)}

 dict=
 {Program:function(m,cn){
    return {type:"Program",elements:cn}}

 ,EmptyStatement:function(m,cn){
    return {type:"EmptyStatement"}}

 ,Block:function(m,cn){
    return {type:"BlockStatement"
           ,body:cn}}

 ,Statement:function(m,cn){return cn[0]}

 ,ExpressionStatement:function(m,cn){
    return {type:"ExpressionStatement"
           ,expression:cn[0]}}

 ,IfStatement:function(m,cn){
    assert(isExpression(cn[0]))
    assert(isStatement(cn[1]))
    assert(!cn[2] || isStatement(cn[2]))
    return {type:"IfStatement"
           ,test:cn[0]
           ,consequent:cn[1]
           ,alternate:cn[2]||null}}

 ,LabelledStatement:function(m,cn){
    assert(cn[0].type=='Identifier')
    assert(isStatement(cn[1]))
    return {type:"LabelledStatement"
           ,label:cn[0]
           ,body:cn[1]}}

 ,BreakStatement:function(m,cn){
    assert(!cn[0] || cn[0].type=="Identifier")
    return {type:"BreakStatement"
           ,label:cn[0]||null}}

 ,ContinueStatement:function(m,cn){
    assert(!cn[0] || cn[0].type=="Identifier")
    return {type:"ContinueStatement"
           ,label:cn[0]||null}}

 ,WithStatement:function(m,cn){
    assert(isExpression(cn[0]))
    assert(isStatement(cn[1]))
    return {type:"WithStatement"
           ,object:cn[0]
           ,body:cn[1]}}

 ,SwitchStatement:function(m,cn){
    assert(isExpression(cn[0]))
    return {type:"SwitchStatement"
           ,test:cn[0]
           ,cases:cn.slice(1)}}

 ,ReturnStatement:function(m,cn){
    assert(!cn[0] || isExpression(cn[0]))
    return {type:"ReturnStatement"
           ,argument:cn[0]||null}}

 ,ThrowStatement:function(m,cn){
    assert(!cn[0] || isExpression(cn[0]))
    return {type:"ThrowStatement"
           ,argument:cn[0]||null}}

 ,TryStatement:function(m,cn){var block,handler,finalizer
    assert(cn[0].type=="BlockStatement")
    block=cn.shift()
    assert(!cn[0] || cn[0].type=='CatchClause'
                  || cn[0].type=='FinallyClause')
    if(cn[0] && cn[0].type=='CatchClause') handler=cn.shift()
    if(cn[0] && cn[0].type=='BlockStatement') finalizer=cn[0]
    return {type:"TryStatement"
           ,block:block
           ,handler:handler||null
           ,finalizer:finalizer||null}}

 ,IterationStatement:function(m,cn){return cn[0]}

 ,WhileStatement:function(m,cn){
    assert(isExpression(cn[0]),"Expression")
    assert(isStatement(cn[1]),"Statement")
    return {type:"WhileStatement"
           ,test:cn[0]
           ,body:cn[1]}}

 ,DoWhileStatement:function(m,cn){
    assert(isStatement(cn[0]))
    assert(isExpression(cn[1]))
    return {type:"DoWhileStatement"
           ,body:cn[0]
           ,test:cn[1]}}

 ,ForStatement:function(m,cn){var init,test,update
    assert(cn[0])
    if(cn[0].type=='ForInit')init=cn.shift().expression
    if(cn[0].type=='ForVarInit')init=cn.shift().declaration
    if(cn[0].type=='ForTest')test=cn.shift().expression
    if(cn[0].type=='ForUpdate')update=cn.shift().expression
    assert(isStatement(cn[0]))
    return {type:"ForStatement"
           ,init:init||null
           ,test:test||null
           ,update:update||null
           ,body:cn[0]}}

 ,ForInit:function(m,cn){
    assert(!cn[0] || isExpression(cn[0]),"Expression")
    return {type:"ForInit"
           ,expression:cn[0]||null}}

 ,ForVarInit:function(m,cn){
    assert(cn[0].type=="VariableDeclaration")
    return {type:"ForVarInit"
           ,declaration:cn[0]}}

 ,VariableDeclarationListNoIn:function(m,cn){
    return {type:"VariableDeclaration"
           ,declarations:cn.map(cleanup_vardecl)}}

 ,ForTest:function(m,cn){
    assert(!cn[0] || isExpression(cn[0]))
    return {type:"ForTest"
           ,expression:cn[0]||null}}

 ,ForUpdate:function(m,cn){
    assert(!cn[0] || isExpression(cn[0]))
    return {type:"ForUpdate"
           ,expression:cn[0]||null}}

 ,ForInStatement:function(m,cn){var left
    if(cn[0].type=='ForInLeft')left=cn.shift().expression
    if(cn[0].type=='ForInVarLeft')left=cn.shift().declaration
    assert(isExpression(cn[0]))
    assert(isStatement(cn[1]))
    return {type:"ForInStatement"
           ,left:left
           ,right:cn[0]
           ,body:cn[1]}}

 ,ForInLeft:function(m,cn){
    assert(isExpression(cn[0]))
    return {type:"ForInLeft"
           ,expression:cn[0]}}

 ,ForInVarLeft:function(m,cn){
    assert(cn[0].type=="VariableDeclaration")
    return {type:"ForInVarLeft"
           ,declaration:cn[0]}}

 ,DebuggerStatement:function(m,cn){
    return {type:"DebuggerStatement"}}

 ,FunctionDeclaration:function(m,cn){var id,params,body
    assert(cn[0].type=="Identifier","name")
    id=cn.shift()
    if(cn.length==2){assert(cn[0].type=="ParameterList");params=cn.shift()}
    assert(cn[0].type=="BlockStatement","body")
    return {type:"FunctionDeclaration"
           ,id:id
           ,params:params?params.elements:null
           ,body:cn[0]}}

 ,VariableDeclaration:function(m,cn){
    assert(cn[0].type=="Identifier","variable identifier")
    assert(!cn[1] || isExpression(cn[1]),"variable value")
    return {type:"VariableDeclaration"
           ,id:cn[0]
           ,init:cn[1]||null}}

 ,VariableStatement:function(m,cn){
    return {type:"VariableStatement"
           ,declarations:cn.map(cleanup_vardecl)}}
 
 ,ThisTok:function(m,cn){
    return {type:"ThisExpression"}}

 ,ArrayLiteral:function(m,cn){var elements=[]
    assert(!cn[0] || cn[0].type=='ElementList')
    if(cn[0])elements=cn.shift().elements
    assert(!cn[0] || cn[0].type=='ElementList')
    if(cn[0])elements.push.apply(elements,cn[0])
    return {type:"ArrayExpression"
           ,elements:elements}}

 ,ElementList:function(m,cn){
    return {type:"ElementList"
           ,elements:cn}}

 ,Elision:function(m,cn){var elements
    assert(!cn[0] || cn[0].type=='ElementList')
    if(cn[0]) elements=cn[0],elements.push(null)
    else elements=[null]
    return {type:"ElementList"
           ,elements:elements}}

 ,ObjectLiteral:function(m,cn){
    assert(!cn[0]||cn[0].type=='PropertyNameAndValueList')
    return {type:"ObjectExpression"
           ,properties:cn[0]?cn[0].properties:[]}}

 ,PropertyNameAndValueList:function(m,cn){
    return {type:"PropertyNameAndValueList"
           ,properties:cn}}

 ,PropertyAssignment:function(m,cn){var kind,key,value
    if(cn[0].type=="PropertyName"){
     kind="init"
     key=cn[0].id
     assert(isExpression(cn[1]))
     value=cn[1]}
    if(cn[0].type=="PropertyGetter"){
     kind='get'
     // XXX how is the function body represented?
     key=cn[0].name
     value=cn[0].body}
    if(cn[0].type=="PropertySetter"){
     kind='set'
     key=cn[0].name
     value=cn[0].body}
    assert(kind,'kind');assert(key,'key');assert(value,'value')
    return {key:key // N.B. no type here
           ,value:value
           ,kind:kind}}

 ,PropertyName:function(m,cn){
    // PropertyName ← IdentifierName / StringLiteral / NumericLiteral
    return {type:"PropertyName"
           ,id:cn[0]}}

 ,PropertyGetter:function(m,cn){
    assert(cn[0]&&cn[0].type=="PropertyName")
    assert(isExpression(cn[0].id))
    assert(cn[1].type=="BlockStatement")
    return {type:"PropertyGetter"
           ,name:cn[0].id
           ,body:cn[1]}}

 ,PropertySetter:function(m,cn){
    assert(cn[0]&&cn[0].type=="PropertyName")
    assert(isExpression(cn[0].id))
    assert(cn[1].type=="Identifier")
    assert(cn[2].type=="BlockStatement")
    return {type:"PropertySetter"
           ,name:cn[0].id
           ,body:{type:"FunctionExpression"
                 ,id:null
                 ,params:[cn[1]]
                 ,body:cn[2]}}}

 ,PropertySetParameterList:function(m,cn){return cn[0]}

 ,IdentifierName:function(m,cn){
    // note this is used only by PropertyName; Identifier doesn't use this
    return {type:"Identifier"
           ,name:m.text()}}

 ,FunctionExpression:function(m,cn){var id,params=[]
    if(cn[0].type=="Identifier") id=cn.shift()
    if(cn[0].type=="ParameterList") params=cn.shift().elements
    assert(cn[0].type=="BlockStatement")
    return {type:"FunctionExpression"
           ,id:id||null
           ,params:params
           ,body:cn[0]
           }}

 ,Identifier:function(m,cn){
    return {type:"Identifier"
           ,name:m.text()}}

 ,FormalParameterList:function(m,cn){
    return {type:"ParameterList" // doesn't appear in output
           ,elements:cn}}

 ,FunctionBody:function(m,cn){
    return {type:"BlockStatement"
           ,body:cn}}

 ,Expression:function(m,cn){
    if(cn.length==1) return cn[0]
    return {type:"SequenceExpression"
           ,expressions:cn}}

 ,UnaryExpression:function(m,cn){
    return cn[0]}

 ,DeleteExpression:function(m,cn){
    return {type:"UnaryExpression"
           ,operator:"delete"
           ,argument:cn[0]}}

 ,VoidExpression:function(m,cn){
    return {type:"UnaryExpression"
           ,operator:"void"
           ,argument:cn[0]}}

 ,TypeofExpression:function(m,cn){
    return {type:"UnaryExpression"
           ,operator:"typeof"
           ,argument:cn[0]}}

 ,PreIncrementExpression:function(m,cn){
    return {type:"UpdateExpression"
           ,operator:"++"
           ,prefix:true
           ,argument:cn[0]}}

 ,PreDecrementExpression:function(m,cn){
    return {type:"UpdateExpression"
           ,operator:"--"
           ,prefix:true
           ,argument:cn[0]}}

 ,UnaryPlusExpression:function(m,cn){
    return {type:"UnaryExpression"
           ,operator:"+"
           ,argument:cn[0]}}

 ,UnaryMinusExpression:function(m,cn){
    return {type:"UnaryExpression"
           ,operator:"-"
           ,argument:cn[0]}}

 ,BitwiseNotExpression:function(m,cn){
    return {type:"UnaryExpression"
           ,operator:"~"
           ,argument:cn[0]}}

 ,LogicalNotExpression:function(m,cn){
    return {type:"UnaryExpression"
           ,operator:"!"
           ,argument:cn[0]}}

 ,PostfixExpression:function(m,cn){
    assert(!cn[1] || cn[1].type=="PostfixOp")
    if(!cn[1]) return cn[0]
    return {type:"UpdateExpression"
           ,operator:cn[1].operator
           ,prefix:false}}

 ,PostIncrementOp:function(m,cn){
    return {type:"PostfixOp"
           ,operator:"++"}}

 ,PostDecrementOp:function(m,cn){
    return {type:"PostfixOp"
           ,operator:"--"}}

 ,AssignmentExpression:function(m,cn){
    assert(cn.length==1 || cn.length==3)
    if(!cn[1])return cn[0]
    assert(cn[1].type=='AssignmentOperator')
    return {type:"AssignmentExpression"
           ,operator:cn[1].operator
           ,left:cn[0]
           ,right:cn[2]}}

 ,AssignmentOperator:function(m,cn){
    return {type:"AssignmentOperator"
           ,operator:m.text()}}

 ,ConditionalExpression:function(m,cn){
    assert(cn.length==1 || cn.length==3)
    if(!cn[1])return cn[0]
    return {type:"ConditionalExpression"
           ,test:cn[0]
           ,consequent:cn[1]
           ,alternate:cn[2]}}

 ,LogicalOrExpression:function(m,cn){
    if(!cn[1])return cn[0]
    return {type:"BinaryExpression"
           ,operator:"||"
           ,left:cn[0]
           ,right:cn[1]}}

 ,LogicalAndExpression:function(m,cn){
    if(!cn[1])return cn[0]
    return {type:"BinaryExpression"
           ,operator:"&&"
           ,left:cn[0]
           ,right:cn[1]}}

 ,BitwiseOrExpression:function(m,cn){
    if(!cn[1])return cn[0]
    return {type:"BinaryExpression"
           ,operator:"|"
           ,left:cn[0]
           ,right:cn[1]}}

 ,BitwiseXOrExpression:function(m,cn){
    if(!cn[1])return cn[0]
    return {type:"BinaryExpression"
           ,operator:"^"
           ,left:cn[0]
           ,right:cn[1]}}

 ,BitwiseAndExpression:function(m,cn){
    if(!cn[1])return cn[0]
    return {type:"BinaryExpression"
           ,operator:"&"
           ,left:cn[0]
           ,right:cn[1]}}

 ,EqualityExpression:function(m,cn){
    assert(cn.length==1 || cn.length==3)
    if(!cn[1])return cn[0]
    assert(cn[1].type=='EqualityOperator')
    return {type:"BinaryExpression"
           ,operator:cn[1].operator
           ,left:cn[0]
           ,right:cn[2]}}

 ,EqualityOp:function(m,cn){
    return {type:"EqualityOperator"
           ,operator:m.text()}}

 ,RelationalExpression:function(m,cn){
    assert(cn.length==1 || cn.length==3)
    if(!cn[1])return cn[0]
    assert(cn[1].type=='RelationalOperator')
    return {type:"BinaryExpression"
           ,operator:cn[1].operator
           ,left:cn[0]
           ,right:cn[2]}}

 ,RelationalOp:function(m,cn){
    return {type:"RelationalOperator"
           ,operator:m.text()}}

 ,ShiftExpression:function(m,cn){
    assert(cn.length==1 || cn.length==3)
    if(!cn[1])return cn[0]
    assert(cn[1].type=='ShiftOperator')
    return {type:"BinaryExpression"
           ,operator:cn[1].operator
           ,left:cn[0]
           ,right:cn[2]}}

 ,ShiftOp:function(m,cn){
    return {type:"ShiftOperator"
           ,operator:m.text()}}

 ,AdditiveExpression:function loop(m,cn){var left,right,op
    assert(cn.length%2 == 1,"odd number of children")
    if(cn.length==1)return cn[0]
    if(cn.length>3){
      left=loop(null,cn.slice(0,-2))}
    else left=cn[0]
    right=cn[cn.length-1]
    op=cn[cn.length-2]
    assert(cn[1].type=='AdditiveOperator')
    return {type:"BinaryExpression"
           ,operator:op.operator
           ,left:left
           ,right:right}}

 ,AdditiveOp:function(m,cn){
    return {type:"AdditiveOperator"
           ,operator:m.text()}}

 ,MultiplicativeExpression:function loop(m,cn){var left,right,op
    assert(cn.length%2 == 1,"odd number of children")
    if(cn.length==1)return cn[0]
    if(cn.length>3){
      left=loop(null,cn.slice(0,-2))}
    else left=cn[0]
    right=cn[cn.length-1]
    op=cn[cn.length-2]
    assert(cn[1].type=='MultiplicativeOperator')
    return {type:"BinaryExpression"
           ,operator:op.operator
           ,left:left
           ,right:right}}

 ,MultiplicativeOp:function(m,cn){
    return {type:"MultiplicativeOperator"
           ,operator:m.text()}}

// LeftHandSideExpr ← (NewTok S?)* ( PrimaryExpr / FunctionExpr ) ( S? Arguments / S? BracketAccessor / S? DotAccessor )*
// see grammars/ECMAScript_5_streamable.peg
 ,LeftHandSideExpression:function(m,cn){var news,core,tail,property,args
    news=[]
    while(cn[0].type=='NewTok') news.push(cn.shift())
    assert(isExpression(cn[0]),'LHSExpr: found core expression (saw '+pp(cn[0])+')')
    core=cn.shift()
    tail=cn
    // now we have the innermost expression, the prefix string of zero or more 'new', and the suffix string of arguments and accessors, in core, news, and tail respectively.
    // We start with the core and eat outwards through the prefixes and suffixes until the entire expression is built up according the correct precedence rules.
    while(cn.length || news.length){
     // First, if there is an accessor, it is appended to create a MemberExpression
     if(cn[0] && (cn[0].type=='DotAccessor' || cn[0].type=='BracketAccessor')){
         property=cn.shift().property
         core={type:"MemberExpression"
              ,object:core
              ,property:property
              ,computed:property.type!='Identifier'}
         // if there was an accessor there might be another one so we need to loop
         continue}
     // Now, if there is any of the tail left, the first element is an Arguments node (parenthesized expression list)
     // If there is an unconsumed prefix new token, then this is a NewExpression, with arguments if cn[0].
     assert(!cn[0] || cn[0].type=='Arguments')
     if(news.length){
         news.pop()
         args=cn.shift()
         core={type:"NewExpression"
              ,constructor:core
              ,arguments:args?args.elements:null}
         // eating Arguments may have exposed a new accessor, so we need to go back to the top of the loop
         continue}
     // Here news.length==0, and if there is a cn[0], it is an Arguments.
     assert(!news.length)
     assert(!cn[0] || cn[0].type=='Arguments')
     // If there is Arguments without "new", that makes a CallExpression, otherwise we are done
     if(cn[0]){
         core={type:"CallExpression"
              ,callee:core
              ,arguments:cn.shift()}}}
    assert(!news.length && !cn.length)
    return core}

 ,NewTok:function(m,cn){return {type:"NewTok"}}

 ,PrimaryExpression:function(m,cn){return cn[0]}

 ,DotAccessor:function(m,cn){
    return {type:"DotAccessor"
           ,property:{type:"Identifier"
                     ,name:m.text().slice(1)}}}

 ,BracketAccessor:function(m,cn){
    return {type:"BracketAccessor"
           ,property:cn[0]}}

 ,Arguments:function(m,cn){
    assert(!cn[0] || cn[0].type=='ArgumentList')
    return {type:"Arguments"
           ,elements:cn[0]?cn[0].elements:null}}

 ,ArgumentList:function(m,cn){
    return {type:"ArgumentList"
           ,elements:cn}}

 ,CaseClause:function(m,cn){
    assert(isExpression(cn[0]))
    return {type:"SwitchCase"
           ,test:cn.shift()
           ,consequent:cn}}

 ,DefaultClause:function(m,cn){
    return {type:"SwitchCase"
           ,test:null
           ,consequent:cn}}

 ,Catch:function(m,cn){
    assert(cn[0].type=="Identifier")
    assert(cn[1].type=='BlockStatement')
    return {type:"CatchClause"
           ,param:cn[0]
           ,body:cn[1]}}

 ,Finally:function(m,cn){
    return {type:"BlockStatement"
           ,body:cn}}

 ,Identifier:function(m,cn){
    return {type:"Identifier"
           ,name:m.text()}}

 ,Literal:function(m,cn){return cn[0]}

 ,NullLiteral:function(m,cn){
    return {type:"Literal"
           ,kind:"null"
           ,value:null}}

 ,BooleanLiteral:function(m,cn){return cn[0]}

 ,TrueTok:function(m,cn){
    return {type:"Literal"
           ,kind:"Boolean"
           ,value:true}}

 ,FalseTok:function(m,cn){
    return {type:"Literal"
           ,kind:"Boolean"
           ,value:false}}

 ,NumericLiteral:function(m,cn){
    return {type:"Literal"
           ,kind:"number"
           ,value:eval(m.text())}} // XXX cheating

 ,StringLiteral:function(m,cn){
    return {type:"Literal"
           ,kind:"string"
           ,value:m.text().slice(1,-1)}}

 ,RegularExpressionLiteral:function(m,cn){
    return {type:"Literal"
           ,kind:"regexp"
           ,value:new RegExp(m.text())}} // N.B. can throw even if parser succeeded

 // everything else we deal with functionally, passing return values up the tree, but for comments we use some mutable local state.

 ,SingleLineComment:function(m,cn){var x
    x=pending_comment
    pending_comment={type:"Comment"
                    ,multiline:false
                    ,text:m.text()}
    if(x)pending_comment.comment=x}

 ,MultiLineComment:function(m,cn){var x
    x=pending_comment
    pending_comment={type:"Comment"
                    ,multiline:true
                    ,text:m.text()
                    ,comment:pending_comment}
    if(x)pending_comment.comment=x}

/*
 ,

 /**/
 }

 ;
 ['VariableDeclarationList'
 ,'VariableDeclaration'
 ,'Expression'
 ,'AssignmentExpression'
 ,'ConditionalExpression'
 ,'LogicalOrExpression'
 ,'LogicalAndExpression'
 ,'BitwiseOrExpression'
 ,'BitwiseXOrExpression'
 ,'BitwiseAndExpression'
 ,'EqualityExpression'
 ,'RelationalExpression'
 ,'RelationalOp'
 ].forEach(function(x){
    if(x in dict) dict[x+'NoIn']=dict[x]})

 for(var rule in dict) dict[rule] = handle_comment(dict[rule])

 // adds comment handling to one of the plain callbacks as they appear above

 // this is actually pretty broken, some comments will be dropped (based on what it ends up attached to)
 function handle_comment(f){
  return function(m,cn){var retval
     retval=f(m,cn)
     if(pending_comment && retval){retval.comment=pending_comment;pending_comment=undefined}
     return retval}}

 function isExpression(x){
  return x&&x.type
    && (  x.type.slice(-10)=="Expression"
       || x.type.slice(-14)=="ExpressionNoIn"
       || x.type=="Literal"
       || x.type=="Identifier" )}

 function isStatement(x){return x&&x.type&&x.type.slice(-9)=="Statement"}

 function cleanup_vardecl(decl){return {id:decl.id,init:decl.init}}

 var warnings=[]
 dict.warn=function(x){warnings.push(x)}

 var parse_result=JSParser.parse(s)

 if(!parse_result[0]) return {type:"ParseError"
                             ,error:PanPG_util.showTree(parse_result)}

 var result = PanPG_util.treeWalker(dict,parse_result)
 if(pending_comment) result.commentAfter=pending_comment // XXX won't ever happen (Program node will always be visited after any Comment it contains)
 if(warnings.length)return warnings.join('\n')
 return result}