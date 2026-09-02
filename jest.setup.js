/* global jest */
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

const rn = require("react-native");
if (!rn.TVEventHandler) {
  Object.defineProperty(rn, "TVEventHandler", {
    value: class MockTVEventHandler {
      enable = jest.fn();
      disable = jest.fn();
    },
    configurable: true,
    writable: true,
  });
}
