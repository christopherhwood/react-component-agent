const { queryLlmWithJsonValidation } = require('../../services/llm');
const { asyncRetry } = require('../../utils/retry');

class InvalidJsonError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidJsonError';
  }
}

/**
 * Generate bug fixes for reverse scrolling components (right to left / bottom
 *  to top).
 * @param {Object} task - Must contain a title field and an _id field
 * @param {string} code - The original code to be replaced.
 * @returns {Promise<{originalCode: string, edit: {codeToReplace: string, newCode: string}, newCode: string, subtaskId: string}[]>} - An array of objects containing the original code, the edit, the new code, and the subtaskId
 */
async function generatePatchesForReverseScrolling(task, code) {
  try {
    const messages = [
      { role: 'system', content: SystemPrompt },
      { role: 'user', content: query() },
    ];
    const response = await asyncRetry(
      async (err) => { return await queryLlmWithJsonValidation(messages, validateCodeEdits, 0, err); }, 
      (err) => err instanceof InvalidJsonError,
      3,
      0
    );
    const edits = applyEdits(code, response, task._id);
    return edits;
  } catch (err) {
    console.log('Error generating patches for reverse scrolling:', err.message);
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

const query = (code) => {
  let query = `# Original Code\n\`\`\`jsx\n${code}\n\`\`\``;
  if (code.includes('onInput')) {
    query += `\n\n# onInput Event Handler\nIt appears we may be listening to input on the contentEditable. If this is being used to channel updates through the React state and back into the contentEditable then that MUST BE STOPPED. YOU MUST NOT use onInput to indirectly update the ContentEditable. That will be a terrible user experience!!
    
    The best and easiest fix is to remove the onInput handler. Until that is done, you will be repeatedly warned about this issue!
    
    If the handler function is not used elsewhere then delete that too, otherwise it may be mistakenly added back in later. I also suggest leaving a comment to never use onInput on contentEditable again.`;
  }
  return query;
};

const SystemPrompt = `You are a staff frontend software engineer working on a new component for your SaaS app. You are the team's specialist in building scrolling behavior. You have been given a new feature request to build a component that scrolls in the opposite direction of the default scrolling behavior. You are responsible for implementing the correct scrolling behavior including things like starting position (at the bottom or right) and the scrolling direction (up or left). You are given the foundational code to build on for the new component. Consider the code and the task and identify what needs improvement.

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

Your edits will be applied in the order they are returned. Any error in any edit will prevent all of the edits from being applied, and you will be alerted of the error.`;

module.exports = { generatePatchesForReverseScrolling };