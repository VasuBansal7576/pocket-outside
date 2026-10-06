import test from "node:test";
import assert from "node:assert/strict";
import { activities, eligible, chooseFrom, dot } from "../core.mjs";
const all = { minutes: 10, still: false, features: ["sky", "plants", "birds"] };
test("A time budget and one-spot choice together exclude the tempting walking card", () => {
  const allowed = eligible({ ...all, minutes: 3, still: true }).map(activity => activity.id);
  assert.deepEqual(allowed, ["sound", "leaf", "cloud"]);
});
test("Missing surroundings cannot be overruled by strong semantic similarity", () => {
  const vectors = activities.map(activity => activity.id === "sound" ? [1, 0] : [0, 1]);
  const choice = chooseFrom([1, 0], vectors, { ...all, features: ["sky"] });
  assert.equal(choice.activity.id, "cloud");
});
test("Empty surroundings and too little time return an explicit empty selection", () => {
  const vectors = activities.map(() => [1, 0]);
  assert.equal(chooseFrom([1, 0], vectors, { ...all, features: [] }), null);
  assert.equal(chooseFrom([1, 0], vectors, { ...all, minutes: 2 }), null);
});
test("Invalid constraints never broaden the eligible catalog", () => {
  for (const bad of [null, {...all, minutes:NaN}, {...all, minutes:-1},
                    {...all, still:"yes"}, {...all, features:["unknown"]}])
    assert.deepEqual(eligible(bad), []);
});
test("A winner is an existing authored card, with deterministic ties", () => {
  const vectors = activities.map(() => [1, 0]);
  const choice = chooseFrom([1, 0], vectors, all);
  assert.equal(choice.activity.id, "branches");
  assert.ok(activities.includes(choice.activity));
});
test("Malformed model data fails instead of producing a misleading match", () => {
  assert.throws(() => dot([NaN], [1]), /Invalid embedding/);
  assert.throws(() => dot([1], [1,2]), /Invalid embedding/);
  assert.throws(() => chooseFrom([1,0], [], all), /Missing catalog embeddings/);
});
test("Every card has bounded duration, declared surroundings and complete authored content", () => {
  assert.equal(new Set(activities.map(activity => activity.id)).size, activities.length);
  for (const activity of activities) {
    assert.ok(activity.minutes > 0 && activity.minutes <= 10);
    assert.ok(activity.needs.length > 0);
    assert.ok(activity.title && activity.about && activity.steps);
    assert.equal(typeof activity.still, "boolean");
    assert.ok(!activity.steps.includes("<script>"));
  }
});

