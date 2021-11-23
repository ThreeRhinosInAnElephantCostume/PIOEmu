import React, { Component } from 'react';
import ReactDOM from "react-dom";
import './App.css';
import NavbarScroller from './components/NavbarScroller';
import { JavaScriptIDE } from './components/JavaScriptIDE';
import Demo from './components/reflex-demo';

let state = "run";

const navigation = {
  links: [
    { name: 'Login', to: '/' },
    { name: 'Register', to: '/' },
    { name: 'Help', to: 'https://datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf#page=335' },
    { name: 'Doc', to: 'https://github.com/ThreeRhinosInAnElephantCostume/PIOEmu' },
  ]
};

export default class App extends Component {
  public render() {
    const { links } = navigation;

    return (
      <div id="wrap">
        <NavbarScroller links={links} />
        <JavaScriptIDE />
      </div>
    );
  }
}
const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);