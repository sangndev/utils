import { useRef } from "react";
import type { Meta } from "@storybook/react-vite";
import { subscribe, proxy } from "../../src/helpers/proxy-state";

const meta = {
  title: "Helpers/proxy-state",
} satisfies Meta;

export default meta;

export function Basic() {
  const a = useRef(
    proxy({ count: 0, foo: { bar: "bazz", gazz: { fi: "do" } }, arr: [1] }),
  );
  subscribe(a.current, "arr", (record) => console.log("arr changed: ", record));
  subscribe(a.current, "count", () => {});
  subscribe(a.current, "foo", (record) => {
    console.log("foo changed: ", record);
  });
  const unsubscribe = subscribe(a.current.foo, "bar", (record) => {
    console.log("bar changed: ", record);
  });
  subscribe(a.current.foo.gazz, "fi", (record) =>
    console.log("fi changed: ", record),
  );
  a.current.arr.push(2);
  a.current.count++;
  a.current.foo.bar = "yayayayayaoayaoyoayoay";
  unsubscribe();

  a.current.foo.gazz.fi = "nan";

  return <div>basic ne</div>;
}
