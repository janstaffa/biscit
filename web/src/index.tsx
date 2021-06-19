import React from 'react';
import ReactDOM from 'react-dom';
import { QueryClientProvider } from 'react-query';
import App from './App';
import './styles/fonts.css';
import './styles/globals.css';
import { queryClient } from './utils/createQueryClient';
import GetToken from './utils/GetToken';

ReactDOM.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <GetToken />
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
