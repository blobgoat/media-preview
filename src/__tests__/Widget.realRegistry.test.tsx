import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Widget } from "../Widget.js";
import { useWidgetContext } from "../context.js";

// Deliberately does NOT mock "../assets/icons/index.js" — this exercises the real production
// registry (src/assets/icons/index.ts), which is auto-generated from the actual .png files in
// src/assets/icons/. See prompt.txt's "Testing an Empty Production Registry" intent, adapted
// now that real icon files exist in the repository: this file covers the real, current registry
// state; Widget.emptyRegistry.test.tsx separately guards the zero-icons case with a mock.
vi.mock("../context.js", () => ({
  useWidgetContext: vi.fn(),
}));

function mockLoadedParameters(values: Record<string, unknown>) {
  vi.mocked(useWidgetContext).mockReturnValue({
    parameters: { state: "loaded", values },
    emitEvent: vi.fn(),
  } as unknown as ReturnType<typeof useWidgetContext>);
}

describe("Widget with the real production icon registry", () => {
  it("renders an actual registered PNG for a real icon name (exact match)", () => {
    mockLoadedParameters({ iconName: "ambulence" });

    render(<Widget />);

    const img = screen.getByTestId("icon-image") as HTMLImageElement;
    expect(img.src).toContain("ambulence");
    expect(img.src).toMatch(/\.png($|\?)/);
  });

  it("resolves a different real icon name to a different PNG", () => {
    mockLoadedParameters({ iconName: "cherry" });

    render(<Widget />);

    const img = screen.getByTestId("icon-image") as HTMLImageElement;
    expect(img.src).toContain("cherry");
  });

  it("does not resolve a real icon name that only differs by case", () => {
    mockLoadedParameters({ iconName: "Ambulence" });

    render(<Widget />);

    expect(screen.queryByTestId("icon-image")).not.toBeInTheDocument();
    expect(screen.getByTestId("icon-unresolved-hint")).toHaveTextContent(
      'No icon named "Ambulence"',
    );
  });

  it("shows the unresolved-icon hint for an unknown name with no resembling registered names", () => {
    mockLoadedParameters({ iconName: "does-not-exist" });

    render(<Widget />);

    expect(screen.queryByTestId("icon-image")).not.toBeInTheDocument();
    const hint = screen.getByTestId("icon-unresolved-hint");
    expect(hint).toHaveTextContent('No icon named "does-not-exist"');
    expect(hint).toHaveTextContent("No similar icon names found.");
  });

  it("suggests a real registered name that resembles a near-miss", () => {
    // "ambulance" (correct spelling) doesn't exactly match the registered "ambulence" (the
    // actual filename), but should still surface as a suggestion.
    mockLoadedParameters({ iconName: "amb" });

    render(<Widget />);

    expect(screen.queryByTestId("icon-image")).not.toBeInTheDocument();
    expect(screen.getByTestId("icon-unresolved-hint")).toHaveTextContent(
      "Did you mean: ambulence?",
    );
  });

  it("prompts for an icon name, with a real example, when iconName is unset", () => {
    mockLoadedParameters({ iconName: "" });

    render(<Widget />);

    expect(screen.getByTestId("icon-widget")).toBeInTheDocument();
    expect(screen.queryByTestId("icon-image")).not.toBeInTheDocument();
    expect(screen.queryByTestId("icon-unresolved-hint")).not.toBeInTheDocument();

    const emptyHint = screen.getByTestId("icon-empty-hint");
    expect(emptyHint).toHaveTextContent("Enter an icon name to display.");
    // Don't assert exactly which name is used as the example — import.meta.glob's key order
    // isn't part of this widget's contract — just that a real, quoted example is shown.
    expect(emptyHint.textContent).toMatch(/Example: ".+"/);
  });
});
