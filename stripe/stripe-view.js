import { stripeReadersModel } from "./stripe-readers-model.js";

export const stripeReaderView = (function () {
  /**
   * Creates HTML elements that hold readers available for use showing
   *     the connect button and append them to the readers list.
   *
   * @param {string} readerName
   * @returns HTMLElement
   */
  function createAvailableReadersList(useReader) {
    const availableReaders = stripeReadersModel.getReadersList();
    const readersHolderElement = document.getElementById(
      "available-readers-holder"
    );
    readersHolderElement.innerHTML = "";

    if (availableReaders) {
      for (const reader of availableReaders) {
        const readerWrapper = document.createElement("div");
        const readerLabel = document.createElement("label");
        const useReaderButton = createUseReaderButton(reader.id);
        useReaderButton.addEventListener("click", () => {
          useReader(reader);
        });

        readerWrapper.setAttribute("class", "vertical-wrapper");
        readerLabel.textContent = reader.label;

        readerWrapper.appendChild(readerLabel);
        readerWrapper.appendChild(useReaderButton);
        readersHolderElement.appendChild(readerWrapper);
      }
    }
  }

  /**
   * Creates HTML disconnect button with event listener to disconnect the already
   *     connected reader when selected.
   *
   * @param {string} readerName Represents the name to be given for the reader
   * @returns {HTMLElement}
   */
  function createStopReaderButton(readerId) {
    const stopReaderButton = document.createElement("input");
    stopReaderButton.setAttribute("id", readerId);
    stopReaderButton.setAttribute("value", "Stop");
    stopReaderButton.setAttribute("class", "button");
    stopReaderButton.setAttribute("type", "button");
    return stopReaderButton;
  }

  /**
   * Creates HTML connect button with event listener to connect to the wanted
   *     reader when selected.
   *
   * @param {string} readerName Represents the name to be given for the reader
   * @returns {HTMLElement}
   */
  function createUseReaderButton(readerId) {
    const useReaderButton = document.createElement("input");
    useReaderButton.setAttribute("id", readerId);
    useReaderButton.setAttribute("value", "Use");
    useReaderButton.setAttribute("class", "connect-button button");
    useReaderButton.setAttribute("type", "button");
    return useReaderButton;
  }

  /**
   * Creates the HTMLElement form that represents the view that will take a new API
   *     secret key to use with connecting to stripe's terminal.
   *
   * @returns {HTMLElement}
   */
  function createSecretKeySetterCard(saveKey) {
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
        document.getElementById("current-modal")?.remove();
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
    buttonsWrapper.setAttribute("class", "flex-space-between");

    buttonsWrapper.appendChild(submitButton);
    form.appendChild(keyLabel);
    form.appendChild(keyInput);
    form.appendChild(buttonsWrapper);

    return form;
  }

  /**
   * Replaces the use reader button of the just chosen reader with a stop
   *     button, and disables the other readers' use buttons.
   *
   * @param {string} mode To specify what to do with use/stop buttons
   *     of all the readers except the one its button has been clicked,
   *     whether to enable or disable the buttons
   * @param {string} reader Represents the reader its button has just been
   *     clicked to exchange its button whether to use/stop button
   */
  function useStopReadersButtons(reader, mode, useReader, stopReader) {
    let stopReaderButton;
    let useReaderButton;
    /** Represents the use reader buttons of the readers apart from the one its
     *      button recently clicked */
    let useReaderButtons;

    switch (mode) {
      case "disable":
        useReaderButton = document.getElementById(reader.id);
        stopReaderButton = createStopReaderButton(reader.id);
        useReaderButton.replaceWith(stopReaderButton);
        useReaderButtons = document.getElementsByClassName("connect-button");
        for (const button of useReaderButtons) {
          button.setAttribute("disabled", true);
        }
        stopReaderButton.addEventListener("click", () => {
          stopReader(reader);
        });
        break;

      case "enable":
        stopReaderButton = document.getElementById(reader.id);
        useReaderButton = createUseReaderButton(reader.id);
        stopReaderButton.replaceWith(useReaderButton);
        useReaderButtons = document.getElementsByClassName("connect-button");
        for (const button of useReaderButtons) {
          button.removeAttribute("disabled");
        }
        useReaderButton.addEventListener("click", () => {
          useReader(reader);
        });
        break;
    }
  }

  /**
   * Represents the HTML code of the stripe view
   *
   * @returns string
   */
  function deviceHtml() {
    return `
    <div class="card-vertical" id="device-view">
        <section class="card-form">
          <span class="subtitle">Reader Connection</span>
          <input
            class="button"
            type="button"
            value="List readers registered"
            id="list-readers-btn"
          />
          <section id="available-readers-holder" class="card"></section>
        </section>
    </div
        `;
  }

  /**
   * Creates the buttons responsible for showing form to set configuration
   *     parameters for the payment gateway used
   */
  function addPresetsButtons() {
    document
      .getElementById("payment-gateway-presets-buttons")
      .insertAdjacentHTML(
        "beforeend",
        `<input
    class="button"
    type="button"
    id="secret-key-card-addition-button"
    value="Set API secret key"
  />`
      );
  }

  let formStepsNum = 0;

  function multipleStepsSetUpForm(setSecretKey, renderPayForm) {
    const h1 = document.createElement("h1");
    const progressBar = document.createElement("div");
    const progress = document.createElement("div");
    const progressSteps = [];

    h1.textContent = "Setting up Stripe";
    h1.classList.add("text-center");

    progressBar.classList.add("progress-bar");

    progress.id = "progress";
    progress.classList.add("progress");
    progressBar.appendChild(progress);

    const stepTitles = ["Secret key", "Finished"];
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

    const keyLabel = document.createElement("label");
    keyLabel.setAttribute("class", "subtitle");
    keyLabel.setAttribute("for", "secret-key-input");
    keyLabel.textContent = "Set API secret key";
    inputGroup1.appendChild(keyLabel);

    const keyInput = document.createElement("input");
    keyInput.setAttribute("required", true);
    keyInput.setAttribute("type", "text");
    keyInput.setAttribute("name", "apiKey");
    keyInput.setAttribute("id", "secret-key-input");
    keyInput.setAttribute(
      "placeholder",
      "Setting a new key will overwrite the already used one."
    );
    inputGroup1.appendChild(keyInput);

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
      setSecretKey(keyInput.value);
    });

    // Form Step 2
    const formStep2 = document.createElement("form");
    formStep2.classList.add("form-step");

    const inputGroup2 = document.createElement("div");
    inputGroup2.classList.add("input-group");
    formStep2.appendChild(inputGroup2);

    const saveLabel = document.createElement("label");
    saveLabel.classList.add("subtitle");
    saveLabel.textContent = "Entries Saved! You can use the app";
    inputGroup2.appendChild(saveLabel);

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
    nextButton2.value = "Use app";
    buttonsGroup2.appendChild(nextButton2);

    formStep2.addEventListener("submit", (e) => {
      e.preventDefault();
      formStepsNum++;
      updateProgressbar();
      form.remove();
      renderPayForm();
    });

    const elements = [h1, progressBar, formStep1, formStep2];

    const form = document.createElement("div");
    form.classList.add("form");
    elements.forEach((element) => {
      form.appendChild(element);
    });

    //------------------------------------
    prevButton2.addEventListener("click", () => {
      formStepsNum--;
      updateFormSteps();
      updateProgressbar();
    });

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
    createAvailableReadersList,
    createSecretKeySetterCard,
    useStopReadersButtons,
    deviceHtml,
    addPresetsButtons,
    multipleStepsSetUpForm,
  };
})();
