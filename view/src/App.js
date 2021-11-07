import "./Firebase";
import {
  AppBar,
  Container,
  ThemeProvider,
  Toolbar,
  Button,
  Box,
  Typography,
} from "@mui/material";
import { getAuth, signOut } from "firebase/auth";
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import "./App.css";
import CreateGroup from "./components/CreateGroup";
import Home from "./components/Home";
import Login from "./Login";
import { CREATE_GROUP, HOME } from "./States";
import theme from "./Themes";

console.log(theme.palette);

function Router({ currentState, setCurrentState }) {
  switch (currentState) {
    case CREATE_GROUP:
      return <CreateGroup setCurrentState={setCurrentState} />;
    default:
      return <Home setCurrentState={setCurrentState} />;
  }
}

const auth = getAuth();
function App() {
  const [user, loading, error] = useAuthState(auth);
  const [currentState, setCurrentState] = useState(HOME);

  function signOutBtn() {
    signOut(auth);
  }

  return (
    <ThemeProvider theme={theme}>
      <Container>
        <AppBar elevation={0} position="sticky" sx={{mb: 2}}>
          <Toolbar sx={{ justifyContent: "space-between" }}>
            {user ? (
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6">{user.displayName}</Typography>
              </Box>
            ) : (
              ""
            )}
            <Button
              variant="h6"
              underline="none"
              color="inherit"
              variant="text"
              sx={{ fontSize: 24 }}
              onClick={() => setCurrentState(HOME)}
            >
              Tasket
            </Button>
            <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
              {user ? (
                <Button variant="text" color="inherit" onClick={signOutBtn}>
                  Sign Out
                </Button>
              ) : (
                ""
              )}
            </Box>
          </Toolbar>
        </AppBar>
        <Container className="App">
          {user ? (
            <Router
              currentState={currentState}
              setCurrentState={setCurrentState}
            />
          ) : (
            <Login />
          )}
        </Container>
      </Container>
    </ThemeProvider>
  );
}

export default App;
