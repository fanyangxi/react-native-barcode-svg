import React from 'react';

declare class Barcode extends React.PureComponent<BarcodeProps, any> {}

export interface BarcodeProps {
  // what the barcode code stands for
  value: string;
  // barcode-format: https://github.com/lindell/JsBarcode/blob/master/src/barcodes/index.js
  format?: string;
  // The width of a single-bar
  singleBarWidth?: number;
  // The max-width of the barcode
  maxWidth?: number;
  // The height of the barcode
  height?: number;
  // The color of the bars
  lineColor?: string;
  //
  backgroundColor?: string;
  /* error handler called when matrix fails to generate */
  onError?: Function;
}

export default Barcode;
