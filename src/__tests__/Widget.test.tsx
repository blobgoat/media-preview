import { fireEvent, render, screen } from "@testing-library/react";
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

  it("prompts for an icon name, with a real example, when iconName is empty", () => {
    mockLoadedParameters({ iconName: "" });

    render(<Widget />);

    expect(screen.getByTestId("icon-widget")).toBeInTheDocument();
    expect(screen.queryByTestId("icon-image")).not.toBeInTheDocument();
    expect(screen.queryByTestId("icon-unresolved-hint")).not.toBeInTheDocument();

    const emptyHint = screen.getByTestId("icon-empty-hint");
    expect(emptyHint).toHaveTextContent("Enter an icon name to display.");
    // The example is pulled from the real registry rather than hardcoded, so it's always valid.
    expect(emptyHint).toHaveTextContent('Example: "search"');
  });

  it("shows an on-widget hint naming the requested icon for an unregistered icon name", () => {
    mockLoadedParameters({ iconName: "does-not-exist" });

    render(<Widget />);

    expect(screen.getByTestId("icon-widget")).toBeInTheDocument();
    expect(screen.queryByTestId("icon-image")).not.toBeInTheDocument();
    expect(screen.queryByTestId("icon-empty-hint")).not.toBeInTheDocument();

    const hint = screen.getByTestId("icon-unresolved-hint");
    expect(hint).toHaveTextContent('No icon named "does-not-exist"');
  });

  it("prompts for an icon name (not the empty-registry message) while widget parameters have not finished loading", () => {
    vi.mocked(useWidgetContext).mockReturnValue({
      parameters: { state: "loading", values: {} },
      emitEvent: vi.fn(),
    } as unknown as ReturnType<typeof useWidgetContext>);

    expect(() => render(<Widget />)).not.toThrow();
    expect(screen.getByTestId("icon-widget")).toBeInTheDocument();
    expect(screen.queryByTestId("icon-image")).not.toBeInTheDocument();
    expect(screen.getByTestId("icon-empty-hint")).toBeInTheDocument();
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

describe("icon name matching is exact only", () => {
  it("does NOT resolve a name that only differs by case", () => {
    mockLoadedParameters({ iconName: "SEARCH" });

    render(<Widget />);

    expect(screen.queryByTestId("icon-image")).not.toBeInTheDocument();
    expect(screen.getByTestId("icon-unresolved-hint")).toHaveTextContent(
      'No icon named "SEARCH"',
    );
  });

  it("does NOT resolve a partial/substring name", () => {
    mockLoadedParameters({ iconName: "calen" });

    render(<Widget />);

    expect(screen.queryByTestId("icon-image")).not.toBeInTheDocument();
    expect(screen.getByTestId("icon-unresolved-hint")).toHaveTextContent(
      'No icon named "calen"',
    );
  });
});

describe("unresolved-icon suggestions match the typed pattern, not the full list", () => {
  it("suggests only registered names that resemble what was typed", () => {
    mockLoadedParameters({ iconName: "calen" });

    render(<Widget />);

    const hint = screen.getByTestId("icon-unresolved-hint");
    expect(hint).toHaveTextContent("Did you mean: calendar?");
    // "search" doesn't resemble "calen" at all, so it should NOT be suggested — this is the
    // difference from the old behavior, which always listed every registered name.
    expect(hint).not.toHaveTextContent("search");
  });

  it("suggests nothing when no registered name resembles the typed pattern", () => {
    mockLoadedParameters({ iconName: "xyz-nothing-like-that" });

    render(<Widget />);

    const hint = screen.getByTestId("icon-unresolved-hint");
    expect(hint).toHaveTextContent('No icon named "xyz-nothing-like-that"');
    expect(hint).toHaveTextContent("No similar icon names found.");
  });

  it("matches case-insensitively when suggesting", () => {
    mockLoadedParameters({ iconName: "SEARCH-ish" });

    render(<Widget />);

    expect(screen.getByTestId("icon-unresolved-hint")).toHaveTextContent(
      "Did you mean: search?",
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
    expect(fillLayer).toHaveStyle({ transform: "scale(0.8)" });
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

  it("defaults the icon to 70% of the shape's size", () => {
    mockLoadedParameters({ iconName: "search", shape: "circle" });

    render(<Widget />);

    const img = screen.getByTestId("icon-image");
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

  it("anchors the icon near the triangle's base instead of centering it, at the default icon size", () => {
    mockLoadedParameters({ iconName: "search", shape: "triangle" });

    render(<Widget />);

    // iconSize defaults to 70, so left/right stay the usual (100 - 70) / 2 = 15% — only the
    // vertical inset is asymmetric for a triangle: a fixed 10% from the base (bottom) versus
    // 100 - 70 - 10 = 20% from the apex (top), instead of 15%/15% like circle/rectangle.
    const img = screen.getByTestId("icon-image");
    expect(img.parentElement).toHaveStyle({
      top: "20%",
      bottom: "10%",
      left: "15%",
      right: "15%",
    });
  });

  it("keeps the triangle icon's bottom inset fixed while growing the top inset shrinks as iconSizePercent grows, like a line of text growing upward from a fixed baseline", () => {
    mockLoadedParameters({ iconName: "search", shape: "triangle", iconSizePercent: 90 });

    render(<Widget />);

    const img = screen.getByTestId("icon-image");
    expect(img.parentElement).toHaveStyle({
      // Bottom stays pinned at the same 10% regardless of iconSizePercent...
      bottom: "10%",
      // ...while the top inset shrinks toward 0 as the icon grows (100 - 90 - 10 = 0)...
      top: "0%",
      // ...and left/right still shrink symmetrically like every other shape.
      left: "5%",
      right: "5%",
    });
  });

  it("clamps the triangle icon's top inset at 0% instead of going negative when iconSizePercent is large enough that it would otherwise overshoot the fixed base inset", () => {
    mockLoadedParameters({ iconName: "search", shape: "triangle", iconSizePercent: 100 });

    render(<Widget />);

    const img = screen.getByTestId("icon-image");
    expect(img.parentElement).toHaveStyle({ top: "0%", bottom: "10%" });
  });

  it("keeps the triangle's base inset fixed at 10% across different icon sizes, unlike circle/rectangle where all four insets shrink together", () => {
    mockLoadedParameters({ iconName: "search", shape: "triangle", iconSizePercent: 50 });

    render(<Widget />);

    expect(screen.getByTestId("icon-image").parentElement).toHaveStyle({ bottom: "10%" });
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

  it("clips the animated content box (background/shadow/hover-press) to a circle, matching the border/fill shape", () => {
    mockLoadedParameters({ iconName: "search", shape: "circle" });

    render(<Widget />);

    expect(screen.getByTestId("icon-widget-content")).toHaveStyle({
      borderRadius: "50%",
      overflow: "hidden",
    });
  });

  it("clips the animated content box to a triangle via clip-path, matching the border/fill shape", () => {
    mockLoadedParameters({ iconName: "search", shape: "triangle" });

    render(<Widget />);

    expect(screen.getByTestId("icon-widget-content").style.clipPath).toContain(
      "polygon(50% 0%, 0% 100%, 100% 100%)",
    );
  });

  it("does not clip the content box for a rectangle shape (no-op, same as the unclipped default)", () => {
    mockLoadedParameters({ iconName: "search", shape: "rectangle" });

    render(<Widget />);

    const content = screen.getByTestId("icon-widget-content");
    expect(content.style.borderRadius).toBe("");
    expect(content.style.clipPath).toBe("");
    expect(content.style.overflow).toBe("");
  });

  it("does not clip the content box when no shape is set (existing/default structure unchanged)", () => {
    mockLoadedParameters({ iconName: "search" });

    render(<Widget />);

    const content = screen.getByTestId("icon-widget-content");
    expect(content.style.borderRadius).toBe("");
    expect(content.style.clipPath).toBe("");
    expect(content.style.overflow).toBe("");
  });

  it("does not clip the icon image itself — only the content box behind it — so the icon still just centers inside the shape", () => {
    mockLoadedParameters({ iconName: "search", shape: "circle" });

    render(<Widget />);

    const img = screen.getByTestId("icon-image");
    expect(img.style.borderRadius).toBe("");
    expect(img.style.clipPath).toBe("");
    expect(img.parentElement?.style.borderRadius).toBe("");
    expect(img.parentElement?.style.clipPath).toBe("");
  });

  it("clips the content box to the shape even without hoverAnimationEnabled or pressAnimationEnabled (background/shadow still shaped)", () => {
    mockLoadedParameters({ iconName: "search", shape: "circle", backgroundColor: "#eeeeee" });

    render(<Widget />);

    expect(screen.getByTestId("icon-widget-content")).toHaveStyle({
      borderRadius: "50%",
      backgroundColor: "#eeeeee",
    });
  });
});

// Returns the mocked emitEvent function so callers can assert on it, unlike the shared
// mockLoadedParameters() above whose emitEvent mock isn't exposed to the caller.
function mockLoadedParametersWithEmit(values: Record<string, unknown>) {
  const emitEvent = vi.fn();
  vi.mocked(useWidgetContext).mockReturnValue({
    parameters: { state: "loaded", values },
    emitEvent,
  } as unknown as ReturnType<typeof useWidgetContext>);
  return emitEvent;
}

describe("widget background color", () => {
  it("leaves the widget background transparent when backgroundColor is unset", () => {
    mockLoadedParameters({ iconName: "search" });

    render(<Widget />);

    expect(screen.getByTestId("icon-widget-content")).toHaveStyle({
      backgroundColor: "transparent",
    });
  });

  it("applies backgroundColor to the animated content container", () => {
    mockLoadedParameters({ iconName: "search", backgroundColor: "#123456" });

    render(<Widget />);

    expect(screen.getByTestId("icon-widget-content")).toHaveStyle({
      backgroundColor: "#123456",
    });
  });

  it("applies backgroundColor even with no icon resolved (empty-hint state)", () => {
    mockLoadedParameters({ iconName: "", backgroundColor: "#123456" });

    render(<Widget />);

    expect(screen.getByTestId("icon-widget-content")).toHaveStyle({
      backgroundColor: "#123456",
    });
  });
});

describe("widget drop shadow", () => {
  it("has no box shadow when shadowEnabled is unset", () => {
    mockLoadedParameters({ iconName: "search" });

    render(<Widget />);

    expect(screen.getByTestId("icon-widget-content")).toHaveStyle({ boxShadow: "none" });
  });

  it("has no box shadow when shadowEnabled is explicitly false", () => {
    mockLoadedParameters({ iconName: "search", shadowEnabled: false });

    render(<Widget />);

    expect(screen.getByTestId("icon-widget-content")).toHaveStyle({ boxShadow: "none" });
  });

  it("adds a box shadow when shadowEnabled is true", () => {
    mockLoadedParameters({ iconName: "search", shadowEnabled: true });

    render(<Widget />);

    const content = screen.getByTestId("icon-widget-content");
    expect(content).not.toHaveStyle({ boxShadow: "none" });
    expect(content.style.boxShadow).toContain("rgba(0, 0, 0, 0.15)");
  });

  it("deepens the shadow on hover when both shadowEnabled and hoverAnimationEnabled are true", () => {
    mockLoadedParameters({ iconName: "search", shadowEnabled: true, hoverAnimationEnabled: true });

    render(<Widget />);

    const widget = screen.getByTestId("icon-widget");
    const content = screen.getByTestId("icon-widget-content");
    expect(content.style.boxShadow).toContain("rgba(0, 0, 0, 0.15)");

    fireEvent.mouseEnter(widget);
    expect(content.style.boxShadow).toContain("rgba(0, 0, 0, 0.22)");

    fireEvent.mouseLeave(widget);
    expect(content.style.boxShadow).toContain("rgba(0, 0, 0, 0.15)");
  });
});

describe("drop shadow on a triangle (box-shadow doesn't render through clip-path, so this uses filter: drop-shadow instead)", () => {
  it("has no shadow-producing filter when shadowEnabled is unset", () => {
    mockLoadedParameters({ iconName: "search", shape: "triangle" });

    render(<Widget />);

    expect(screen.getByTestId("icon-widget-content")).toHaveStyle({ filter: "none" });
  });

  it("uses filter: drop-shadow(...), not box-shadow, when shadowEnabled is true on a triangle", () => {
    mockLoadedParameters({ iconName: "search", shape: "triangle", shadowEnabled: true });

    render(<Widget />);

    const content = screen.getByTestId("icon-widget-content");
    // box-shadow would be silently clipped away by the triangle's clip-path, so it must be unset
    // here — the visible shadow has to come from `filter` instead.
    expect(content.style.boxShadow).toBe("");
    expect(content.style.filter).toContain("drop-shadow(");
    expect(content.style.filter).toContain("rgba(0, 0, 0, 0.15)");
  });

  it("deepens the drop-shadow filter on hover, same as the box-shadow does for circle/rectangle", () => {
    mockLoadedParameters({
      iconName: "search",
      shape: "triangle",
      shadowEnabled: true,
      hoverAnimationEnabled: true,
    });

    render(<Widget />);

    const widget = screen.getByTestId("icon-widget");
    const content = screen.getByTestId("icon-widget-content");
    expect(content.style.filter).toContain("rgba(0, 0, 0, 0.15)");

    fireEvent.mouseEnter(widget);
    expect(content.style.filter).toContain("rgba(0, 0, 0, 0.22)");

    fireEvent.mouseLeave(widget);
    expect(content.style.filter).toContain("rgba(0, 0, 0, 0.15)");
  });

  it("flattens the drop-shadow filter while pressed, same as the box-shadow does for circle/rectangle", () => {
    mockLoadedParameters({
      iconName: "search",
      shape: "triangle",
      shadowEnabled: true,
      hoverAnimationEnabled: true,
      pressAnimationEnabled: true,
    });

    render(<Widget />);

    const widget = screen.getByTestId("icon-widget");
    const content = screen.getByTestId("icon-widget-content");

    fireEvent.mouseEnter(widget);
    expect(content.style.filter).toContain("rgba(0, 0, 0, 0.22)");

    fireEvent.mouseDown(widget);
    expect(content.style.filter).toContain("rgba(0, 0, 0, 0.15)");
  });

  it("still uses box-shadow (not filter) for circle, since border-radius doesn't have the clip-path shadow problem", () => {
    mockLoadedParameters({ iconName: "search", shape: "circle", shadowEnabled: true });

    render(<Widget />);

    const content = screen.getByTestId("icon-widget-content");
    expect(content.style.boxShadow).toContain("rgba(0, 0, 0, 0.15)");
    expect(content.style.filter).toBe("");
  });
});

describe("hover animation", () => {
  it("does not scale on mouse enter when hoverAnimationEnabled is unset", () => {
    mockLoadedParameters({ iconName: "search" });

    render(<Widget />);

    const widget = screen.getByTestId("icon-widget");
    fireEvent.mouseEnter(widget);

    expect(screen.getByTestId("icon-widget-content")).toHaveStyle({ transform: "scale(1)" });
  });

  it("does not scale on mouse enter when hoverAnimationEnabled is explicitly false", () => {
    mockLoadedParameters({ iconName: "search", hoverAnimationEnabled: false });

    render(<Widget />);

    const widget = screen.getByTestId("icon-widget");
    fireEvent.mouseEnter(widget);

    expect(screen.getByTestId("icon-widget-content")).toHaveStyle({ transform: "scale(1)" });
  });

  it("scales up on mouse enter and back down on mouse leave when hoverAnimationEnabled is true", () => {
    mockLoadedParameters({ iconName: "search", hoverAnimationEnabled: true });

    render(<Widget />);

    const widget = screen.getByTestId("icon-widget");
    const content = screen.getByTestId("icon-widget-content");
    expect(content).toHaveStyle({ transform: "scale(1)" });

    fireEvent.mouseEnter(widget);
    expect(content).toHaveStyle({ transform: "scale(1.04)" });

    fireEvent.mouseLeave(widget);
    expect(content).toHaveStyle({ transform: "scale(1)" });
  });

  it("applies the hover animation regardless of what's currently shown (empty-hint state)", () => {
    mockLoadedParameters({ iconName: "", hoverAnimationEnabled: true });

    render(<Widget />);

    const widget = screen.getByTestId("icon-widget");
    fireEvent.mouseEnter(widget);
    expect(screen.getByTestId("icon-widget-content")).toHaveStyle({ transform: "scale(1.04)" });
  });

  it("keeps the mouse-hover handlers on the outer widget, unaffected by the inner padding/scale", () => {
    mockLoadedParameters({ iconName: "search", hoverAnimationEnabled: true });

    render(<Widget />);

    expect(screen.getByTestId("icon-widget")).toHaveStyle({
      width: "100%",
      height: "100%",
      overflow: "hidden",
    });
  });
});

describe("hover animation padding", () => {
  it("reserves no padding when hoverAnimationEnabled is unset, even if a padding value is given", () => {
    mockLoadedParameters({ iconName: "search", hoverAnimationPaddingPercent: 10 });

    render(<Widget />);

    expect(screen.getByTestId("icon-widget-content")).toHaveStyle({
      top: "0%",
      right: "0%",
      bottom: "0%",
      left: "0%",
    });
  });

  it("defaults to 4% padding on all sides when hoverAnimationEnabled is on but no padding is given", () => {
    mockLoadedParameters({ iconName: "search", hoverAnimationEnabled: true });

    render(<Widget />);

    expect(screen.getByTestId("icon-widget-content")).toHaveStyle({
      top: "4%",
      right: "4%",
      bottom: "4%",
      left: "4%",
    });
  });

  it("honors a custom hoverAnimationPaddingPercent", () => {
    mockLoadedParameters({
      iconName: "search",
      hoverAnimationEnabled: true,
      hoverAnimationPaddingPercent: 15,
    });

    render(<Widget />);

    expect(screen.getByTestId("icon-widget-content")).toHaveStyle({
      top: "15%",
      right: "15%",
      bottom: "15%",
      left: "15%",
    });
  });

  it("falls back to the 4% default for a non-positive padding value", () => {
    mockLoadedParameters({
      iconName: "search",
      hoverAnimationEnabled: true,
      hoverAnimationPaddingPercent: 0,
    });

    render(<Widget />);

    expect(screen.getByTestId("icon-widget-content")).toHaveStyle({ top: "4%" });
  });

  it("keeps the padded content within the outer widget's clipped bounds (overflow: hidden), so a hover scale-up never visually escapes the widget", () => {
    mockLoadedParameters({ iconName: "search", hoverAnimationEnabled: true });

    render(<Widget />);

    expect(screen.getByTestId("icon-widget")).toHaveStyle({ overflow: "hidden" });
    // The animated transform lives on icon-widget-content, a descendant of icon-widget — so
    // icon-widget's own overflow: hidden actually clips it on scale-up (clipping an element's
    // own transform via its own `overflow` doesn't work; only a transformed *descendant's*
    // overflow is clippable by an ancestor, which is why the scale can't live on icon-widget
    // itself).
    expect(screen.getByTestId("icon-widget-content").parentElement).toBe(
      screen.getByTestId("icon-widget"),
    );
  });
});

describe("press animation", () => {
  it("does not scale on mouse down when pressAnimationEnabled is unset", () => {
    mockLoadedParameters({ iconName: "search" });

    render(<Widget />);

    fireEvent.mouseDown(screen.getByTestId("icon-widget"));

    expect(screen.getByTestId("icon-widget-content")).toHaveStyle({ transform: "scale(1)" });
  });

  it("does not scale on mouse down when pressAnimationEnabled is explicitly false", () => {
    mockLoadedParameters({ iconName: "search", pressAnimationEnabled: false });

    render(<Widget />);

    fireEvent.mouseDown(screen.getByTestId("icon-widget"));

    expect(screen.getByTestId("icon-widget-content")).toHaveStyle({ transform: "scale(1)" });
  });

  it("scales down on mouse down and back up on mouse up when pressAnimationEnabled is true", () => {
    mockLoadedParameters({ iconName: "search", pressAnimationEnabled: true });

    render(<Widget />);

    const widget = screen.getByTestId("icon-widget");
    const content = screen.getByTestId("icon-widget-content");
    expect(content).toHaveStyle({ transform: "scale(1)" });

    fireEvent.mouseDown(widget);
    expect(content).toHaveStyle({ transform: "scale(0.96)" });

    fireEvent.mouseUp(widget);
    expect(content).toHaveStyle({ transform: "scale(1)" });
  });

  it("reverts the press if the mouse leaves the widget before mouse up (e.g. pressed then dragged away)", () => {
    mockLoadedParameters({ iconName: "search", pressAnimationEnabled: true });

    render(<Widget />);

    const widget = screen.getByTestId("icon-widget");
    const content = screen.getByTestId("icon-widget-content");

    fireEvent.mouseDown(widget);
    expect(content).toHaveStyle({ transform: "scale(0.96)" });

    fireEvent.mouseLeave(widget);
    expect(content).toHaveStyle({ transform: "scale(1)" });
  });

  it("shows the press scale, not the hover scale, when both are enabled and the widget is pressed while hovered", () => {
    mockLoadedParameters({
      iconName: "search",
      hoverAnimationEnabled: true,
      pressAnimationEnabled: true,
    });

    render(<Widget />);

    const widget = screen.getByTestId("icon-widget");
    const content = screen.getByTestId("icon-widget-content");

    fireEvent.mouseEnter(widget);
    expect(content).toHaveStyle({ transform: "scale(1.04)" });

    fireEvent.mouseDown(widget);
    expect(content).toHaveStyle({ transform: "scale(0.96)" });

    // Releasing without leaving falls back to the still-active hover state.
    fireEvent.mouseUp(widget);
    expect(content).toHaveStyle({ transform: "scale(1.04)" });
  });

  it("falls back to the resting (non-hover) shadow while pressed, even if shadowEnabled and hoverAnimationEnabled are both on", () => {
    mockLoadedParameters({
      iconName: "search",
      shadowEnabled: true,
      hoverAnimationEnabled: true,
      pressAnimationEnabled: true,
    });

    render(<Widget />);

    const widget = screen.getByTestId("icon-widget");
    const content = screen.getByTestId("icon-widget-content");

    fireEvent.mouseEnter(widget);
    expect(content.style.boxShadow).toContain("rgba(0, 0, 0, 0.22)");

    fireEvent.mouseDown(widget);
    expect(content.style.boxShadow).toContain("rgba(0, 0, 0, 0.15)");
  });

  it("applies the press animation regardless of what's currently shown (empty-hint state)", () => {
    mockLoadedParameters({ iconName: "", pressAnimationEnabled: true });

    render(<Widget />);

    const widget = screen.getByTestId("icon-widget");
    fireEvent.mouseDown(widget);
    expect(screen.getByTestId("icon-widget-content")).toHaveStyle({ transform: "scale(0.96)" });
  });
});

describe("click event", () => {
  it("emits iconClicked with no parameter updates when the widget is clicked", () => {
    const emitEvent = mockLoadedParametersWithEmit({ iconName: "search" });

    render(<Widget />);

    fireEvent.click(screen.getByTestId("icon-widget"));

    expect(emitEvent).toHaveBeenCalledTimes(1);
    expect(emitEvent).toHaveBeenCalledWith("iconClicked", { parameterUpdates: {} });
  });

  it("still emits iconClicked when clicked in the empty-hint state (no icon resolved)", () => {
    const emitEvent = mockLoadedParametersWithEmit({ iconName: "" });

    render(<Widget />);

    fireEvent.click(screen.getByTestId("icon-widget"));

    expect(emitEvent).toHaveBeenCalledWith("iconClicked", { parameterUpdates: {} });
  });

  it("still emits iconClicked when clicked in the unresolved-hint state", () => {
    const emitEvent = mockLoadedParametersWithEmit({ iconName: "does-not-exist" });

    render(<Widget />);

    fireEvent.click(screen.getByTestId("icon-widget"));

    expect(emitEvent).toHaveBeenCalledWith("iconClicked", { parameterUpdates: {} });
  });
});
