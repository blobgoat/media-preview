import { Button, Card, Text } from "@radix-ui/themes";
import React from "react";

interface ExampleCardProps {
  label: string;
  onClick: () => void;
}

// Presentational pieces live in components/ and take plain props — they don't reach into
// useWidgetContext() themselves. Widget.tsx owns all parameter reads/event emits and passes the
// results down, which keeps these components easy to unit test in isolation.
export const ExampleCard: React.FC<ExampleCardProps> = ({ label, onClick }) => {
  return (
    <Card>
      <Text as="p" mb="2">
        {label}
      </Text>
      <Button onClick={onClick}>Emit example event</Button>
    </Card>
  );
};
