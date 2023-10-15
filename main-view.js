export const stripeReaderView = (function () {
  const addReader = function (themeUsed) {
    return `
        <div class="vertical-wrapper">
            <label>SIMULATOR</label>
            <custom-button value="Connect"></custom-button>
        </div>`;
  };

  /**
   * Creates an HTML element that holds a reader available for use.
   *
   * @param {string} readerName
   * @returns HTMLElement
   */
  const createAvailableReaderElement = function (readerName) {
    const readerWrapper = document.createElement("div");
    const readerLabel = document.createElement("label");
    const connectButton = createConnectButton(readerName);

    readerWrapper.setAttribute("class", "vertical-wrapper");
    readerLabel.textContent = readerName;

    readerWrapper.appendChild(readerLabel);
    readerWrapper.appendChild(connectButton);
    return readerWrapper;
  };

  /**
   * Creates HTML disconnect button with event listener to disconnect the already
   *     connected reader when selected.
   *
   * @param {string} readerName Represents the name to be given for the reader
   * @returns {HTMLElement}
   */
  function createDisconnectButton(readerName) {
    const disconnectButton = document.createElement("input");
    disconnectButton.setAttribute("id", readerName);
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
  function createConnectButton(readerName) {
    const connectButton = document.createElement("input");
    connectButton.setAttribute("id", readerName);
    connectButton.setAttribute("value", "Connect");
    connectButton.setAttribute("class", "connect-button button");
    connectButton.setAttribute("type", "button");
    return connectButton;
  }

  return {
    addReader,
    createAvailableReaderElement,
    createDisconnectButton,
    createConnectButton,
  };
})();
