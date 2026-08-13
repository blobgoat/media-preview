import React from "react";
import { iconAssets } from "../assets/icons/index.js";

export interface IconDisplayProps {
  /** Key into the repository's icon registry (src/assets/icons/index.ts). */
  iconName?: string;
  /** CSS color to recolor the icon to. Blank/unset keeps the PNG's own original colors. */
  iconColor?: string;
  /** "circle" | "triangle" | "rectangle" (case-insensitive). Anything else = no shape. */
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
   * icon fills the central 70% of the shape, leaving a 15% margin on each side so the shape
   * reads as a backdrop). Only applies when a shape is set — without a shape the icon already
   * fills 100% of the widget. Defaults to 70 when a shape is set but this isn't.
   */
  iconSizePercent?: number;
}

const SHAPE_CLIP_STYLES: Record<string, React.CSSProperties> = {
  circle: { borderRadius: "50%" },
  rectangle: {},
  triangle: { clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" },
};

const DEFAULT_SHAPE_BORDER_THICKNESS_PERCENT = 8;
const DEFAULT_ICON_SIZE_PERCENT_WITH_SHAPE = 70;

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

// Resolves a requested icon name against the registered names: exact match first, then a
// case-insensitive exact match, then falls back to a substring search in either direction
// (typed name is a substring of a registered name, or vice versa) — e.g. "cal" or "CALENDAR"
// both resolve to "calendar". Ties are broken by preferring the shortest (closest) registered
// name, then alphabetically, so the result is deterministic.
export function resolveIconKey(
  iconName: string | undefined,
  availableNames: string[],
): string | undefined {
  if (!iconName) {
    return undefined;
  }
  if (availableNames.includes(iconName)) {
    return iconName;
  }

  const lower = iconName.toLowerCase();
  const exactCaseInsensitive = availableNames.find((name) => name.toLowerCase() === lower);
  if (exactCaseInsensitive) {
    return exactCaseInsensitive;
  }

  const substringMatches = availableNames.filter((name) => {
    const nameLower = name.toLowerCase();
    return nameLower.includes(lower) || lower.includes(nameLower);
  });
  if (substringMatches.length === 0) {
    return undefined;
  }

  substringMatches.sort((a, b) => a.length - b.length || a.localeCompare(b));
  return substringMatches[0];
}

// Looks up `iconName` in the repository's PNG icon registry (with the search fallback above).
// Missing/empty/unmatched names all resolve to `undefined` rather than throwing or falling back
// to a substitute icon — see prompt.txt's "No Default Icon" and "Invalid Icon Names"
// requirements.
function getIconAsset(iconName: string | undefined): string | undefined {
  const key = resolveIconKey(iconName, Object.keys(iconAssets));
  return key ? iconAssets[key] : undefined;
}

// Renders the resolved icon (if any) inside a flex container that fills and centers within its
// available space.
//
// Two distinct "no icon" states:
//   - iconName not supplied at all: render an empty container, silently. This preserves the
//     original "no default icon" requirement — nothing was asked for, so nothing is shown. A
//     shape is never drawn in this state either ("blank image functionality" stays blank).
//   - iconName supplied but not found (even via the search fallback): render a small on-widget
//     hint naming the requested key and listing the currently registered icon names.
export const IconDisplay: React.FC<IconDisplayProps> = ({
  iconName,
  iconColor,
  shape,
  shapeFillColor,
  shapeBorderColor,
  shapeBorderThickness,
  iconSizePercent,
}) => {
  const iconSrc = getIconAsset(iconName);
  const wasRequested = Boolean(iconName);
  const availableNames = Object.keys(iconAssets);
  const shapeKey = normalizeShapeKey(shape);

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

  return (
    <div
      data-testid="icon-widget"
      className="icon-widget"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        overflow: "hidden",
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
                top: `${iconInsetPercent}%`,
                right: `${iconInsetPercent}%`,
                bottom: `${iconInsetPercent}%`,
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
        <div
          data-testid="icon-unresolved-hint"
          style={{
            textAlign: "center",
            padding: "8px",
            fontSize: "12px",
            lineHeight: 1.4,
            color: "#8b8d98",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          <div>
            No icon named <strong>&quot;{iconName}&quot;</strong>
          </div>
          <div>
            {availableNames.length > 0
              ? `Available: ${availableNames.join(", ")}`
              : "No icons registered yet — see src/assets/icons/index.ts"}
          </div>
        </div>
      ) : null}
    </div>
  );
};
