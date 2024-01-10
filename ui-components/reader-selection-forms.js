import { HTMLElementsIds } from "../constants/elements-ids.js";
import { ReaderSelectionMethod } from "../constants/ui-components-selection.js";

const readerChoosingForms = (function () {
  /**
   * Shows a form for the user to enter the reader model and serial number
   *     in order for the driver to save and use it in transactions.
   *
   * @param {function(string): undefined} saveReader The function responsible
   *     for saving the new reader
   * @param {?string} usedReader Represents the reader that is under use
   *     by the driver
   * @returns {HTMLElement} Form for the user to enter the reader details
   */
  const manual = (saveReader, usedReader) => {
    const form = document.createElement("form");
    const deviceNameLabel = document.createElement("label");
    const deviceNameInput = document.createElement("input");
    const submitButton = document.createElement("input");
    const buttonsWrapper = document.createElement("div");

    form.setAttribute("id", "payment-device-form");
    form.setAttribute("class", "input-group");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      saveReader(deviceNameInput.value);
      submitButton.setAttribute("disabled", true);
      submitButton.value = "Saved successfully";
      setTimeout(() => {
        document.getElementById(HTMLElementsIds.CURRENT_MODAL_SHOWN)?.remove();
        submitButton.removeAttribute("disabled");
        submitButton.value = "Save";
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
    buttonsWrapper.classList.add("buttons-group");

    buttonsWrapper.appendChild(submitButton);
    form.appendChild(deviceNameLabel);
    form.appendChild(deviceNameInput);
    form.appendChild(buttonsWrapper);

    if (usedReader) {
      deviceNameInput.value = usedReader;
    }
    return form;
  };

  /**
   * Uses the driver selected method getReadersAvailable to list the available
   *     readers so that the user chooses the reader he/she wants.
   *
   * @param {function(string): undefined} saveReader The function responsible
   *     for saving the new reader
   * @param {?string} usedReaderId Represents the reader that is already
   *     under use
   * @param {function(): object} getReaders The function that calls API that
   *     retrieves the readers registered to the account used
   * @returns {HTMLElement} The form that will show the list of readers
   *     to choose from
   */
  const pickFromListByAPI = (saveReader, usedReaderId, getReaders) => {
    const form = document.createElement("form");
    const submitButton = document.createElement("input");
    const subtitle = document.createElement("span");
    const listReadersButton = document.createElement("input");
    const readersHolderElement = document.createElement("section");
    const buttonsWrapper = document.createElement("div");
    let readerSelected;

    listReadersButton.addEventListener("click", async () => {
      readersHolderElement.innerHTML = "";
      listReadersButton.setAttribute("disabled", true);
      listReadersButton.value = "Getting readers...";

      getReaders()
        .then((availableReaders) => {
          listReadersButton.value = "List readers registered";
          listReadersButton.removeAttribute("disabled");
          if (availableReaders?.error) {
            console.log();
            alert(availableReaders.error.message);
          }

          if (availableReaders.data) {
            for (const reader of availableReaders.data) {
              const readerWrapper = document.createElement("div");
              const readerLabel = document.createElement("label");
              const useReaderButton = createUseReaderButton(reader.id);

              if (usedReaderId == reader.id) {
                useReaderButton.setAttribute("value", "Chosen");
                readerSelected = usedReaderId;
                submitButton.removeAttribute("disabled");
              }
              useReaderButton.addEventListener("click", () => {
                document
                  .querySelectorAll(".connect-button")
                  .forEach((connectButton) => {
                    connectButton.setAttribute("value", "Select");
                  });
                useReaderButton.value = "Chosen";
                submitButton.removeAttribute("disabled");
                readerSelected = reader.id;
              });

              readerWrapper.setAttribute("class", "vertical-wrapper");
              readerLabel.textContent = reader.label;

              readerWrapper.appendChild(readerLabel);
              readerWrapper.appendChild(useReaderButton);
              readersHolderElement.appendChild(readerWrapper);
            }
          }
        })
        .catch((err) => {
          listReadersButton.value = "List readers registered";
          listReadersButton.removeAttribute("disabled");
          if (err == "TypeError: Failed to fetch") {
            alert("Check your internet connection and try again.");
          } else {
            alert("error occured, try again later");
          }
        });
    });

    submitButton.setAttribute("type", "submit");
    submitButton.setAttribute("class", "button ml-auto");
    submitButton.setAttribute("id", "device-details-button");
    submitButton.setAttribute("value", "Save");
    submitButton.setAttribute("disabled", true);

    subtitle.classList.add("subtitle");
    subtitle.textContent = "Reader selection";
    form.setAttribute("class", "input-group");
    readersHolderElement.setAttribute("class", "card");
    readersHolderElement.innerHTML = "";
    listReadersButton.setAttribute("class", "button");
    listReadersButton.setAttribute("type", "button");
    listReadersButton.setAttribute("value", "List readers registered");
    listReadersButton.setAttribute("id", "list-readers-btn");
    buttonsWrapper.classList.add("buttons-group");

    buttonsWrapper.appendChild(submitButton);
    form.appendChild(subtitle);
    form.appendChild(listReadersButton);
    form.appendChild(readersHolderElement);
    form.appendChild(buttonsWrapper);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitButton.setAttribute("disabled", true);
      saveReader(readerSelected);
      submitButton.value = "Saved Successfully";
      setTimeout(() => {
        submitButton.removeAttribute("disabled");
        submitButton.value = "Save";
        document.getElementById(HTMLElementsIds.CURRENT_MODAL_SHOWN)?.remove();
      }, 1500);
    });
    return form;
  };

  /**
   * Creates HTML select button with event listener to select to the wanted
   *     reader when selected.
   *
   * @param {string} readerId Represents the id to be given for the selection
   *     button
   * @returns {HTMLElement}
   */
  function createUseReaderButton(readerId) {
    const useReaderButton = document.createElement("input");
    useReaderButton.setAttribute("id", readerId);
    useReaderButton.setAttribute("value", "Select");
    useReaderButton.setAttribute("class", "connect-button button");
    useReaderButton.setAttribute("type", "button");
    return useReaderButton;
  }

  return {
    manual,
    pickFromListByAPI,
  };
})();

/**
 * Contains readers selection methods accompanied with their forms
 */
export const ReaderSelectionForms = {
  [ReaderSelectionMethod.MANUAL_ENTRY]: readerChoosingForms.manual,
  [ReaderSelectionMethod.PICK_FROM_LIST_BY_API]:
    readerChoosingForms.pickFromListByAPI,
};
