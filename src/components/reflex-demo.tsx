import React from "react";

import { ReflexContainer, ReflexElement, ReflexSplitter } from "react-reflex";

import "react-reflex/styles.css";


const Demo = () => {
  return (
    <div className="reflex">
      <ReflexContainer className="site-content" orientation="vertical">

        <ReflexElement className="nav-panel">
              nav panel
        </ReflexElement>

        <ReflexSplitter />

        <ReflexElement className="workboard" >
          JAVASCRIPTIDE
        </ReflexElement>

        <ReflexSplitter />

        <ReflexElement className="workboard" >
          PIOIDE
        </ReflexElement>
      </ReflexContainer>
    </div>
  );
};
export default Demo;
