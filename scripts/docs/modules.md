[reportscript](README.md) / Exports

# reportscript

## Table of contents

### Type Aliases

- [Cell](modules.md#cell)
- [CellOptions](modules.md#celloptions)
- [CellStyle](modules.md#cellstyle)
- [CellValue](modules.md#cellvalue)
- [ColumnSetting](modules.md#columnsetting)
- [ColumnSplitFn](modules.md#columnsplitfn)
- [Document](modules.md#document)
- [FontSetting](modules.md#fontsetting)
- [HeaderFooters](modules.md#headerfooters)
- [HorizontalAlignment](modules.md#horizontalalignment)
- [Image](modules.md#image)
- [ImageCell](modules.md#imagecell)
- [Layout](modules.md#layout)
- [PageBreakRows](modules.md#pagebreakrows)
- [Row](modules.md#row)
- [RowOptions](modules.md#rowoptions)
- [Section](modules.md#section)
- [SnapshotResult](modules.md#snapshotresult)
- [Table](modules.md#table)
- [TextCell](modules.md#textcell)
- [Unit](modules.md#unit)
- [VerticalAlignment](modules.md#verticalalignment)
- [Watermark](modules.md#watermark)

### Functions

- [renderPdf](modules.md#renderpdf)
- [renderSnapshot](modules.md#rendersnapshot)
- [splitColumn](modules.md#splitcolumn)

## Type Aliases

### Cell

Ƭ **Cell**: [`ImageCell`](modules.md#imagecell) \| [`TextCell`](modules.md#textcell)

#### Defined in

[types.ts:1](https://github.com/canyon-trail/reportscript/blob/4a17745/src/types.ts#L1)

___

### CellOptions

Ƭ **CellOptions**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `align?` | [`HorizontalAlignment`](modules.md#horizontalalignment) |
| `columnSpan?` | `number` |

#### Defined in

[types.ts:3](https://github.com/canyon-trail/reportscript/blob/4a17745/src/types.ts#L3)

___

### CellStyle

Ƭ **CellStyle**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `backgroundColor?` | `string` |
| `bottomBorder?` | `boolean` |
| `grid?` | `boolean` |
| `gridColor?` | `string` |
| `lineGap?` | `number` |
| `noWrap?` | `boolean` |
| `verticalAlign?` | [`VerticalAlignment`](modules.md#verticalalignment) |

#### Defined in

[types.ts:8](https://github.com/canyon-trail/reportscript/blob/4a17745/src/types.ts#L8)

___

### CellValue

Ƭ **CellValue**: `string` \| `number`

#### Defined in

[types.ts:18](https://github.com/canyon-trail/reportscript/blob/4a17745/src/types.ts#L18)

___

### ColumnSetting

Ƭ **ColumnSetting**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `align?` | [`HorizontalAlignment`](modules.md#horizontalalignment) |
| `splitFn?` | [`ColumnSplitFn`](modules.md#columnsplitfn) |
| `width?` | `string` |

#### Defined in

[types.ts:26](https://github.com/canyon-trail/reportscript/blob/4a17745/src/types.ts#L26)

___

### ColumnSplitFn

Ƭ **ColumnSplitFn**: (`value`: `string`, `measure`: (`text`: `string`) => `number`, `availableSpace`: `number`) => [`string`, `string`] \| [`string`]

#### Type declaration

▸ (`value`, `measure`, `availableSpace`): [`string`, `string`] \| [`string`]

##### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `string` |
| `measure` | (`text`: `string`) => `number` |
| `availableSpace` | `number` |

##### Returns

[`string`, `string`] \| [`string`]

#### Defined in

[types.ts:20](https://github.com/canyon-trail/reportscript/blob/4a17745/src/types.ts#L20)

___

### Document

Ƭ **Document**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `footers?` | [`HeaderFooters`](modules.md#headerfooters) |
| `headers?` | [`HeaderFooters`](modules.md#headerfooters) |
| `layout?` | [`Layout`](modules.md#layout) |
| `pageBreakRows?` | [`PageBreakRows`](modules.md#pagebreakrows) |
| `pageNumbers?` | `boolean` |
| `repeatReportHeaders?` | `boolean` |
| `repeatSectionHeaders?` | `boolean` |
| `sectionPageNumbers?` | `boolean` |
| `sections` | [`Section`](modules.md#section)[] |
| `tableGap?` | `number` |
| `timeStampPageNumberFontSetting?` | [`FontSetting`](modules.md#fontsetting) |
| `timestamp?` | `boolean` |
| `watermark?` | [`Watermark`](modules.md#watermark) |

#### Defined in

[types.ts:32](https://github.com/canyon-trail/reportscript/blob/4a17745/src/types.ts#L32)

___

### FontSetting

Ƭ **FontSetting**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `bold?` | `boolean` |
| `boldFace?` | `string` |
| `color?` | `string` |
| `fontFace?` | `string` |
| `fontSize?` | `number` |
| `underline?` | `boolean` |

#### Defined in

[types.ts:48](https://github.com/canyon-trail/reportscript/blob/4a17745/src/types.ts#L48)

___

### HeaderFooters

Ƭ **HeaderFooters**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `columns?` | [`ColumnSetting`](modules.md#columnsetting)[] |
| `rows` | [`Row`](modules.md#row)[] |
| `style?` | [`RowOptions`](modules.md#rowoptions) |

#### Defined in

[types.ts:57](https://github.com/canyon-trail/reportscript/blob/4a17745/src/types.ts#L57)

___

### HorizontalAlignment

Ƭ **HorizontalAlignment**: ``"left"`` \| ``"center"`` \| ``"right"``

#### Defined in

[types.ts:63](https://github.com/canyon-trail/reportscript/blob/4a17745/src/types.ts#L63)

___

### Image

Ƭ **Image**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `height` | `number` |
| `image` | `Buffer` \| `string` |
| `width?` | `number` |

#### Defined in

[types.ts:65](https://github.com/canyon-trail/reportscript/blob/4a17745/src/types.ts#L65)

___

### ImageCell

Ƭ **ImageCell**: [`CellStyle`](modules.md#cellstyle) & [`CellOptions`](modules.md#celloptions) & \{ `align`: [`HorizontalAlignment`](modules.md#horizontalalignment) ; `image`: [`Image`](modules.md#image)  }

#### Defined in

[types.ts:71](https://github.com/canyon-trail/reportscript/blob/4a17745/src/types.ts#L71)

___

### Layout

Ƭ **Layout**: ``"landscape"`` \| ``"portrait"``

#### Defined in

[types.ts:76](https://github.com/canyon-trail/reportscript/blob/4a17745/src/types.ts#L76)

___

### PageBreakRows

Ƭ **PageBreakRows**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `columns?` | [`ColumnSetting`](modules.md#columnsetting)[] |
| `rows` | [`Row`](modules.md#row)[] |
| `style?` | [`RowOptions`](modules.md#rowoptions) |

#### Defined in

[types.ts:78](https://github.com/canyon-trail/reportscript/blob/4a17745/src/types.ts#L78)

___

### Row

Ƭ **Row**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `data` | ([`Cell`](modules.md#cell) \| [`CellValue`](modules.md#cellvalue))[] |
| `image?` | [`Image`](modules.md#image) |
| `options?` | [`RowOptions`](modules.md#rowoptions) |

#### Defined in

[types.ts:89](https://github.com/canyon-trail/reportscript/blob/4a17745/src/types.ts#L89)

___

### RowOptions

Ƭ **RowOptions**: [`CellStyle`](modules.md#cellstyle) & [`FontSetting`](modules.md#fontsetting) & \{ `border?`: `boolean`  }

#### Defined in

[types.ts:95](https://github.com/canyon-trail/reportscript/blob/4a17745/src/types.ts#L95)

___

### Section

Ƭ **Section**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `headers?` | [`HeaderFooters`](modules.md#headerfooters) |
| `tableGap?` | `number` |
| `tables` | [`Table`](modules.md#table)[] |
| `watermark?` | [`Watermark`](modules.md#watermark) |

#### Defined in

[types.ts:100](https://github.com/canyon-trail/reportscript/blob/4a17745/src/types.ts#L100)

___

### SnapshotResult

Ƭ **SnapshotResult**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `rendered` | `string` |
| `snapshot` | `string` |

#### Defined in

[types.ts:107](https://github.com/canyon-trail/reportscript/blob/4a17745/src/types.ts#L107)

___

### Table

Ƭ **Table**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `columns?` | [`ColumnSetting`](modules.md#columnsetting)[] |
| `headers?` | [`Row`](modules.md#row)[] |
| `rows` | [`Row`](modules.md#row)[] |
| `style?` | [`RowOptions`](modules.md#rowoptions) |

#### Defined in

[types.ts:112](https://github.com/canyon-trail/reportscript/blob/4a17745/src/types.ts#L112)

___

### TextCell

Ƭ **TextCell**: [`CellStyle`](modules.md#cellstyle) & [`FontSetting`](modules.md#fontsetting) & [`CellOptions`](modules.md#celloptions) & \{ `value`: [`CellValue`](modules.md#cellvalue)  }

#### Defined in

[types.ts:119](https://github.com/canyon-trail/reportscript/blob/4a17745/src/types.ts#L119)

___

### Unit

Ƭ **Unit**: ``"fr"`` \| ``"%"`` \| ``"pt"``

#### Defined in

[types.ts:125](https://github.com/canyon-trail/reportscript/blob/4a17745/src/types.ts#L125)

___

### VerticalAlignment

Ƭ **VerticalAlignment**: ``"top"`` \| ``"center"`` \| ``"bottom"``

#### Defined in

[types.ts:127](https://github.com/canyon-trail/reportscript/blob/4a17745/src/types.ts#L127)

___

### Watermark

Ƭ **Watermark**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `color?` | `string` |
| `fontFace?` | `string` |
| `text` | `string` |

#### Defined in

[types.ts:129](https://github.com/canyon-trail/reportscript/blob/4a17745/src/types.ts#L129)

## Functions

### renderPdf

▸ **renderPdf**(`document`, `response`): `NodeJS.WritableStream`

Writes a Document to a NodeJS.WriteableStream and returns the stream.

Examples:

Writing to an Express HTTP response:
```javascript
router.get("/" (req, res) => {
  const document = tranformData(req);
  renderPdf(document, res);
}

function tranformData(req: Request): Document {...}
```

Writing to a blob stream and displaying in an iframe:
```javascript
import blobStream from "blob-stream";

const blob = blobStream();
const stream = reportscript.renderPdf(document, blob);
stream.on("finish", function () {
  const url = stream.toBlobURL("application/pdf");
  iframe.src = url;
});
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `document` | [`Document`](modules.md#document) |
| `response` | `WritableStream` |

#### Returns

`NodeJS.WritableStream`

#### Defined in

[index.ts:45](https://github.com/canyon-trail/reportscript/blob/4a17745/src/index.ts#L45)

___

### renderSnapshot

▸ **renderSnapshot**(`path`, `document`): [`SnapshotResult`](modules.md#snapshotresult)

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `document` | [`Document`](modules.md#document) |

#### Returns

[`SnapshotResult`](modules.md#snapshotresult)

#### Defined in

[index.ts:53](https://github.com/canyon-trail/reportscript/blob/4a17745/src/index.ts#L53)

___

### splitColumn

▸ **splitColumn**(`value`, `measure`, `availableSpace`): [`string`, `string`]

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `string` |
| `measure` | (`text`: `string`) => `number` |
| `availableSpace` | `number` |

#### Returns

[`string`, `string`]

#### Defined in

[paginate/splitColumn.ts:4](https://github.com/canyon-trail/reportscript/blob/4a17745/src/paginate/splitColumn.ts#L4)
