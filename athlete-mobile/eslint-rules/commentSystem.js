const EXPORTED_DECLARATIONS =
  "Program > :matches(ExportNamedDeclaration, ExportDefaultDeclaration)";
const PRIVATE_DECLARATIONS = `Program > :matches(${[
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
const JSX_COMMENT_CONTAINERS = ["JSXExpressionContainer", "JSXEmptyExpression"];

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

// Strips the comment markers and the blank first and last lines of a block.
const readBlockLines = (comment) => {
  const lines = comment.value
    .replace(/^\*/, "")
    .split("\n")
    .map((line) => line.replace(/^\s*(\* ?)?/, "").trimEnd());
  const first = lines.findIndex((line) => line !== "");
  const last = lines.findLastIndex((line) => line !== "");
  return lines.slice(first, last + 1);
};

const toLineComments = (lines, indent) =>
  lines.map((line) => (line ? `// ${line}` : "//")).join(`\n${indent}`);

const toDocComment = (lines, indent) =>
  lines.length === 1
    ? `/** ${lines[0]} */`
    : ["/**", ...lines.map((line) => (line ? ` * ${line}` : " *")), " */"].join(
        `\n${indent}`,
      );

// Line comments merge into one doc comment, and a plain block comment gains
// its second asterisk. Other mixes need a person to decide.
const buildDocText = (sourceCode, group) => {
  if (group.every((comment) => comment.type === "Line")) {
    const lines = group.map((comment) =>
      comment.value.replace(/^ /, "").trimEnd(),
    );
    const isSafe = lines.every((line) => !line.includes("*/"));
    return isSafe
      ? toDocComment(lines, readIndent(sourceCode, group[0]))
      : null;
  }
  return group.length === 1 ? `/**${group[0].value}*/` : null;
};

const reportDocGroup = (context, group, messageId) => {
  const { sourceCode } = context;
  const range = [group[0].range[0], group.at(-1).range[1]];
  const text = buildDocText(sourceCode, group);
  context.report({
    loc: { start: group[0].loc.start, end: group.at(-1).loc.end },
    messageId,
    fix: text === null ? null : (fixer) => fixer.replaceTextRange(range, text),
  });
};

const reportBlockComment = (context, comment, messageId) => {
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

const isInJsx = (sourceCode, comment) =>
  JSX_COMMENT_CONTAINERS.includes(
    sourceCode.getNodeByRangeIndex(comment.range[0])?.type,
  );

/**
 * Checks the form of each comment and never demands one. A comment above an
 * exported declaration or on a type member is a block doc comment. JSX keeps
 * its block comments, the only form JSX allows. Every other comment is a line
 * comment.
 */
module.exports = {
  meta: {
    type: "suggestion",
    fixable: "code",
    schema: [],
    messages: {
      exportedNeedsDoc:
        "A comment above an exported declaration is a block doc comment (/** */).",
      memberNeedsDoc:
        "A comment on an interface or type member is a block doc comment (/** */).",
      privateNeedsLine:
        "A comment above a module-private declaration is a line comment (//).",
      blockOutsideJsx:
        "Block comments appear only above exports, on type members and in JSX. Use a line comment (//).",
    },
  },
  create: (context) => {
    const { sourceCode } = context;
    const docComments = new Set();
    const privateComments = new Set();
    const checkDocGroup = (messageId) => (node) => {
      const group = collectLeadingComments(sourceCode, node);
      group.forEach((comment) => docComments.add(comment));
      const isDoc = group.length === 1 && isDocComment(group[0]);
      if (group.length > 0 && !isDoc) reportDocGroup(context, group, messageId);
    };
    const checkRemainingComment = (comment) => {
      if (comment.type === "Line" || docComments.has(comment)) return;
      if (isInJsx(sourceCode, comment)) return;
      const messageId = privateComments.has(comment)
        ? "privateNeedsLine"
        : "blockOutsideJsx";
      reportBlockComment(context, comment, messageId);
    };
    return {
      [EXPORTED_DECLARATIONS]: checkDocGroup("exportedNeedsDoc"),
      [TYPE_MEMBERS]: checkDocGroup("memberNeedsDoc"),
      [PRIVATE_DECLARATIONS]: (node) =>
        collectLeadingComments(sourceCode, node).forEach((comment) =>
          privateComments.add(comment),
        ),
      "Program:exit": () =>
        sourceCode.getAllComments().forEach(checkRemainingComment),
    };
  },
};
