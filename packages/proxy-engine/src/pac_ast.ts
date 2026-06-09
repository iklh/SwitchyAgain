import UglifyBackend from './uglifyjs_shim';

export type Node = any;
export type PrintOptions = {
  beautify?: boolean;
  comments?: boolean;
};

const U2 = UglifyBackend as any;

export default U2;

class RawStatement extends U2.AST_SymbolRef {
  aborts: () => boolean;

  constructor(raw: string) {
    super({name: raw});
    this.aborts = () => false;
  }
}

export function compressor(options: Record<string, unknown>, falseByDefault?: Record<string, unknown>): Node {
  return U2.Compressor(options, falseByDefault);
}

export function toplevel(body: Node[]): Node {
  return new U2.AST_Toplevel({body});
}

export function object(properties: Node[]): Node {
  return new U2.AST_Object({properties});
}

export function objectKeyVal(key: string, value: Node): Node {
  return new U2.AST_ObjectKeyVal({key, value});
}

export function rawStatement(raw: string): Node {
  return new RawStatement(raw);
}

export function fn(argnames: string[], body: Node[]): Node {
  return new U2.AST_Function({
    argnames: argnames.map((name) => new U2.AST_SymbolFunarg({name})),
    body
  });
}

export function str(value: string): Node {
  return new U2.AST_String({value});
}

export function num(value: number): Node {
  return new U2.AST_Number({value});
}

export function regexp(value: RegExp): Node {
  return new U2.AST_RegExp({value});
}

export function trueNode(): Node {
  return new U2.AST_True;
}

export function falseNode(): Node {
  return new U2.AST_False;
}

export function thisNode(): Node {
  return new U2.AST_This;
}

export function symbol(name: string): Node {
  return new U2.AST_SymbolRef({name});
}

export function symbolVar(name: string): Node {
  return new U2.AST_SymbolVar({name});
}

export function directive(value: string): Node {
  return new U2.AST_Directive({value});
}

export function returnStmt(value: Node): Node {
  return new U2.AST_Return({value});
}

export function varDef(name: string, value: Node): Node {
  return new U2.AST_VarDef({
    name: symbolVar(name),
    value
  });
}

export function varStmt(definitions: Node[]): Node {
  return new U2.AST_Var({definitions});
}

export function call(expression: Node, args: Node[] = []): Node {
  return new U2.AST_Call({expression, args});
}

export function newExpr(expression: Node, args: Node[] = []): Node {
  return new U2.AST_New({expression, args});
}

export function dot(expression: Node, property: string): Node {
  return new U2.AST_Dot({expression, property});
}

export function sub(expression: Node, property: Node): Node {
  return new U2.AST_Sub({expression, property});
}

export function assign(left: Node, right: Node, operator = '='): Node {
  return new U2.AST_Assign({left, operator, right});
}

export function binary(left: Node, operator: string, right: Node): Node {
  return new U2.AST_Binary({left, operator, right});
}

export function unaryPrefix(operator: string, expression: Node): Node {
  return new U2.AST_UnaryPrefix({operator, expression});
}

export function conditional(condition: Node, consequent: Node, alternative: Node): Node {
  return new U2.AST_Conditional({condition, consequent, alternative});
}

export function block(body: Node[]): Node {
  return new U2.AST_BlockStatement({body});
}

export function simple(body: Node): Node {
  return new U2.AST_SimpleStatement({body});
}

export function ifStmt(condition: Node, body: Node): Node {
  return new U2.AST_If({condition, body});
}

export function doWhile(body: Node, condition: Node): Node {
  return new U2.AST_Do({body, condition});
}

export function switchStmt(expression: Node, body: Node[]): Node {
  return new U2.AST_Switch({expression, body});
}

export function caseStmt(expression: Node, body: Node[]): Node {
  return new U2.AST_Case({expression, body});
}

export function defaultStmt(body: Node[]): Node {
  return new U2.AST_Default({body});
}
