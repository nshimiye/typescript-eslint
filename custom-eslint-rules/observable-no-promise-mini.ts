/**
 * npx tsc eslint_rules/observable-no-promise-aaa.ts && npx eslint index.ts --ext .ts --rulesdir eslint_rules
 * 
 * npx tsc eslint_rules/observable-no-promise-aaa.ts --lib es2015 --target es2015 --moduleResolution node
 * 
 * npx eslint index.ts --ext .ts --rulesdir eslint_rules
 * 
 * npx tsc eslint_rules/observable-no-promise-aaa.ts
 * 
 * 
 */
import { ParserWeakMapESTreeToTSNode } from "@typescript-eslint/typescript-estree/dist/parser-options";
import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";
import * as tsutils from 'tsutils';
import * as ts from 'typescript';

const { getParserServices } = ESLintUtils;

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/custom-eslint-rules/${name}`
);

// Type: RuleModule<"uppercase", ...>

export = createRule({
  name: 'observable-no-promise-mini',
  create(context) {
    const parserServices = getParserServices(context);
    const checker = parserServices.program.getTypeChecker();

    return {
      ReturnStatement(node: TSESTree.ReturnStatement) {
        const expression = node.argument as TSESTree.CallExpression;
        if (isPromiseLikeExpression(checker, parserServices.esTreeNodeToTSNodeMap, expression)) {
          context.report({ messageId: "promiseToObservable", node });
        }
      },
    };
  },
  meta: {
    docs: {
      recommended: 'warn',
      description:
        "This project uses Observables instead of promises",
    },
    messages: {
      uppercase: "Start this name with an upper-case letter.",
      promiseToObservable: "Please use observable instead!",
    },
    type: "suggestion",
    schema: [],
  },
  defaultOptions: [],
});

// =======
function isPromiseLikeExpression(checker: ts.TypeChecker, esTreeNodeToTSNodeMap: ParserWeakMapESTreeToTSNode<TSESTree.Node>, expression: TSESTree.CallExpression): boolean {

  const tsNode = esTreeNodeToTSNodeMap.get(expression);
  if (isPromiseLike(checker, tsNode)) {
    return true;
  }

  const newExpression = (expression?.callee as TSESTree.MemberExpression)?.object as TSESTree.CallExpression;
  if (newExpression) {
    return isPromiseLikeExpression(checker, esTreeNodeToTSNodeMap, newExpression);
  }
  return false;
}

function isPromiseLike(checker: ts.TypeChecker, node: ts.Node): boolean {
  const type = checker.getTypeAtLocation(node);
  for (const ty of tsutils.unionTypeParts(checker.getApparentType(type))) {
    const then = ty.getProperty('then');
    if (then === undefined) {
      continue;
    }

    const thenType = checker.getTypeOfSymbolAtLocation(then, node);
    if (
      hasMatchingSignature(
        thenType,
        signature =>
          signature.parameters.length >= 2 &&
          isFunctionParam(checker, signature.parameters[0], node) &&
          isFunctionParam(checker, signature.parameters[1], node),
      )
    ) {
      return true;
    }
  }
  return false;
}


function hasMatchingSignature(
  type: ts.Type,
  matcher: (signature: ts.Signature) => boolean,
): boolean {
  for (const t of tsutils.unionTypeParts(type)) {
    if (t.getCallSignatures().some(matcher)) {
      return true;
    }
  }

  return false;
}

function isFunctionParam(
  checker: ts.TypeChecker,
  param: ts.Symbol,
  node: ts.Node,
): boolean {
  const type: ts.Type | undefined = checker.getApparentType(
    checker.getTypeOfSymbolAtLocation(param, node),
  );
  for (const t of tsutils.unionTypeParts(type)) {
    if (t.getCallSignatures().length !== 0) {
      return true;
    }
  }
  return false;
}
