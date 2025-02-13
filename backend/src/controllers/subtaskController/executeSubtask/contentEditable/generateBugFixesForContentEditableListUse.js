const { queryLlmWithJsonValidation } = require('../../../../services/llm');
const { asyncRetry } = require('../../../../utils/retry');

class InvalidJsonError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidJsonError';
  }
}

/**
 * Generate bug fixes for contenteditable list use and return the code for the component. Retries the request to LLM if the response is invalid JSON.
 * @param {Object} task - Must contain a title field and an _id field
 * @param {string} code - The original code to be replaced.
 * @returns {Promise<{originalCode: string, edit: {codeToReplace: string, newCode: string}, newCode: string, subtaskId: string}[]>} - An array of objects containing the original code, the edit, the new code, and the subtaskId
 */
async function generateBugFixesForContentEditableListUse(task, code) {
  let edits = await _generateBugFixesForContentEditableListUse(task, code);
  if (edits.length > 0) {
    code = edits[edits.length - 1].newCode;
  }
  if (code.includes('onInput')) {
    const res = await asyncRetry(
      async (err) => { return await queryLlmWithJsonValidation([
        { role: 'system', content: SystemPrompt },
        { role: 'user', content: LastChanceQuery + `\n\nThe code to edit is below:\n\`\`\`jsx\n${code}\n\`\`\`` }],
      validateCodeEdits,
      0,
      err
      );},
      (err) => err instanceof InvalidJsonError,
      3,
      0
    );
    edits = edits.concat(applyEdits(code, res, task._id));
  }
  console.log('\n\n\nGENERATE CONTENTEDITABLE-LIST_USE BUG FIXES EDITS:', JSON.stringify(edits.map(e => e.edit)), '\n\n\n');
  return edits;
}

async function _generateBugFixesForContentEditableListUse(task, code) {
  try {
    console.log('GENERATING CONTENTEDITABLE-LIST_USE BUG FIXES');
    const res = await asyncRetry(
      async (err) => { return await queryLlmWithJsonValidation([
        { role: 'system', content: SystemPrompt },
        { role: 'user', content: DeveloperGuidePrompt },
        { role: 'assistant', content: 'Ok, thank you. I will use this to generate bug fixes for the code.'},
        { role: 'user', content: query(code) }],
      validateCodeEdits,
      0,
      err
      );},
      (err) => err instanceof InvalidJsonError,
      3,
      0
    );
    console.log('\n\n\nGENERATE CONTENTEDITABLE-LIST_USE BUG FIXES RESPONSE:', JSON.stringify(res), '\n\n\n');
    const edits = applyEdits(code, res, task._id);
    return edits;
  } catch (err) {
    console.log('\n\n\nGENERATE CONTENTEDITABLE-LIST_USE BUG FIXES ERROR:', err, '\n\n\n');
    return [];
  }
}

const applyEdits = (originalCode, response, subtaskId) => {
  let _originalCode = originalCode;
  const json = JSON.parse(response.content);
  if (!json.code && json.edits.length === 0) {
    return [];
  }

  if (json.code) {
    return [{
      originalCode: '', 
      edit: { codeToReplace: '', newCode: json.code },
      newCode: json.code,
      subtaskId: subtaskId
    }];
  }
  return json.edits.map(edit => {
    const newCode = _originalCode.replace(edit.codeToReplace, edit.newCode);
    if (newCode === _originalCode) {
      console.error('Edit failed:', edit, _originalCode);
    }
    const e = {
      originalCode: _originalCode,
      edit,
      newCode: newCode,
      subtaskId: subtaskId
    };
    _originalCode = newCode;
    return e;
  });
};

const validateCodeEdits = (json) => {
  if (!Array.isArray(json.edits)) {
    throw new InvalidJsonError('Invalid edits');
  }
  for (const edit of json.edits) {
    if (typeof edit !== 'object' || !edit.codeToReplace || typeof edit.codeToReplace !== 'string' || typeof edit.newCode !== 'string') {
      throw new InvalidJsonError('Invalid edit');
    }
  }
  return true;
};

const LastChanceQuery = `You MUST remove this implementation and substitute it with a direct DOM manipulation approach. You will be reminded repeatedly until this is fixed. 
    
You can use the function below as a starting point:

\`\`\`javascript
function toggleList(type) {
  const range = saveSelection();
  if (!range) return;

  const selectedText = range.toString();

  // Check if the selection is already in a list
  let parent = range.commonAncestorContainer;
  while (parent && parent.nodeName !== "LI" && parent.nodeName !== "OL" && parent.nodeName !== "UL") {
      parent = parent.parentNode;
  }

  if (parent && (parent.nodeName === "LI" || parent.nodeName === "OL" || parent.nodeName === "UL")) {
      // If in a list, check if it's the same type to toggle off or switch type
      if (parent.nodeName === "LI") {
          parent = parent.parentNode; // Get UL or OL parent
      }
      if ((type === 'unordered' && parent.nodeName === "UL") || (type === 'ordered' && parent.nodeName === "OL")) {
          // Toggle off the list by replacing it with paragraphs or plain text
          const listItems = Array.from(parent.children);
          const plainText = listItems.map(item => \`<p>\${item.innerHTML}</p>\`).join('');
          parent.outerHTML = plainText; // Replace the whole list with paragraphs
      } else {
          // Switch list type
          const newListType = type === 'unordered' ? 'ul' : 'ol';
          parent.outerHTML = \`<\${newListType}>\${parent.innerHTML}</\${newListType}>\`;
      }
  } else {
      // Start a new list
      const lines = selectedText.split('\n').filter(line => line.trim() !== '');
      let listItems = lines.length > 0 ? lines.map(line => \`<li>\${line}</li>\`).join('') : '<li></li>';
      const listTypeTag = type === 'unordered' ? 'ul' : 'ol';
      const listHtml = \`<\${listTypeTag}>\${listItems}</\${listTypeTag}>\`;

      if (document.queryCommandSupported('insertHTML')) {
          document.execCommand('insertHTML', false, listHtml);
      } else {
          range.insertNode(document.createElement(listHtml));
      }
  }
  restoreSelection(range);
}

// Usage examples
// toggleList('unordered'); // To toggle unordered list
// toggleList('ordered');   // To toggle ordered list
\`\`\``;

const query = (code) => {
  let query = `# Original Code\n\`\`\`jsx\n${code}\n\`\`\``;
  if (code.includes('insertOrderedList') || code.includes('insertUnorderedList')) {
    query += `\n\n# insertOrderedList or insertUnorderedList command identified!\nIt appears we may be trying to manage ordered or unordered lists using the document.execCommand API. This not recommended.
    
    You MUST remove this implementation and substitute it with a direct DOM manipulation approach. You will be reminded repeatedly until this is fixed. 
    
    You can use the function below as a starting point:

    \`\`\`javascript
    function toggleList(type) {
      const range = saveSelection();
      if (!range) return;
    
      const selectedText = range.toString();
    
      // Check if the selection is already in a list
      let parent = range.commonAncestorContainer;
      while (parent && parent.nodeName !== "LI" && parent.nodeName !== "OL" && parent.nodeName !== "UL") {
          parent = parent.parentNode;
      }
    
      if (parent && (parent.nodeName === "LI" || parent.nodeName === "OL" || parent.nodeName === "UL")) {
          // If in a list, check if it's the same type to toggle off or switch type
          if (parent.nodeName === "LI") {
              parent = parent.parentNode; // Get UL or OL parent
          }
          if ((type === 'unordered' && parent.nodeName === "UL") || (type === 'ordered' && parent.nodeName === "OL")) {
              // Toggle off the list by replacing it with paragraphs or plain text
              const listItems = Array.from(parent.children);
              const plainText = listItems.map(item => \`<p>\${item.innerHTML}</p>\`).join('');
              parent.outerHTML = plainText; // Replace the whole list with paragraphs
          } else {
              // Switch list type
              const newListType = type === 'unordered' ? 'ul' : 'ol';
              parent.outerHTML = \`<\${newListType}>\${parent.innerHTML}</\${newListType}>\`;
          }
      } else {
          // Start a new list
          const lines = selectedText.split('\n').filter(line => line.trim() !== '');
          let listItems = lines.length > 0 ? lines.map(line => \`<li>\${line}</li>\`).join('') : '<li></li>';
          const listTypeTag = type === 'unordered' ? 'ul' : 'ol';
          const listHtml = \`<\${listTypeTag}>\${listItems}</\${listTypeTag}>\`;
    
          if (document.queryCommandSupported('insertHTML')) {
              document.execCommand('insertHTML', false, listHtml);
          } else {
              range.insertNode(document.createElement(listHtml));
          }
      }
      restoreSelection(range);
    }
    
    // Usage examples
    // toggleList('unordered'); // To toggle unordered list
    // toggleList('ordered');   // To toggle ordered list
    \`\`\``;
  }
  return query;
};

const SystemPrompt = `You are a staff software engineer who specializes in contentEditable use in React. You are working on a UI Component for your SaaS app using React and TailwindCss. Your team has already started work on the component and has some initial code. Your job is to review their code and ensure the contentEditable is being used correctly and without any bugs related to performance or core functionality.

To assist you, we are supplying you with the document "A Hacker's Guide to ContentEditable Lists". Leverage the guide to find and fix potential bugs related to ContentEditable list implementations.

Maintain the initial intention of the code. Do NOT significantly modify the component to fix bugs. Do NOT remove or add new features. Do NOT alter styles or accessibility (unless the bug is related to styles or accessibility).

Here are the imports for React, ReactDOM, & PropTypes:
\`\`\`javascript
import React from 'https://cdn.jsdelivr.net/npm/react@18.2.0/+esm';
import ReactDOM from 'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/+esm';
import PropTypes from 'https://cdn.jsdelivr.net/npm/prop-types@15.8.1/+esm';
\`\`\`
Only use these imports and place them at the top of the file. Do NOT import other components or libraries. Do NOT use try to import from 'react' or 'react-dom' or 'prop-types' directly. Use the imports provided.

Do NOT import other components or libraries. Build with just react and tailwind css.

When you make a change you must first locate the code you want to change. You will return the EXACT COPY of the code you want to change, along with the new code that will replace it.

You will return your edits using JSON in the format \`{edits: [{codeToReplace: 'an exact copy (including spacing, linebreaks, & comments) from the original code that will be replaced. Cannot be an empty string.', newCode: 'the new code that will replace the codeToReplace. Will be copied verbatim.'}]}\`.

Your edits will be applied in the order they are returned. Any error in any edit will prevent all of the edits from being applied, and you will be alerted of the error.
`;

const DeveloperGuidePrompt = `Here is a guide to help with your review.

# A Hacker's Guide to ContentEditable's Lists

The problem we face is that contentEditable's lists don't always work as expected. Instead of using document.execCommand, we will just directly modify the DOM to make our lists. Below is a guide on how to do this:

You should implement a function similar to what's below and use that.
\`\`\`javascript
function toggleList(type) {
  const range = saveSelection();
  if (!range) return;

  const selectedText = range.toString();

  // Check if the selection is already in a list
  let parent = range.commonAncestorContainer;
  while (parent && parent.nodeName !== "LI" && parent.nodeName !== "OL" && parent.nodeName !== "UL") {
      parent = parent.parentNode;
  }

  if (parent && (parent.nodeName === "LI" || parent.nodeName === "OL" || parent.nodeName === "UL")) {
      // If in a list, check if it's the same type to toggle off or switch type
      if (parent.nodeName === "LI") {
          parent = parent.parentNode; // Get UL or OL parent
      }
      if ((type === 'unordered' && parent.nodeName === "UL") || (type === 'ordered' && parent.nodeName === "OL")) {
          // Toggle off the list by replacing it with paragraphs or plain text
          const listItems = Array.from(parent.children);
          const plainText = listItems.map(item => \`<p>\${item.innerHTML}</p>\`).join('');
          parent.outerHTML = plainText; // Replace the whole list with paragraphs
      } else {
          // Switch list type
          const newListType = type === 'unordered' ? 'ul' : 'ol';
          parent.outerHTML = \`<\${newListType}>\${parent.innerHTML}</\${newListType}>\`;
      }
  } else {
      // Start a new list
      const lines = selectedText.split('\n').filter(line => line.trim() !== '');
      let listItems = lines.length > 0 ? lines.map(line => \`<li>\${line}</li>\`).join('') : '<li></li>';
      const listTypeTag = type === 'unordered' ? 'ul' : 'ol';
      const listHtml = \`<\${listTypeTag}>\${listItems}</\${listTypeTag}>\`;

      if (document.queryCommandSupported('insertHTML')) {
          document.execCommand('insertHTML', false, listHtml);
      } else {
          range.insertNode(document.createElement(listHtml));
      }
  }
  restoreSelection(range);
}

// Usage examples
// toggleList('unordered'); // To toggle unordered list
// toggleList('ordered');   // To toggle ordered list
\`\`\``;
 
module.exports = { generateBugFixesForContentEditableListUse };