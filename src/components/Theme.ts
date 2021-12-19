import { createTheme } from '@mui/material/styles';

const maintheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: `#C51A4A`, //red
      dark: `#24292e`,
      contrastText: 'white',
    },
    secondary: {
      main: '#fff',
      contrastText: 'black',
    }
  },
});

export default maintheme;