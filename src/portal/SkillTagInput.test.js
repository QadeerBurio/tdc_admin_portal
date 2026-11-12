import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SkillTagInput from "./SkillTagInput";

function Harness({ initial = [], onSkills }) {
  const [skills, setSkills] = useState(initial);
  return <SkillTagInput id="jm-skills" value={skills} onChange={(s) => { setSkills(s); onSkills && onSkills(s); }} />;
}
const box = () => screen.getByPlaceholderText(/Type a skill|skills added/);
const chips = () => screen.queryAllByRole("listitem").map((li) => li.textContent.replace("×", ""));
const type = (text) => fireEvent.change(box(), { target: { value: text } });
const paste = (text) => fireEvent.paste(box(), { clipboardData: { getData: () => text } });

test("Enter or comma turns the typed skill into a chip; × removes it", () => {
  render(<Harness />);
  type("React"); fireEvent.keyDown(box(), { key: "Enter" });
  type("Node.js"); fireEvent.keyDown(box(), { key: "," });
  expect(chips()).toEqual(["React", "Node.js"]);
  expect(box().value).toBe("");
  fireEvent.click(screen.getByRole("button", { name: "remove React" }));
  expect(chips()).toEqual(["Node.js"]);
  expect(screen.getByText(/1\/15 skills/)).toBeInTheDocument();
});

test("typing a comma at the end adds nothing to the text; Backspace on an empty box removes the last chip", () => {
  render(<Harness initial={["React", "SQL"]} />);
  type("Git,");
  expect(box().value).toBe("Git");
  type("");
  fireEvent.keyDown(box(), { key: "Backspace" });
  expect(chips()).toEqual(["React"]);
});

test("a skill over 40 characters or a repeat is refused with the reason", () => {
  render(<Harness initial={["React"]} />);
  type("x".repeat(41)); fireEvent.keyDown(box(), { key: "Enter" });
  expect(screen.getByRole("alert").textContent).toMatch(/over 40 characters/);
  expect(chips()).toEqual(["React"]);
  type("react"); fireEvent.keyDown(box(), { key: "Enter" });
  expect(screen.getByRole("alert").textContent).toMatch(/already added/);
});

test("at most 15: the box is closed when full", () => {
  render(<Harness initial={Array.from({ length: 15 }, (_, i) => `S${i}`)} />);
  expect(box()).toBeDisabled();
  expect(screen.getByText(/15\/15 skills/)).toBeInTheDocument();
});

test("pasting a long text suggests tags to confirm; one can be left out; brackets are kept together", () => {
  const seen = [];
  render(<Harness onSkills={(s) => seen.push(s)} />);
  paste("We need:\n• React\n• Node.js - Express\n• Python (pandas, numpy)");
  const group = screen.getByTestId("skill-suggestions");
  expect(group.textContent).toMatch(/Split the pasted text into 5 skills/);
  expect(chips()).toEqual([]); // nothing added before confirming
  fireEvent.click(screen.getByRole("button", { name: "leave out We need:" }));
  fireEvent.click(screen.getByRole("button", { name: "add these" }));
  expect(chips()).toEqual(["React", "Node.js", "Express", "Python (pandas, numpy)"]);
  expect(screen.queryByTestId("skill-suggestions")).toBeNull();
});

test("cancel drops the suggestions; a single short skill pastes as typed", () => {
  render(<Harness />);
  paste("React, Vue");
  fireEvent.click(screen.getByRole("button", { name: "cancel" }));
  expect(screen.queryByTestId("skill-suggestions")).toBeNull();
  expect(chips()).toEqual([]);
  const ev = paste("React");
  expect(ev).toBe(true); // not prevented: the browser puts it in the box
  expect(screen.queryByTestId("skill-suggestions")).toBeNull();
});

test("suggestions over the limits aren't added, and say why", () => {
  render(<Harness initial={Array.from({ length: 14 }, (_, i) => `S${i}`)} />);
  paste("Kotlin, Swift, " + "y".repeat(45));
  fireEvent.click(screen.getByRole("button", { name: "add these" }));
  expect(chips()).toHaveLength(15);
  expect(chips()[14]).toBe("Kotlin");
  expect(screen.getByRole("alert").textContent).toMatch(/at most 15 skills/);
  expect(screen.getByRole("alert").textContent).toMatch(/over 40 characters/);
});
