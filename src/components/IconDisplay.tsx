import React from "react";
import { iconAssets } from "../assets/icons/index.js";

export interface IconDisplayProps {
  /** Key into the repository's icon registry (src/assets/icons/index.ts). */
  iconName?: string;
}

// Looks up `iconName` in the repository's PNG icon registry. Missing/empty/unregistered names
// all resolve to `undefined` rather than throwing or falling back to a substitute icon — see
// prompt.txt's "No Default Icon" and "Invalid Icon Names" requirements.
function getIconAsset(iconName?: string): string | undefined {
  if (!iconName) {
    return undefined;
  }

  return iconAssets[iconName];
}

// Renders the resolved icon (if any) inside a flex container that fills and centers within its
// available space.
//
// Two distinct "no icon" states, by request (a Workshop author configured `iconName="ambulence"`
// — a typo for "ambulance" — and saw a blank widget with no indication of why):
//   - iconName not supplied at all: render an empty container, silently. This preserves the
//     original "no default icon" requirement — nothing was asked for, so nothing is shown.
//   - iconName supplied but not found in the registry (typo, or not registered yet): render a
//     small on-widget hint naming the requested key and listing the currently registered icon
//     names, so a Workshop author can immediately see why nothing rendered and what values are
//     actually valid, instead of silently guessing.
export const IconDisplay: React.FC<IconDisplayProps> = ({ iconName }) => {
  const iconSrc = getIconAsset(iconName);
  const wasRequested = Boolean(iconName);
  const availableNames = Object.keys(iconAssets);

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
      {iconSrc ? (
        <img
          data-testid="icon-image"
          src={iconSrc}
          alt=""
          aria-hidden="true"
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
          }}
        />
      ) : wasRequested ? (
        <div
          data-testid="icon-unresolved-hint"
          style={{
            textAlign: "center",
            padding: "8px",
            fontSize: "12px",
            lineHeight: 1.4,
            color: "#8b8d98",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
