// TODO:
// 
// Handle the other 90% of AST node types.
// correct string quoting (in util.js)
// the compose_* functions should probably be split up after all, into context_map and compose functions.
// The compose functions Stringⁿ → String will then be extension points; the caller can provide their own for any node types.

// format :: Options × String → String
function format(opts,s){var ast
 opts=opts||{}

 // semicolons, indentation, newline_before_closing_brace, space_after_comma, space_around_operators, space_inside_parens, number_radix, object_literal_comma_first, blank_before_function, space_inside_if_test_parens, space_before_if_test, space_after_single_line_if_test, control_statement_braces, control_statement_empty, string_linebreak_style, string_charset
 default_('semicolons','all') // 'after-all', 'separators', 'only-required', 'before-dangerous'
 default_('indentation',2) // TODO: support tabs
 default_('newline_before_closing_brace',true)
 default_('space_after_comma',true)
 default_('space_around_operators',true) // TODO: add option to show precedence, e.g: 'x = a*b + b*c' but 'x=a+b;'
 default_('space_inside_parens',false) // where parens are used for grouping (not as syntax in control structures)
 default_('number_radix',10) // 8, 10, 16, 'shortest'
 default_('object_literal_comma_first',false)
 default_('blank_before_function',true)
 default_('space_inside_if_test_parens',false) // 'if ( x )' or 'if (x)'
 default_('space_before_if_test',true) // 'if (' or 'if('
 default_('space_after_single_line_if_test',true) // 'if(...) foo()' or 'if(...)foo()'
 default_('control_statement_braces','preserve') // 'preserve', 'braces', 'one-statement-only' [1] [2]
 default_('control_statement_empty','empty-statement') // 'empty-statement', 'empty-braces' [3]
 default_('string_linebreak_style','backslash-n') // 'backslash-n', 'line-continuation', 'plus-operator'
 default_('string_charset','utf-8') // 'utf-8', 'ascii'

 // [1] 'preserve' preserves braces if they are in the input, leaving "if(x)y" without braces and "if(x){y}" with braces.
 //     'braces' always uses a block statement, even with only one statement inside.
 //     'one-statement-only' will drop braces whenever there is only one statement in the body of the if statement.
 // [2] The "control statements" include the if statement and the iteration statements: for, for-in, while, do-while.
 // [3] If a control statement has an empty body, it can be written as an empty statement e.g. "while(x());", or as an empty block e.g. "while(x()){}".

 function default_(k,v){if(opts[k]===undefined)opts[k]=v}

 // parse the input
 ast=js_ast(s)

 if(ast.type=="ParseError") return ast.error

 return print(opts,ast)}


// print :: Options × AST → String
function print(opts,ast){var formattable,context
 formattable=generate_formattable(opts)(ast)
 context={min_precedence:0,indentation:''}
 return formattable.compose(opts,formattable,context)}


// generate_formattable :: Options → AST → Formattable
function generate_formattable(opts){return function self(ast){var f,cn,str1,str2,str3
 //throw x // line "806" = 41
 //log(ast)

 // Some AST nodes on which we recurse can contain some null child elements, 
 // which we handle by returning a formattable that encodes the empty string.

 if(ast===null){
  return {cn:[]
         ,compose:function(){return ''}
         ,min_chars:0
         ,min_width:0
         ,n_statements:0
         }}

/*
{type:'Program'
,elements:[{type:'ExpressionStatement'
           ,expression:{type:'ArrayExpression'
                       ,elements:[{type:'Literal',kind:'string'
                                  ,value:'abc'}
                                 ,{type:'Literal',kind:'string'
                                  ,value:"d\'ef"}
                                 ,{type:'Literal',kind:'string'
                                  ,value:'"xyz","XYZ"'}]}}]}
*/

 switch(ast.type){


 case 'Program':
  cn=ast.elements.map(self)
  f={cn:cn
    ,compose:compose_program_elements
    ,min_chars:sum(cn.map(access('min_chars')))
    ,n_statements:sum(cn.map(access('n_statements')))
    };break


 case 'ExpressionStatement':
  cn=[self(ast.expression)]
  f={cn:cn
    ,min_chars:cn[0].min_chars
    ,min_width:cn[0].min_width
    ,n_statements:1
    ,compose:compose_expression_statement
    };break


 case 'IfStatement':
  cn=[self(ast.test),self(ast.consequent),self(ast.alternate)]
  f={cn:cn
    ,min_chars:sum(cn.map(access('min_chars')))
    ,min_width:max(cn.map(access('min_width')))
    ,n_statements:1+sum(cn.slice(1).map(access('n_statements')))
    ,compose:compose_if_statement
    };break


 case 'BinaryExpression':
  cn=[self(ast.left),self(ast.right)]
  f={cn:cn
    ,min_chars:sum(cn.map(access('min_chars')))
    ,min_width:max(cn.map(access('min_width')))
    ,compose:compose_binary_expression(ast.operator)
    };break


 case 'CallExpression':
  cn=[self(ast.callee),self(ast.arguments)]
  f={cn:cn
    ,min_chars:sum(cn.map(access('min_chars')))
    ,min_width:max(cn.map(access('min_width')))
    ,compose:compose_call_expression
    };break


 case 'Arguments':
  cn=(ast.elements||[]).map(self)
  f={cn:cn
    ,min_chars:sum(cn.map(access('min_chars')))
    ,min_width:max(cn.map(access('min_width')))
    ,compose:compose_arguments
    };break


 case 'ArrayExpression':
  cn=ast.elements.map(self)
  f={cn:cn
    // min length is brackets + commas + sum of min length of children
    ,min_chars:2+(cn.length?cn.length-1:0)+sum(cn.map(access('min_chars')))
    ,min_width:max(cn.map(access('min_width')))
    ,compose:compose_array_expression
    };break


 case 'Literal':
  switch(ast.kind){
  case 'number':
   str1=String(ast.value)
   f={min_chars:str1.length
     ,min_width:str1.length
     ,compose:compose_number_literal(ast.value)
     };break
  case 'string':
   str1=quote_string_single(ast.value)
   str2=quote_string_double(ast.value)
   f={min_chars:min([str1.length,str2.length])
     ,min_width:ast.value.length?3:2 // strings can be broken across lines, but will need at least an opening quote, one character and a line continuation = 3 chars per line
     ,string_quote_pref:str1.length<str2.length ?"'" :str2.length<str1.length ?'"' :undefined
     ,string_quote_penalty:Math.abs(str1.length-str2.length)
     ,compose:compose_string_literal(ast.value)
     };break
  case 'regex':
  default:
  throw new Error('unhandled literal type: '+ast.kind)}
  break


 case 'Identifier':
  f={min_chars:ast.name.length
    ,min_width:ast.name.length
    ,compose:function(){return ast.name}
    };break


 default:
  throw new Error('unhandled AST node type '+ast.type)}


 return f}}

// JavaScript operator precedence:

// 1  bracket accessors, dot accessors
// 2  new with arguments, function call
// 3  new without arguments
// 4  postincrement, postdecrement
// 5  delete, void, typeof, preincrement, predecrement, unary plus, unary minus, bitwise not, logical not
//    Binary operators:
// 6  Multiplicative
// 7  Additive (e + e, e - e)
// 8  Shift
// 9  Relational (<, >, <=, >=, instanceof, in)
// 10 Equality
// 11 BitwiseAnd
// 12 BitwiseXOr
// 13 BitwiseOr
// 14 LogicalAnd
// 15 LogicalOr
// 16 ternary ≔ OrExpr ? AssignExpr : AssignExpr
// 17 assignment operators
// 18 comma operator
//    Other
// 19 statement separators (newlines, semicolons)

var binary_op_prec=
{'*':6
,'/':6
,'+':7
,'-':7
,'<<':8
,'>>':8
,'>>>':8
,'<':9
,'>':9
,'<=':9
,'>=':9
,'instanceof':9
,'in':9
,'==':10
,'!=':10
,'===':10
,'!==':10
,'&':11
,'^':12
,'|':13
,'&&':14
,'||':15
}

// compose_* :: (Options, Formattable, Context) → String
function compose_program_elements(o,f,c){var i,l,ctx,strs=[],str,line_sep
 ctx=extend({},c)
 ctx.min_precedence=20
 for(i=0,l=f.cn.length;i<l;i++){
  if(str=f.cn[i].compose(o,f.cn[i],ctx))strs.push(str)}
 line_sep='\n'+c.indentation
 if(o.semicolons=='all'){
  return strs.map(function(s){return s+';'}).join(line_sep)}
 throw new Error('unimplemented o.semicolon option: '+o.semicolons)}


// f.cn = [test, consequent, alternate]
function compose_if_statement(o,f,c){var ctx,test,conseq,if_branch,alt,else_branch,s1,s2,s3,s4,s5
 ctx=extend({},c)
 ctx.min_precedence=18.5
 test=f.cn[0].compose(o,f.cn[0],ctx)
 ctx.min_precedence=20
 conseq=f.cn[1].compose(o,f.cn[1],ctx)
 if(f.cn[2]){
  alt=f.cn[2].compose(o,f.cn[2],ctx)
  else_branch=compose_control_statement(o,"else",f.cn[2],c)}
 s1=o.space_before_if_test?'if ':'if'
 s2=o.space_inside_if_test_parens?'( ':'('
 s3=o.space_inside_if_test_parens?' )':')'
 if_branch=compose_control_statement(o,s1+s2+test+s3,f.cn[1],c)
 return if_branch
      + (alt ? else_branch : '')
 }

function compose_control_statement(o,control,statement,c){var ctx,s1,is_block
 ctx=extend({},c)
 ctx.min_precedence=20
 s1=statement.compose(o,statement,ctx)
 is_block=statement.type=="Block"
 return control
      + (is_block ? '' : ' ')
      + s1
 }


function compose_expression_statement(o,f,c){
 //log(f)
 return f.cn[0].compose(o,f.cn[0],extend({},c,{min_precedence:18}))}


function compose_call_expression(o,f,c){var ctx,s_callee,s_args
 ctx=extend({},c)
 ctx.min_precedence=2
 s_callee=f.cn[0].compose(o,f.cn[0],ctx)
 s_args=f.cn[1].compose(o,f.cn[1],c)
 return s_callee+s_args} // TODO: add options for whitespace between callee and arguments


function compose_arguments(o,f,c){var ctx,strings
 ctx=extend({},c)
 ctx.min_precedence=17
 strings=f.cn.map(function(arg){return arg.compose(o,arg,c)})
 return '(' // TODO: options for whitespace here
      + strings.join(o.space_after_comma?', ':',')
      + ')'}


// associativity:
//
//       *
//      / \
//     b   *
//        / \
//       d   e
// 
// The tree shown is right-associated.
// If the operator * is left-associative, this must be parenthesized.
// Similarly, the reflection of this tree about the vertical axis would require parentheses if the operator were right-associative.
// When generating the sub-expression, if the left branch of a left-associative operator has the same precedence and associativity, then no parentheses are required.
// In the right branch, a left-associative operator of the same precedence would parse incorrectly if not parenthesized, and a right-associative operator at the same level as a left-associative operator without parentheses would be a parse error, so in all cases, the precedence of the right branch must be higher than the precedence of the parent left-associative operator.


function compose_binary_expression(op){return function _compose_binary_expression(o,f,c){var ctx,prec,assoc,str,op_str,parenthesize,parens
 prec=binary_op_prec[op]
 // it so happens that all the ES5 binary operators are left-associative
 assoc="left"
 ctx=extend({},c,{min_precedence:prec,associativity:"left"})
 op_str=o.space_around_operators?' '+op+' ':op
 str=f.cn[0].compose(o,f.cn[0],extend({},c,{min_precedence:prec,associativity:"left"}))
    +op_str
    +f.cn[1].compose(o,f.cn[1],extend({},c,{min_precedence:prec-0.1,associativity:"none"}))
 parenthesize = prec>c.min_precedence || prec==c.min_precedence && assoc!=c.associativity
 parens=o.spaces_inside_parens?['( ',' )']:['(',')']
 return parenthesize?parens[0]+str+parens[1]
                    :str}}

function compose_array_expression(o,f,c){var subs,i,l,ctx
 subs=[]
 ctx=extend({},c,{min_precedence:17})
 for(i=0,l=f.cn.length;i<l;i++){
  subs[i]=f.cn[i].compose(o,f.cn[i],ctx)}
 return '['
      + subs.join(',')
      + ']'}

function compose_number_literal(n){return function(o,f,c){
 return n.toString(o.number_radix)}}

function compose_string_literal(s){return function(o,f,c){
 }}