import React, { Component } from 'react';
import ReactDOM from "react-dom";
import './App.css';
import IDEDashboard from './components/IDEDashboard';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SimpleNavbar from './components/SimpleNavbar';
import { Plotter } from './plotter';
import { InitPIO } from './main';
import { PIO } from './PIO/PIO';


InitPIO();

const maintheme = createTheme({
  palette: {
    primary: {
      main: `#C51A4A`, //red `#C51A4A`
      dark: `#24292e`,
      contrastText: 'white',
    },
    secondary: {
      main: '#fff',
      contrastText: 'black',
      //dark: `#000000`, //green
    }
  },
});

const navigation = {
  links: [
    { name: 'Login', to: '/' },
    { name: 'Register', to: '/' },
    { name: 'Help', to: 'https://datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf#page=335' },
    { name: 'Doc', to: 'https://github.com/ThreeRhinosInAnElephantCostume/PIOEmu' },
  ]
};

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