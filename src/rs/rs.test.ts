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
    const result = func.renderTemplate(variables);

    expect(result).toBe("Page 1 of 3");
  });

  it("throws with invalid variable", () => {
    expect(() => rs`Page {{banana}} of {{documentPageCount}}`).toThrow(
      "{{banana}} is not a valid variable"
    );
  });

  it("properly handles user variables", () => {
    const myVar = "world";
    const template = rs`Hello ${myVar} on page {{documentPageNumber}}`;
    expect(template.renderTemplate(variables)).toBe("Hello world on page 1");
  });
});
