import { Theme } from "@radix-ui/themes";
import React, { useCallback } from "react";
import { IconDisplay } from "./components/IconDisplay.js";
import { useWidgetContext } from "./context.js";

function readString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function readBoolean(value: unknown): boolean {
  return value === true;
}

export const Widget: React.FC = () => {
  const { parameters, emitEvent } = useWidgetContext();

  // Workshop delivers an unset string parameter as "" (there's no manifest-level default in
  // this SDK), not undefined — handle the blank case explicitly rather than assuming a falsy
  // check alone will fall through to a sensible default. While parameters haven't finished
  // loading yet (or failed to load), every value below falls through to `undefined`/`false` —
  // which IconDisplay treats the same as "not configured" — rather than the widget adding its
  // own loading/error UI (prompt.txt's scope restrictions call out not adding a loading
  // indicator or error text).
  const loaded = parameters.state === "loaded";
  const iconName = loaded ? readString(parameters.values.iconName) : undefined;
  const iconColor = loaded ? readString(parameters.values.iconColor) : undefined;
  const shape = loaded ? readString(parameters.values.shape) : undefined;
  const shapeFillColor = loaded ? readString(parameters.values.shapeFillColor) : undefined;
  const shapeBorderColor = loaded ? readString(parameters.values.shapeBorderColor) : undefined;
  const shapeBorderThickness = loaded
    ? readNumber(parameters.values.shapeBorderThickness)
    : undefined;
  const iconSizePercent = loaded ? readNumber(parameters.values.iconSizePercent) : undefined;
  const backgroundColor = loaded ? readString(parameters.values.backgroundColor) : undefined;
  const shadowEnabled = loaded ? readBoolean(parameters.values.shadowEnabled) : false;
  const hoverAnimationEnabled = loaded
    ? readBoolean(parameters.values.hoverAnimationEnabled)
    : false;
  const hoverAnimationPaddingPercent = loaded
    ? readNumber(parameters.values.hoverAnimationPaddingPercent)
    : undefined;
  const pressAnimationEnabled = loaded
    ? readBoolean(parameters.values.pressAnimationEnabled)
    : false;

  // Fires regardless of what's currently displayed (icon, empty-state prompt, or unresolved
  // hint) — see the `iconClicked` event's doc comment in main.config.ts.
  const handleWidgetClick = useCallback(() => {
    emitEvent("iconClicked", { parameterUpdates: {} });
  }, [emitEvent]);

  return (
    <Theme appearance="light" hasBackground={false}>
      <IconDisplay
        iconName={iconName}
        iconColor={iconColor}
        shape={shape}
        shapeFillColor={shapeFillColor}
        shapeBorderColor={shapeBorderColor}
        shapeBorderThickness={shapeBorderThickness}
        iconSizePercent={iconSizePercent}
        backgroundColor={backgroundColor}
        shadowEnabled={shadowEnabled}
        hoverAnimationEnabled={hoverAnimationEnabled}
        hoverAnimationPaddingPercent={hoverAnimationPaddingPercent}
        pressAnimationEnabled={pressAnimationEnabled}
        onWidgetClick={handleWidgetClick}
      />
    </Theme>
  );
};
