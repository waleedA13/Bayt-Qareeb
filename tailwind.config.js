module.exports = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14213D",      // dusk sky
        lantern: "#E9B949",  // lamp gold
        paper: "#F4F6F9",
        sage: "#2F6F5E",     // allowed
        clay: "#A63D33",     // not allowed
        brothers: "#2B5C9E",
        sisters: "#8A3B6E",
      },
      fontFamily: {
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-body)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
