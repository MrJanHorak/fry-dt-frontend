import React from "react";

function SplitText({ rate, displayWord, role }) {
  return (
    <span aria-label={displayWord} role={role}>
      {displayWord.split("").map(function (char, index) {
        let style = {"animationDelay": (index + 1 ) / rate  + "s"}
        return (
          <span aria-hidden="true" key={index} style={style}>
            {char}
          </span>
        );
      })}
    </span>
  );
}

export default SplitText;
