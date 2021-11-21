import React, { Component } from 'react';
import './App.css';
import 'reset-css';
import NavbarScroller from './components/NavbarScroller';
import { JavaScriptIDE } from './components/JavaScriptIDE';
import PIOIDE from './components/PIOIDE';
import ParentIDE from './components/ParentIDE';
import StyledButton from './components/button';


const navigation = {
  brand: { name: 'PIO-EMU', to: '/' },
  links: [
    { name: 'Login', to: '/' },
    { name: 'Register', to: '/' },
    { name: 'Help', to: 'https://datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf#page=335' },
    { name: 'Doc', to: 'https://github.com/ThreeRhinosInAnElephantCostume/PIOEmu' },
  ]
};

let state = "none";

export default class App extends Component {
  public render() {
    const { brand, links } = navigation;

    return (
      <div className="App">
        <NavbarScroller brand={brand} links={links} />
       <div id="IDESET">
         <div id="NAVIGATION"><StyledButton title="run" state={state}/><StyledButton title="debug"/><StyledButton title="view"/></div>
         <JavaScriptIDE  state={state}/><PIOIDE/></div>
      </div>
    );
  }
}