import * as React from 'react'
import Theme from './Theme';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';

type State = {
  state: string}

export const JavaScriptIDE  = ( { state }: State) => {
  return (
    <CodeMirror
      value="console.log('Hello world! Welcome to the  JavaScript IDE');"
      height="600px"
      width="35rem"
      extensions={[javascript({ jsx: true })]}
      onChange={(valueJS, viewUpdate) => {
        if (state === "run") console.log('Run value:', valueJS);
        else if (state === "debug") console.log('Debug value:', valueJS);
      }}
    />
  );
}

//STYLES
