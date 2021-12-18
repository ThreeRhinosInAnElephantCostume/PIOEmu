import * as React from 'react';
import { Box, Button, Dialog, DialogActions, DialogTitle, TextField } from '@mui/material';
import { IUser } from './interfaces';
import axios from 'axios';

const MIN_PASSWORD_LENGTH = 4;

export default function LoginForm() {
    const [open, setOpen] = React.useState(false);
    const [user_password, setPassword] = React.useState("");
    const [user_name, setName] = React.useState("");
    const [errorMessage, setErrorMessage] = React.useState("");

React.useEffect(() => {
  if (user_password) { 
    setErrorMessage("Can't log in, wrong password."); }
  else {
    setErrorMessage("");
  }
})

const handleOpen = () => {
    setOpen(true);
}

const handleLogin = () => {
  setOpen(false);
  console.log("Login user: ");
  axios.get("http://localhost:5000/users", { params: { id: "1" } }).then(function (response) {
    console.log(response.data);
  });
}

const handleClose = () => {
    setOpen(false);
}

return (
  <div>
    <Button onClick={handleOpen}>
      Login
    </Button>
    <Dialog open ={open} onClose={handleClose}>
      <DialogTitle>Login to your account</DialogTitle>
      <TextField
      id="username"
      label="USERNAME"
      margin="normal"/>
      <TextField
      value={user_password}
      id="password"
      type="password"
      label="PASSWORD"
      margin="normal"
      helperText={errorMessage}
      onChange={(e) => setPassword(e.target.value)}/>
  <DialogActions>
    <Button onClick={handleLogin}>Login</Button>
    <Button onClick={handleClose}>Cancel</Button>
  </DialogActions>
  </Dialog>
  </div>
)
}
