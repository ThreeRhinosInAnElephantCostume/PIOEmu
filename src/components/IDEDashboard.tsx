import { AppBar, Button, ButtonGroup, Dialog, DialogActions, DialogTitle, List, ListItemButton, ListItemText, TextField, Toolbar } from '@mui/material';
import { ReflexContainer, ReflexElement, ReflexSplitter } from "react-reflex";
import { javascript } from '@codemirror/lang-javascript';
import { plotCanvases, RunProgram } from '../main';
import { js_example_program } from '../example';
import CodeMirror from '@uiw/react-codemirror';
import RegisterForm from './RegisterForm';
import logo from '../images/pioemu.svg';
import Cookies from 'universal-cookie';
import "react-reflex/styles.css";
import React from 'react';
import axios from 'axios';

export var js_raw_program: string = js_example_program;
export var pio_raw_program: string = "90a0\na0c7\n9080\na027\na046\n00a7\n1808\na042\n0085\n0002";

let projects_names: string[] = [];
let projects_public: string[] = [];
let projects_users: string[] = [];

type IDEState = {
  dashboardType: string;
  theme: "light" | "dark";
  javascript: string;
  pio: string;
  projectList: boolean;
  loadedProjects: string;
  activeUser: string;
  loginOpen: boolean;
  userName: string;
  userPassword: string;
  loginErrorMessage: string;
};

type IDEProps = {
  theme: "light" | "dark";
};

export default class IDEDashboard extends React.Component<IDEProps, IDEState> {
  state: IDEState = {
    dashboardType: "base",
    theme: this.props.theme,
    javascript: js_example_program,
    pio: pio_raw_program,
    projectList: false,
    loadedProjects: "No projects loaded",
    activeUser: "Guest",
    loginOpen: false,
    userName: "",
    userPassword: "",
    loginErrorMessage: "",
  };

  render()
  {
    return (
      <div id="resizable-divs">
        {this.topNavbar()}
        <ReflexContainer className="site-content" orientation="horizontal">
          <ReflexElement>
            <ReflexContainer className="site-content" orientation="vertical">
              <ReflexElement className="DASHBOARD">
                {this.projectList()}
                <ButtonGroup variant="contained" aria-label="outlined primary button group">
                  <Button onClick={this.setNavBase}>BASE</Button>
                  <Button onClick={this.setNavPlotter}>NAVIGATION</Button>
                </ButtonGroup>
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
      </div>
    );
  };

  topNavbar = () =>
  {
    return (
      <AppBar position="static" color="secondary">
        <Toolbar variant='regular'>
          <img src={logo} alt="PIOEMU" />
          {this.LoginForm()}
          <RegisterForm />
          <Button href="https://datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf#page=335" target="_blank">HELP</Button>
        </Toolbar>
      </AppBar>
    );
  };

  getDashboard = () =>
  {
    if(this.state.dashboardType === "NAVIGATION") return this.dashboardNavigation();
    else return this.dashboardBase();
  };

  setNavPlotter = () =>
  {
    this.setState({ dashboardType: "NAVIGATION" });
  };

  setNavBase = () =>
  {
    this.setState({ dashboardType: "BASE" });
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
    projects_names = [];
    projects_public = [];
    projects_users = [];

    axios.get("http://localhost:5000/loadProjects/" + this.state.activeUser).then(response =>
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
    let ItemList = [];
    for(let i = 0; i < projects_names.length; i++)
    {
      ItemList.push(<ListItemButton><ListItemText primary={projects_names[i]} /><ListItemText primary={projects_users[i]} />
        <ListItemText primary={projects_public[i]} /></ListItemButton>);
    }

    return (
      <Dialog open={this.state.projectList} onClose={this.closeProjectList}>
        <DialogTitle>List of all public projects and private projects of {this.state.activeUser}</DialogTitle>
        <List component="nav">
          <ListItemButton disabled={true}><ListItemText primary="Name" /><ListItemText primary="Creator" /><ListItemText primary="Public" /></ListItemButton>
          {ItemList}
        </List>
      </Dialog>
    );
  };

  LoginForm()
  {
    const cookies = new Cookies();

    const handleOpen = () =>
    {
      this.setState({ loginOpen: true });
    };

    const handleClose = () =>
    {
      this.setState({ loginOpen: false });
      cookies.set('user', this.state.activeUser, { path: '/' });
    };

    const handleLogout = () =>
    {
      this.setState({ activeUser: "Guest" });
    };

    const handleLogin = () =>
    {
      axios.get("http://localhost:5000/login/" + this.state.userName + "/" + this.state.userPassword).then(response =>
      {
        if(response.data == "Login error")
        {
          this.setState({ activeUser: "Guest" });
          this.setState({ loginErrorMessage: "Can't log in, wrong user/password combination." });
        }
        else
        {
          cookies.set('user', this.state.activeUser, { path: '/' });
          this.setState({ activeUser: response.data[0].name });
          handleClose();
        }
      });
    };

    if(this.state.activeUser == "Guest")
    {
      return (
        <div>
          <Button onClick={handleOpen}>
            Login
          </Button>
          <Dialog open={this.state.loginOpen} onClose={handleClose}>
            <DialogTitle>Login to your account</DialogTitle>
            <TextField
              value={this.state.userName}
              id="username"
              label="USERNAME"
              margin="normal"
              onChange={(e) => this.setState({ userName: e.target.value })} />
            <TextField
              value={this.state.userPassword}
              id="password"
              type="password"
              label="PASSWORD"
              margin="normal"
              helperText={this.state.loginErrorMessage}
              onChange={(e) =>
              {
                this.setState({ userPassword: e.target.value });
                this.setState({ loginErrorMessage: "" });
              }} />
            <DialogActions>
              <Button onClick={handleLogin}>Login</Button>
              <Button onClick={handleClose}>Cancel</Button>
            </DialogActions>
          </Dialog></div>
      );
    }
    else
    {
      return (
        <div>
          <Button onClick={handleLogout} >Welcome, {this.state.activeUser}! [Log out]</Button></div>
      );
    }
  }
};