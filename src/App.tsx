import React, { Component } from 'react';
import ReactDOM from "react-dom";
import './App.css';
import IDEDashboard from './components/IDEDashboard';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SimpleNavbar from './components/SimpleNavbar';
import maintheme from './components/Theme';

export default class App extends Component
{
  public render() 
  {
    return (
      <ThemeProvider theme={maintheme}>
        <SimpleNavbar />
        <div id="resizable-divs">
          <IDEDashboard theme="light" />
        </div>
      </ThemeProvider>
    );
  }
}
const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);