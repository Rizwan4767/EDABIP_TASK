// Ambient module declaration for .svg files imported as React components
// via react-native-svg-transformer.
//
// IMPORTANT: imports must live INSIDE the declare module block.
// Top-level imports would convert this file into an ES module and break
// the ambient declaration.
declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}
