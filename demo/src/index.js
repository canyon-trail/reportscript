const reportscript = require("../../dist/index.js");
const blobStream = require("blob-stream");

const generateDocument = () => {
  const documentHeader = {
    rows: [
      {
        data: ["Here is Document Header"],
      },
    ],
    style: {
      fontSize: 25,
    },
  };
  const section = {
    tables: [
      {
        headers: [
          {
            data: ["table header", "I am also table header"],
          },
        ],
        rows: [
          {
            data: ["I am data", "I am really longgggggggg data"],
          },
        ],
        style: {
          fontSize: 25,
          grid: true,
        },
      },
    ],
  };
  const documentFooter = {
    rows: [
      {
        data: ["Here is Document Footer"],
      },
    ],
    style: {
      fontSize: 25,
    },
  };
  return {
    headers: documentHeader,
    sections: [section],
    footers: documentFooter,
    layout: "portrait",
  };
};

const makePdf = (document, iframe) => {
  const bobStream = blobStream();
  const stream = reportscript.renderPdf(document, bobStream);
  stream.on("finish", function () {
    const url = stream.toBlobURL("application/pdf");
    iframe.src = url;
  });
};
var iframe = document.querySelector("iframe");

var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/javascript");
editor.setValue(
  generateDocument
    .toString()
    .split("\n")
    .slice(1, -1)
    .join("\n")
    .replace(/^  /gm, "")
);
editor.getSession().getSelection().clearSelection();

makePdf(generateDocument(), iframe);

let debounceTimeout;

editor.getSession().on("change", function () {
  try {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    const fn = new Function(editor.getValue());
    console.log(fn);
    debounceTimeout = setTimeout(() => {
      makePdf(fn(), iframe);
      debounceTimeout = undefined;
    }, 100);
  } catch (e) {
    console.log(e);
  }
});
