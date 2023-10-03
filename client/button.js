class CustomButton extends HTMLElement {
  // observedAttributes specify what attributes to expose for change.
  static get observedAttributes() {
    return [
      "background-color",
      "hover-background-color",
      "font-color",
      "disabled",
    ];
  }

  constructor() {
    super();
  }

  connectedCallback() {
    console.log("oc", this);
    const shadowDom = this.attachShadow({ mode: "open" });
    const value = this.getAttribute("value");
    const disabledState = this.hasAttribute("disabled") ? "disabled=true" : "";
    this.disabled = true;
    shadowDom.innerHTML = `
      <link rel="stylesheet" href="styles/custom-button-style.css" />
      <input
          type="button"
          class="button"
          value="${value === null || value === undefined ? "Default" : value}" 
          ${disabledState}
        />
      `;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (newValue !== "undefined") {
      const attribute = {
        "background-color": "--background-color",
        "hover-background-color": "--hover-background-color",
        "font-color": "--font-color",
      };
      if (name === "disabled") {
        console.log("change", newValue);
        // this.shadowRoot.querySelector('input').setAttribute("disabled", newValue);
      } else {
        this.style.setProperty(attribute[name], newValue);
      }
    }
  }
}

customElements.define("custom-button", CustomButton);
