const fs = require('fs');
const os = require('os');
const path = require('path');
const { ESLint } = require('eslint');
const Parser = require('tree-sitter');
const JavaScript = require('tree-sitter-javascript');

async function lintAndFixCode(code, checkUnusedVars = true) {
  // write code to a temp file
  const tempFile = path.join(os.tmpdir(), 'temp.js');
  fs.writeFileSync(tempFile, code);

  // Lint temp file
  let config = ReactConfig;
  if (!checkUnusedVars) {
    config.rules = { 'no-unused-vars': 'off' };
  }
  const eslint = new ESLint({ overrideConfig: config, fix: true }); // Ensure ESLint is configured to attempt fixes
  const results = await eslint.lintFiles([tempFile]);
  await ESLint.outputFixes(results);

  // Read the fixed code from the temp file
  const fixedCode = fs.readFileSync(tempFile, 'utf8');

  let customResults = [];
  try {
    const parser = new Parser();
    parser.setLanguage(JavaScript);
    const tree = parser.parse(fixedCode);
    customResults = checkAllElementsClosed(tree.rootNode);
    customResults = customResults.concat(checkImports(tree.rootNode));
  } catch (error) {
    console.error('Error parsing fixed code:', error);
  }

  const formatter = await eslint.loadFormatter('json'); 
  const formattedResults = formatter.format(results);
  const extractedResults = JSON.parse(formattedResults).flatMap(result => result.messages);
  const fullResults = extractedResults.concat(customResults);
  return { code: fixedCode, results: JSON.stringify(fullResults)};
}

function checkAllElementsClosed(rootNode) {
  let errors = [];

  function traverse(node) {
    // Check if the node is a JSX opening element and not self-closing
    if (node.type === 'jsx_opening_element') {
      const correspondingClosingTag = findCorrespondingClosingTag(node);

      if (!correspondingClosingTag) {
        let openTag = node.text.split(' ')[0];
        openTag = openTag.trim();
        // if openTag doesn't end in > then add it
        if (!openTag.endsWith('>')) {
          openTag += '>';
        }
        errors.push({
          // Assuming ruleId is fixed since we're checking for a specific issue
          ruleId: 'jsx-no-unclosed-tags',
          severity: 2, // Typically 1 for warning, 2 for error
          message: `JSX tag ${openTag} is not properly closed.`,
          line: node.startPosition.row + 1, // Tree-sitter rows are 0-indexed; add 1 for human-readable line numbers
          column: node.startPosition.column + 1
        });
      }
    }

    node.children.forEach(child => traverse(child));
  }

  traverse(rootNode);
  return errors;
}

function findCorrespondingClosingTag(openingNode) {
  // use node.nextSibling to traverse over openingNode siblings and look for node.type === 'jsx_closing_element'
  let sibling = openingNode.nextSibling;
  let openTag = openingNode.text.split(' ')[0];
  // remove < and > from openTag
  openTag = openTag.replace('<', '').replace('>', '').trim();
  console.log('openTag', openTag);
  while (sibling) {
    console.log('sibling', sibling.text);
    console.log('sibling type', sibling.type);
    if (sibling.type === 'jsx_closing_element' && sibling.text.includes(openTag)) {
      return sibling;
    }
    sibling = sibling.nextSibling;
  }
  return null;
}

const ReactConfig = {
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true, // Enable JSX
    },
  },
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended', // Uses the recommended rules from eslint-plugin-react
    'plugin:react-hooks/recommended', // Uses the recommended rules from eslint-plugin-react-hooks
    'plugin:prettier/recommended', // Enables eslint-plugin-prettier and eslint-config-prettier
  ],
  settings: {
    react: {
      version: '18.2', // Automatically detect the React version
    },
  },
  plugins: [
    'react',
    'react-hooks',
  ],
};

function checkImports(rootNode) {
  // Look for import statements where the source does not begin with https://cdn.jsdelivr.net. Return an error for each one found in eslint error format.
  let errors = [];
  function traverse(node) {
    if (node.type === 'import_declaration') {
      if (!node.text.includes('https://cdn.jsdelivr.net')) {
        errors.push({
          ruleId: 'no-bad-imports',
          severity: 2,
          message: `Import source ${node.text} is not from a cdn. It must be from a cdn.`,
          line: node.startPosition.row + 1,
          column: node.startPosition.column + 1,
        });
      }
    }
    node.children.forEach(child => traverse(child));
  }
  traverse(rootNode);
  return errors;
}

module.exports = { lintAndFixCode };