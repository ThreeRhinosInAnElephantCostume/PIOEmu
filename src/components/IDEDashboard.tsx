import React, {Fragment, Component} from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { ReflexContainer, ReflexElement, ReflexSplitter } from "react-reflex";
import { Button, ButtonGroup, Slider } from '@mui/material';

import "react-reflex/styles.css";

type IDEState = {
  dashboard_type: string;
};

type IDEProps = {
  type?: string;
}

export default class IDEDashboard extends React.Component<IDEProps, IDEState> {
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
    <Button variant="contained" onClick={this.onClick}>PLOT A</Button>
    <Button variant="contained" onClick={this.onClick}>PLOT B</Button>
    <Slider defaultValue={50} aria-label="Default" valueLabelDisplay="auto" />
    </Fragment>
    ) 
  };

  dashboardBase = () =>  {
    return (
    <Fragment>
    <Button variant="contained" onClick={this.onClick}>RUN</Button>
    <Button variant="contained" onClick={this.onClick}>DEBUG</Button>
    </Fragment>
    ); 
  };

  dashboard3rd = () =>  {
    return (
    <Fragment>
    <Button variant="contained" onClick={this.onClick}>3rd 1</Button>
    <Button variant="contained" onClick={this.onClick}>3rd 2</Button>
    </Fragment>
    ); 
  };

  dashboardNav = () => {
    return (
    <ButtonGroup variant="contained" aria-label="outlined primary button group">
    <Button onClick={this.setNavBase}>BASE</Button>
    <Button onClick={this.setNavPlotter}>PLOTTER</Button>
    <Button onClick={this.setNav3RD}>3RD</Button>
    </ButtonGroup>);
  };

  onClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) =>  {
  console.log("You clicked a button");
  console.log(this.state.dashboard_type);
};
};