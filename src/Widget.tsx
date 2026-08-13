import { Theme } from "@radix-ui/themes";
import React from "react";
import { IconDisplay } from "./components/IconDisplay.js";
import { useWidgetContext } from "./context.js";

function readString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

export const Widget: React.FC = () => {
  const { parameters } = useWidgetContext();

  // Workshop delivers an unset string parameter as "" (there's no manifest-level default in
  // this SDK), not undefined — handle the blank case explicitly rather than assuming a falsy
  // check alone will fall through to a sensible default. While parameters haven't finished
  // loading yet (or failed to load), every value below falls through to `undefined` — which
  // IconDisplay treats the same as "not configured" — rather than the widget adding its own
  // loading/error UI (prompt.txt's scope restrictions call out not adding a loading indicator
  // or error text).
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
      />
    </Theme>
  );
};
