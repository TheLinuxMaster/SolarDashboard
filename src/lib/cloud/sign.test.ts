import { test } from "node:test";
import assert from "node:assert/strict";

import { computeSign } from "./sign";

test("signs the same bytes as OpenSSL AES-256-CBC (login payload)", () => {
  const sign = computeSign({
    MemberID: "owner@example.com",
    Password: "p@ssw0rd",
    remember: "true",
    type: "1",
  });

  assert.equal(
    sign,
    "eahPYNcQ5Rn8zjvk1pcFfNpwi7e99fg+jntgsGbptnWWsOLPHUlCafRqHrpJaMkDyQC9hhJAj6ZXk4nq91mjO4w8HN19g5laZFLK+ysMs1lsslpM54d8dfDnVw9MH2NEteHzcT8Jg7FPHgUpnNMRSw==",
  );
});

test("filters empty, null and boolean values and stringifies arrays", () => {
  const sign = computeSign({
    Foo: "bar",
    a: [1, 2],
    b: false,
    c: "",
    d: null,
    e: 0,
  });

  assert.equal(
    sign,
    "q9s4HD8rWuE6KtsBe/PoP4A0w/V7kWqQ1E6RcZ+WspmLDThtuHxqJKJ7atpZs5hocDNPrtMu37n18lbVGW3AFA==",
  );
});
