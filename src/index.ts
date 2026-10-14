import r2wc from "@r2wc/react-to-web-component";
import Element from "./Element";

// Convert React component to web component
const WebComponent = r2wc(Element, {
  props: {
    message: "string",
  },
});

// Register the custom element
customElements.define("aaa-aa", WebComponent);
