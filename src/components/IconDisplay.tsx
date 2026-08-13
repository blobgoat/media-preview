import React, { useState } from "react";
import { iconAssets } from "../assets/icons/index.js";

export interface IconDisplayProps {
  /** Key into the repository's icon registry (src/assets/icons/index.ts). Must match exactly. */
  iconName?: string;
  /** CSS color to recolor the icon to. Blank/unset keeps the PNG's own original colors. */
  iconColor?: string;
  /**
   * "circle" | "triangle" | "rectangle" (case-insensitive). Anything else (or blank) = no shape,
   * matching the existing/default structure. In addition to drawing the border/fill backdrop
   * behind the icon, this also clips the widget's own animated content box — the element that
   * carries backgroundColor, the shadow, and the hover/press scale (see hoverAnimationEnabled /
   * pressAnimationEnabled) — to this same shape, so the click-down and hover affordance itself
   * reads as a circle/triangle rather than a rectangle around a circular/triangular icon.
   * "rectangle" is a no-op clip, so it (and leaving this unset) both fall back to the same
   * unclipped rectangular content box.
   */
  shape?: string;
  /** Fill color for the shape. Blank/unset = transparent fill. */
  shapeFillColor?: string;
  /** Border color for the shape. Blank/unset = no border. */
  shapeBorderColor?: string;
  /**
   * Border thickness as a PERCENTAGE of the shape's own size (not px) — e.g. 8 means the
   * border eats about 8% off each edge. Defaults to 8 when shapeBorderColor is set but this
   * isn't.
   *
   * This is a percentage rather than a fixed pixel value on purpose: the border is drawn as a
   * uniform inward *scale* of the shape (see `fillScale` below), which is the only approach
   * that's geometrically guaranteed to stay inside the outer shape for every shape/aspect ratio
   * combination, including a triangle in a non-square widget. A fixed px inset applied
   * independently to each edge does NOT have that guarantee for a triangle — on a wide/short
   * widget, the inner (fill) triangle's corners end up outside the outer (border) triangle's
   * slanted edges, since insetting a box by the same px amount on all sides changes a
   * non-square triangle's proportions. A percentage-based uniform scale sidesteps that entirely.
   */
  shapeBorderThickness?: number;
  /**
   * How much of the shape's box the icon itself should occupy, as a percentage (e.g. 70 = the
   * icon fills 70% of the shape, leaving margin around it so the shape reads as a backdrop).
   * Only applies when a shape is set — without a shape the icon already fills 100% of the
   * widget. Defaults to 70 when a shape is set but this isn't.
   *
   * For circle/rectangle, that margin is split evenly on all four sides (the icon grows outward
   * from the center as this increases). For triangle, the icon is instead anchored to a fixed
   * inset from the base, and grows upward from there as this increases — the same way a line of
   * text grows upward from a fixed baseline as its font size increases — since a triangle's
   * usable width is widest near its base and narrows toward the apex, so centering the icon in
   * the full bounding box (like the other shapes) would leave it floating above empty space.
   */
  iconSizePercent?: number;
  /** CSS color for the widget's own background. Blank/unset = transparent. */
  backgroundColor?: string;
  /**
   * Adds a drop shadow around the whole widget; deepens slightly on hover if that's enabled.
   * Rendered as `box-shadow` normally, but as `filter: drop-shadow(...)` when `shape` is
   * "triangle" — `box-shadow` is silently clipped away by the `clip-path` a triangle needs,
   * while a filter isn't. Either way it looks the same; this is purely an implementation detail.
   */
  shadowEnabled?: boolean;
  /** Scales the widget up slightly on mouse hover. Independent of onWidgetClick. */
  hoverAnimationEnabled?: boolean;
  /**
   * Percentage of the widget's own box reserved as empty padding around the animated content, so
   * the hover scale-up (see hoverAnimationEnabled) has room to grow into instead of visually
   * spilling past the widget's allocated area. Only applies when hoverAnimationEnabled is true —
   * ignored otherwise. Defaults to 4 when hover animation is on but this isn't set.
   */
  hoverAnimationPaddingPercent?: number;
  /**
   * Scales the widget down slightly while the mouse button is held down on it. Independent of
   * hoverAnimationEnabled and onWidgetClick — a press can be animated even if hover isn't, and
   * vice versa. When both a hover and a press are active at once (e.g. pressing while already
   * hovering), the press take precedence, matching the usual "active state wins" convention.
   */
  pressAnimationEnabled?: boolean;
  /** Called on click anywhere in the widget, regardless of what's currently displayed. */
  onWidgetClick?: () => void;
}

const SHAPE_CLIP_STYLES: Record<string, React.CSSProperties> = {
  circle: { borderRadius: "50%" },
  rectangle: {},
  triangle: { clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" },
};

const DEFAULT_SHAPE_BORDER_THICKNESS_PERCENT = 8;
const DEFAULT_ICON_SIZE_PERCENT_WITH_SHAPE = 70;
// Fixed inset from the triangle's base the icon is anchored to, regardless of iconSizePercent —
// see the "anchor the icon's bottom edge" comment where this is used.
const TRIANGLE_BASE_INSET_PERCENT = 10;
// The hover scale factor below (1.04) grows the animated content by ~2% per side, so 4% of
// padding on each side comfortably covers that growth with a little room to spare.
const DEFAULT_HOVER_ANIMATION_PADDING_PERCENT = 4;
const HOVER_SCALE = "scale(1.04)";
const PRESS_SCALE = "scale(0.96)";

function normalizeShapeKey(shape: string | undefined): string | undefined {
  const key = shape?.trim().toLowerCase();
  return key && key in SHAPE_CLIP_STYLES ? key : undefined;
}

function clampPercent(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return Math.min(value, 100);
}

// Looks up `iconName` in the repository's PNG icon registry. This is an EXACT, case-sensitive
// match only — no normalization or fuzzy resolution. An unmatched name never falls back to a
// substitute icon; see prompt.txt's "No Default Icon" and "Invalid Icon Names" requirements.
// (Fuzzy/substring matching is used only to build "did you mean" suggestions in the unresolved
// hint below — never to decide what actually renders.)
function getIconAsset(iconName: string | undefined): string | undefined {
  if (!iconName) {
    return undefined;
  }
  return iconAssets[iconName];
}

// Finds registered icon names that resemble `pattern` — a case-insensitive substring match in
// either direction (the registered name contains the typed text, or the typed text contains the
// registered name), e.g. typing "ambul" or "AMBULENCE" both surface "ambulence". Used only to
// populate "did you mean" suggestions when there's no exact match; it never affects what
// actually renders. Sorted shortest-name-first, then alphabetically, for a stable order.
export function findSimilarIconNames(pattern: string, availableNames: string[]): string[] {
  const lower = pattern.toLowerCase();
  return availableNames
    .filter((name) => {
      const nameLower = name.toLowerCase();
      return nameLower.includes(lower) || lower.includes(nameLower);
    })
    .sort((a, b) => a.length - b.length || a.localeCompare(b));
}

// Renders the resolved icon (if any) inside a flex container that fills and centers within its
// available space.
//
// Three distinct states depending on `iconName`:
//   - not supplied at all: instructs the Workshop author to enter one, with a real example
//     pulled from the registry so it's always valid.
//   - supplied but no EXACT match in the registry: names the requested value and, if any
//     registered names resemble it, suggests them ("did you mean") — without guessing or
//     rendering a substitute icon.
//   - supplied and matches exactly: renders it, optionally recolored and/or inside a shape.
// A shape is only ever drawn around an actually-resolved icon, never around either hint state.
export const IconDisplay: React.FC<IconDisplayProps> = ({
  iconName,
  iconColor,
  shape,
  shapeFillColor,
  shapeBorderColor,
  shapeBorderThickness,
  iconSizePercent,
  backgroundColor,
  shadowEnabled,
  hoverAnimationEnabled,
  hoverAnimationPaddingPercent,
  onWidgetClick,
}) => {
  const iconSrc = getIconAsset(iconName);
  const wasRequested = Boolean(iconName);
  const availableNames = Object.keys(iconAssets);
  const shapeKey = normalizeShapeKey(shape);

  // Hover/press are tracked in state rather than CSS `:hover`/`:active` because every other
  // style in this component is a plain inline style object (no stylesheet/class to attach a
  // pseudo-selector to) — see the rest of the file for that convention.
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const isHoverAnimating = Boolean(hoverAnimationEnabled) && isHovered;
  // A press in progress always wins over a simultaneous hover state (e.g. the mouse is already
  // hovering when the button goes down) — same "active state wins" convention as CSS's own
  // `:active` outranking `:hover` when both would otherwise apply.
  const isPressAnimating = isHoverAnimating && isPressed;

  const baseShadow = shadowEnabled ? "0 2px 8px rgba(0, 0, 0, 0.15)" : "none";
  const hoverShadow = shadowEnabled ? "0 6px 16px rgba(0, 0, 0, 0.22)" : "none";
  // Pressing "flattens" the widget back toward its resting shadow even mid-hover, reinforcing
  // the press visually rather than just relying on the scale change alone.
  const currentShadow = isPressAnimating ? baseShadow : isHoverAnimating ? hoverShadow : baseShadow;
  // `clip-path` (used for the triangle shape below) clips away `box-shadow` entirely — clip-path
  // restricts ALL of an element's painting to its shape's interior, and box-shadow is painted
  // outside the border box, so the shadow has nowhere left to render. `border-radius` (circle)
  // and no shape at all don't have this problem, since they never touch clip-path. The fix is
  // `filter: drop-shadow(...)` instead of `box-shadow` for triangle specifically: unlike
  // box-shadow, a filter is computed on the element's already-rendered (already-clipped) output
  // and is allowed to paint outside those bounds — including past `overflow: hidden` — which is
  // exactly what a shadow needs. drop-shadow()'s offset/blur/color syntax is otherwise identical
  // to box-shadow's (this component's shadow values never use box-shadow's spread parameter, so
  // the same strings work unchanged for either property).
  const usesClipPathShape = shapeKey === "triangle";
  const contentShadowStyle: React.CSSProperties = usesClipPathShape
    ? { filter: currentShadow === "none" ? "none" : `drop-shadow(${currentShadow})` }
    : { boxShadow: currentShadow };
  const currentScale = isPressAnimating ? PRESS_SCALE : isHoverAnimating ? HOVER_SCALE : "scale(1)";

  // Only reserve the padding when hover animation is actually on — otherwise the animated
  // content keeps filling the full widget, same as before this feature existed. This is what
  // keeps the hover scale-up (below) contained: the animated content sits inset by this amount
  // inside `icon-widget`, which is the element that actually clips overflow via
  // `overflow: hidden` — an element can't clip its own transform via its own `overflow`, only a
  // transformed *descendant's* overflow, which is why the scale has to live one level in.
  const hoverPaddingPercent = hoverAnimationEnabled
    ? clampPercent(hoverAnimationPaddingPercent, DEFAULT_HOVER_ANIMATION_PADDING_PERCENT)
    : 0;

  const iconElement = iconSrc
    ? iconColor
      ? // Recolored: paint `iconColor` through the PNG's own alpha channel as a mask, rather
      // than rendering the PNG's original pixels. Only makes sense for single-color
      // silhouette PNGs with transparency (true for this repo's icon set) — a multi-color
      // source PNG would just become a solid color block.
      (
        <div
          data-testid="icon-image"
          data-icon-recolored="true"
          aria-hidden="true"
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: iconColor,
            WebkitMaskImage: `url(${iconSrc})`,
            maskImage: `url(${iconSrc})`,
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            WebkitMaskSize: "contain",
            maskSize: "contain",
          }}
        />
      )
      : (
        <img
          data-testid="icon-image"
          src={iconSrc}
          alt=""
          aria-hidden="true"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      )
    : null;

  const hasBorder = Boolean(shapeBorderColor);
  const borderThicknessPercent = hasBorder
    ? clampPercent(shapeBorderThickness, DEFAULT_SHAPE_BORDER_THICKNESS_PERCENT)
    : 0;
  // Uniform scale-from-center is geometrically guaranteed to keep the fill layer strictly
  // inside the border layer for ANY shape/aspect ratio (a scaled copy of a convex shape about
  // an interior point always stays inside the original) — see the shapeBorderThickness doc
  // comment above for why a per-edge px inset doesn't have that guarantee for a triangle.
  const fillScale = hasBorder ? Math.max(0, 1 - (2 * borderThicknessPercent) / 100) : 1;

  const iconSize = shapeKey
    ? clampPercent(iconSizePercent, DEFAULT_ICON_SIZE_PERCENT_WITH_SHAPE)
    : 100;
  const iconInsetPercent = (100 - iconSize) / 2;
  // A triangle's usable width is widest near its base and narrows toward the apex, so centering
  // the icon in the bounding box (like circle/rectangle do) leaves it looking too high, floating
  // above empty space near the base. Instead, anchor the icon's bottom edge near the base with a
  // fixed inset, and let iconSizePercent grow the icon upward from there — the same way
  // increasing a font size grows a line of text upward from a fixed baseline, rather than
  // growing symmetrically out from the vertical center.
  const isTriangleAnchoredToBase = shapeKey === "triangle";
  const iconBottomInsetPercent = isTriangleAnchoredToBase
    ? TRIANGLE_BASE_INSET_PERCENT
    : iconInsetPercent;
  const iconTopInsetPercent = isTriangleAnchoredToBase
    ? Math.max(0, 100 - iconSize - TRIANGLE_BASE_INSET_PERCENT)
    : iconInsetPercent;

  const hintTextStyle: React.CSSProperties = {
    textAlign: "center",
    padding: "8px",
    fontSize: "12px",
    lineHeight: 1.4,
    color: "#8b8d98",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };
  const wrapperStyle = {
    filter: "drop-shadow(0px 8px 6px rgba(0, 0, 0, 0.3))",
    display: "inline-block", // Keeps parent exact size of the child
  };

  return (
    <div
      data-testid="icon-widget"
      className="icon-widget"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        overflow: "hidden",
        cursor: (onWidgetClick && hoverAnimationEnabled) ? "pointer" : undefined,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        // Releasing the mouse button outside the widget (e.g. pressed, then dragged away before
        // letting go) shouldn't leave the widget stuck looking pressed forever.
        setIsPressed(false);

      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={onWidgetClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onWidgetClick?.();
        }
      }}
      role={onWidgetClick ? "button" : undefined}
      tabIndex={onWidgetClick ? 0 : undefined}
    ><div style={wrapperStyle}>
        <div
          data-testid="icon-widget-content"
          style={{
            position: "absolute",
            top: `${hoverPaddingPercent}%`,
            right: `${hoverPaddingPercent}%`,
            bottom: `${hoverPaddingPercent}%`,
            left: `${hoverPaddingPercent}%`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: backgroundColor || "transparent",
            transform: currentScale,
            transformOrigin: "center",
            transition:
              hoverAnimationEnabled
                ? `transform 150ms ease, ${usesClipPathShape ? "filter" : "box-shadow"} 150ms ease`
                : undefined,
            ...contentShadowStyle,
            // Clip this box — the one carrying the background color, the shadow, and the
            // hover/press scale — to the same shape as the border/fill drawn behind the icon, so
            // the click-down/hover affordance itself reads as a circle or triangle instead of
            // staying a rectangle around a circular/triangular icon. `overflow: hidden` is needed
            // for the circle case specifically: `borderRadius` alone rounds this box's own corners
            // but doesn't clip its children, while `clipPath` (the triangle case) clips regardless
            // — including it for both keeps the two cases consistent. "rectangle", and no shape set
            // at all, are both no-ops here (SHAPE_CLIP_STYLES.rectangle === {}), leaving this an
            // unclipped rectangle exactly as before this feature existed.
            overflow: shapeKey ? "hidden" : undefined,
            ...(shapeKey ? SHAPE_CLIP_STYLES[shapeKey] : {}),
          }}
        >
          {iconElement ? (
            shapeKey ? (
              <div
                data-testid="icon-shape"
                data-shape={shapeKey}
                style={{ position: "relative", width: "100%", height: "100%" }}
              >
                <div
                  data-testid="icon-shape-border"
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    backgroundColor: shapeBorderColor || "transparent",
                    ...SHAPE_CLIP_STYLES[shapeKey],
                  }}
                />
                <div
                  data-testid="icon-shape-fill"
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    backgroundColor: shapeFillColor || "transparent",
                    transform: `scale(${fillScale})`,
                    transformOrigin: "center",
                    ...SHAPE_CLIP_STYLES[shapeKey],
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: `${iconTopInsetPercent}%`,
                    right: `${iconInsetPercent}%`,
                    bottom: `${iconBottomInsetPercent}%`,
                    left: `${iconInsetPercent}%`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {iconElement}
                </div>
              </div>
            ) : (
              iconElement
            )
          ) : wasRequested ? (
            <div data-testid="icon-unresolved-hint" style={hintTextStyle}>
              <div>
                No icon named <strong>&quot;{iconName}&quot;</strong>
              </div>
              <div>
                {availableNames.length === 0
                  ? "No icons registered yet — see src/assets/icons/index.ts"
                  : (() => {
                    const suggestions = findSimilarIconNames(iconName ?? "", availableNames);
                    return suggestions.length > 0
                      ? `Did you mean: ${suggestions.join(", ")}?`
                      : "No similar icon names found.";
                  })()}
              </div>
            </div>
          ) : (
            <div data-testid="icon-empty-hint" style={hintTextStyle}>
              <div>Enter an icon name to display.</div>
              <div>
                {availableNames.length > 0
                  ? `Example: "${availableNames[0]}"`
                  : "No icons are registered yet — add PNGs to src/assets/icons/ first."}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
