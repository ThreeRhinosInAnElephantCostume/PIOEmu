import React, { Fragment } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { ReflexContainer, ReflexElement, ReflexSplitter } from "react-reflex";
import { Button, ButtonGroup, Switch, FormGroup, FormControlLabel, Grid } from '@mui/material';
import { plotCanvases, plotters, RunProgram, RunTestProgram } from '../main';
import "react-reflex/styles.css";
import { js_example_program, pio_example_program } from '../example';
import { PIOASM } from '../editor/PIO.language';

export var js_raw_program: string = js_example_program;
export var pio_raw_program: string = pio_example_program;

type IDEState = {
  dashboard_type: string;
  theme: "light" | "dark";
  javascript: string;
  pio: string;
};

type IDEProps = {
  type?: string;
  theme: "light" | "dark";
};

export default class IDEDashboard extends React.Component<IDEProps, IDEState> {
  state: IDEState = {
    dashboard_type: "base",
    theme: this.props.theme,
    javascript: js_example_program,
    pio: pio_raw_program,
  };

  render()
  {
    return (
      <ReflexContainer className="site-content" orientation="horizontal">
        <ReflexElement>
          <ReflexContainer className="site-content" orientation="vertical">
            <ReflexElement className="DASHBOARD">
              {this.dashboardNav()}
              {this.getDashboard()}
            </ReflexElement>
            <ReflexSplitter />
            <ReflexElement>
              <CodeMirror id="JAVASCRIPTIDE"
                height="1000px"
                theme={this.state.theme}
                value={this.state.javascript}
                extensions={[javascript({ jsx: true, typescript: true })]}
                onChange={(valueJS, viewUpdate) =>
                {
                  this.setState({ javascript: valueJS });
                }}
              /></ReflexElement>
            <ReflexSplitter />
            <ReflexElement>
              <CodeMirror id="PIOIDE"
                height="1000px"
                theme={this.state.theme}
                value={this.state.pio}
                extensions={[PIOASM()]}
                onChange={(valuePIO, viewUpdate) =>
                {
                  this.setState({ pio: valuePIO });
                }}
              /></ReflexElement>
          </ReflexContainer>
        </ReflexElement>
        <ReflexSplitter />
        <ReflexElement>{plotCanvases}</ReflexElement>
      </ReflexContainer>
    );
  };

  getDashboard = () =>
  {
    if(this.state.dashboard_type === "NAVIGATION") return this.dashboardNavigation();
    else if(this.state.dashboard_type === "3RD") return this.dashboard3rd();
    else return this.dashboardBase();
  };

  setNavPlotter = () =>
  {
    this.setState({ dashboard_type: "NAVIGATION" });
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
    RunProgram(this.state.pio, this.state.javascript);
    this.setNavBase();
  };

  dashboardNavigation = () =>
  {
    // let canvases: ReactElement[] = [];
    // for(let it of plotters)
    // {
    //   let el = (<canvas ref={(c) => it.canvas = c!}></canvas>);

    //   canvases.push(el);
    // }

    return (
      <ButtonGroup orientation="vertical">
        <Button variant="contained" onClick={this.resetIDE}>RESET IDE</Button>
      </ButtonGroup>
    );
  };

  dashboardBase = () =>
  {
    return (
      <ButtonGroup orientation="vertical">
        <Button variant="contained" onClick={this.switchMode}>THEME: {this.state.theme}</Button>
        <Button variant="contained" onClick={this.onRun}>RUN</Button>
      </ButtonGroup>
    );
  };

  dashboard3rd = () =>
  {
    return (
      <ButtonGroup orientation="vertical">
        <Button variant="contained" onClick={this.onClick}>3rd 1</Button>
        <Button variant="contained" onClick={this.onClick}>3rd 2</Button>
      </ButtonGroup>
    );
  };

  dashboardNav = () =>
  {
    return (
      <ButtonGroup variant="contained" aria-label="outlined primary button group">
        <Button onClick={this.setNavBase}>BASE</Button>
        <Button onClick={this.setNavPlotter}>NAVIGATION</Button>
      </ButtonGroup>);
  };

  switchMode = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) =>
  {
    if(this.state.theme == "dark")
      this.setState({ theme: "light" });
    else
      this.setState({ theme: "dark" });
  };

  onClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) =>
  {
    console.log("You clicked a button");
    console.log(this.state.dashboard_type);
  };
  resetIDE = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) =>
  {
    this.setState({ pio: pio_raw_program });
    this.setState({ javascript: js_raw_program });

  };
};

