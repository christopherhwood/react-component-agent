const { queryLlmWithJsonValidation } = require('../../../services/llm');
const { asyncRetry } = require('../../../utils/retry');
const { lintAndFixCode } = require('./lint');
const { pickBestCode } = require('../../userTaskController/executeFoundationTask/pickBestCode');

class InvalidJsonError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidJsonError';
  }
}

async function generateLintFixes(task, originalCode, newCode, lintResults) {
  if (!lintResults || lintResults.length === 0) {
    return [];
  }
  
  let attempts;
  if (lintResults.length <= 2) {
    attempts = 4;
  } else if (lintResults.length <= 5) {
    attempts = 5;
  } else {
    attempts = 6;
  }

  const lintFixPromises = [];
  for (let i = 0; i < attempts; i++) {
    lintFixPromises.push(recursiveLintSolver(task, originalCode, newCode, lintResults));
  }
  const polishedCodes = await Promise.all(lintFixPromises);
  const lintedCodes = await Promise.all(polishedCodes.map(code => lintAndFixCode(code)));
  const minErrorCount = Math.min(...lintedCodes.map(codeResult => JSON.parse(codeResult.results).length));
  const successfulLintCodes = lintedCodes.filter(codeResult => JSON.parse(codeResult.results).length === minErrorCount);

  let polishedCode = successfulLintCodes[0];
  if (successfulLintCodes.length > 1) {
    polishedCode = await pickBestCode(task.title, successfulLintCodes);
  }
  return [{ originalCode: newCode, newCode: polishedCode.code, subtaskId: task._id }];
}

async function recursiveLintSolver(task, originalCode, newCode, lintResults, attemptsRemaining = 1) {
  console.log('lint attempts remaining', attemptsRemaining);
  if (attemptsRemaining === 0) {
    return newCode;
  }
  try {
    const res = await asyncRetry(
      async (err) => { return await queryLlmWithJsonValidation([
        { role: 'system', content: SystemPrompt },
        { role: 'user', content: contextualQuery(task.title, originalCode, newCode)},
        { role: 'assistant', content: 'Got it, thank you for the background context. What lint errors exist in the new code that you would like me to help you resolve?'},
        { role: 'user', content: query(newCode, lintResults) }
      ], validateCodeEdits, 0.25, err);},
      (err) => err instanceof InvalidJsonError,
      1,
      0
    );
    const edits = applyEdits(newCode, res, task._id);
    if (edits.length > 0) {
      newCode = edits[edits.length - 1].newCode;
    }
    // lint again
    const newLintResults = await lintAndFixCode(newCode);
    newCode = newLintResults.code;
    if (newLintResults.results.length !== 0) {
      return await recursiveLintSolver(task, originalCode, newCode, newLintResults.results, attemptsRemaining - 1);
    }
    return newCode;
  } catch {
    return newCode;
  }
}

const contextualQuery = (taskTitle, preTaskCode, newCode) => {
  return `I am working on a task titled "${taskTitle}".\n\nBefore starting this task, my code looked like this:\n\`\`\`jsx\n${preTaskCode}\n\`\`\`\n\nI have made some changes to the code and now it looks like this:\n\`\`\`jsx\n${newCode}\n\`\`\`\n\nI am now encountering some lint errors and I need help resolving them.`;
};

const query = (code, lintResults) => {
  return `Here are the lint errors:\`\`\`json\n${JSON.stringify(lintResults)}\n\`\`\`\n\nAnd as a reminder, here is the new code that we need to fix:\n\n# New Code:\`\`\`jsx\n${code}\n\`\`\`\n\nYou MUST fix all lint errors in order to continue.`;
};

const validateCodeEdits = (json) => {
  if (!json.code || typeof json.code !== 'string') {
    console.log('\n\n*********** RECEIVED INVALID JSON FROM LINT LLM **************\n\n');
  }
  return json.code && typeof json.code === 'string';
};

const applyEdits = (originalCode, response, subtaskId) => {
  let _originalCode = originalCode;
  const json = JSON.parse(response.content);
  if (!json.code && json.edits.length === 0) {
    return [];
  }

  if (json.code) {
    return [{
      originalCode: originalCode, 
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

const SystemPrompt = `You are a staff software engineer polishing a UI Component for your company's SaaS app that uses React & Tailwind CSS. Your team has written some code and you are now fixing the linter errors. You will be sent a message with the task at hand, the code, and the lint errors. Your job is to fix the lint errors, minimizing the impact of the changes on the existing code.

You will be given the code before work on this task began, the task title, and the new code plus the lint errors. From this you can understand what the team is trying to accomplish with the new code. Your job in fixing the lint errors is to support these changes and not counteract them. We are trying to fix the lint errors first and foremost, but also want to ensure that the code is fulfilling the task at hand.

When inspecting a lint error or warning, examine the code around the lint error or warning carefully. It may have been a mistake in the code prior to where the lint error was actually reported that is causing the problem. Use your expert understanding of React and Javascript to locate the error and fix it.

Ensure that your changes do not introduce new lint errors and that the code still works as expected. Be aware that some of the lint errors may be in conflict. For example, "missing a prop type specifier" and "PropTypes is unused". If you add proptypes to fix the first then you will also solve the second issue. However, if you remove PropTypes to satisfy the second and then use PropTypes to satisfy the first then you will create a new linter error. Think carefully about the different lint errors and how to best resolve them in one go before you start.

Do NOT use comments to silence the errors. Fix the errors in the code. Be precise in your fixes, don't take out other functionality in your pursuit to please the linter.

Here are the imports for React, ReactDOM, & PropTypes:
\`\`\`javascript
import React from 'https://cdn.jsdelivr.net/npm/react@18.2.0/+esm';
import ReactDOM from 'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/+esm';
import PropTypes from 'https://cdn.jsdelivr.net/npm/prop-types@15.8.1/+esm';
\`\`\`
Only use these imports and place them at the top of the file. Do NOT import other components or libraries. Do NOT use try to import from 'react' or 'react-dom' or 'prop-types' directly. Use the imports provided.

Sometimes you will encounter situations where the result of useState is only partially used. In these cases, you should remove the unused parts of the result, but you should NOT remove the entire line. For example, if you have a line like this:
\`\`\`javascript
const [a, setA] = useState(0);
\`\`\`
and you only use the setA function, you should change it to:
\`\`\`javascript
const [, setA] = useState(0);
\`\`\`
You should NOT remove the entire line.

Pay attention to the comments in the code. If there are comments to not do something, you should not do it.

Rewrite the entire piece of code and fix the lint errors. DO NOT LEAVE ANYTHING OUT FOR BREVITY. DO NOT LEAVE ANYTHING OUT FOR BREVITY. DO NOT LEAVE ANYTHING OUT FOR BREVITY. Your code will completely replace the existing code.

Return your new code in the json format: {code: ''}`;

module.exports = { generateLintFixes };