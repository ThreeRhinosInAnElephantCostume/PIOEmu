import React from 'react';
import { AppBar, Button, Toolbar, Typography } from '@mui/material';
import logo from '../images/pioemu.svg';
import RegisterForm from './RegisterForm';
import LoginForm from './LoginForm';

const styles = {
  toolbarButtons: {
    marginLeft: 'auto', //Align items to the right
  },
};

const SimpleNavbar = () => {
    const [activeUser, setUser] = React.useState("Guest");

React.useEffect(() => {
    let user_name = "";
    if (user_name)
        setUser(user_name);
    else
        setUser('Guest');
  })

    return (
        <AppBar position="static" color="secondary">
            <Toolbar variant='regular'>
                <img src={logo} alt="PIOEMU"/>
                <LoginForm />
                <RegisterForm/>
                <Button href="https://datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf#page=335" target="_blank">HELP</Button> 
            <div style={styles.toolbarButtons}>
            <Typography variant="h6" color="inherit" component="div" >
            Welcome, {activeUser}!
            </Typography>
            </div>
            </Toolbar>
            
        </AppBar>
    )
}

export default SimpleNavbar;