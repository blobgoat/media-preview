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
  it("renders an actual registered PNG for a real icon name", () => {
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

  it("shows the unresolved-icon hint, listing real registered names, for an unknown name", () => {
    mockLoadedParameters({ iconName: "does-not-exist" });

    render(<Widget />);

    expect(screen.queryByTestId("icon-image")).not.toBeInTheDocument();
    const hint = screen.getByTestId("icon-unresolved-hint");
    expect(hint).toHaveTextContent('No icon named "does-not-exist"');
    // Spot-check a couple of the real filenames rather than asserting exact list order, since
    // that order comes from import.meta.glob and isn't part of this widget's contract.
    expect(hint).toHaveTextContent("ambulence");
    expect(hint).toHaveTextContent("cherry");
  });

  it("renders no icon and no hint when iconName is unset", () => {
    mockLoadedParameters({ iconName: "" });

    render(<Widget />);

    expect(screen.getByTestId("icon-widget")).toBeInTheDocument();
    expect(screen.queryByTestId("icon-image")).not.toBeInTheDocument();
    expect(screen.queryByTestId("icon-unresolved-hint")).not.toBeInTheDocument();
  });
});
