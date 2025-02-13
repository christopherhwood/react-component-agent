import React from 'react';
import ReactDOM from 'react-dom/client';
import { asyncWithLDProvider } from 'launchdarkly-react-client-sdk';
import './index.css';
import { Provider } from 'react-redux';
import store from './redux/store';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

(async () => {
  const LDProvider = await asyncWithLDProvider({
    clientSideID: '65e180526816620f7f3fc656',
    context: {
      kind: "user",
      anonymou: true
    },
    options: { /* ... */ }
  });

  root.render(
    <React.StrictMode>
      <LDProvider>
        <Provider store={store}>
          <App/>
        </Provider>
      </LDProvider>
    </React.StrictMode>
  );
})();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
