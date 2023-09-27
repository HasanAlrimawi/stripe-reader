class CustomButton extends HTMLElement {
  // observedAttributes specify what attributes to expose for change.
  static get observedAttributes() {
    return ["background-color", "hover-background-color", "font-color"];
  }

  constructor() {
    super();
  }

  connectedCallback() {
    const shadowDom = this.attachShadow({ mode: "open" });
    const value = this.getAttribute("value");
    const disabled = this.getAttribute("disabled");
    shadowDom.innerHTML = `
      <link rel="stylesheet" href="styles/custom-button-style.css" />
      <input
          type="button"
          class="button"
          value="${value === null || value === undefined ? "Default" : value}" 
          
        />
      `;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (newValue !== "undefined") {
      if (name === "background-color") {
        this.style.setProperty("--background-color", newValue);
      } else if (name === "hover-background-color") {
        this.style.setProperty("--hover-background-color", newValue);
      } else if (name === "font-color") {
        this.style.setProperty("--font-color", newValue);
      }
    }
  }
}

customElements.define("custom-button", CustomButton);
