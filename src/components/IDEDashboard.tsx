import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { ReflexContainer, ReflexElement, ReflexSplitter } from "react-reflex";
import "react-reflex/styles.css";
import { Button, ButtonGroup, Dialog, DialogTitle, List, ListItemButton, ListItemText } from '@mui/material';
import { plotCanvases, RunProgram } from '../main';
import { js_example_program } from '../example';
import axios from 'axios';
import Cookies from 'universal-cookie';

export var js_raw_program: string = js_example_program;
export var pio_raw_program: string = "90a0\na0c7\n9080\na027\na046\n00a7\n1808\na042\n0085\n0002";
let projects_names: string[] = [];
let projects_public: string[] = [];
let projects_users: string[] = [];

type IDEState = {
  dashboard_type: string;
  theme: "light" | "dark";
  javascript: string;
  pio: string;
  projectList: boolean;
  loadedProjects: string;
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
    projectList: false,
    loadedProjects: "No projects loaded",
  };

  render()
  {
    return (
      <ReflexContainer className="site-content" orientation="horizontal">
        <ReflexElement>
          <ReflexContainer className="site-content" orientation="vertical">
            <ReflexElement className="DASHBOARD">
              {this.projectList()}
              {this.dashboardNav()}
              {this.getDashboard()}
            </ReflexElement>
            <ReflexSplitter />
            <ReflexElement>
              <CodeMirror id="JAVASCRIPTIDE"
                height="1000px"
                theme={this.state.theme}
                value={this.state.javascript}
                extensions={[javascript({ jsx: true })]}
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
        <Button variant="contained" onClick={this.saveProject}>SAVE PROJECT</Button>
        <Button variant="contained" onClick={this.loadProjects}>LOAD PROJECT</Button>
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

  switchMode = () =>
  {
    if(this.state.theme == "dark")
      this.setState({ theme: "light" });
    else
      this.setState({ theme: "dark" });
  };

  resetIDE = () =>
  {
    this.setState({ pio: pio_raw_program });
    this.setState({ javascript: js_raw_program });

  };

  saveProject = () =>
  {
    const cookies = new Cookies();
    const activeUser = cookies.get('user');
    this.setState({ pio: pio_raw_program });
    this.setState({ javascript: js_raw_program });

    axios.post("http://localhost:5000/saveProject", {
      javascript: this.state.javascript,
      pio: this.state.pio,
      name: "test",
      user: activeUser,
      public: 1,
    }).catch(err => console.log(err));
  };

  closeProjectList = () =>
  {
    this.setState({ projectList: false });
  };

  openProjectList = () =>
  {
    this.setState({ projectList: true });
  };

  loadProjects = () =>
  {
    const cookies = new Cookies();
    const activeUser = cookies.get('user');
    projects_names = [];
    projects_public = [];
    projects_users = [];

    axios.get("http://localhost:5000/loadProjects/" + activeUser).then(response =>
    {
      for(let i = 0; i < response.data.length; i++)
      {
        projects_names.push(response.data[i].name);
        projects_public.push(response.data[i].public);
        projects_users.push(response.data[i].user);
      }
      this.openProjectList();
    });
  };

  projectList = () =>
  {
    const cookies = new Cookies();
    const activeUser = cookies.get('user');
    let ItemList = [];
    for(let i = 0; i < projects_names.length; i++)
    {
      ItemList.push(<ListItemButton><ListItemText primary={projects_names[i]} /><ListItemText primary={projects_users[i]} />
        <ListItemText primary={projects_public[i]} /></ListItemButton>);
    }

    return (
      <Dialog open={this.state.projectList} onClose={this.closeProjectList}>
        <DialogTitle>List of all public projects and private projects of {activeUser}</DialogTitle>
        <List component="nav">
          <ListItemButton disabled={true}><ListItemText primary="Name" /><ListItemText primary="Creator" /><ListItemText primary="Public" /></ListItemButton>
          {ItemList}
        </List>
      </Dialog>
    );
  };
};