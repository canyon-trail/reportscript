---
layout: post
side_bar: true
refactor: true
include_tail: false
# Index page
---
# What is reportscript?
Reportscript serves as a library for generating PDF documents in both Node and Browser environments. It provides a fast, reliable way to render your multi-page, complex documents. What sets reportscript apart is its ability to support both .JS and .TS, as well as offering a wide range of features from page numbers, images, timestamps, watermarks, and more.

Check out our interactive [**demo**](/demo) feature to test out reportscript capabilities  in real time. For a more in-dept guide checkout [**documentation**](/documentation/installation).

# Quickstart
1. Install reportscript:
```terminal
npm install reportscript
```
2. Import `renderPdf`:
```javascript
import renderPdf from 'reportscript'
import fs from 'fs'
import path from 'path'
```
3. Make your document:
```javascript
const document = {
    sections: {
        tables: [
        {
            rows: [{
                data: ["hello world !!!"] 
                }],
            },
        ],
    },
}
```
4. Render your PDF to a path:

```javascript
const path = path.join("cool_name.pdf");
renderPdf(document,fs.createWriteStream(path))
```