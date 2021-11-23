import React, {Fragment} from 'react';
import Theme from './Theme';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { ReflexContainer, ReflexElement, ReflexSplitter } from "react-reflex";

import "react-reflex/styles.css";

export const JavaScriptIDE  = () => {
  return (
    <Fragment>
      
      <ReflexContainer className="site-content" orientation="vertical">
      <ReflexElement><GetNavigation/></ReflexElement>
      <ReflexSplitter />
      <ReflexElement>
      <CodeMirror id="JAVASCRIPTIDE"
      value="console.log('Hello world! Welcome to the JavaScript IDE');"
      height="600px"
      extensions={[javascript({ jsx: true })]}
      onChange={(valueJS, viewUpdate) => {
        console.log('value:', valueJS);
      }}
    /></ReflexElement> 
    <ReflexSplitter />
    <ReflexElement>
    <CodeMirror id="PIOIDE"
      value="console.log('This is a PIO editor');"
      height="600px"
      onChange={(valueJS, viewUpdate) => {
        console.log('value:', valueJS);
      }}
    />  </ReflexElement> 
    </ReflexContainer>
    </Fragment>
  );
}

const onClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) =>  {
  console.log("You clicked a button");
};

function GetNavigation() {
    return (
  <Fragment><div style={{display: "flex", flexDirection: "column"}}>
 <button onClick={onClick}>RUN</button>
 <button onClick={onClick}>DEBUG</button>
 </div>
 </Fragment>
 )
}