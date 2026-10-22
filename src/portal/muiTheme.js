// muiTheme.js: tdc look for the admin screens built with MUI (career portal, events).
// Wrap a screen with withTdcTheme(Screen); no logic changes.
import React from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";

export const tdcMuiTheme = createTheme({
  palette: {
    primary: { main: "#111111", contrastText: "#FFFFFF" },
    secondary: { main: "#F9C349", contrastText: "#111111" },
    error: { main: "#B42318" },
    success: { main: "#1E6B3A" },
    warning: { main: "#C77700" },
    info: { main: "#2B7FC0" },
    background: { default: "#FAF8F3", paper: "#FFFFFF" },
    text: { primary: "#111111", secondary: "#6B675E" },
    divider: "#ECE7DB",
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: "'DM Sans', system-ui, sans-serif",
    h1: { fontFamily: "'Outfit', system-ui, sans-serif", fontWeight: 800 },
    h2: { fontFamily: "'Outfit', system-ui, sans-serif", fontWeight: 800 },
    h3: { fontFamily: "'Outfit', system-ui, sans-serif", fontWeight: 800 },
    h4: { fontFamily: "'Outfit', system-ui, sans-serif", fontWeight: 800, letterSpacing: "-0.5px" },
    h5: { fontFamily: "'Outfit', system-ui, sans-serif", fontWeight: 700 },
    h6: { fontFamily: "'Outfit', system-ui, sans-serif", fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 700 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 22, minHeight: 40, paddingLeft: 18, paddingRight: 18 } },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: "none" }, outlined: { borderColor: "#ECE7DB" }, rounded: { borderRadius: 22 } },
    },
    MuiCard: { styleOverrides: { root: { border: "1px solid #ECE7DB", borderRadius: 22 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 24 } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 15, fontWeight: 700 } } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 16, backgroundColor: "#FFFFFF" }, notchedOutline: { borderColor: "#ECE7DB" } } },
    MuiTab: { styleOverrides: { root: { textTransform: "none", fontWeight: 600, fontSize: 15 } } },
    MuiTabs: { styleOverrides: { indicator: { backgroundColor: "#F9C349", height: 3 } } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 700, color: "#6B675E" }, root: { borderColor: "#F0ECE2" } } },
  },
});

export function withTdcTheme(Screen) {
  function Themed(props) {
    return (
      <ThemeProvider theme={tdcMuiTheme}>
        <Screen {...props} />
      </ThemeProvider>
    );
  }
  Themed.displayName = `Tdc(${Screen.displayName || Screen.name || "Screen"})`;
  return Themed;
}
