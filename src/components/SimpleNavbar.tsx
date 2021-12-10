import React from 'react';
import { AppBar, Button, Toolbar } from '@mui/material';
import logo from '../images/pioemu.svg';
import RegisterForm from './RegisterForm';
import LoginForm from './LoginForm';

const SimpleNavbar = () => {
    return (
        <AppBar position="static" color="secondary">
            <Toolbar variant='regular'>
                <img src={logo} alt="PIOEMU"/>
                <LoginForm/>
                <RegisterForm/>
                <Button href="https://datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf#page=335" target="_blank">HELP</Button> 
            </Toolbar>
        </AppBar>
    )
}

export default SimpleNavbar;