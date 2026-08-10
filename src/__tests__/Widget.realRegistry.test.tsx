import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Widget } from "../Widget.js";
import { useWidgetContext } from "../context.js";

// Deliberately does NOT mock "../assets/icons/index.js" — this exercises the real production
// registry (src/assets/icons/index.ts), which ships empty until real PNG assets are added later.
// See prompt.txt's "Testing an Empty Production Registry" / "Real Empty Production Registry"
// requirements: the widget must work correctly with zero registered icons, without requiring a
// production PNG just to make a test pass.
vi.mock("../context.js", () => ({
  useWidgetContext: vi.fn(),
}));

describe("Widget with the real (empty) production icon registry", () => {
  it("renders without throwing and shows the unresolved-icon hint for any requested name", () => {
    vi.mocked(useWidgetContext).mockReturnValue({
      parameters: { state: "loaded", values: { iconName: "search" } },
      emitEvent: vi.fn(),
    } as unknown as ReturnType<typeof useWidgetContext>);

    expect(() => render(<Widget />)).not.toThrow();

    expect(screen.getByTestId("icon-widget")).toBeInTheDocument();
    expect(screen.queryByTestId("icon-image")).not.toBeInTheDocument();

    // With zero registered icons, the hint should say so rather than listing an empty
    // "Available:" line.
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
