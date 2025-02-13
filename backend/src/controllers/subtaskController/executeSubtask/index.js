const { queryLlmWithJsonValidation } = require('../../../services/llm');
const { asyncRetry } = require('../../../utils/retry');
const { generateAccessibilityGuidelines } = require('./generateAccessibilityGuidelines');
// const { generateDesignGuidelines } = require('./generateDesignGuidelines');
const { lintAndFixCode } = require('./lint');
const { generateLintFixes } = require('./generateLintFixes');
const { generateBugFixesForContentEditableCode } = require('./contentEditable/generateBugFixesForContentEditableCode');
const { generateBugFixesForContentEditableListUse } = require('./contentEditable/generateBugFixesForContentEditableListUse');


class InvalidJsonError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidJsonError';
  }
}

/**
 * Execute a subtask and return the code for the component. Retries the request to LLM if the response is invalid JSON.
 * @param {Object} subtask - Must contain a title field
 * @param {string | null | undefined} originalCode - The original code to be replaced. Can be null or undefined.
 * @returns {Promise<{originalCode: string, edit: {codeToReplace: string, newCode: string}, newCode: string, subtaskId: string}[]>} - An array of objects containing the original code, the edit, the new code, and the subtaskId
 * @throws {Error} If any helper functions error out
 */
async function executeSubtask(subtask, originalCode) {
  const savedOriginalCode = originalCode;
  if (!subtask.title || typeof subtask.title !== 'string') {
    throw new Error('Invalid subtask');
  }

  const promises = [
    generateAccessibilityGuidelines(subtask.title),
  ];
  const [accessibilityGuidelines] = await Promise.all(promises);

  let messages = [
    { role: 'system', content: getSystemPrompt(originalCode) },
    { role: 'user', content: getQuery(subtask.title, null, null, null, originalCode) },
  ];
  let response = {user: 'assistant', content: '{edits: []}'};
  try {
    response = await asyncRetry(
      async (err) => { return await queryLlmWithJsonValidation(messages, getValidateSubtaskMethod(originalCode), 0, err);},
      (err) => err instanceof InvalidJsonError,
      3,
      0
    );
    const edits = applyEdits(originalCode, response, subtask._id);
    if (edits.length > 0) {
      originalCode = edits[edits.length - 1].newCode;
    }
    // const {code, lintResults} = await lintAndFixCode(originalCode);
    // originalCode = code;
    // if (lintResults && lintResults.length) {
    //   messages.push(response, {role: 'user', content: 'The code has lint errors after executing your edits. Reply with the edits necessary to fix the lint errors below:\n\n# Lint Errors\n```json\n' + JSON.stringify(lintResults) + '\n```'});
    //   response = await asyncRetry(
    //     async (err) => { return await queryLlmWithJsonValidation(messages, getValidateSubtaskMethod(originalCode), 0, err);},
    //     (err) => err instanceof InvalidJsonError,
    //     3,
    //     0
    //   );
    //   const edits = applyEdits(originalCode, response, subtask._id);
    //   if (edits.length > 0) {
    //     originalCode = edits[edits.length - 1].newCode;
    //   }
    // }
  } catch {
    // Do nothing
  }
  
  // const designGuidelines = await generateDesignGuidelines(subtask.title, originalCode);

  // messages[0] = { role: 'system', content: getSystemPrompt(originalCode) };
  // messages.push({ role: 'assistant', content: response.content }, { role: 'user', content: getDesignGuidelinesQuery(designGuidelines, originalCode) });
  // try {
  //   response = await asyncRetry(
  //     async (err) => { return await queryLlmWithJsonValidation(messages, getValidateSubtaskMethod(originalCode), 0, err);},
  //     (err) => err instanceof InvalidJsonError,
  //     3,
  //     0
  //   );
  //   const edits = applyEdits(originalCode, response, subtask._id);
  //   if (edits.length > 0) {
  //     originalCode = edits[edits.length - 1].newCode;
  //   }
  // } catch {
  //   // Do nothing
  // }
  
  messages[0] = { role: 'system', content: getSystemPrompt(originalCode) };
  messages.push({ role: 'assistant', content: response.content }, { role: 'user', content: getAccessibilityGuidelinesQuery(accessibilityGuidelines, originalCode) });
  try {
    response = await asyncRetry(
      async (err) => { return await queryLlmWithJsonValidation(messages, getValidateSubtaskMethod(originalCode), 0, err);},
      (err) => err instanceof InvalidJsonError,
      1,
      0
    );
    const edits = applyEdits(originalCode, response, subtask._id);
    if (edits.length > 0) {
      originalCode = edits[edits.length - 1].newCode;
    }
  } catch {
    // Do nothing
  }

  if (originalCode.includes('contentEditable')) {
    try {
      const edits = await generateBugFixesForContentEditableCode(subtask, originalCode);
      if (edits.length > 0) {
        originalCode = edits[edits.length - 1].newCode;
      }
    } catch {
    // Do nothing
    }
  }

  if (originalCode.includes('insertOrderedList') || originalCode.includes('insertUnorderedList')) {
    try {
      const edits = await generateBugFixesForContentEditableListUse(subtask, originalCode);
      if (edits.length > 0) {
        originalCode = edits[edits.length - 1].newCode;
      }
    } catch {
    // Do nothing
    }
  }

  // const renderErrors = await testComponentRendering(originalCode);
  const lintResults = await lintAndFixCode(originalCode);
  originalCode = lintResults.code;
  const edits = await generateLintFixes(subtask, savedOriginalCode, originalCode, lintResults.results);
  if (edits.length > 0) {
    originalCode = edits[edits.length - 1].newCode;
  }

  return [{originalCode: savedOriginalCode, newCode: originalCode, subtaskId: subtask._id}];
}

// const getDesignGuidelinesQuery = (designGuidelines, code) => {
//   return `Good, now adjust the code as necessary to satisfy the following design guidelines:\n${designGuidelines}\n## Code\n\`\`\`jsx\n${code}\n\`\`\``;
// };

const getAccessibilityGuidelinesQuery = (accessibilityGuidelines, code) => {
  return `Good, now adjust the code as necessary to satisfy the following accessibility guidelines:\n${accessibilityGuidelines}\n## Code\n\`\`\`jsx\n${code}\n\`\`\``;
};

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

const getQuery = (task, accessibilityGuidelines, designGuidelines, testCases, originalCode) => {
  let query = `# Task: ${task}`;
  if (accessibilityGuidelines) {
    query += `\n# Accessibility Guidelines:\n${accessibilityGuidelines}`;
  }
  if (designGuidelines) {
    query += `\n# Design Guidelines:\n${designGuidelines}`;
  }
  if (testCases) {
    query += `\n# Test Cases:\n${testCases}`;
  }
  if (originalCode) {
    query += `\n# Original Code:\n\`\`\`javascript\n${originalCode}\n\`\`\``;
  }
  return query;
};

const getValidateSubtaskMethod = (originalCode) => {
  return originalCode ? genValidateSubtaskWithOriginalCode(originalCode) : validateSubtaskWithoutOriginalCode;
};

const genValidateSubtaskWithOriginalCode = (originalCode) => {
  return (json) => {
    if (!Array.isArray(json.edits)) {
      throw new InvalidJsonError('Invalid edits');
    }
    for (const edit of json.edits) {
      if (typeof edit !== 'object' || !edit.codeToReplace || typeof edit.codeToReplace !== 'string' || typeof edit.newCode !== 'string') {
        throw new InvalidJsonError('Invalid edit');
      }
      if (!originalCode.includes(edit.codeToReplace)) {
        throw new InvalidJsonError(`Invalid codeToReplace:\n\`\`\`javascript\n${edit.codeToReplace}\n\`\`\`\nnot found in original code`);
      }
    }
    return true;
  };
};

const validateSubtaskWithoutOriginalCode = (json) => {
  if (!json.code || typeof json.code !== 'string') {
    throw new InvalidJsonError('Invalid code');
  }
  return true;
};

const getSystemPrompt = (originalCode) => `You are a freelance software engineer working with a client who needs to generate a UI Component for their SaaS app using React and TailwindCss. You will receive a task from the user and are responsible for returning a working component that satisfies the request. Each request is one in a series of requests, there may be existing code that was written to satisfy previous requests. Work with that code and only delete or modify it if the task explicitly instructs you to do so.

Your clients are working on early stage prototype projects and may not have through completely through all details of the component. That is okay, they trust your judgement on unspecified details. The most critical part of your work is to return a working component that can render and that satisfies the request. If dummy data is needed to demonstrate the component working, you should include that as well. Your client will be happy to see a working component that they can interact with.

Prioritize building modular and easy to maintain code with small components combining together to create more complex components. The code should be easy for your clients to understand and modify. Be sure that your components are all combined into what is rendered on the screen.

Strictly adhere to the task at hand and DO NOT add any additional functionality or extra components that are not requested. Do not even include extra labels, divs, etc. For example, if the task is to just add a button, a label, or a text input area then you should only add that one element and nothing else. Keep the component and the code lean, focused, and beautiful.

Use best practices like accessibility, responsive design, and semantic HTML, as well as the latest features of React and TailwindCss.

Here are the imports for React, ReactDOM, & PropTypes:
\`\`\`javascript
import React from 'https://cdn.jsdelivr.net/npm/react@18.2.0/+esm';
import ReactDOM from 'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/+esm';
import PropTypes from 'https://cdn.jsdelivr.net/npm/prop-types@15.8.1/+esm';
\`\`\`
Only use these imports and place them at the top of the file. Do NOT import other components or libraries. Do NOT use try to import from 'react' or 'react-dom' or 'prop-types' directly. Use the imports provided.

Do NOT import other components or libraries. Build with just react and tailwind css.

When writing your jsx, be sure to close all tags and write valid jsx. If deleting code, be sure to leave the code in a working state.

Pay attention to the comments in the code. If there are comments to not do something, you should not do it.

The root element to attach to has the id 'root'.

When it comes to color choices, please note that your component will be displayed on a screen with a dark background of \`bg-grey-950\`. Be careful using dark colors as they may not be visible.

Remember to use all subcomponents you built when you render to the root, don't leave anything out!

Return your response in json format like so: ${originalCode ? '{edits: [{codeToReplace: \'an exact copy of the text (including spacing, all classNames, comments, etc.) from the original code that will be replaced. Cannot be an empty string.\', newCode: \'the new code that will replace the codeToReplace. Will be copied verbatim.\'}]}.\n\nYour edits will be applied in the order they are returned. Any error in any edit will prevent all of the edits from being applied, and you will be alerted of the error.' : '{code: \'\'}'}`;

module.exports = {
  executeSubtask,
};