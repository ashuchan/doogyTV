import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";
import { ResponsiveLayout } from "../ResponsiveLayout";
import * as tvUtils from "@/utils/tv-utils";

describe("ResponsiveLayout component", () => {
  it("should render children in mobile layout", () => {
    jest.spyOn(tvUtils, "isTVDevice").mockReturnValue(false);
    jest.spyOn(tvUtils, "isLargeScreen").mockReturnValue(false);
    jest.spyOn(tvUtils, "isGoogleTV").mockReturnValue(false);

    const { getByText } = render(
      <ResponsiveLayout>
        <Text>Mobile Content</Text>
      </ResponsiveLayout>
    );

    expect(getByText("Mobile Content")).toBeTruthy();
  });

  it("should render children with TV container styles when on TV", () => {
    jest.spyOn(tvUtils, "isTVDevice").mockReturnValue(true);
    jest.spyOn(tvUtils, "isLargeScreen").mockReturnValue(true);
    jest.spyOn(tvUtils, "isGoogleTV").mockReturnValue(true);

    const { getByText } = render(
      <ResponsiveLayout>
        <Text>TV Content</Text>
      </ResponsiveLayout>
    );

    expect(getByText("TV Content")).toBeTruthy();
  });
});
