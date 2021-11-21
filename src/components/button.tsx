import React, { Component } from 'react';
import styled from 'styled-components';
import Theme from './Theme';

type MyProps = {
  title: string
  state?: string
}

class StyledButton extends React.Component<MyProps> {
  changeState () {}
  render() {
    return (<Button onClick={this.changeState} id={ this.props.title }>{ this.props.title }</Button>)
  }
}
export default StyledButton; 

const Button = styled.button`
  background: ${Theme.colors.dark};
  font-family: ${Theme.fonts.code};
  color: ${Theme.colors.light};
  padding: 15px;
  border: none;
  margin: 20px;
  font-size: 16px;
  text-transform: lowercase;
  :disabled {
    opacity: 0.4;
  }
  :hover {
    background: ${Theme.colors.green};
  }
`;