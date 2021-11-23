import React, { Component } from 'react';
import Theme from './Theme';
import CodeMirror from '@uiw/react-codemirror';


type MyProps = {
  code: string;
};

type MyState = {
  height: string;
  width: string;
  value: string
};

export default class ParentIDE extends React.Component<MyProps, MyState> {
  state: MyState = {
    height: "600px",
    width: "35rem",
    value: "console.log('This is Parent IDE');"
  };
  render() {
    return (
      <div className="ide"><CodeMirror
      value={this.state.value}
      height={this.state.height}
      width={this.state.width}
      onChange={(value, viewUpdate) => {
        console.log('value:', value);
      }}
    /></div>
    );
  }
}
//STYLES
