import { createTheme } from '@mui/material/styles';

export default createTheme({
    palette: {
        mode: 'dark',
        primary: {
          main: '#24961f',
        },
        secondary: {
          main: '#ff1744',
        },
        background: {
          default: "#303030",
          paper: "#424242"
        }
      },
      spacing: 8,
});