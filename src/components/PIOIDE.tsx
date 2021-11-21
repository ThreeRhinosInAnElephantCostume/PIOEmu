import * as React from 'react'
import Theme from './Theme';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';

export default function PIOIDE() {
  return (
    <div className="ide"><CodeMirror
      value="console.log('Hello world! Welcome to the PIO IDE');"
      height="600px"
      width="35rem"
      extensions={[javascript({ jsx: true })]}
      onChange={(value, viewUpdate) => {
        console.log('value:', value);
      }}
    /></div>
  );
}

//STYLES
