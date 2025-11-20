import { useState } from "react";
import type { Meta } from "@storybook/react-vite";
import { proxy, useSubscribe } from "../../src/helpers/proxy-state";

const meta = {
  title: "Helpers/proxy-state",
} satisfies Meta;

export default meta;

const state = proxy<{
  count: number;
  task: string[];
}>({ count: 0, task: ["task 1"] });

function Count() {
  const count = useSubscribe(state, "count");
  return <p>Count is: {count}</p>;
}

function List() {
  const list = useSubscribe(state, "task");
  return (
    <div>
      <p>List task:</p>
      <ul>
        {list.map((task, index) => (
          <li key={task + index}>{task}</li>
        ))}
      </ul>
    </div>
  );
}

function Display() {
  return (
    <div>
      <Count />
      <List />
    </div>
  );
}

function Dispatch() {
  const [taskName, setTaskName] = useState<string>("");
  return (
    <div
      style={{
        display: "grid",
        rowGap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 8,
        }}
      >
        <button onClick={() => state.count++}>+</button>
        <button onClick={() => state.count--}>-</button>
      </div>
      <div>
        <input
          value={taskName}
          placeholder="Create a task..."
          onChange={(e) => setTaskName(e.target.value)}
        />
        <button
          disabled={taskName === ""}
          onClick={() => {
            state.task.push(taskName);
            setTaskName("");
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function Basic() {
  return (
    <>
      <Dispatch />
      <Display />
    </>
  );
}
