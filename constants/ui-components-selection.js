/**
 * @fileoverview This file holds enums holding the keys of the ui components
 * usable, in order to unify the place of their keys to prevent typos and
 * ensure consistency.
 */

export const AuthenticationMethod = Object.freeze({
  API_KEY: "API_KEY",
  USERNAME_AND_PASSWORD: "USERNAME_AND_PASSWORD",
});

export const ReaderSelectionMethod = Object.freeze({
  MANUAL_ENTRY: "MANUAL_ENTRY",
  PICK_FROM_LIST_BY_API: "PICK_FROM_LIST_BY_API",
});

export const MultipleStepsFormSelection = Object.freeze({
  DEFAULT: "DEFAULT",
});
