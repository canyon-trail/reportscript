---
title: Render options
---
1. Rendering to a path

```javascript
import fs from 'fs'
import path from 'path'

const path = path.join("cool_name.pdf");
renderPdf(document,fs.createWriteStream(path))
```
2. Rendering to note
3. Rendering in Browser
4. Rendering using express