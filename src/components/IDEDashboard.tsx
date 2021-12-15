import React, { Fragment, Component, ReactElement } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { ReflexContainer, ReflexElement, ReflexSplitter } from "react-reflex";
import { Button, ButtonGroup, Slider } from '@mui/material';
import { plotCanvases, plotters, RunProgram, RunTestProgram } from '../main';

import "react-reflex/styles.css";
import ReactDOM from 'react-dom';

export var js_raw_program: string = "";
export var pio_raw_program: string = "90a0\na0c7\n9080\na027\na046\n00a7\n1808\na042\n0085\n0002";

type IDEState = {
  dashboard_type: string;
};

type IDEProps = {
  type?: string;
};

export default class IDEDashboard extends React.Component<IDEProps, IDEState> {
  state: IDEState = {
    dashboard_type: "base",
  };

  render()
  {
    return (
      <Fragment>
        <ReflexContainer className="site-content" orientation="vertical">
          <ReflexElement className="DASHBOARD">
            {this.dashboardNav()}
            {this.getDashboard()}
          </ReflexElement>
          <ReflexSplitter />
          <ReflexElement>
            <CodeMirror id="JAVASCRIPTIDE"
              value="console.log('Hello world! Welcome to the JavaScript IDE');"
              extensions={[javascript({ jsx: true })]}
              onChange={(valueJS, viewUpdate) =>
              {
                js_raw_program = valueJS;
              }}
            /></ReflexElement>
          <ReflexSplitter />
          <ReflexElement>
            <CodeMirror id="PIOIDE"
              value={pio_raw_program}
              onChange={(valueJS, viewUpdate) =>
              {
                pio_raw_program = valueJS;
              }}
            />  </ReflexElement>
        </ReflexContainer>
      </Fragment>
    );
  };

  getDashboard = () =>
  {
    if(this.state.dashboard_type === "PLOTTER") return this.dashboardPlotter();
    else if(this.state.dashboard_type === "3RD") return this.dashboard3rd();
    else return this.dashboardBase();
  };

  setNavPlotter = () =>
  {
    this.setState({ dashboard_type: "PLOTTER" });
  };
  setNavBase = () =>
  {
    this.setState({ dashboard_type: "BASE" });
  };
  setNav3RD = () =>
  {
    this.setState({ dashboard_type: "3RD" });
  };

  newPlot = () => 
  {
    //test(document.getElementById("mycanvas")! as HTMLCanvasElement);
  };

  onRun = () => 
  {
    //RunTestProgram(pio_raw_program);
    RunProgram(pio_raw_program, js_raw_program);
    this.setNavBase();
  };

  dashboardPlotter = () =>
  {
    // let canvases: ReactElement[] = [];
    // for(let it of plotters)
    // {
    //   let el = (<canvas ref={(c) => it.canvas = c!}></canvas>);

    //   canvases.push(el);
    // }

    return (
      <Fragment>
        <Button variant="contained" onClick={this.newPlot}>NEW PLOT</Button>
        <Slider defaultValue={50} aria-label="Default" valueLabelDisplay="auto" />
      </Fragment>
    );
  };

  dashboardBase = () =>
  {
    return (
      <Fragment>
        <Button variant="contained" onClick={this.onRun}>RUN</Button>
        <Button variant="contained" onClick={this.onClick}>DEBUG</Button>
        {plotCanvases}
      </Fragment>
    );
  };

  dashboard3rd = () =>
  {
    return (
      <Fragment>
        <Button variant="contained" onClick={this.onClick}>3rd 1</Button>
        <Button variant="contained" onClick={this.onClick}>3rd 2</Button>
      </Fragment>
    );
  };

  dashboardNav = () =>
  {
    return (
      <ButtonGroup variant="contained" aria-label="outlined primary button group">
        <Button onClick={this.setNavBase}>BASE</Button>
        <Button onClick={this.setNavPlotter}>PLOTTER</Button>
        <Button onClick={this.setNav3RD}>3RD</Button>
      </ButtonGroup>);
  };

  onClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) =>
  {
    console.log("You clicked a button");
    console.log(this.state.dashboard_type);
  };
};