import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { Widget } from "../Widget.js";
import { useWidgetContext } from "../context.js";

vi.mock("../context.js", () => ({
  useWidgetContext: vi.fn(),
}));

describe("Widget", () => {
  it("renders the example card once parameters have loaded", () => {
    vi.mocked(useWidgetContext).mockReturnValue({
      parameters: { state: "loaded", values: { exampleTextInput: "hello" } },
      emitEvent: vi.fn(),
    } as unknown as ReturnType<typeof useWidgetContext>);

    render(<Widget />);

    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("emits exampleInteraction with a lastInteraction update on click", async () => {
    const emitEvent = vi.fn();
    vi.mocked(useWidgetContext).mockReturnValue({
      parameters: { state: "loaded", values: { exampleTextInput: "hello" } },
      emitEvent,
    } as unknown as ReturnType<typeof useWidgetContext>);

    render(<Widget />);
    await userEvent.click(screen.getByRole("button", { name: /emit example event/i }));

    expect(emitEvent).toHaveBeenCalledWith(
      "exampleInteraction",
      expect.objectContaining({
        parameterUpdates: expect.objectContaining({
          lastInteraction: expect.any(String),
        }),
      }),
    );
  });
});
