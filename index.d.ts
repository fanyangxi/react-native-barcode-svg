import React from 'react';

declare class Barcode extends React.PureComponent<BarcodeProps, any> {}

export interface BarcodeProps {
  // what the barcode code stands for
  value: string;
  // barcode-format: https://github.com/lindell/JsBarcode/blob/master/src/barcodes/index.js
  format?: string;
  // The width of a single-bar (default is 2)
  singleBarWidth?: number;
  // The max-width of the barcode (default is undefined, no limitation)
  maxWidth?: number;
  // The height of the barcode, without text/value height (default is 100)
  height?: number;
  // The color of the bars
  lineColor?: string;
  // The color of the barcode
  backgroundColor?: string;
  /* error handler called when matrix fails to generate */
  onError?: Function;
}

export default Barcode;
