import React from 'react';
import { useSelector } from 'react-redux';
import { getCurrentCode } from '../../../redux/selectors';

const ComponentDisplay = () => {
  const currentCode = useSelector(getCurrentCode);

  // Prepare the HTML content with the currentCode
  const htmlContent = currentCode ? `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Component Preview</title>
    <style>
      body, html {
        height: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
        justify-content: center;
        align-items: center;
      }
      #root {
        width: 100%; /* Adjust width as needed */
        height: 100%; /* Adjust height as needed */
      }
    </style>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@^2.0/dist/tailwind.min.css" rel="stylesheet">
</head>
<body>
    <div id="root"></div>
    <script type="text/babel" data-presets="react" data-type="module">
    ${currentCode}
  </script>
</body>
</html>
` : '';

  return (
    <iframe
      className="w-full h-full flex-grow border-none"
      style={{padding: "50px 50px 0 50px"}}
      title="Component Preview"
      srcDoc={htmlContent} // Set the srcDoc directly with the HTML content
    ></iframe>
  );
};

export default ComponentDisplay;

