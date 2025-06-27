import React, { useState } from "react";
import Image from "next/image";
import Style from "../card/card.module.css";
import image from "../../candidate.png";

const Card = ({ candidateArray, giveVote, changeVote, removeVote, votingDeadline }) => {
  const [votedCandidateId, setVotedCandidateId] = useState(null);
  const [transactionInProgress, setTransactionInProgress] = useState(false);
  const [votingTransactionId, setVotingTransactionId] = useState(null);
  const [hasVoted, setHasVoted] = useState(false); // New state to track if user has voted
  
  const isVotingActive = () => {
    if (!votingDeadline) return true; 
    return new Date() < new Date(votingDeadline);
  };

  const handleGiveVote = async (candidate) => {
    if (!isVotingActive() || transactionInProgress || hasVoted) return; 
    
    const candidateId = candidate.candidateID || candidate.id;
    
    // Immediately disable button and set transaction state
    setTransactionInProgress(true);
    setVotingTransactionId(candidateId);
    
    try {
      if (votedCandidateId === null) {
        // First time voting
        if (giveVote) {
          await giveVote({ id: candidateId, address: candidate.address });
        }
        setVotedCandidateId(candidateId);
        setHasVoted(true); // Set hasVoted to true after successful vote
      } else if (votedCandidateId !== candidateId) {
        if (changeVote) {
          await changeVote({ 
            oldId: votedCandidateId, 
            newId: candidateId, 
            address: candidate.address 
          });
        }
        setVotedCandidateId(candidateId);
        // hasVoted remains true since user already voted before
      }
      
      // Reset transaction state after successful vote
      setTransactionInProgress(false);
      setVotingTransactionId(null);
      
    } catch (error) {
      console.error("Voting transaction failed:", error);
      // Reset transaction state on error so user can retry
      setTransactionInProgress(false);
      setVotingTransactionId(null);
      return;
    }
  };

  const handleRemoveVote = async () => {
    if (!isVotingActive() || transactionInProgress) return;
    
    if (votedCandidateId !== null) {
      setTransactionInProgress(true);
      setVotingTransactionId(votedCandidateId);
      
      try {
        if (removeVote) {
          await removeVote({ id: votedCandidateId });
        }
        setVotedCandidateId(null);
        setHasVoted(false); // Reset hasVoted when vote is removed
        setTransactionInProgress(false);
        setVotingTransactionId(null);
      } catch (error) {
        console.error("Remove vote transaction failed:", error);
        setTransactionInProgress(false);
        setVotingTransactionId(null);
      }
    }
  };

  const getButtonText = (candidate) => {
    const candidateId = candidate.candidateID || candidate.id;
    
    if (!isVotingActive()) {
      return "Voting Closed";
    }
    
    if (transactionInProgress && votingTransactionId === candidateId) {
      return "Processing...";
    }
    
    if (votedCandidateId === candidateId) {
      return "✓ Voted";
    }
    
    if (hasVoted && votedCandidateId !== candidateId) {
      return "Vote Already Cast";
    }
    
    if (transactionInProgress) {
      return "Transaction Pending";
    }
    
    return "Give Vote";
  };

  const getButtonClass = (candidate) => {
    const candidateId = candidate.candidateID || candidate.id;
    const isCurrentVote = votedCandidateId === candidateId;
    const isTransactionPending = transactionInProgress && votingTransactionId === candidateId;
    
    let classes = Style.giveVoteBtn;
    
    // Disable all buttons if user has voted, voting is closed, or transaction in progress
    if (!isVotingActive() || hasVoted || transactionInProgress) {
      classes += ` ${Style.disabled}`;
    }
    
    if (isTransactionPending) {
      classes += ` ${Style.processing}`;
    }
    
    return classes;
  };

  const isButtonDisabled = (candidate) => {
    const candidateId = candidate.candidateID || candidate.id;
    
    // Disable all buttons if user has voted, voting is closed, or transaction in progress
    return !isVotingActive() || hasVoted || transactionInProgress;
  };

  return (
    <div className={Style.container}>
      {/* Voting Status Display */}
      {votingDeadline && (
        <div className={Style.votingStatus}>
          <p>
            Voting Status: {isVotingActive() ? "🟢 Active" : "🔴 Closed"}
            {votingDeadline && (
              <span> | Deadline: {new Date(votingDeadline).toLocaleString()}</span>
            )}
          </p>
        </div>
      )}
      
     
      
      {/* Transaction Status */}
      {transactionInProgress && (
        <div className={Style.transactionStatus}>
          <p>⏳ Transaction in progress... Please wait.</p>
        </div>
      )}
      
      {candidateArray?.map((el, i) => {
        const candidateId = el?.candidateID || el?.id;
        
        return (
          <div key={candidateId || i} className={Style.card}>
            <div className={Style.imageContainer}>
              <Image
                src={el?.image || image}
                alt={el?.name || "candidate"}
                width={100}
                height={100}
                className={Style.candidateImage}
              />
            </div>
            <div className={Style.details}>
              <h3 className={Style.candidateId}>
                #{candidateId} {el?.name && `- ${el.name}`}
              </h3>
              {el?.age && <p className={Style.age}>AGE: {el.age}</p>}
              <p className={Style.address}>
                Address: {el?.address ? `${el.address.slice(0, 20)}...` : 'N/A'}
              </p>
              <div className={Style.voteSection}>
                <span className={Style.totalVoteLabel}>Total Votes</span>
                <div className={Style.voteCount}>
                  {el?.totalVote || el?.voteCount || el?.votes || 0}
                </div>
              </div>
              <div className={Style.buttonContainer}>
                <button
                  className={getButtonClass(el)}
                  onClick={() => handleGiveVote(el)}
                  disabled={isButtonDisabled(el)}
                >
                  {getButtonText(el)}
                </button>
                
                {/* Show voted indicator for the selected candidate */}
                {votedCandidateId === candidateId && hasVoted && (
                  <div className={Style.votedStatus}>
                    <span className={Style.votedIndicator}>✅ Your Vote</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Card;