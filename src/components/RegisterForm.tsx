import * as React from 'react';
import { Box, Button, Dialog, DialogActions, DialogTitle, TextField } from '@mui/material';

const MIN_PASSWORD_LENGTH = 4;

export default function RegisterForm() {
    const [open, setOpen] = React.useState(false);
    const [user_password, setText] = React.useState("");
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

return (
  <div>
    <Button onClick={handleOpen}>
      Register
    </Button>
    <Dialog open ={open} onClose={handleClose}>
      <DialogTitle>Register a new account</DialogTitle>
      <TextField 
      required
      id="username"
      label="USERNAME"
      margin="normal"/>
      <TextField 
      error={user_password.length < MIN_PASSWORD_LENGTH}
      required
      id="password"
      label="PASSWORD"
      margin="normal"
      helperText={errorMessage}
      onChange={(e) => setText(e.target.value)}
      value={user_password}/>
      <TextField 
      required
      type="email"
      id="email"
      label="EMAIL"
      margin="normal"/>
  <DialogActions>
    <Button onClick={handleClose}>Register</Button>
    <Button onClick={handleClose}>Cancel</Button>
  </DialogActions>
  </Dialog>
  </div>
)
}