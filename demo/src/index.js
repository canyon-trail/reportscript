const reportscript = require("../../dist/index.js")
const PDFDocument = require('pdfkit');
const blobStream = require('blob-stream');

const generateDocument = () =>{
const documentHeader = {
    rows:[{
      data:["Here is Document Header"]
    }],
    style:{
      fontSize:25
    }
  } 
  const section = {
    tables: [
      {
        headers:[{
            data:[
                "table header",
                "I am also table header"]}],
        rows: [{ 
            data: [
                "I am data", 
                "I am really longgggggggg data"] }],
        style:{
          fontSize:25,
          grid:true
        }
      },
    ],

  };
  const documentFooter = {
    rows:[{
      data:["Here is Document Footer"]
    }],
    style:{
      fontSize:25
    }
  }
  return {
    headers:documentHeader,
    sections: [
      section,
    ],
    footers: documentFooter,
    layout: "portrait",
  };
}

const makePdf = (document,iframe) => {
  const doc = new PDFDocument;
  const stream = blobStream();
  reportscript.renderPdf(document,stream)
  doc.end()
  const url = stream.toBlobURL('application/pdf');
  iframe.src = url;
}
var iframe = document.querySelector('iframe');

var editor = ace.edit('editor');
editor.setTheme('ace/theme/monokai');
editor.getSession().setMode('ace/mode/javascript');
editor.setValue(generateDocument.toString()
.split('\n')
.slice(1, -1)
.join('\n')
.replace(/^  /gm, ''));
editor
  .getSession()
  .getSelection()
  .clearSelection();

makePdf(generateDocument(),iframe)

