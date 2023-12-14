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
    // const cancelButton = document.createElement("input");
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
        submitButton.setAttribute("value", "Save");
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
    // cancelButton.setAttribute("type", "submit");
    // cancelButton.setAttribute("class", "button");
    // cancelButton.setAttribute("value", "Cancel");
    buttonsWrapper.setAttribute("class", "flex-space-between");

    // buttonsWrapper.appendChild(cancelButton);
    buttonsWrapper.appendChild(submitButton);
    form.appendChild(customerIdLabel);
    form.appendChild(customerIdInput);
    form.appendChild(passwordLabel);
    form.appendChild(passwordInput);
    form.appendChild(buttonsWrapper);
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
    const submitButton = document.createElement("input");
    // const cancelButton = document.createElement("input");
    const buttonsWrapper = document.createElement("div");

    form.setAttribute("id", "payment-device-form");
    form.setAttribute("class", "input-group");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      saveDeviceDetails(deviceNameInput.value);
      submitButton.setAttribute("disabled", true);
      submitButton.value = "Saved successfully";
      setTimeout(() => {
        submitButton.removeAttribute("disabled");
        submitButton.setAttribute("value", "Save");
      }, 1500);
    });
    deviceNameLabel.setAttribute("class", "subtitle");
    deviceNameLabel.setAttribute("for", "device-model");
    deviceNameLabel.textContent = "Device Model & Serial Number";
    deviceNameInput.setAttribute("required", true);
    deviceNameInput.setAttribute("type", "text");
    deviceNameInput.setAttribute("name", "deviceModel");
    deviceNameInput.setAttribute("id", "device-model");
    deviceNameInput.setAttribute(
      "placeholder",
      "Enter device model with the serial number [model_serialnumber] (e.g. A920PRO_578111)"
    );
    submitButton.setAttribute("type", "submit");
    submitButton.setAttribute("class", "button ml-auto");
    submitButton.setAttribute("id", "device-details-button");
    submitButton.setAttribute("value", "Save");
    // cancelButton.setAttribute("type", "submit");
    // cancelButton.setAttribute("class", "button");
    // cancelButton.setAttribute("value", "Cancel");
    buttonsWrapper.setAttribute("class", "flex-space-between");

    // buttonsWrapper.appendChild(cancelButton);
    buttonsWrapper.appendChild(submitButton);
    form.appendChild(deviceNameLabel);
    form.appendChild(deviceNameInput);
    form.appendChild(buttonsWrapper);

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

  let formStepsNum = 0;

  function multipleStepsSetUpForm(
    saveAccountCredentials,
    saveReaderDetails,
    renderPayForm
  ) {
    // Create elements
    const h1 = document.createElement("h1");
    const progressBar = document.createElement("div");
    const progress = document.createElement("div");
    const progressSteps = [];
    // Setting up elements' attributes
    h1.textContent = "Setting up app...";
    h1.classList.add("text-center");

    progressBar.classList.add("progress-bar");

    progress.id = "progress";
    progress.classList.add("progress");
    progressBar.appendChild(progress);

    const stepTitles = ["Credentials", "Reader", "Finished"];
    stepTitles.forEach((title, index) => {
      const step = document.createElement("div");
      index === 0
        ? step.classList.add("progress-step-active", "progress-step")
        : step.classList.add("progress-step");
      step.setAttribute("data-title", title);
      progressSteps.push(step);
      progressBar.appendChild(step);
    });

    // Creating form steps individually
    // Form Step 1
    const formStep1 = document.createElement("form");
    formStep1.classList.add("form-step", "form-step-active");

    const inputGroup1 = document.createElement("div");
    inputGroup1.classList.add("input-group");
    formStep1.appendChild(inputGroup1);

    const customerIdLabel = document.createElement("label");
    customerIdLabel.classList.add("subtitle");
    customerIdLabel.setAttribute("for", "customer-id");
    customerIdLabel.textContent = "Customer id";
    inputGroup1.appendChild(customerIdLabel);

    const customerIdInput = document.createElement("input");
    customerIdInput.required = true;
    customerIdInput.type = "text";
    customerIdInput.name = "customerId";
    customerIdInput.id = "customer-id";
    customerIdInput.placeholder = "Enter your customer id";
    inputGroup1.appendChild(customerIdInput);

    const passwordLabel = document.createElement("label");
    passwordLabel.classList.add("subtitle");
    passwordLabel.setAttribute("for", "password");
    passwordLabel.textContent = "Password";
    inputGroup1.appendChild(passwordLabel);

    const passwordInput = document.createElement("input");
    passwordInput.required = true;
    passwordInput.type = "password";
    passwordInput.name = "password";
    passwordInput.id = "password";
    passwordInput.placeholder = "Enter your account password";
    inputGroup1.appendChild(passwordInput);

    const buttonsGroup1 = document.createElement("div");
    buttonsGroup1.classList.add("buttons-group");
    formStep1.appendChild(buttonsGroup1);

    const nextButton1 = document.createElement("input");
    nextButton1.type = "submit";
    nextButton1.classList.add("button", "button-next", "ml-auto");
    nextButton1.value = "Next";
    buttonsGroup1.appendChild(nextButton1);

    formStep1.addEventListener("submit", (e) => {
      e.preventDefault();
      formStepsNum++;
      updateFormSteps();
      updateProgressbar();
      saveAccountCredentials(customerIdInput.value, passwordInput.value);
    });

    // Form Step 2
    const formStep2 = document.createElement("form");
    formStep2.classList.add("form-step");

    const inputGroup2 = document.createElement("div");
    inputGroup2.classList.add("input-group");
    formStep2.appendChild(inputGroup2);

    const readerLabel = document.createElement("label");
    readerLabel.classList.add("subtitle");
    readerLabel.setAttribute("for", "device-model");
    readerLabel.textContent = "Device Model & Serial Number";
    inputGroup2.appendChild(readerLabel);

    // Creating input element
    const readerInput = document.createElement("input");
    readerInput.required = true;
    readerInput.type = "text";
    readerInput.name = "deviceModel";
    readerInput.id = "device-model";
    readerInput.placeholder =
      "Enter device model with the serial number [model_serialnumber] (e.g. A920PRO_578111)";
    inputGroup2.appendChild(readerInput);

    const buttonsGroup2 = document.createElement("div");
    buttonsGroup2.classList.add("buttons-group");
    formStep2.appendChild(buttonsGroup2);

    const prevButton2 = document.createElement("input");
    prevButton2.classList.add("button", "button-previous");
    prevButton2.value = "Previous";
    buttonsGroup2.appendChild(prevButton2);

    const nextButton2 = document.createElement("input");
    nextButton2.type = "submit";
    nextButton2.classList.add("button", "button-next");
    nextButton2.value = "Next";
    buttonsGroup2.appendChild(nextButton2);

    formStep2.addEventListener("submit", (e) => {
      e.preventDefault();
      formStepsNum++;
      updateFormSteps();
      updateProgressbar();
      saveReaderDetails(readerInput.value);
    });

    // Form Step 3
    const formStep3 = document.createElement("form");
    formStep3.classList.add("form-step");

    const inputGroup3 = document.createElement("div");
    inputGroup3.classList.add("input-group");
    formStep3.appendChild(inputGroup3);

    const saveLabel = document.createElement("label");
    saveLabel.classList.add("subtitle");
    saveLabel.textContent = "Entries Saved! You can use the app";
    inputGroup3.appendChild(saveLabel);

    const buttonsGroup3 = document.createElement("div");
    buttonsGroup3.classList.add("buttons-group");
    formStep3.appendChild(buttonsGroup3);

    const prevButton3 = document.createElement("input");
    prevButton3.classList.add("button", "button-previous");
    prevButton3.value = "Previous";
    buttonsGroup3.appendChild(prevButton3);

    const nextButton3 = document.createElement("input");
    nextButton3.type = "submit";
    nextButton3.classList.add("button", "button-next");
    nextButton3.value = "Use app";
    buttonsGroup3.appendChild(nextButton3);

    formStep3.addEventListener("submit", (e) => {
      e.preventDefault();
      formStepsNum++;
      updateProgressbar();
      form.remove();
      renderPayForm();
    });

    const elements = [h1, progressBar, formStep1, formStep2, formStep3];

    const form = document.createElement("div");
    form.classList.add("form");
    elements.forEach((element) => {
      form.appendChild(element);
    });

    //------------------------------------
    const previousButtons = [prevButton2, prevButton3];
    for (const btn of previousButtons) {
      btn.addEventListener("click", () => {
        formStepsNum--;
        updateFormSteps();
        updateProgressbar();
      });
    }
    //---------------------------------------

    return form;
  }

  const updateProgressbar = () => {
    const progressSteps = document.getElementsByClassName("progress-step");
    const progress = document.getElementById("progress");

    [...progressSteps].forEach((progressStep, idx) => {
      if (idx < formStepsNum + 1) {
        progressStep.classList.add("progress-step-active");
      } else {
        progressStep.classList.remove("progress-step-active");
      }
    });
    const progressActive = document.getElementsByClassName(
      "progress-step-active"
    );

    progress.style.width =
      ((progressActive.length - 1) / (progressSteps.length - 1)) * 100 + "%";
  };

  const updateFormSteps = () => {
    const formSteps = document.getElementsByClassName("form-step");
    [...formSteps].forEach((formStep) => {
      if (formStep.classList.contains("form-step-active")) {
        formStep.classList.remove("form-step-active");
      }
    });
    formSteps[formStepsNum].classList.add("form-step-active");
  };

  return {
    accountCredentialsCard,
    defineReaderDeviceCard,
    createCheckButton,
    addPresetsButtons,
    multipleStepsSetUpForm,
  };
})();
