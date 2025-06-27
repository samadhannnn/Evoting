import React, { useState, useContext } from "react";
import Image from "next/image";
import Link from "next/link";
import { AiFillLock, AiFillUnlock } from "react-icons/ai";

//INTERNAL IMPORT
import { VotingContext } from "../../context/Voter";
import Style from "./NavBar.module.css";
import loding from "../../loding.gif";

const NavBar = () => {
  const { connectWallet, error, currentAccount } = useContext(VotingContext);
  const [openNav, setOpenNav] = useState(false);

  const openNaviagtion = () => {
    setOpenNav(!openNav);
  };

  return (
    <div className={Style.navbar}>
      {error && error !== "" && (
        <div className={Style.message__Box}>
          <div className={Style.message}>
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className={Style.navbar_box}>
        <div className={Style.title}>
          <Link href={{ pathname: "/" }}>
            <span>E-Voting</span>
          </Link>
        </div>
        
        <div className={Style.connect}>
          {currentAccount ? (
            <div>
              <div
                onClick={openNaviagtion}
                className={Style.connect_flex}
              >
                <button>{currentAccount.slice(0, 10)}..</button>
                <span>{openNav ? <AiFillUnlock /> : <AiFillLock />}</span>
              </div>

              {openNav && (
                <div className={Style.navigation}>
                  <p>
                    <Link href={{ pathname: "/" }}>Home</Link>
                  </p>
                  <p>
                    <Link href={{ pathname: "candidate-regisration" }}>
                      Candidate Registration
                    </Link>
                  </p>
                  <p>
                    <Link href={{ pathname: "allowed-voters" }}>
                      Voter Registration
                    </Link>
                  </p>
                  <p>
                    <Link href={{ pathname: "voterList" }}>Voter List</Link>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={connectWallet}
              className={Style.connect_button}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavBar;