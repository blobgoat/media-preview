import { Theme } from "@radix-ui/themes";
import React from "react";
import { IconDisplay } from "./components/IconDisplay.js";
import { useWidgetContext } from "./context.js";

export const Widget: React.FC = () => {
  const { parameters } = useWidgetContext();

  // Workshop delivers an unset string parameter as "" (there's no manifest-level default in
  // this SDK), not undefined — handle the blank case explicitly rather than assuming a falsy
  // check alone will fall through to a sensible default. While parameters haven't finished
  // loading yet (or failed to load), there is also no resolved iconName — both cases fall
  // through to IconDisplay's own "no icon" rendering rather than the widget adding its own
  // loading/error UI (prompt.txt's scope restrictions call out not adding a loading indicator
  // or error text).
  const iconName =
    parameters.state === "loaded" && typeof parameters.values.iconName === "string"
      ? parameters.values.iconName
      : undefined;

  return (
    <Theme appearance="light" hasBackground={false}>
      <IconDisplay iconName={iconName} />
    </Theme>
  );
};
