import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
    dark: `#24292e`,
      // light: will be calculated from palette.primary.main,
      main: '#ff4400',
      // dark: will be calculated from palette.primary.main,
      // contrastText: will be calculated to contrast with palette.primary.main
    },
    secondary: {
      light: `#6CC04A`,
      main: `#C51A4A`,
      // dark: will be calculated from palette.secondary.main,
      contrastText: '#ffcc00',
    },
    // Used by `getContrastText()` to maximize the contrast between
    // the background and the text.
    contrastThreshold: 3,
    // Used by the functions below to shift a color's luminance by approximately
    // two indexes within its tonal palette.
    // E.g., shift from Red 500 to Red 300 or Red 700.
    tonalOffset: 0.2,
  },
});

export default {
  colors: {
    bg: `#FFFFFF`,
    light: `#FFFFFF`, 
    dark: `#24292e`,
    green: `#6CC04A`,
    red: `#C51A4A`,
  },
  fonts: {
    body: `IBM Plex Sans, sans-serif`,
    heading: `IBM Plex Sans, sans-serif`,
    code: `Source Code Pro, monospace`,
  }
}

