import type { Meta } from "@storybook/react-vite";
import { subscribe, proxy } from "../../src/helpers/proxy-state";

const meta = {
  title: "Helpers/proxy-state",
} satisfies Meta;

export default meta;

export function Basic() {
  const a = proxy({ count: 0, foo: { bar: "bazz" } });
  // subscribe(a, "count", () => {});
  // a.count++;
  subscribe(a.foo, 'bar', () => {})
  a.foo.bar = 'rezzz'

  // console.log(a.count)
  return <div>basic ne</div>;
}
