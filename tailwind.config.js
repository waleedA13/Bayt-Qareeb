module.exports = {
  // hover: styles only on devices that can hover, so they don't stick after a tap on phones
  future: { hoverOnlyWhenSupported: true },
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      keyframes: { "fade-up": { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } } },
      animation: { "fade-up": "fade-up 320ms ease-out both" },
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
        body: ["Figtree", "system-ui", "sans-serif"],
        display: ["'Reem Kufi'", "Figtree", "sans-serif"],
      },
    },
  },
  plugins: [],
};
