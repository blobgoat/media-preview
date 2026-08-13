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

  it("scales the PNG to fill the widget's available area while preserving its aspect ratio", () => {
    mockLoadedParameters({ iconName: "search" });

    render(<Widget />);

    expect(screen.getByTestId("icon-image")).toHaveStyle({
      width: "100%",
      height: "100%",
      objectFit: "contain",
    });
  });
});

describe("icon name search fallback", () => {
  it("resolves a case-insensitive exact match", () => {
    mockLoadedParameters({ iconName: "SEARCH" });

    render(<Widget />);

    expect((screen.getByTestId("icon-image") as HTMLImageElement).src).toContain(
      "/mock/search.png",
    );
  });

  it("resolves a substring match when there's no exact match", () => {
    mockLoadedParameters({ iconName: "calen" });

    render(<Widget />);

    expect((screen.getByTestId("icon-image") as HTMLImageElement).src).toContain(
      "/mock/calendar.png",
    );
  });

  it("still shows the hint when nothing matches even via substring search", () => {
    mockLoadedParameters({ iconName: "xyz-nothing-like-that" });

    render(<Widget />);

    expect(screen.queryByTestId("icon-image")).not.toBeInTheDocument();
    expect(screen.getByTestId("icon-unresolved-hint")).toHaveTextContent(
      'No icon named "xyz-nothing-like-that"',
    );
  });
});

describe("icon recoloring", () => {
  it("keeps the PNG's original colors (plain <img>) when iconColor is not set", () => {
    mockLoadedParameters({ iconName: "search" });

    render(<Widget />);

    expect(screen.getByTestId("icon-image").tagName).toBe("IMG");
  });

  it("recolors the icon via a CSS mask when iconColor is set", () => {
    mockLoadedParameters({ iconName: "search", iconColor: "#ff0000" });

    render(<Widget />);

    const el = screen.getByTestId("icon-image");
    expect(el.tagName).toBe("DIV");
    expect(el).toHaveStyle({ backgroundColor: "#ff0000" });
    expect(
      el.style.maskImage || el.style.getPropertyValue("-webkit-mask-image"),
    ).toContain("/mock/search.png");
  });
});

describe("shape around the icon", () => {
  it("renders no shape wrapper when shape is unset", () => {
    mockLoadedParameters({ iconName: "search" });

    render(<Widget />);

    expect(screen.queryByTestId("icon-shape")).not.toBeInTheDocument();
  });

  it("renders no shape wrapper for an unrecognized shape value", () => {
    mockLoadedParameters({ iconName: "search", shape: "hexagon" });

    render(<Widget />);

    expect(screen.queryByTestId("icon-shape")).not.toBeInTheDocument();
  });

  it("recognizes shape values case-insensitively and trims whitespace", () => {
    mockLoadedParameters({ iconName: "search", shape: "  TRIANGLE  " });

    render(<Widget />);

    expect(screen.getByTestId("icon-shape")).toHaveAttribute("data-shape", "triangle");
  });

  it("wraps the icon in a circle with the requested fill and border colors", () => {
    mockLoadedParameters({
      iconName: "search",
      shape: "circle",
      shapeFillColor: "#eeeeee",
      shapeBorderColor: "#333333",
    });

    render(<Widget />);

    expect(screen.getByTestId("icon-shape")).toHaveAttribute("data-shape", "circle");
    expect(screen.getByTestId("icon-shape-border")).toHaveStyle({
      backgroundColor: "#333333",
      borderRadius: "50%",
    });
    expect(screen.getByTestId("icon-shape-fill")).toHaveStyle({
      backgroundColor: "#eeeeee",
      borderRadius: "50%",
    });
    expect(screen.getByTestId("icon-image")).toBeInTheDocument();
  });

  it("draws the border as a uniform inward scale, not a fixed px inset, so it can never render outside the shape regardless of aspect ratio (e.g. a wide/short triangle)", () => {
    mockLoadedParameters({
      iconName: "search",
      shape: "triangle",
      shapeBorderColor: "#333333",
      shapeBorderThickness: 10,
    });

    render(<Widget />);

    const fillLayer = screen.getByTestId("icon-shape-fill");
    // scale(0.8) == 1 - 2*10% — a uniform scale-from-center of a convex shape (like this
    // triangle) about an interior point is always strictly contained within the unscaled
    // original, for any box aspect ratio. A fixed-px top/right/bottom/left inset does not have
    // that guarantee for a triangle, which is what caused the fill triangle to poke outside the
    // border triangle on non-square widgets before this fix.
    expect(fillLayer).toHaveStyle({ transform: "scale(0.8)" });
    // No per-edge inset is used for the fill layer at all anymore.
    expect(fillLayer.style.top).toBe("0px");
    expect(fillLayer.style.left).toBe("0px");
  });

  it("defaults border thickness to 8% when a border color is set but shapeBorderThickness isn't", () => {
    mockLoadedParameters({
      iconName: "search",
      shape: "rectangle",
      shapeBorderColor: "#000000",
    });

    render(<Widget />);

    expect(screen.getByTestId("icon-shape-fill")).toHaveStyle({ transform: "scale(0.84)" });
  });

  it("doesn't scale down the fill layer at all when no border color is set", () => {
    mockLoadedParameters({
      iconName: "search",
      shape: "rectangle",
      shapeFillColor: "#eeeeee",
    });

    render(<Widget />);

    expect(screen.getByTestId("icon-shape-fill")).toHaveStyle({ transform: "scale(1)" });
  });

  it("defaults the icon to 70% of the shape's size, growing beyond the old cramped default", () => {
    mockLoadedParameters({ iconName: "search", shape: "circle" });

    render(<Widget />);

    const img = screen.getByTestId("icon-image");
    // 70% icon size => (100-70)/2 = 15% inset on each side of the shape.
    expect(img.parentElement).toHaveStyle({
      top: "15%",
      right: "15%",
      bottom: "15%",
      left: "15%",
    });
  });

  it("lets iconSizePercent make the icon fill more (or less) of the shape", () => {
    mockLoadedParameters({ iconName: "search", shape: "circle", iconSizePercent: 90 });

    render(<Widget />);

    const img = screen.getByTestId("icon-image");
    expect(img.parentElement).toHaveStyle({
      top: "5%",
      right: "5%",
      bottom: "5%",
      left: "5%",
    });
  });

  it("never renders a shape when there is no icon to show (blank stays blank)", () => {
    mockLoadedParameters({ iconName: "", shape: "circle", shapeFillColor: "#eeeeee" });

    render(<Widget />);

    expect(screen.getByTestId("icon-widget")).toBeInTheDocument();
    expect(screen.queryByTestId("icon-shape")).not.toBeInTheDocument();
    expect(screen.queryByTestId("icon-image")).not.toBeInTheDocument();
  });

  it("never renders a shape around the unresolved-icon hint", () => {
    mockLoadedParameters({ iconName: "does-not-exist", shape: "circle" });

    render(<Widget />);

    expect(screen.getByTestId("icon-unresolved-hint")).toBeInTheDocument();
    expect(screen.queryByTestId("icon-shape")).not.toBeInTheDocument();
  });
});
