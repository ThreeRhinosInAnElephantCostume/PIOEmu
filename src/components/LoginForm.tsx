import * as React from 'react';
import { Box, Button, Dialog, DialogActions, DialogTitle, TextField } from '@mui/material';

const MIN_PASSWORD_LENGTH = 4;

export default function LoginForm() {
    const [open, setOpen] = React.useState(false);


const handleOpen = () => {
    setOpen(true);
}

const handleLogin = () => {
  setOpen(false);
  console.log("Login user: ");
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
      id="password"
      type="password"
      label="PASSWORD"
      margin="normal"/>
  <DialogActions>
    <Button onClick={handleLogin}>Login</Button>
    <Button onClick={handleClose}>Cancel</Button>
  </DialogActions>
  </Dialog>
  </div>
)
}
