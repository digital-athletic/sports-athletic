const DECLARATIONS = `Program > :matches(${[
  "ExportNamedDeclaration",
  "ExportDefaultDeclaration",
  "VariableDeclaration",
  "FunctionDeclaration",
  "ClassDeclaration",
  "TSTypeAliasDeclaration",
  "TSInterfaceDeclaration",
  "TSEnumDeclaration",
  "TSModuleDeclaration",
  "TSDeclareFunction",
].join(", ")})`;
const TYPE_MEMBERS = [
  "TSPropertySignature",
  "TSMethodSignature",
  "TSIndexSignature",
  "TSCallSignatureDeclaration",
  "TSConstructSignatureDeclaration",
].join(", ");
const FUNCTIONS = [
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
];
const JSX_COMMENT_CONTAINERS = ["JSXExpressionContainer", "JSXEmptyExpression"];
const STAR_PREFIX = /^\s*\* ?/;

const isDocComment = (comment) =>
  comment.type === "Block" && comment.value.startsWith("*");

const startsOwnLine = (sourceCode, comment) => {
  const before = sourceCode.getTokenBefore(comment, { includeComments: true });
  return !before || before.loc.end.line < comment.loc.start.line;
};

const endsOwnLine = (sourceCode, comment) => {
  const after = sourceCode.getTokenAfter(comment, { includeComments: true });
  return !after || after.loc.start.line > comment.loc.end.line;
};

const isInFunctionBody = (node) => {
  for (let current = node; current?.parent; current = current.parent) {
    const { parent } = current;
    if (FUNCTIONS.includes(parent.type) && parent.body === current) return true;
  }
  return false;
};

const isInJsx = (sourceCode, comment) =>
  JSX_COMMENT_CONTAINERS.includes(
    sourceCode.getNodeByRangeIndex(comment.range[0])?.type,
  );

// The comments stacked directly above the node, without a blank line between
// them. A comment after code on the same line belongs to that code.
const collectLeadingComments = (sourceCode, node) => {
  const group = [];
  let nextLine = node.loc.start.line;
  for (const comment of sourceCode.getCommentsBefore(node).reverse()) {
    const isAdjacent = nextLine - comment.loc.end.line <= 1;
    if (!isAdjacent || !startsOwnLine(sourceCode, comment)) break;
    group.unshift(comment);
    nextLine = comment.loc.start.line;
  }
  return group;
};

const readIndent = (sourceCode, comment) =>
  sourceCode.lines[comment.loc.start.line - 1].slice(
    0,
    comment.loc.start.column,
  );

// Drops the leading asterisks of a doc-style block, or else the indent all
// continuation lines share, so deeper indentation inside the text survives.
const stripContinuationPrefix = (lines) => {
  const textLines = lines.filter((line) => line.trim() !== "");
  if (textLines.every((line) => STAR_PREFIX.test(line))) {
    return lines.map((line) => line.replace(STAR_PREFIX, ""));
  }
  const indent = Math.min(...textLines.map((line) => line.search(/\S/)));
  return lines.map((line) => line.slice(indent));
};

// Strips the comment markers and the blank first and last lines of a block.
const readBlockLines = (comment) => {
  const [first, ...rest] = comment.value.replace(/^\*/, "").split("\n");
  const lines = [first.trim(), ...stripContinuationPrefix(rest)].map((line) =>
    line.trimEnd(),
  );
  const start = lines.findIndex((line) => line !== "");
  const end = lines.findLastIndex((line) => line !== "");
  return lines.slice(start, end + 1);
};

const readCommentLines = (comment) =>
  comment.type === "Line"
    ? [comment.value.replace(/^ /, "").trimEnd()]
    : readBlockLines(comment);

const toLineComments = (lines, indent) =>
  lines.map((line) => (line ? `// ${line}` : "//")).join(`\n${indent}`);

const toDocComment = (lines, indent) =>
  lines.length === 1
    ? `/** ${lines[0]} */`
    : ["/**", ...lines.map((line) => (line ? ` * ${line}` : " *")), " */"].join(
        `\n${indent}`,
      );

// A line comment that contains the closing marker cannot move into a block.
const reportDocGroup = (context, group) => {
  const { sourceCode } = context;
  const range = [group[0].range[0], group.at(-1).range[1]];
  const lines = group.flatMap(readCommentLines);
  const isSafe = lines.every((line) => !line.includes("*/"));
  const text = toDocComment(lines, readIndent(sourceCode, group[0]));
  context.report({
    loc: { start: group[0].loc.start, end: group.at(-1).loc.end },
    messageId: "declarationNeedsDoc",
    fix: isSafe ? (fixer) => fixer.replaceTextRange(range, text) : null,
  });
};

const reportAsLineComment = (context, comment, messageId) => {
  const { sourceCode } = context;
  const isFixable =
    startsOwnLine(sourceCode, comment) && endsOwnLine(sourceCode, comment);
  const text = toLineComments(
    readBlockLines(comment),
    readIndent(sourceCode, comment),
  );
  context.report({
    loc: comment.loc,
    messageId,
    fix: isFixable ? (fixer) => fixer.replaceText(comment, text) : null,
  });
};

/**
 * Checks the form of each comment and never demands one, following the Google
 * TypeScript style guide. A comment directly above a declaration or a type
 * member is a doc comment, a comment inside a function body is a line comment,
 * and plain block comments appear only in JSX.
 */
module.exports = {
  meta: {
    type: "suggestion",
    fixable: "code",
    schema: [],
    messages: {
      declarationNeedsDoc:
        "A comment that documents a declaration or a type member is a doc comment (/** */).",
      docInFunctionBody:
        "A comment inside a function body is a line comment (//).",
      blockOutsideJsx:
        "Plain block comments (/* */) appear only in JSX. Use a doc comment (/** */) above a declaration or a line comment (//).",
    },
  },
  create: (context) => {
    const { sourceCode } = context;
    const docGroupComments = new Set();
    const checkDeclaration = (node) => {
      if (isInFunctionBody(node)) return;
      const group = collectLeadingComments(sourceCode, node);
      group.forEach((comment) => docGroupComments.add(comment));
      const isDoc = group.length === 1 && isDocComment(group[0]);
      if (group.length > 0 && !isDoc) reportDocGroup(context, group);
    };
    const checkRemainingComment = (comment) => {
      if (comment.type === "Line" || docGroupComments.has(comment)) return;
      if (isInJsx(sourceCode, comment)) return;
      if (!isDocComment(comment)) {
        reportAsLineComment(context, comment, "blockOutsideJsx");
      } else if (
        isInFunctionBody(sourceCode.getNodeByRangeIndex(comment.range[0]))
      ) {
        reportAsLineComment(context, comment, "docInFunctionBody");
      }
    };
    return {
      [DECLARATIONS]: checkDeclaration,
      [TYPE_MEMBERS]: checkDeclaration,
      "Program:exit": () =>
        sourceCode.getAllComments().forEach(checkRemainingComment),
    };
  },
};
