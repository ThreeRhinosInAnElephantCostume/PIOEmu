import * as React from 'react';
import { Box, Button, Dialog, DialogActions, DialogTitle, TextField } from '@mui/material';

export default function RegisterForm() {
    const [open, setOpen] = React.useState(false);


const handleOpen = () => {
    setOpen(true);
}

const handleClose = () => {
    setOpen(false);
}

const style = { padding: '25px'};

return (
  <div>
    <Box sx={style}>
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
      required
      id="password"
      label="PASSWORD"
      margin="normal"/>
      <TextField 
      required
      id="email"
      label="EMAIL"
      margin="normal"/>
  <DialogActions>
    <Button onClick={handleClose}>Register</Button>
    <Button onClick={handleClose}>Cancel</Button>
  </DialogActions>
  </Dialog>
</Box>
  </div>
  

)
}