const { renderPdf } = require("reportscript");
const blobStream = require("blob-stream");

const generateDocument = () => {
  function createDocument(image) {
    const documentHeader = {
      rows: [
        {
          data: [
            {
              image: {
                image,
                height: 100
              },
              align: "left"
            },
            {
              value: "Document Header",
              fontSize: 16,
              underline: true,
              verticalAlign: "center"
            },
            ""
          ],
          options: { underline: true, lineGap: 20 }
        },
        {
          data: [
            {
              value: "Subheader",
              fontSize: 14,
              align: "left",
              underline: false,
            },
            "",
            {
              value: "1-1-2024",
              fontSize: 12,
              align: "right"
            },
          ],
        },
      ],
      columns: [{ width: "1fr" },{ width: "1fr" },{width: "1fr"}],
      style: { bold: true }
    };

    const dataRows = [...new Array(30).keys()].map(x => {
      const quantity = Math.floor(Math.random() * 10);
      const rate = (Math.random() * 100) * (quantity === 1 ? -1 : 1);
      const total = rate * quantity;
      const color = total < 0 ? "red" : "black";
      const bold = total > 500;

      return {
        data: [
          { value: `Description ${x}`, align: "left" },
          rate.toFixed(2),
            quantity,
          { value: total.toFixed(2), color, bold }
        ]
      }
    });

    const loremText = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";

    const dataSection = {
      headers: {
        rows: [
          {
            data: ["Section Header"],
            options: { align: "left", fontSize: 15, bold: true, underline: true  }
          }
        ]
      },
      tables: [
        {
          headers: [
            {
              data: ["Description", "Rate", "Quantity", "Total"],
              options: { bold: true, align: "center" },
            },
          ],
          rows: dataRows,
          style: {
            fontSize: 13,
            grid: true,
            align: "right"
          },
          columns: [
            { width: "1fr" },
            { width: "75pt" },
            { width: "75pt" },
            { width: "75pt" }
          ]
        },
      ],
      watermark: { text: "Draft", color: "#ff0000" }
    };

    const textImagesSection = {
      tables: [
        {
          headers: [
            {
              data: [{
                value: "Make a table just to display images or text",
                columnSpan: 2
              }],
              options: {
                bold: true,
                align: "center",
                fontSize: 15,
              },
            },
          ],
          rows: [
            {
              data: [loremText, loremText],
              options: { fontSize: 11, align: "left" },
              image: {
                image,
                height: 300,
              },
            }
          ],
          columns: [{ width: "1fr" },{ width: "1fr"}]
        },
      ],
    }

    const documentFooter = {
      rows: [
        {
          data: ["Document Footer"],
        },
      ],
      style: {
        fontSize: 12,
      },
    };

    return {
      headers: documentHeader,
      sections: [
        dataSection,
        textImagesSection,
      ],
      repeatSectionHeaders: true,
      footers: documentFooter,
      pageNumbers: true,
      timestamp: true,
      timeStampPageNumberFontSetting: {
        fontFace: "Times-Roman",
        fontSize: 9
      },
      layout: "portrait",
      pageBreakRows: {
        rows: [{
          data: [{
            value: "(Continued on next page)",
            fontSize: 12
          }]
        }]
      }
    };
  }

  function getDocument() {
    return fetch(
      "/assets/canyon-mission.jpeg",
      { mode: "no-cors", method: "get" }
    )
    .then(response => response.arrayBuffer())
    .then(imgBuffer => createDocument(imgBuffer));
  }

  return getDocument();
};

const makePdf = (document, iframe) => {
  document.then(x => {
    const bobStream = blobStream();
    const stream = renderPdf(x, bobStream);
    stream.on("finish", function () {
      const url = stream.toBlobURL("application/pdf");
      iframe.src = url;
    });
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
    debounceTimeout = setTimeout(() => {
      makePdf(fn(), iframe);
      debounceTimeout = undefined;
    }, 100);
  } catch (e) {
    console.log(e);
  }
});