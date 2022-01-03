import * as React from 'react';
import { Button, Dialog, DialogActions, DialogTitle, TextField } from '@mui/material';
import { IUser } from './interfaces';
import axios from 'axios';

const MIN_PASSWORD_LENGTH = 4;

const new_user: IUser = {
  name: '',
  password: '',
};

export default function RegisterForm()
{
  const [open, setOpen] = React.useState(false);
  const [user_password, setPassword] = React.useState("");
  const [user_name, setName] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");

  React.useEffect(() =>
  {
    if(user_password.length < MIN_PASSWORD_LENGTH)
    {
      setErrorMessage("Password needs to have at least " + MIN_PASSWORD_LENGTH + " characters");
    }
    else
    {
      setErrorMessage("");
    }
  });

  const handleOpen = () =>
  {
    setOpen(true);
  };

  const handleClose = () =>
  {
    setOpen(false);
  };

  const registerUser = () =>
  {
    new_user.name = user_name;
    new_user.password = user_password;
    console.log(new_user.name);
    axios.post("http://localhost:5000/register", {
      name: new_user.name,
      password: new_user.password,
    }).catch(err => console.log(err));
    setOpen(false);
  };

  return (
    <div>
      <Button onClick={handleOpen}>
        Register
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Register a new account</DialogTitle>
        <TextField
          required
          value={user_name}
          id="username"
          label="USERNAME"
          margin="normal"
          onChange={(e) => setName(e.target.value)} />
        <TextField
          error={user_password.length < MIN_PASSWORD_LENGTH}
          required
          id="password"
          type="password"
          label="PASSWORD"
          margin="normal"
          helperText={errorMessage}
          onChange={(e) => setPassword(e.target.value)}
          value={user_password} />
        <DialogActions>
          <Button onClick={registerUser}>Register</Button>
          <Button onClick={handleClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
