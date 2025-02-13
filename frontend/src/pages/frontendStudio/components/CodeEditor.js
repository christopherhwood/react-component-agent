import React from 'react';
import { useSelector } from 'react-redux';
import AceEditor from 'react-ace';
import ace from 'ace-builds/src-noconflict/ace';
import { getCurrentCode } from '../../../redux/selectors';

// Import the mode (language) and theme
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-kr_theme';
import "ace-builds/webpack-resolver";
ace.config.set('basePath', process.env.PUBLIC_URL)

const CodeEditor = () => {
  const currentCode = useSelector(getCurrentCode);

  const onChange = (newValue) => {
    // Handle code change here. You might want to update the Redux state with the new code.
    // console.log('change', newValue);
  };

  return (
    <AceEditor
    style={{ width: '100%', height: '100%' }}
      mode="javascript"
      theme="kr_theme"
      onChange={onChange}
      name="UNIQUE_ID_OF_DIV"
      editorProps={{ $blockScrolling: true }}
      value={currentCode || ''}
      setOptions={{
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        enableSnippets: true,
        showLineNumbers: true,
        tabSize: 2,
        wrap: true,
      }}
    />
  );
};

export default CodeEditor;
