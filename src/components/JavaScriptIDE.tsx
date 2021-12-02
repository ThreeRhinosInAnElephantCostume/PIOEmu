import React, {Fragment, Component} from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { ReflexContainer, ReflexElement, ReflexSplitter } from "react-reflex";

import "react-reflex/styles.css";

type IDEState = {
  dashboard_type: string;
};

type IDEProps = {
  type?: string;
}

export default class JavaScriptIDE extends React.Component<IDEProps, IDEState> {
  state: IDEState = {
    dashboard_type: "base",
  };

  render() { 
    return (
    <Fragment>
      <ReflexContainer className="site-content" orientation="vertical">
      <ReflexElement  className="DASHBOARD">
        { this.dashboardNav() }
        { this.getDashboard() }
        </ReflexElement>
      <ReflexSplitter />
      <ReflexElement>
      <CodeMirror id="JAVASCRIPTIDE"
      value="console.log('Hello world! Welcome to the JavaScript IDE');"
      extensions={[javascript({ jsx: true })]}
      onChange={(valueJS, viewUpdate) => {
        console.log('value:', valueJS);
      }}
    /></ReflexElement> 
    <ReflexSplitter />
    <ReflexElement>
    <CodeMirror id="PIOIDE"
      value="console.log('This is a PIO editor');"
      onChange={(valueJS, viewUpdate) => {
        console.log('value:', valueJS);
      }}
    />  </ReflexElement> 
    </ReflexContainer>
    </Fragment>
  );};

  getDashboard = () => {
    if (this.state.dashboard_type === "PLOTTER") return this.dashboardPlotter();
    else if (this.state.dashboard_type === "3RD") return this.dashboard3rd();
    else return this.dashboardBase();
  };

  setNavPlotter = () => { 
      this.setState({dashboard_type: "PLOTTER" })
    };
  setNavBase = () => { 
      this.setState({dashboard_type: "BASE" })
    };
  setNav3RD = () => { 
      this.setState({dashboard_type: "3RD" })
    };

  dashboardPlotter = () =>  {
    return (
    <Fragment>
    <button onClick={this.onClick }>PLOT A</button>
    <button onClick={this.onClick }>PLOT B</button>
    </Fragment>
    ) 
  };

  dashboardBase = () =>  {
    return (
    <Fragment>
    <button onClick={this.onClick}>RUN</button>
    <button onClick={this.onClick}>DEBUG</button>
    </Fragment>
    ); 
  };

  dashboard3rd = () =>  {
    return (
    <Fragment>
    <button onClick={this.onClick}>3rd 1</button>
    <button onClick={this.onClick}>3rd 2</button>
    </Fragment>
    ); 
  };

  dashboardNav = () => {
    return (
    <div id="dashboardNav">
      <button onClick={this.setNavBase}>BASE</button>
      <button onClick={this.setNavPlotter}>PLOTTER</button>
      <button onClick={this.setNav3RD}>3RD</button>
    </div>);
  };

  onClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) =>  {
  console.log("You clicked a button");
  console.log(this.state.dashboard_type);
};
};