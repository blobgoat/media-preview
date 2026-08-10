import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Widget } from "../Widget.js";
import { useWidgetContext } from "../context.js";

vi.mock("../context.js", () => ({
  useWidgetContext: vi.fn(),
}));

// Real PNG assets don't exist in the repository yet (see prompt.txt and
// src/assets/icons/index.ts, which ships an empty registry). These tests exercise icon
// resolution against a mocked registry instead of requiring production assets — the real,
// actually-empty registry is covered separately in Widget.realRegistry.test.tsx.
vi.mock("../assets/icons/index.js", () => ({
  iconAssets: {
    search: "/mock/search.png",
    calendar: "/mock/calendar.png",
  },
}));

function mockLoadedParameters(values: Record<string, unknown>) {
  vi.mocked(useWidgetContext).mockReturnValue({
    parameters: { state: "loaded", values },
    emitEvent: vi.fn(),
  } as unknown as ReturnType<typeof useWidgetContext>);
}

describe("Widget", () => {
  it("renders the registered PNG for a valid icon name", () => {
    mockLoadedParameters({ iconName: "search" });

    render(<Widget />);

    const img = screen.getByTestId("icon-image") as HTMLImageElement;
    expect(img.src).toContain("/mock/search.png");
    expect(screen.getAllByTestId("icon-image")).toHaveLength(1);
  });

  it("resolves different icon names to their own PNG rather than a hardcoded image", () => {
    mockLoadedParameters({ iconName: "search" });
    const { unmount } = render(<Widget />);
    expect((screen.getByTestId("icon-image") as HTMLImageElement).src).toContain(
      "/mock/search.png",
    );
    unmount();

    mockLoadedParameters({ iconName: "calendar" });
    render(<Widget />);
    expect((screen.getByTestId("icon-image") as HTMLImageElement).src).toContain(
      "/mock/calendar.png",
    );
  });

  it("renders no icon and no hint, without crashing, when iconName is empty", () => {
    mockLoadedParameters({ iconName: "" });

    render(<Widget />);

    expect(screen.getByTestId("icon-widget")).toBeInTheDocument();
    expect(screen.queryByTestId("icon-image")).not.toBeInTheDocument();
    // Nothing was requested, so — unlike the unregistered-name case below — no hint is shown
    // either; this preserves the "no default icon" behavior for a genuinely unset parameter.
    expect(screen.queryByTestId("icon-unresolved-hint")).not.toBeInTheDocument();
  });

  it("shows an on-widget hint naming the requested icon and the registered alternatives for an unregistered icon name", () => {
    mockLoadedParameters({ iconName: "does-not-exist" });

    render(<Widget />);

    expect(screen.getByTestId("icon-widget")).toBeInTheDocument();
    expect(screen.queryByTestId("icon-image")).not.toBeInTheDocument();

    const hint = screen.getByTestId("icon-unresolved-hint");
    expect(hint).toHaveTextContent('No icon named "does-not-exist"');
    expect(hint).toHaveTextContent("Available: search, calendar");
  });

  it("renders no icon and no hint while widget parameters have not finished loading", () => {
    vi.mocked(useWidgetContext).mockReturnValue({
      parameters: { state: "loading", values: {} },
      emitEvent: vi.fn(),
    } as unknown as ReturnType<typeof useWidgetContext>);

    expect(() => render(<Widget />)).not.toThrow();
    expect(screen.getByTestId("icon-widget")).toBeInTheDocument();
    expect(screen.queryByTestId("icon-image")).not.toBeInTheDocument();
    expect(screen.queryByTestId("icon-unresolved-hint")).not.toBeInTheDocument();
  });

  it("gives the main container the required flex layout contract", () => {
    mockLoadedParameters({ iconName: "" });

    render(<Widget />);

    expect(screen.getByTestId("icon-widget")).toHaveStyle({
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: "100%",
      boxSizing: "border-box",
      overflow: "hidden",
    });
  });

  it("contains the rendered PNG within the widget's available area", () => {
    mockLoadedParameters({ iconName: "search" });

    render(<Widget />);

    expect(screen.getByTestId("icon-image")).toHaveStyle({
      maxWidth: "100%",
      maxHeight: "100%",
      objectFit: "contain",
    });
  });
});
