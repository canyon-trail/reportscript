---
icon: fa-solid fa-book
order: 3
layout: post
title: Developer Guide
---

# Document

A [Document](/documentation/#document) is the main data object that gets passed to renderPdf. It contains [Headers, Footers](#document-headersfooters), [Sections](#section) and many [settings](#document-setting) that can be set on the Document level.


Example:

```javascript
const document = {
  headers: {
    rows: [{
        data: ["Document Header"],
    }]
  },
  sections: [mySections],
  footers: {
    rows: [{
        data: ["Document Footer"],
    }]
  },
  layout: "portrait",
  timestamp: true,
  pageNumbers: true
}
renderPdf(document)
```
## Document Headers/Footers

Document headers and footers are [HeaderFooters](/documentation/#headerfooters) type. Document headers are displayed at the top of a pdf page. By default, the headers are only displayed on the first page. Document footers are displayed at the bottom of every page.
```javascript
const documentHeaders = {
  rows: [{
    data: ["Document Header"],
  }]
  columns: [{align:"left"}]
  style:{
    bold:true
  }
}
const documentFooters = {
  rows: [{
    data: ["Document Footer"],
  }]
  columns: [{align:"right"}]
  style:{
    bold:true
  }
}
const document = {
  headers: documentHeaders,
  sections: [mySections],
  footers: documentFooters,
}
```
## Document Setting
### Layout
[Layout](/documentation/#layout) determines the orientation of the pdf document. The available options are "landscape" and "portrait". The default is “landscape”.
```javascript
const document = {
  ...myDocument,
  layout: "portrait"
}
```
### Repeat Document Headers
The Document's [headers](#document-headersfooters) is displayed at the beginning of the document once by default. This settings will display the Document's headers on every page.
```javascript
const document = {
  ...myDocument,
  headers:[myheader]
  repeatReportHeaders: true
}
```
### Repeat Section Headers
The [Section headers](#section) is displayed at the start of each section by default. In the scenario where a section takes up 2 more pages, this setting allows repeating of section headers at the start of every page.
```javascript
const document = {
  ...myDocument,
  sections:[section1,section2]
  repeatSectionHeaders: true
}
```
### Page Number
Display page numbers on the bottom right of every page. Example: “Page 1 of 10”
```javascript
const document = {
  ...myDocument,
  pageNumbers: true
}
```
### Timestamp
Display timestamp on the bottom right of every page. Example: “Wed Apr 05 2023 04:05:58” 

```javascript
const document = {
  ...myDocument,
  tinmestamp: true
}
```

When couple with [Page Number](#page-number), the timestamp will be displayed first. Example: “Wed Apr 05 2023 04:05:58 Page 1 of 10”
### Section Page Number
Since Document can have an array of [Section](#sections), this setting gives us the option to allow each section to have their own page numbers. Page numbers reset to 1 for every section. An error will be thrown if both [pageNumbers](#page-number) and sectionPageNumbers are set to true
```javascript
const document = {
  ...myDocument,
  sections: [section1, section2]
  sectionPageNumbers: true
}
```
### timeStampPageNumberFontSetting
timeStampPageNumberFontSetting change the default font settings for any page numbers and timestamps. See available [font settings](/documentation/#fontsetting). 
```javascript
const document = {
  ...myDocument,
  tinmestamp: true,
  pageNumbers: true
  timeStampPageNumberFontSetting: {
    bold: true,
    underline: true
  }
}
```
### Watermark 
Displays a [watermark](/documentation/#watermark) on every page of the pdf. If a section has Watermark set, it will override the document watermark setting.
```javascript
const document = {
  ...myDocument,
  watermark: {
    text: "Don't steal :)",
    fontFace: "Times-Bold",
    color: "ff0000"
  }
}
```
### Page break Rows
Adding [custom rows on page break](/documentation/#pagebreakrows). One good usage is indicating that there is more than one page to the document like below.
```javascript
const document = {
  ...myDocument,
  pageBreakRows: {
    rows: [{
      data: [{ value: "(continued on next page)", align: "left" }]
    }],
    columns: [{ width: "2fr" }]
    style: {
        bold: true
    }
  }
}
```
### Table Gaps
Sets the spacing between tables in the document. Default value is 18 (see [Document size and measurements](#measurement)). Any section tableGap settings will override the document tableGap. 
```javascript
const document = {
  ...myDocument,
  tableGap: 5
}
```

# Section
Each [Section](/documentation/#section) can span multiple pages, and a new section will start on a new Page. Section's Headers are a little different than Document's [Headers and Footers](#document-headerfooter). Sections contains its own [Headers] () and [Tables](). 

Section can override [TableGap](#table-gaps) and [WaterMark](#watermark) from Document's settings when render that specific Section. 

```javascript
const section = {
  headers: {
    rows: [{
      data: ["My Section Header"],
  }]
    columns: [{ align: "left" }]
  },
  tables: [sectionTables],
  tableGap: 12
  watermark: {
    text: "Section Watermark",
    fontFace: "Times-Bold",
    color: "ff0000"
  }
}
const document = {
  sections: [mySection],
}
renderPdf(document)
```
# Table
Section have to have an array of Tables. Each table will have their own [Headers], [Rows], [Styles] (for [row style options](/documentation/#rowoptions)), and [Columns](#columns-setting). The style that is set here will be applied every row in the table, unless you choose to override them at the row level, which will be discussed later.
```javascript
const table = {
  headers: [{
    data: ["Label","Quantity","Rate","Total"],
    options: { bold: true },
  }],
  rows: [...dataRows],
  columns: [
   { width: "2fr" },
   { width: "1fr" },
   { width: "1fr" },
   { width: "1fr" },
  ],
  style: { grid: true }
}
const section = {
  tables:[table]
}
```
## Table Header
Table Headers are a little different than [Document and Section Headers]. They are an array of [Row]. Their styling, and column settings will be set by the table. 
```javascript
const tableHeader = {
    data: ["Label","Quantity","Rate","Total"],
  }
const table = {
  headers: [tableHeader],
  rows: [...dataRows],
}

```
# Row
Row is used by Headers, Footers, and Tables. Row contains data for an entry in a table. It also have options, which can be used to override any settings that were set by Table, when render that specific row. 
## Data
Data is an array of CellValue or Cell. Cell Value could be any strings or numbers. Cell is an object that is used when you want to specify certain setting for a cell,
# Cell
# Columns setting
# Styles/Options
# Measurement