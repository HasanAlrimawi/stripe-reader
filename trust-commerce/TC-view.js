export const TCReaderView = (function () {
  /**
   * Creates and returns form element of account credentials to be used
   *     for transactions through trust commerce payment gateway.
   *
   * @param {function} saveAccountCredentials the callback function to be
   *     invoked when the button is clicked
   * @returns HTMLElement form of the account credentials to be used
   */
  function accountCredentialsCard(saveAccountCredentials) {
    const form = document.createElement("form");
    const customerIdLabel = document.createElement("label");
    const customerIdInput = document.createElement("input");
    const passwordLabel = document.createElement("label");
    const passwordInput = document.createElement("input");
    const submitButton = document.createElement("input");

    form.setAttribute("id", "account-credentials-form");
    form.setAttribute("class", "card-form");
    form.addEventListener("submit", (event) => {
      saveAccountCredentials(event);
      document.getElementById("account-credentials-form").remove();
    });
    customerIdLabel.setAttribute("class", "subtitle");
    customerIdLabel.setAttribute("for", "customerId");
    customerIdLabel.textContent = "Customer id";
    customerIdInput.setAttribute("required", true);
    customerIdInput.setAttribute("type", "text");
    customerIdInput.setAttribute("name", "customerId");
    customerIdInput.setAttribute("id", "customer-id");
    customerIdInput.setAttribute("placeholder", "Enter your customer id");
    passwordLabel.setAttribute("class", "subtitle");
    passwordLabel.setAttribute("for", "password");
    passwordLabel.textContent = "Password";
    passwordInput.setAttribute("required", true);
    passwordInput.setAttribute("type", "password");
    passwordInput.setAttribute("name", "password");
    passwordInput.setAttribute("id", "password");
    passwordInput.setAttribute("placeholder", "Enter your account password");
    submitButton.setAttribute("type", "submit");
    submitButton.setAttribute("class", "button");
    submitButton.setAttribute("id", "account-credentials-button");
    submitButton.setAttribute("value", "Save");

    form.appendChild(customerIdLabel);
    form.appendChild(customerIdInput);
    form.appendChild(passwordLabel);
    form.appendChild(passwordInput);
    form.appendChild(submitButton);

    return form;
  }

  /**
   * Creates and returns form element of reader device to be used
   *     for transactions through trust commerce payment gateway.
   *
   * @param {function} saveDeviceDetails the callback function to be invoked
   *     when the button is clicked
   * @returns HTMLElement form of the reader to be used
   */
  function defineReaderDeviceCard(saveDeviceDetails) {
    const form = document.createElement("form");
    const deviceNameLabel = document.createElement("label");
    const deviceNameInput = document.createElement("input");
    const serialNumberLabel = document.createElement("label");
    const serialNumberInput = document.createElement("input");
    const submitButton = document.createElement("input");

    form.setAttribute("id", "payment-device-form");
    form.setAttribute("class", "card-form");
    form.addEventListener("submit", (event) => {
      saveDeviceDetails(event);
      document.getElementById("payment-device-form").remove();
    });
    deviceNameLabel.setAttribute("class", "subtitle");
    deviceNameLabel.setAttribute("for", "deviceName");
    deviceNameLabel.textContent = "Device Name";
    deviceNameInput.setAttribute("required", true);
    deviceNameInput.setAttribute("type", "text");
    deviceNameInput.setAttribute("name", "deviceName");
    deviceNameInput.setAttribute("id", "device-name");
    deviceNameInput.setAttribute("placeholder", "Enter device name");
    serialNumberLabel.setAttribute("class", "subtitle");
    serialNumberLabel.setAttribute("for", "serialNumber");
    serialNumberLabel.textContent = "Serial Number";
    serialNumberInput.setAttribute("required", true);
    serialNumberInput.setAttribute("type", "text");
    serialNumberInput.setAttribute("name", "serialNumber");
    serialNumberInput.setAttribute("id", "serial-number");
    serialNumberInput.setAttribute(
      "placeholder",
      "Enter device's serial number"
    );
    submitButton.setAttribute("type", "submit");
    submitButton.setAttribute("class", "button");
    submitButton.setAttribute("id", "device-details-button");
    submitButton.setAttribute("value", "Save");

    form.appendChild(deviceNameLabel);
    form.appendChild(deviceNameInput);
    form.appendChild(serialNumberLabel);
    form.appendChild(serialNumberInput);
    form.appendChild(submitButton);

    return form;
  }

  /**
   * Creates a button used to check for the transaction state that has
   *     been submitted.
   *
   * The function invoker is responsible for appointing callback function
   *     for the button.s
   *
   * @returns HTMLElement the button that has been created
   */
  function createCheckButton() {
    const connectButton = document.createElement("input");
    connectButton.setAttribute("id", "check-pay");
    connectButton.setAttribute("value", "Check Transaction");
    connectButton.setAttribute("class", "button");
    connectButton.setAttribute("type", "button");
    return connectButton;
  }

  /**
   * Creates the buttons responsible for showing form to set configuration
   *     parameters for the payment gateway used and adds them to the DOM.
   *
   * The invoker is responsible to appoint callback functions for the buttons.
   */
  function addPresetsButtons() {
    document
      .getElementById("payment-gateway-presets-buttons")
      .insertAdjacentHTML(
        "afterbegin",
        `
    <input
        class="button"
        type="button"
        id="set-account-credentials-button"
        value="Set account credentials"
      />
      <input
        class="button"
        type="button"
        id="add-reader-button"
        value="Set reader used"
      />`
      );
  }

  return {
    accountCredentialsCard,
    defineReaderDeviceCard,
    createCheckButton,
    addPresetsButtons,
  };
})();
