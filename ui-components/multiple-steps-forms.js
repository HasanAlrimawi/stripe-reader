const multipleStepsForms = (function () {
  /**
   * @typedef {Object} StepForm
   * @property {string} title Represents what this form represents
   * @property {HTMLElement} form Holds the form HTML element
   */

  /**
   * Creates and returns a multi step form that's composed of the forms passed
   *     then calls the function reponsible for rendering the view wanted after
   *     completing the multi-step form.
   *
   * @param {Array<StepForm>} forms Represents the array of forms to be grouped
   *     in a multi step form
   * @param {function(undefined): undefined} renderNextView Represents function
   *     that is expected to render the view wanted after finishing the multi
   *     step form
   * @returns {HTMLElement} the Multi step form
   */
  const createMultiStepForm = (forms, renderNextView) => {
    let formStepsNum = 0;
    const h1 = document.createElement("h1");
    const progressBar = document.createElement("div");
    const progress = document.createElement("div");
    const progressSteps = [];

    h1.textContent = "Setting up ...";
    h1.classList.add("text-center");

    progressBar.classList.add("progress-bar");

    progress.id = "progress";
    progress.classList.add("progress");
    progressBar.appendChild(progress);

    let elements = [h1, progressBar];
    let previousButtons = [];

    // Adds the forms titles to the progress-bar
    forms.forEach((form, index) => {
      const step = document.createElement("div");
      index === 0
        ? step.classList.add("progress-step-active", "progress-step")
        : step.classList.add("progress-step");
      step.setAttribute("data-title", form.title);
      progressSteps.push(step);
      progressBar.appendChild(step);
    });

    // Adds previous button and the styling for the forms in order to
    // show/hide the form
    forms.forEach((form, index) => {
      const formHolder = document.createElement("div");
      if (index !== 0) {
        formHolder.classList.add("form-step");
        formHolder.appendChild(form.form);
        const prevButton = document.createElement("input");
        prevButton.classList.add("button", "button-previous");
        prevButton.value = "Previous";
        previousButtons.push(prevButton);
        form.form.lastElementChild.insertBefore(
          prevButton,
          form.form.lastElementChild.lastElementChild
        );
        form.form.addEventListener("submit", (e) => {
          formStepsNum++;
          updateFormSteps();
          updateProgressbar();
        });
      } else {
        formHolder.classList.add("form-step", "form-step-active");
        formHolder.appendChild(form.form);
        form.form.addEventListener("submit", (e) => {
          formStepsNum++;
          updateFormSteps();
          updateProgressbar();
        });
      }
      elements.push(formHolder);
    });

    const lastForm = document.createElement("form");
    lastForm.classList.add("form-step");

    const inputGroup = document.createElement("div");
    inputGroup.classList.add("input-group");
    lastForm.appendChild(inputGroup);

    const saveLabel = document.createElement("label");
    saveLabel.classList.add("subtitle");
    saveLabel.textContent = "Entries Saved! You can use the app";
    inputGroup.appendChild(saveLabel);

    const buttonsGroup = document.createElement("div");
    buttonsGroup.classList.add("buttons-group");
    lastForm.appendChild(buttonsGroup);

    const prevButton = document.createElement("input");
    prevButton.classList.add("button", "button-previous");
    prevButton.value = "Previous";
    previousButtons.push(prevButton);
    buttonsGroup.appendChild(prevButton);

    const nextButton = document.createElement("input");
    nextButton.type = "submit";
    nextButton.classList.add("button", "button-next");
    nextButton.value = "Use app";
    buttonsGroup.appendChild(nextButton);

    lastForm.addEventListener("submit", (e) => {
      e.preventDefault();
      formStepsNum++;
      updateProgressbar();
      formStepsNum = 0;
      form.remove();
      renderNextView();
    });

    const step = document.createElement("div");
    step.classList.add("progress-step");
    step.setAttribute("data-title", "Finished");
    progressSteps.push(step);
    progressBar.appendChild(step);
    elements.push(lastForm);

    const form = document.createElement("div");
    form.classList.add("form");
    elements.forEach((element) => {
      form.appendChild(element);
    });

    // creates event listener for all previous buttons
    for (const btn of previousButtons) {
      btn.addEventListener("click", () => {
        formStepsNum--;
        updateFormSteps();
        updateProgressbar();
      });
    }

    // Following functions responsible for showing/hiding forms as well as
    // updating the progress bar
    /**
     * Responsible for updating the progress bar of the multi-step form.
     */
    const updateProgressbar = () => {
      const progressSteps = document.getElementsByClassName("progress-step");
      const progress = document.getElementById("progress");

      [...progressSteps].forEach((progressStep, index) => {
        if (index < formStepsNum + 1) {
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

    /**
     * Responsible for viewing the needed step of the multi-step form.
     */
    const updateFormSteps = () => {
      const formSteps = document.getElementsByClassName("form-step");
      [...formSteps].forEach((formStep) => {
        if (formStep.classList.contains("form-step-active")) {
          formStep.classList.remove("form-step-active");
        }
      });
      formSteps[formStepsNum].classList.add("form-step-active");
    };

    return form;
  };

  return {
    createMultiStepForm,
  };
})();

/**
 * Contains different multi step forms.
 */
export const MULTIPLE_STEPS_FORM_GENERATION = {
  DEFAULT: multipleStepsForms.createMultiStepForm,
};
