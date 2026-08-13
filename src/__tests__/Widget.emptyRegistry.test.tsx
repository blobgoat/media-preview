import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Widget } from "../Widget.js";
import { useWidgetContext } from "../context.js";

vi.mock("../context.js", () => ({
  useWidgetContext: vi.fn(),
}));

// Mocks the registry down to zero entries, regardless of whatever .png files actually live in
// src/assets/icons/ right now. This guards the "must work correctly with zero registered icons"
// requirement as a permanent regression check, independent of the repository's current icon
// collection (see prompt.txt's "Real Empty Production Registry" requirement).
vi.mock("../assets/icons/index.js", () => ({
  iconAssets: {},
}));

describe("Widget with a zero-icon registry", () => {
  it("renders without throwing and shows the unresolved-icon hint for any requested name", () => {
    vi.mocked(useWidgetContext).mockReturnValue({
      parameters: { state: "loaded", values: { iconName: "search" } },
      emitEvent: vi.fn(),
    } as unknown as ReturnType<typeof useWidgetContext>);

    expect(() => render(<Widget />)).not.toThrow();

    expect(screen.getByTestId("icon-widget")).toBeInTheDocument();
    expect(screen.queryByTestId("icon-image")).not.toBeInTheDocument();

    const hint = screen.getByTestId("icon-unresolved-hint");
    expect(hint).toHaveTextContent('No icon named "search"');
    expect(hint).toHaveTextContent("No icons registered yet");
  });

  it("renders no icon and no hint when iconName is unset, even with an empty registry", () => {
    vi.mocked(useWidgetContext).mockReturnValue({
      parameters: { state: "loaded", values: { iconName: "" } },
      emitEvent: vi.fn(),
    } as unknown as ReturnType<typeof useWidgetContext>);

    expect(() => render(<Widget />)).not.toThrow();

    expect(screen.getByTestId("icon-widget")).toBeInTheDocument();
    expect(screen.queryByTestId("icon-image")).not.toBeInTheDocument();
    expect(screen.queryByTestId("icon-unresolved-hint")).not.toBeInTheDocument();
  });
});
