import React from "react";

//INTERNAL IMPORT
import Style from "./Input.module.css";

const Input = ({ inputType, title, placeholder, handleClick, value }) => {
  return (
    <div className={Style.input}>
      <p className={Style.input__title}>{title}</p>
      <div className={Style.input__box}>
        <input
          type={inputType}
          className={Style.input__box__form}
          placeholder={placeholder}
          onChange={handleClick}
          value={value}
        />
      </div>
    </div>
  );
};

export default Input;