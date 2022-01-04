import React, { Component } from 'react';
import ReactDOM from "react-dom";
import './App.css';
import IDEDashboard from './components/IDEDashboard';
import { ThemeProvider } from '@mui/material/styles';
import maintheme from './components/Theme';

export default class App extends Component
{
  public render() 
  {
    return (
      <ThemeProvider theme={maintheme}>
        <IDEDashboard theme="light" />
      </ThemeProvider>
    );
  }
}
const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);