import { useRef } from "react";
import type { Meta } from "@storybook/react-vite";
import { subscribe, proxy } from "../../src/helpers/proxy-state";

const meta = {
  title: "Helpers/proxy-state",
} satisfies Meta;

export default meta;

export function Basic() {
  const a = useRef(proxy({ count: 0, foo: { bar: "bazz" } }));
  // subscribe(a, "count", () => {});
  // a.count++;
  subscribe(a.current, "foo", (record) => {
    console.log("foo changed: ", record);
  });
  // unsubscribe();
  const unsubscribe = subscribe(a.current.foo, "bar", (record) => {
    console.log("bar changed: ", record);
  });
  a.current.foo.bar = "yayayayayaoayaoyoayoay";
  // unsubscribe()

  // console.log(a.count)
  return <div>basic ne</div>;
}
