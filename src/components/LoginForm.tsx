import * as React from 'react';
import { Button, Dialog, DialogActions, DialogTitle, TextField } from '@mui/material';
import axios from 'axios';
import Cookies from 'universal-cookie';

export default function LoginForm()
{
  const cookies = new Cookies();
  cookies.set('user', "Guest", { path: '/' });
  const [open, setOpen] = React.useState(false);
  const [user_password, setPassword] = React.useState("");
  const [user_name, setName] = React.useState("Guest");
  const [loginStatus, setLoginStatus] = React.useState("Guest");
  const [errorMessage, setErrorMessage] = React.useState("");

  React.useEffect(() =>
  {
    cookies.set('user', loginStatus, { path: '/' });
  }, [loginStatus]);

  const handleOpen = () =>
  {
    setOpen(true);
  };

  const handleClose = () =>
  {
    setOpen(false);
  };

  const handleLogout = () =>
  {
    setLoginStatus("");
  };

  const handleLogin = () =>
  {
    axios.get("http://localhost:5000/login/" + user_name + "/" + user_password).then(function (response)
    {
      if(response.data == "Login error")
      {
        setErrorMessage("Can't log in, wrong user/password combination.");
      }
      else
      {
        setLoginStatus(response.data[0].name);
        setOpen(false);
      }
    });
  };

  if(loginStatus == "Guest")
  {
    return (
      <div>
        <Button onClick={handleOpen}>
          Login
        </Button>
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Login to your account</DialogTitle>
          <TextField
            id="username"
            label="USERNAME"
            margin="normal"
            onChange={(e) => setName(e.target.value)} />
          <TextField
            value={user_password}
            id="password"
            type="password"
            label="PASSWORD"
            margin="normal"
            helperText={errorMessage}
            onChange={(e) =>
            {
              setPassword(e.target.value);
              setErrorMessage("");
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
        <Button onClick={handleLogout} >Welcome, {loginStatus}! [Log out]</Button></div>
    );
  }
}
