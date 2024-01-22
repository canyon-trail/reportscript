---
title: Documentation
---

[reportscript](README.md) / Exports

# reportscript

## Table of contents

### Type Aliases

- [Cell](#cell)
- [CellStyle](#cellstyle)
- [CellValue](#cellvalue)
- [ColumnSetting](#columnsetting)
- [ColumnSplitFn](#columnsplitfn)
- [Document](#document)
- [FontSetting](#fontsetting)
- [HeaderFooters](#headerfooters)
- [HorizontalAlignment](#horizontalalignment)
- [Image](#image)
- [ImageCell](#imagecell)
- [Layout](#layout)
- [PageBreakRows](#pagebreakrows)
- [Row](#row)
- [RowOptions](#rowoptions)
- [Section](#section)
- [SnapshotResult](#snapshotresult)
- [Table](#table)
- [TextCell](#textcell)
- [Unit](#unit)
- [VerticalAlignment](#verticalalignment)
- [Watermark](#watermark)

### Functions

- [renderPdf](#renderpdf)
- [renderSnapshot](#rendersnapshot)
- [splitColumn](#splitcolumn)

## Type Aliases

### Cell

Ƭ **Cell**: [`ImageCell`](#imagecell) \| [`TextCell`](#textcell)

#### Defined in

[types.ts:14](https://github.com/canyon-trail/reportscript/blob/2fed1dd/src/types.ts#L14)

___

### CellStyle

Ƭ **CellStyle**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `align?` | [`HorizontalAlignment`](#horizontalalignment) |
| `backgroundColor?` | `string` |
| `bold?` | `boolean` |
| `boldFace?` | `string` |
| `bottomBorder?` | `boolean` |
| `color?` | `string` |
| `columnSpan?` | `number` |
| `fontFace?` | `string` |
| `fontSize?` | `number` |
| `grid?` | `boolean` |
| `gridColor?` | `string` |
| `lineGap?` | `number` |
| `noWrap?` | `boolean` |
| `underline?` | `boolean` |
| `verticalAlign?` | [`VerticalAlignment`](#verticalalignment) |

#### Defined in

[types.ts:48](https://github.com/canyon-trail/reportscript/blob/2fed1dd/src/types.ts#L48)

___

### CellValue

Ƭ **CellValue**: `string` \| `number`

#### Defined in

[types.ts:12](https://github.com/canyon-trail/reportscript/blob/2fed1dd/src/types.ts#L12)

___

### ColumnSetting

Ƭ **ColumnSetting**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `align?` | [`HorizontalAlignment`](#horizontalalignment) |
| `splitFn?` | [`ColumnSplitFn`](#columnsplitfn) |
| `width?` | `string` |

#### Defined in

[types.ts:100](https://github.com/canyon-trail/reportscript/blob/2fed1dd/src/types.ts#L100)

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

[types.ts:94](https://github.com/canyon-trail/reportscript/blob/2fed1dd/src/types.ts#L94)

___

### Document

Ƭ **Document**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `footers?` | [`HeaderFooters`](#headerfooters) |
| `headers?` | [`HeaderFooters`](#headerfooters) |
| `layout?` | [`Layout`](#layout) |
| `pageBreakRows?` | [`PageBreakRows`](#pagebreakrows) |
| `pageNumbers?` | `boolean` |
| `repeatReportHeaders?` | `boolean` |
| `repeatSectionHeaders?` | `boolean` |
| `sectionPageNumbers?` | `boolean` |
| `sections` | [`Section`](#section)[] |
| `tableGap?` | `number` |
| `timeStampPageNumberFontSetting?` | [`FontSetting`](#fontsetting) |
| `timestamp?` | `boolean` |
| `watermark?` | [`Watermark`](#watermark) |

#### Defined in

[types.ts:114](https://github.com/canyon-trail/reportscript/blob/2fed1dd/src/types.ts#L114)

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

[types.ts:136](https://github.com/canyon-trail/reportscript/blob/2fed1dd/src/types.ts#L136)

___

### HeaderFooters

Ƭ **HeaderFooters**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `columns?` | [`ColumnSetting`](#columnsetting)[] |
| `rows` | [`Row`](#row)[] |
| `style?` | [`RowOptions`](#rowoptions) |

#### Defined in

[types.ts:108](https://github.com/canyon-trail/reportscript/blob/2fed1dd/src/types.ts#L108)

___

### HorizontalAlignment

Ƭ **HorizontalAlignment**: ``"left"`` \| ``"center"`` \| ``"right"``

#### Defined in

[types.ts:66](https://github.com/canyon-trail/reportscript/blob/2fed1dd/src/types.ts#L66)

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

[types.ts:82](https://github.com/canyon-trail/reportscript/blob/2fed1dd/src/types.ts#L82)

___

### ImageCell

Ƭ **ImageCell**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `align` | [`HorizontalAlignment`](#horizontalalignment) |
| `backgroundColor?` | `string` |
| `bottomBorder?` | `boolean` |
| `columnSpan?` | `number` |
| `grid?` | `boolean` |
| `gridColor?` | `string` |
| `image` | [`Image`](#image) |
| `lineGap?` | `number` |
| `noWrap?` | `boolean` |
| `verticalAlign?` | [`VerticalAlignment`](#verticalalignment) |

#### Defined in

[types.ts:16](https://github.com/canyon-trail/reportscript/blob/2fed1dd/src/types.ts#L16)

___

### Layout

Ƭ **Layout**: ``"landscape"`` \| ``"portrait"``

#### Defined in

[types.ts:10](https://github.com/canyon-trail/reportscript/blob/2fed1dd/src/types.ts#L10)

___

### PageBreakRows

Ƭ **PageBreakRows**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `columns?` | [`ColumnSetting`](#columnsetting)[] |
| `rows` | [`Row`](#row)[] |
| `style?` | [`RowOptions`](#rowoptions) |

#### Defined in

[types.ts:76](https://github.com/canyon-trail/reportscript/blob/2fed1dd/src/types.ts#L76)

___

### Row

Ƭ **Row**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `data` | ([`Cell`](#cell) \| [`CellValue`](#cellvalue))[] |
| `image?` | [`Image`](#image) |
| `options?` | [`RowOptions`](#rowoptions) |

#### Defined in

[types.ts:88](https://github.com/canyon-trail/reportscript/blob/2fed1dd/src/types.ts#L88)

___

### RowOptions

Ƭ **RowOptions**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `backgroundColor?` | `string` |
| `bold?` | `boolean` |
| `boldFace?` | `string` |
| `border?` | `boolean` |
| `bottomBorder?` | `boolean` |
| `color?` | `string` |
| `fontFace?` | `string` |
| `fontSize?` | `number` |
| `grid?` | `boolean` |
| `gridColor?` | `string` |
| `lineGap?` | `number` |
| `underline?` | `boolean` |

#### Defined in

[types.ts:33](https://github.com/canyon-trail/reportscript/blob/2fed1dd/src/types.ts#L33)

___

### Section

Ƭ **Section**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `headers?` | [`HeaderFooters`](#headerfooters) |
| `tableGap?` | `number` |
| `tables` | [`Table`](#table)[] |
| `watermark?` | [`Watermark`](#watermark) |

#### Defined in

[types.ts:1](https://github.com/canyon-trail/reportscript/blob/2fed1dd/src/types.ts#L1)

___

### SnapshotResult

Ƭ **SnapshotResult**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `rendered` | `string` |
| `snapshot` | `string` |

#### Defined in

[types.ts:145](https://github.com/canyon-trail/reportscript/blob/2fed1dd/src/types.ts#L145)

___

### Table

Ƭ **Table**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `columns?` | [`ColumnSetting`](#columnsetting)[] |
| `headers?` | [`Row`](#row)[] |
| `rows` | [`Row`](#row)[] |
| `style?` | [`RowOptions`](#rowoptions) |

#### Defined in

[types.ts:69](https://github.com/canyon-trail/reportscript/blob/2fed1dd/src/types.ts#L69)

___

### TextCell

Ƭ **TextCell**: \{ `value`: [`CellValue`](#cellvalue)  } & [`CellStyle`](#cellstyle)

#### Defined in

[types.ts:29](https://github.com/canyon-trail/reportscript/blob/2fed1dd/src/types.ts#L29)

___

### Unit

Ƭ **Unit**: ``"fr"`` \| ``"%"`` \| ``"pt"``

#### Defined in

[types.ts:106](https://github.com/canyon-trail/reportscript/blob/2fed1dd/src/types.ts#L106)

___

### VerticalAlignment

Ƭ **VerticalAlignment**: ``"top"`` \| ``"center"`` \| ``"bottom"``

#### Defined in

[types.ts:67](https://github.com/canyon-trail/reportscript/blob/2fed1dd/src/types.ts#L67)

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

[types.ts:130](https://github.com/canyon-trail/reportscript/blob/2fed1dd/src/types.ts#L130)

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
| `document` | [`Document`](#document) |
| `response` | `WritableStream` |

#### Returns

`NodeJS.WritableStream`

#### Defined in

[index.ts:44](https://github.com/canyon-trail/reportscript/blob/2fed1dd/src/index.ts#L44)

___

### renderSnapshot

▸ **renderSnapshot**(`path`, `document`): [`SnapshotResult`](#snapshotresult)

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `document` | [`Document`](#document) |

#### Returns

[`SnapshotResult`](#snapshotresult)

#### Defined in

[index.ts:52](https://github.com/canyon-trail/reportscript/blob/2fed1dd/src/index.ts#L52)

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

[paginate/splitColumn.ts:4](https://github.com/canyon-trail/reportscript/blob/2fed1dd/src/paginate/splitColumn.ts#L4)
