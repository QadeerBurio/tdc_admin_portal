// muiTheme.js: tdc look for the admin screens built with MUI (career portal, events).
// Wrap a screen with withTdcTheme(Screen); no logic changes.
import React from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { TOKEN as T } from "./tokens";

export const tdcMuiTheme = createTheme({
  palette: {
    primary: { main: T.ink, contrastText: T.card },
    secondary: { main: T.yellow, contrastText: T.ink },
    error: { main: T.danger },
    success: { main: T.success },
    warning: { main: T.orange },
    info: { main: T.blue },
    background: { default: T.paper, paper: T.card },
    text: { primary: T.ink, secondary: T.muted },
    divider: T.line,
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
      styleOverrides: { root: { backgroundImage: "none" }, outlined: { borderColor: T.line }, rounded: { borderRadius: 22 } },
    },
    MuiCard: { styleOverrides: { root: { border: `1px solid ${T.line}`, borderRadius: 22 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 24 } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 15, fontWeight: 700 } } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 16, backgroundColor: T.card }, notchedOutline: { borderColor: T.line } } },
    MuiTab: { styleOverrides: { root: { textTransform: "none", fontWeight: 600, fontSize: 15 } } },
    MuiTabs: { styleOverrides: { indicator: { backgroundColor: T.yellow, height: 3 } } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 700, color: T.muted }, root: { borderColor: T.lineSoft } } },
    MuiDialogTitle: { styleOverrides: { root: { fontFamily: "'Outfit', system-ui, sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: "-0.4px" } } },
    MuiDialogActions: { styleOverrides: { root: { padding: "14px 22px", borderTop: `1px solid ${T.line}`, gap: 8 } } },
    MuiBackdrop: { styleOverrides: { root: { backgroundColor: "rgba(17, 17, 17, 0.4)" } } },
    MuiMenu: { styleOverrides: { paper: { borderRadius: 16, border: `1px solid ${T.line}`, boxShadow: "0 16px 40px rgba(17, 17, 17, 0.08)" } } },
    MuiMenuItem: { styleOverrides: { root: { borderRadius: 12, margin: "2px 6px", fontSize: 14, "&.Mui-selected": { backgroundColor: T.yellowSoft }, "&.Mui-selected:hover": { backgroundColor: T.yellowSoft } } } },
    MuiSelect: { styleOverrides: { select: { borderRadius: 14 } } },
    MuiInputLabel: { styleOverrides: { root: { color: T.muted, "&.Mui-focused": { color: T.ink } } } },
    MuiSnackbarContent: { styleOverrides: { root: { backgroundColor: T.ink, color: T.card, borderRadius: 16, fontSize: 14 } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 16 }, standardSuccess: { backgroundColor: T.successBg, color: T.success }, standardError: { backgroundColor: T.dangerBg, color: T.danger }, standardWarning: { backgroundColor: T.yellowSoft, color: T.ink }, standardInfo: { backgroundColor: T.blueBg, color: T.blue } } },
    MuiTooltip: { styleOverrides: { tooltip: { backgroundColor: T.ink, borderRadius: 10, fontSize: 12.5 } } },
    MuiLinearProgress: { styleOverrides: { root: { height: 8, borderRadius: 4, backgroundColor: T.lineSoft }, bar: { backgroundColor: T.ink, borderRadius: 4 } } },
    MuiCircularProgress: { defaultProps: { color: "inherit" } },
    MuiSwitch: { styleOverrides: { switchBase: { "&.Mui-checked": { color: T.ink }, "&.Mui-checked + .MuiSwitch-track": { backgroundColor: T.yellow, opacity: 1 } } } },
    MuiCheckbox: { styleOverrides: { root: { "&.Mui-checked": { color: T.ink } } } },
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
