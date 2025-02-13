const { queryLlmWithJsonValidation } = require('../../../../services/llm');
const { asyncRetry } = require('../../../../utils/retry');

class InvalidJsonError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidJsonError';
  }
}

/**
 * Generate bug fixes for contenteditable code and return the code for the component. Retries the request to LLM if the response is invalid JSON.
 * @param {Object} task - Must contain a title field and an _id field
 * @param {string} code - The original code to be replaced.
 * @returns {Promise<{originalCode: string, edit: {codeToReplace: string, newCode: string}, newCode: string, subtaskId: string}[]>} - An array of objects containing the original code, the edit, the new code, and the subtaskId
 */
async function generateBugFixesForContentEditableCode(task, code) {
  let edits = await _generateBugFixesForContentEditableCode(task, code);
  if (edits.length > 0) {
    code = edits[edits.length - 1].newCode;
  }
  if (code.includes('onInput')) {
    const res = await asyncRetry(
      async (err) => { return await queryLlmWithJsonValidation([
        { role: 'system', content: SystemPrompt },
        { role: 'user', content: `You MUST get rid of the onInput that is used on contentEditable in order to continue. If the handler function is not used elsewhere then delete that too. I also suggest leaving a comment to never use onInput on contentEditable again.\n\nThe code to edit is below:\n\`\`\`jsx\n${code}\n\`\`\`` }],
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
  console.log('\n\n\nGENERATE CONTENTEDITABLE BUG FIXES EDITS:', JSON.stringify(edits.map(e => e.edit)), '\n\n\n');
  return edits;
}

async function _generateBugFixesForContentEditableCode(task, code) {
  try {
    console.log('GENERATING CONTENTEDITABLE BUG FIXES');
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
    console.log('\n\n\nGENERATE CONTENTEDITABLE BUG FIXES RESPONSE:', JSON.stringify(res), '\n\n\n');
    const edits = applyEdits(code, res, task._id);
    return edits;
  } catch (err) {
    console.log('\n\n\nGENERATE CONTENTEDITABLE BUG FIXES ERROR:', err, '\n\n\n');
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

const SystemPrompt = `You are a staff software engineer who specializes in contentEditable use in React. You are working on a UI Component for your SaaS app using React and TailwindCss. Your team has already started work on the component and has some initial code. Your job is to review their code and ensure the contentEditable is being used correctly and without any bugs related to performance or core functionality.

To assist you, we are supplying you with the document "A Hacker's Guide to ContentEditable & React". Leverage the guide to find and fix potential bugs and unlock advanced capabilities in your ContentEditable component.

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

# A Hacker's Guide to ContentEditable & React

Building Advanced Text Editors in React with \`contentEditable\` and \`document.execCommand\`

First of all, even though document.execCommand is deprecated, it's still supported in all major browsers and is what we'll use when working with contentEditable.

## **VERY IMPORTANT** How to Synchronize ContentEditable DOM-managed content and React-managed content

### Source of the Problem

When using \`contentEditable\` for rich text editing in React applications, you may encounter issues where the cursor (caret) position resets to the beginning or end of the content upon state updates. This happens because React re-renders the component based on state changes, and replacing the \`innerHTML\` of the \`contentEditable\` element during this process can lose the current selection and cursor position.

To avoid this problem we MUST NOT update the DOM's content in a hot loop. We MUST let the DOM manage the input -> DOM updates and we MUST only update the DOM -> React state when the user has stopped typing for a moment or when an external state change happens (like a hot key or toolbar button press).

DO NOT UPDATE THE DOM STATE ON EVERY KEY PRESS.
DO NOT UPDATE THE DOM STATE ON EVERY KEY PRESS.
DO NOT UPDATE THE DOM STATE ON EVERY KEY PRESS.

### Example Code that Avoids the Problem

\`\`\`jsx
import React, { useRef, useContext, useMemo } from "https://cdn.jsdelivr.net/npm/react@18.2.0/+esm";

// Create Context
const EditorContext = React.createContext(null);

// EditorProvider Component
function EditorProvider({ children }) {
  const editorRef = useRef(null);
  
  const applyFormatting = (command, value = '') => {
    if (editorRef.current) {
      document.execCommand(command, false, value);
    }
  };

  const loadExternalContent = (content) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = content;
    }
  };

  // useMemo to ensure functions are memoized
  const contextValue = useMemo(() => ({
    applyFormatting,
    loadExternalContent,
    editorRef
  }), []);

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
}

// Toolbar Component
function Toolbar() {
  const { applyFormatting, loadExternalContent } = useContext(EditorContext);

  return (
    <div>
      <button onClick={() => applyFormatting('bold')}>Bold</button>
      <button onClick={() => applyFormatting('italic')}>Italic</button>
      <button onClick={() => loadExternalContent('<p>This is some external content</p>')}>Load Content</button>
    </div>
  );
}

// TextInput Component
function TextInput() {
  const { editorRef } = useContext(EditorContext);

  return (
    <div
      ref={editorRef}
      contentEditable
      style={{ border: '1px solid black', minHeight: '100px', cursor: 'text', marginTop: '10px' }}
    >
    </div>
  );
}

// App Component (or wherever you'd use the editor)
function App() {
  return (
    <EditorProvider>
      <Toolbar />
      <TextInput />
    </EditorProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
\`\`\`

## Maintaining Selection State

A common challenge when building rich text editors is preserving text selection when interacting with external controls (e.g., formatting buttons).

### Saving and Restoring Selection

\`\`\`javascript
let savedSelection;

// Save the current selection
function saveSelection() {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
        savedSelection = sel.getRangeAt(0);
    }
}

// Restore the saved selection
function restoreSelection() {
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedSelection);
}
\`\`\`

**Usage**: Call \`saveSelection()\` when an external control gains focus and \`restoreSelection()\` before applying any formatting command.

## Handling Complex Formatting

Direct DOM manipulation may be necessary for formatting not supported by \`document.execCommand\`.

### Inserting Custom HTML

\`\`\`javascript
function insertCustomHtml(html) {
    restoreSelection(); // Ensure the selection is restored
    const div = document.createElement('div');
    div.innerHTML = html;
    const range = savedSelection || document.createRange();
    range.deleteContents();
    range.insertNode(div.firstChild);
    // Remember to synchronize this change with React's state
}
\`\`\`

**Note**: It's crucial to keep React's state in sync with any DOM manipulations to prevent rendering inconsistencies.

## Cross-Browser Compatibility

Ensure consistent editor behavior across different browsers by testing extensively and applying necessary polyfills or fallbacks.

## Managing Undo/Redo Stack

Implementing a custom undo/redo functionality enhances user experience and provides more control over the editor's state changes.

### Custom Undo/Redo Implementation

\`\`\`javascript
class UndoRedoStack {
    constructor() {
        this.stack = [];
        this.index = -1;
    }

    add(state) {
        this.stack = this.stack.slice(0, this.index + 1);
        this.stack.push(state);
        this.index++;
    }

    undo() {
        if (this.index > 0) {
            this.index--;
            return this.stack[this.index];
        }
        return null;
    }

    redo() {
        if (this.index < this.stack.length - 1) {
            this.index++;
            return this.stack[this.index];
        }
        return null;
    }
}
\`\`\`

### Embedding Media

Incorporating media like images or videos requires handling file inputs, drag-and-drop, and potentially server uploads.

#### Inserting Images

\`\`\`javascript
function insertImage(url) {
    restoreSelection();
    const img = document.createElement('img');
    img.src = url;
    const range = savedSelection || document.createRange();
    range.insertNode(img);
    // Update React's state accordingly
}
\`\`\`

### Handling Indices and Ranges with Mixed Content

When building advanced text editing features, one of the trickier aspects to manage is accurately tracking indices and ranges within the \`contentEditable\` element, especially when dealing with a mix of text, formatting, and non-text elements like images. Non-text elements can disrupt the linear flow of text, making it challenging to calculate accurate positions for text insertion, selection, and formatting operations.

**Key Considerations**:

- **Accurate Position Calculation**: Implementing algorithms or using libraries that can accurately account for the presence of non-text elements when calculating positions for insertions and selections.
- **Selection Preservation**: Techniques for saving and restoring selections must account for non-text elements, ensuring that the editor can accurately restore cursor positions or text selections even after complex content manipulations.
- **Custom Data Attributes**: Utilizing HTML5 data attributes (\`data-\`) on non-text elements to store metadata can help in tracking these elements within the editor's content, facilitating more precise manipulations and interactions.

Addressing these challenges requires thoughtful design and potentially innovative solutions, underscoring the importance of a solid understanding of both the \`contentEditable\` API and the DOM's behavior with mixed content types.

### Customizing Paste Behavior

Intercepting and customizing the behavior of paste operations allows you to sanitize and control the content being inserted into your editor. This can prevent unwanted formatting, remove potentially harmful HTML, and ensure consistency across the editor's content.

**Example**:

\`\`\`javascript
document.getElementById('editor').addEventListener('paste', (event) => {
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
});
\`\`\`

This example demonstrates how to intercept the paste event, prevent the default paste behavior, and insert only the plain text content, thereby stripping any formatting or HTML tags from the pasted content.

### Accessibility Considerations

Ensuring your text editor is accessible to all users, including those with disabilities, is crucial. This includes keyboard navigability, appropriate use of ARIA roles and properties, and ensuring that all interactive elements are accessible and labeled correctly.

**Key Points**:

- Ensure all buttons and controls are reachable and usable with the keyboard alone.
- Use ARIA roles and properties to describe the editor's features and states to assistive technologies.
- Provide alternative text for non-text content, such as images, that are inserted into the editor.

A few last tips: 
- DO NOT use default content, use a placeholder instead.
- Always set the cursor to be at the end of the content when the user focuses into the contentEditable.`;
 
module.exports = { generateBugFixesForContentEditableCode };