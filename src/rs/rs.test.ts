import { rs } from ".";

const variables = {
  documentPageNumber: 1,
  documentPageCount: 3,
  sectionPageNumber: 1,
  sectionPageCount: 1,
  timestamp: "",
};

describe("rs", () => {
  it("applies variables", () => {
    const func = rs`Page {{documentPageNumber}} of {{documentPageCount}}`;
    const result = func.apply(null, [variables]);

    expect(result).toBe("Page 1 of 3");
  });

  it("throws with invalid variable", () => {
    const func = rs`Page {{banana}} of {{documentPageCount}}`;
    expect(() => func.apply(null, [variables])).toThrow(
      "{{banana}} is not a valid variable"
    );
  });
});
