import { HTML_ELEMENTS_IDS } from "../constants/elements-ids.js";

const authenticationForms = (function () {
  /**
   * Creates and returns form for taking account credentials, the customer
   *     id and password.
   *
   * @param {function(string, string): undefined} saveAccountCredentials
   *     Responsible for saving the account credentials to the driver and
   *     local storage
   * @param {?string} usedAccount The account credentials already saved and used
   *     by the driver
   * @returns {HTMLElement}
   */
  const accountCredentialsForm = (saveAccountCredentials, usedAccount) => {
    const form = document.createElement("form");
    const customerIdLabel = document.createElement("label");
    const customerIdInput = document.createElement("input");
    const passwordLabel = document.createElement("label");
    const passwordInput = document.createElement("input");
    const submitButton = document.createElement("input");
    const buttonsWrapper = document.createElement("div");

    form.setAttribute("id", "account-credentials-form");
    form.setAttribute("class", "input-group");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      saveAccountCredentials(customerIdInput.value, passwordInput.value);
      submitButton.setAttribute("disabled", true);
      submitButton.value = "Saved successfully";
      setTimeout(() => {
        submitButton.removeAttribute("disabled");
        submitButton.value = "Save";
        document
          .getElementById(HTML_ELEMENTS_IDS.CURRENT_MODAL_SHOWN)
          ?.remove();
      }, 1500);
    });
    customerIdLabel.setAttribute("class", "subtitle");
    customerIdLabel.setAttribute("for", "customer-id");
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
    submitButton.setAttribute("class", "button ml-auto");
    submitButton.setAttribute("id", "account-credentials-button");
    submitButton.setAttribute("value", "Save");
    buttonsWrapper.classList.add("buttons-group");

    buttonsWrapper.appendChild(submitButton);
    form.appendChild(customerIdLabel);
    form.appendChild(customerIdInput);
    form.appendChild(passwordLabel);
    form.appendChild(passwordInput);
    form.appendChild(buttonsWrapper);

    if (usedAccount) {
      customerIdInput.value = usedAccount.customerId;
      passwordInput.value = usedAccount.password;
    }
    return form;
  };

  /**
   * Creates and returns form for taking secret key that the driver will use
   *     for making transctions.
   *
   * @param {function(string): undefined} saveKey Responsible for saving the
   *     secret key on local storage and the driver using it
   * @param {?string} usedKey Secret key already saved in local storage and
   *     used by the driver
   * @returns {HTMLElement}
   */
  const keyForm = (saveKey, usedKey) => {
    const form = document.createElement("form");
    const keyLabel = document.createElement("label");
    const keyInput = document.createElement("input");
    const submitButton = document.createElement("input");
    const buttonsWrapper = document.createElement("div");

    form.setAttribute("id", "secret-key-card");
    form.setAttribute("class", "input-group");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      saveKey(keyInput.value);
      submitButton.setAttribute("value", "Successfully saved");
      submitButton.setAttribute("disabled", "true");
      setTimeout(() => {
        submitButton.removeAttribute("disabled");
        submitButton.value = "Save";
        document
          .getElementById(HTML_ELEMENTS_IDS.CURRENT_MODAL_SHOWN)
          ?.remove();
      }, 1500);
    });
    keyLabel.setAttribute("class", "subtitle");
    keyLabel.setAttribute("for", "secret-key-input");
    keyLabel.textContent = "Set API secret key";
    keyInput.setAttribute("required", true);
    keyInput.setAttribute("type", "text");
    keyInput.setAttribute("name", "apiKey");
    keyInput.setAttribute("id", "secret-key-input");
    keyInput.setAttribute(
      "placeholder",
      "Setting a new key will overwrite the already used one."
    );
    submitButton.setAttribute("type", "submit");
    submitButton.setAttribute("class", "button ml-auto");
    submitButton.setAttribute("id", "secret-key-button");
    submitButton.setAttribute("value", "Save");
    buttonsWrapper.classList.add("buttons-group");

    buttonsWrapper.appendChild(submitButton);
    form.appendChild(keyLabel);
    form.appendChild(keyInput);
    form.appendChild(buttonsWrapper);

    if (usedKey) {
      keyInput.value = usedKey;
    }
    return form;
  };

  return {
    accountCredentialsForm,
    keyForm,
  };
})();

/**
 * Contains authentication methods accompanied with their forms
 */
export const AUTHENTICATION_METHODS_FORMS = {
  USER_AND_PASSWORD: authenticationForms.accountCredentialsForm,
  KEY: authenticationForms.keyForm,
};
