import * as React from 'react';
import { Box, Button, Dialog, DialogActions, DialogTitle, TextField } from '@mui/material';
import { IUser } from './interfaces';
import axios from 'axios';

const MIN_PASSWORD_LENGTH = 4;

const new_user: IUser = {
    name: '',
    email: '',
    password: '',
};

export default function RegisterForm() {
    const [open, setOpen] = React.useState(false);
    const [user_password, setPassword] = React.useState("");
    const [user_name, setName] = React.useState("");
    const [user_email, setEmail] = React.useState("");
    const [errorMessage, setErrorMessage] = React.useState("");

React.useEffect(() => {
  if (user_password.length < MIN_PASSWORD_LENGTH) { 
    setErrorMessage("Password needs to have at least " + MIN_PASSWORD_LENGTH + " characters"); }
  else {
    setErrorMessage("");
  }
})

const handleOpen = () => {
    setOpen(true);
}

const handleClose = () => {
    setOpen(false);
}

const registerUser = () => {
  new_user.name = user_name;
  new_user.email = user_email;
  new_user.password = user_password;
  console.log('User created');
  console.log(new_user.name);
  axios.post(`http://localhost:5000/users`, new_user);
  setOpen(false);
}

return (
  <div>
    <Button onClick={handleOpen}>
      Register
    </Button>
    <Dialog open ={open} onClose={handleClose}>
      <DialogTitle>Register a new account</DialogTitle>
      <TextField 
      required
      value={user_name}
      id="username"
      label="USERNAME"
      margin="normal"
      onChange={(e) => setName(e.target.value)}/>
      <TextField 
      error={user_password.length < MIN_PASSWORD_LENGTH}
      required
      id="password"
      type="password"
      label="PASSWORD"
      margin="normal"
      helperText={errorMessage}
      onChange={(e) => setPassword(e.target.value)}
      value={user_password}/>
      <TextField 
      required
      value={user_email}
      type="email"
      id="email"
      label="EMAIL"
      margin="normal"
      onChange={(e) => setEmail(e.target.value)}/>
  <DialogActions>
    <Button onClick={registerUser}>Register</Button>
    <Button onClick={handleClose}>Cancel</Button>
  </DialogActions>
  </Dialog>
  </div>
)
}
