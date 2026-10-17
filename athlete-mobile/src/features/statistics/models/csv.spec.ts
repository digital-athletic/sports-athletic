import { buildCsv, escapeCsvField } from "./csv";

describe("csv: escapeCsvField", () => {
  it("leaves plain text unquoted", () => {
    expect(escapeCsvField("plain text")).toBe("plain text");
  });

  it("quotes fields with a comma", () => {
    expect(escapeCsvField("a,b")).toBe('"a,b"');
  });

  it("quotes fields with a quote and doubles the quote", () => {
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
  });

  it("quotes fields with line breaks", () => {
    expect(escapeCsvField("a\nb")).toBe('"a\nb"');
    expect(escapeCsvField("a\r\nb")).toBe('"a\r\nb"');
  });

  it("renders null as an empty field", () => {
    expect(escapeCsvField(null)).toBe("");
  });

  it.each(["=SUM(A1)", "+1", "-1", "@cmd"])(
    "prefixes text starting with a formula character: %s",
    (value) => {
      expect(escapeCsvField(value)).toBe(`'${value}`);
    },
  );

  it("prefixes text starting with a tab or a carriage return", () => {
    expect(escapeCsvField("\tcmd")).toBe("'\tcmd");
    expect(escapeCsvField("\rcmd")).toBe(`"'\rcmd"`);
  });

  it("guards and quotes text that needs both", () => {
    expect(escapeCsvField("=A1,B1")).toBe(`"'=A1,B1"`);
  });

  it("keeps numbers numeric, including negative numbers", () => {
    expect(escapeCsvField(-5)).toBe("-5");
    expect(escapeCsvField(12.5)).toBe("12.5");
    expect(escapeCsvField(0)).toBe("0");
  });
});

describe("csv: buildCsv", () => {
  it("starts with a UTF-8 BOM", () => {
    const csv = buildCsv(["a"], []);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it("joins fields with commas and rows with CRLF", () => {
    const csv = buildCsv(
      ["a", "b"],
      [
        [1, "x,y"],
        [2, null],
      ],
    );
    expect(csv.slice(1)).toBe('a,b\r\n1,"x,y"\r\n2,\r\n');
  });

  it("writes only the header for no rows", () => {
    expect(buildCsv(["a", "b"], []).slice(1)).toBe("a,b\r\n");
  });
});
