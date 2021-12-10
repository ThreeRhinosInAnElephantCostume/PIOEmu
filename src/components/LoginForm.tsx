import * as React from 'react';
import { Box, Button, Dialog, DialogActions, DialogTitle, TextField } from '@mui/material';

export default function LoginForm() {
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
      Login
    </Button>
    <Dialog open ={open} onClose={handleClose}>
      <DialogTitle>Login to your account</DialogTitle>
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
  <DialogActions>
    <Button onClick={handleClose}>Login</Button>
    <Button onClick={handleClose}>Cancel</Button>
  </DialogActions>
  </Dialog>
</Box>
  </div>
  

)
}