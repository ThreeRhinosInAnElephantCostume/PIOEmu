import React, { Component } from 'react';
import ReactDOM from "react-dom";
import './App.css';
import IDEDashboard from './components/IDEDashboard';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SimpleNavbar from './components/SimpleNavbar';
import { Plotter } from './plotter';
import { PIO } from './PIO/PIO';

const maintheme = createTheme({
  palette: {
    primary: {
      main: `#C51A4A`, //red
      dark: `#24292e`,
      contrastText: 'white',
    },
    secondary: {
      main: '#fff',
      contrastText: 'black',
    }
  },
});
export default class App extends Component
{
  public render()
  {
    return (
      <ThemeProvider theme={maintheme}>
        <SimpleNavbar />
        <div id="resizable-divs">
          <IDEDashboard />
        </div>
      </ThemeProvider>
    );
  }
}
const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);