import React, { Component } from 'react';
import Theme from './Theme';
import CodeMirror from '@uiw/react-codemirror';

type State = {
  state?: string,
  text?: string
}

class ParentIDE extends React.Component<State> {
  render() {
    return (
    <CodeMirror
      value="This is a parent IDE. You should not see this"
      height="600px"
      width="35rem"
    />
  );
  }
}

export default ParentIDE; 

//STYLES
