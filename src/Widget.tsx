import { Callout, Flex, Skeleton, Theme } from "@radix-ui/themes";
import React, { useCallback } from "react";
import { ExampleCard } from "./components/ExampleCard.js";
import { useWidgetContext } from "./context.js";

export const Widget: React.FC = () => {
  const { parameters, emitEvent } = useWidgetContext();

  const isLoading = parameters.state === "not-started" || parameters.state === "loading";

  // Workshop delivers an unset string parameter as "" (there's no manifest-level default in
  // this SDK), not undefined — handle the blank case explicitly rather than assuming a falsy
  // check alone will fall through to a sensible default.
  const exampleTextValue =
    typeof parameters.values.exampleTextInput === "string" &&
    parameters.values.exampleTextInput.trim().length > 0
      ? parameters.values.exampleTextInput
      : "(exampleTextInput not configured yet)";

  const handleExampleClick = useCallback(() => {
    emitEvent("exampleInteraction", {
      parameterUpdates: {
        lastInteraction: `clicked at ${new Date().toISOString()}`,
      },
    });
  }, [emitEvent]);

  return (
    <Theme appearance="light" hasBackground={false}>
      <Flex
        direction="column"
        align="center"
        justify="center"
        gap="3"
        p="2"
        style={{
          width: "100%",
          height: "100%",
          minWidth: "0px",
          minHeight: "0px",
          boxSizing: "border-box",
          backgroundColor: "transparent",
        }}
      >
        {isLoading ? (
          <Skeleton>
            <div style={{ width: 200, height: 80, borderRadius: 8 }} />
          </Skeleton>
        ) : parameters.state === "error" ? (
          <Callout.Root color="red" role="alert">
            <Callout.Text>Failed to load widget parameters.</Callout.Text>
          </Callout.Root>
        ) : (
          <ExampleCard label={exampleTextValue} onClick={handleExampleClick} />
        )}
      </Flex>
    </Theme>
  );
};
