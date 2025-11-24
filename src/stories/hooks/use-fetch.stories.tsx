import type { Meta } from "@storybook/react-vite";
import { useFetch } from "../../hooks/use-fetch";

const meta = {
  title: "Hooks/use-fetch",
} satisfies Meta;

export default meta;

export function Basic() {
  useFetch("", () => fetch(""));
  return <div>basic</div>;
}
