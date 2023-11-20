import { stripeReadersModel } from "./stripe-readers-model.js";

export const stripeReaderView = (function () {
  /**
   * Creates HTML elements that hold readers available for use showing
   *     the connect button and append them to the readers list.
   *
   * @param {string} readerName
   * @returns HTMLElement
   */
  function createAvailableReadersList(connectToReader) {
    const availableReaders = stripeReadersModel.getReadersList();
    const readersHolderElement = document.getElementById(
      "available-readers-holder"
    );
    readersHolderElement.innerHTML = "";

    if (availableReaders) {
      for (const reader of availableReaders) {
        const readerWrapper = document.createElement("div");
        const readerLabel = document.createElement("label");
        const connectButton = createConnectButton(reader.id);
        connectButton.addEventListener("click", () => {
          connectToReader(reader);
        });

        readerWrapper.setAttribute("class", "vertical-wrapper");
        readerLabel.textContent = reader.label;

        readerWrapper.appendChild(readerLabel);
        readerWrapper.appendChild(connectButton);
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
  function createDisconnectButton(readerId) {
    const disconnectButton = document.createElement("input");
    disconnectButton.setAttribute("id", readerId);
    disconnectButton.setAttribute("value", "Disconnect");
    disconnectButton.setAttribute("class", "button");
    disconnectButton.setAttribute("type", "button");
    return disconnectButton;
  }

  /**
   * Creates HTML connect button with event listener to connect to the wanted
   *     reader when selected.
   *
   * @param {string} readerName Represents the name to be given for the reader
   * @returns {HTMLElement}
   */
  function createConnectButton(readerId) {
    const connectButton = document.createElement("input");
    connectButton.setAttribute("id", readerId);
    connectButton.setAttribute("value", "Connect");
    connectButton.setAttribute("class", "connect-button button");
    connectButton.setAttribute("type", "button");
    return connectButton;
  }

  /**
   * Creates the HTMLElement that represents the view that will take a new API
   *     secret key to use with connecting to stripe's terminal.
   *
   * @returns {HTMLElement}
   */
  function createSecretKeySetterCard() {
    const wrapper = document.createElement("section");
    wrapper.setAttribute("class", "card-form");
    wrapper.setAttribute("id", "secretKeyCard");
    wrapper.insertAdjacentHTML(
      "beforeend",
      `<label class="subtitle" for="secretKey">Set API secret key</label>
    <input type="text" name="secretKey" id="secretKeyInput"
    placeholder="Setting a new key will overwrite the already used one.">
    <input type="button" class="button" id="secretKeyButton"
     value="Set key">`
    );
    return wrapper;
  }

  /**
   * Replaces the connect button of the just connected reader with a disconnect
   *     button, and disables the other readers' connect buttons.
   *
   * @param {string} mode To specify what to do with connect/disconnect buttons
   *     of all the readers except the one its button has been clicked,
   *     whether to enable or disable the buttons
   * @param {string} reader Represents the reader its button has just been clicked
   *     to exchange its button whether to connect/disconnect button
   */
  function controlConnectButtons(
    reader,
    mode,
    connectToReader,
    disconnectReader
  ) {
    let disconnectButton;
    let connectButton;
    /** Represents the connect buttons of the readers apart from the one its
     *      button recently clicked */
    let connectButtons;

    switch (mode) {
      case "disable":
        connectButton = document.getElementById(reader.id);
        disconnectButton = createDisconnectButton(reader.id);
        connectButton.replaceWith(disconnectButton);
        connectButtons = document.getElementsByClassName("connect-button");
        connectButtons.forEach((button) => {
          button.setAttribute("disabled", true);
        });
        disconnectButton.addEventListener("click", () => {
          disconnectReader(reader);
        });
        break;

      case "enable":
        disconnectButton = document.getElementById(reader.id);
        connectButton = createConnectButton(reader.id);
        disconnectButton.replaceWith(connectButton);
        connectButtons = document.getElementsByClassName("connect-button");
        connectButtons.forEach((button) => {
          button.removeAttribute("disabled");
        });
        connectButton.addEventListener("click", () => {
          connectToReader(reader);
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
    id="secretKeyCardAdditionButton"
    value="Set API secret key"
  />`
      );
  }

  return {
    createAvailableReadersList,
    createSecretKeySetterCard,
    controlConnectButtons,
    deviceHtml,
    addPresetsButtons,
  };
})();
