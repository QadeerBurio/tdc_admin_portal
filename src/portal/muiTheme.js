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
    MuiDialogTitle: { styleOverrides: { root: { fontFamily: "'Outfit', system-ui, sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: "-0.4px" } } },
    MuiDialogActions: { styleOverrides: { root: { padding: "14px 22px", borderTop: "1px solid #ECE7DB", gap: 8 } } },
    MuiBackdrop: { styleOverrides: { root: { backgroundColor: "rgba(17, 17, 17, 0.4)" } } },
    MuiMenu: { styleOverrides: { paper: { borderRadius: 16, border: "1px solid #ECE7DB", boxShadow: "0 16px 40px rgba(17, 17, 17, 0.08)" } } },
    MuiMenuItem: { styleOverrides: { root: { borderRadius: 12, margin: "2px 6px", fontSize: 14, "&.Mui-selected": { backgroundColor: "#FFF1CC" }, "&.Mui-selected:hover": { backgroundColor: "#FFF1CC" } } } },
    MuiSelect: { styleOverrides: { select: { borderRadius: 14 } } },
    MuiInputLabel: { styleOverrides: { root: { color: "#6B675E", "&.Mui-focused": { color: "#111111" } } } },
    MuiSnackbarContent: { styleOverrides: { root: { backgroundColor: "#111111", color: "#FFFFFF", borderRadius: 16, fontSize: 14 } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 16 }, standardSuccess: { backgroundColor: "#E3F3E8", color: "#1E6B3A" }, standardError: { backgroundColor: "#FDECEA", color: "#B42318" }, standardWarning: { backgroundColor: "#FFF1CC", color: "#111111" }, standardInfo: { backgroundColor: "#E1F1FA", color: "#2B7FC0" } } },
    MuiTooltip: { styleOverrides: { tooltip: { backgroundColor: "#111111", borderRadius: 10, fontSize: 12.5 } } },
    MuiLinearProgress: { styleOverrides: { root: { height: 8, borderRadius: 4, backgroundColor: "#F0ECE2" }, bar: { backgroundColor: "#111111", borderRadius: 4 } } },
    MuiCircularProgress: { defaultProps: { color: "inherit" } },
    MuiSwitch: { styleOverrides: { switchBase: { "&.Mui-checked": { color: "#111111" }, "&.Mui-checked + .MuiSwitch-track": { backgroundColor: "#F9C349", opacity: 1 } } } },
    MuiCheckbox: { styleOverrides: { root: { "&.Mui-checked": { color: "#111111" } } } },
    MuiIconButton: { styleOverrides: { root: { borderRadius: 18 } } },
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
