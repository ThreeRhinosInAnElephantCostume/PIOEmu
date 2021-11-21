import * as React from 'react'
import styled from 'styled-components';
import Theme from './Theme';
import logo from '../images/pioemu.svg';

const NavbarScroller = (props: {
  brand: { name: string; to: string },
  links: Array<{ name: string, to: string }>
}) => {
  const { brand, links } = props;
  const NavLinks: any = () => links.map((link: { name: string, to: string }) => <Li key={link.name}><a href={link.to}>{link.name}</a></Li>);
  return (
    <Navbar>
      <img src={logo} alt="PIOEMU"/>       
      <Ul>
        <NavLinks />
      </Ul>
    </Navbar >
  )
};

//STYLES

const Navbar = styled.nav`
  background: ${Theme.colors.light};
  font-family: ${Theme.fonts.code};
  text-transform: capitalize;
  color: ${Theme.colors.dark};
  display: flex;
  align-items: center;
  justify-content: space-between;
  a { color:${Theme.colors.dark}; text-decoration: none;
  :hover {color: ${Theme.colors.red};
  }}`;

const Ul = styled.ul`
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;`;

const Li = styled.li`
  flex: 1;
  -webkit-box-align: center;
  -webkit-box-pack: center;
  -webkit-tap-highlight-color: transparent;
  align-items: center;
  height: 100%;
  justify-content: center;
  text-decoration: none;
  -webkit-box-align: center;
  -webkit-box-pack: center;
  -webkit-tap-highlight-color: transparent;
  align-items: center;
  display: flex;
  font-size: 14px;
  height: 50px;
  justify-content: center;
  line-height: 16px;
  margin: 0 10px ;
  text-decoration: none;
  white-space: nowrap;`;

export default NavbarScroller;