import React, { useState } from "react";
import Image from "next/image";
import Style from "../card/card.module.css";
import voterCardStyle from "./voterCard.module.css";

const VoterCard = ({ voterArray, onVoteClick, loading = false, updateVoterStatus }) => {
  const [votingInProgress, setVotingInProgress] = useState(new Set());
  const [imageErrors, setImageErrors] = useState(new Set());

  // Cast Vote Function
  const castVote = async (voter, selectedCandidate = null) => {
    try {
      if (!voter || !voter.voterID) {
        throw new Error('Invalid voter data');
      }

      if (voter.votingStatus) {
        throw new Error('Voter has already cast their vote');
      }

      const voteData = {
        voterID: voter.voterID,
        voterName: voter.name,
        candidateID: selectedCandidate?.id || null,
        candidateName: selectedCandidate?.name || null,
        constituency: voter.constituency,
        timestamp: new Date().toISOString(),
      };

      console.log('Sending vote data:', voteData);

      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voteData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          const errorText = await response.text();
          console.log('Non-JSON error response:', errorText);
          if (response.status === 404) {
            errorMessage = 'Vote API endpoint not found. Please check if /api/vote exists.';
          }
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Vote result:', result);
      
      return {
        success: true,
        message: 'Vote cast successfully',
        data: result
      };

    } catch (error) {
      console.error('Error casting vote:', error);
      
      return {
        success: false,
        message: error.message || 'Failed to cast vote',
        error: error
      };
    }
  };

  const handleVoteAction = async (voter) => {
    if (voter.votingStatus || votingInProgress.has(voter.voterID)) {
      return;
    }

    setVotingInProgress(prev => new Set(prev).add(voter.voterID));
    
    try {
      if (onVoteClick) {
        await onVoteClick(voter);
      } else {
        const result = await castVote(voter);
        
        if (result.success) {
          if (updateVoterStatus) {
            updateVoterStatus(voter.voterID, true);
          }
          
          alert('Vote cast successfully!');
        } else {
          alert(`Error: ${result.message}`);
        }
      }
    } catch (error) {
      console.error('Vote action error:', error);
      alert('An unexpected error occurred while casting vote');
    } finally {
      setVotingInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(voter.voterID);
        return newSet;
      });
    }
  };

  const handleImageError = (voterID) => {
    setImageErrors(prev => new Set(prev).add(voterID));
  };

  const getImageSrc = (voter) => {
    const imageSource = voter.profileImage || voter.image;
    
    if (imageSource && !imageErrors.has(voter.voterID)) {
      if (imageSource.startsWith('data:')) {
        return imageSource;
      } else if (imageSource.startsWith('http') || imageSource.startsWith('/')) {
        return imageSource;
      } else {
        return `/uploads/${imageSource}`;
      }
    }
    
    return null;
  };

  const getStatusBadge = (voter) => {
    if (voter.votingStatus) {
      return (
        <div className={`${voterCardStyle.votingStatusBadge} ${voterCardStyle.voted}`}>
          ✓ Voted
        </div>
      );
    }
    return (
      <div className={`${voterCardStyle.votingStatusBadge} ${voterCardStyle.notVoted}`}>
        Pending
      </div>
    );
  };

  const getVoteButton = (voter) => {
    const isVoting = votingInProgress.has(voter.voterID);
    
    if (voter.votingStatus) {
      return (
        <button 
          className={voterCardStyle.voteButton} 
          disabled
          style={{ 
            background: 'linear-gradient(135deg, #10b981, #059669)',
            cursor: 'default'
          }}
        >
          ✓ Vote Recorded
        </button>
      );
    }

    return (
      <button 
        className={voterCardStyle.voteButton}
        onClick={() => handleVoteAction(voter)}
        disabled={isVoting || loading}
      >
        {isVoting ? (
          <>
            <span style={{ marginRight: '0.5rem' }}>⏳</span>
            Processing...
          </>
        ) : (
          <>
            <span style={{ marginRight: '0.5rem' }}>🗳️</span>
            Cast Vote
          </>
        )}
      </button>
    );
  };

  const renderVoterImage = (voter) => {
    const imageSrc = getImageSrc(voter);
    
    if (imageSrc) {
      return (
        <Image
          src={imageSrc}
          alt={`${voter.name}'s profile photo`}
          width={80}
          height={80}
          className={voterCardStyle.voterImage}
          loading="lazy"
          onError={() => handleImageError(voter.voterID)}
          style={{ objectFit: 'cover', borderRadius: '50%' }}
        />
      );
    }
    
    // Show placeholder when no image is available
    return (
      <div 
        className={voterCardStyle.voterImagePlaceholder}
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          color: '#9ca3af',
          border: '2px solid #e5e7eb'
        }}
      >
        👤
      </div>
    );
  };

  if (!voterArray || voterArray.length === 0) {
    return (
      <div className={voterCardStyle.voterContainer}>
        <div className={voterCardStyle.emptyState}>
          <p>No voters found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={Style.card}>
      {voterArray?.map((voter, index) => (
        <div 
          key={voter.voterID || index} 
          className={`${Style.card_box} ${voterCardStyle.voterCard} ${loading ? voterCardStyle.loading : ''}`}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {getStatusBadge(voter)}
          
          <div className={Style.image}>
            {renderVoterImage(voter)}
          </div>
          
          <div className={Style.card_info}>
            <h2>
             
              <span className={voterCardStyle.voter_id}> ID: {voter.voterID}</span><br/>
               {voter.name} 
            </h2>
            
            <p className={voterCardStyle.voter_address}>
              Address: {voter.address?.length > 30 
                ? `${voter.address.slice(0, 30)}...` 
                : voter.address || 'No address provided'
              }
            </p>

            {voter.constituency && (
              <p className={voterCardStyle.voter_constituency}>
                Constituency: {voter.constituency}
              </p>
            )}

            {voter.age && (
              <p className={voterCardStyle.voter_details}>
                Age: {voter.age} {voter.gender && `| Gender: ${voter.gender}`}
              </p>
            )}
            
            
            <div className={voterCardStyle.voter_stat}>
              <span className={voter.votingStatus ? voterCardStyle.active : voterCardStyle.inactive}></span>
              <p className={`${voterCardStyle.vote_Status} ${voter.votingStatus ? voterCardStyle.voted : voterCardStyle.not_voted}`}>
                {voter.votingStatus === true ? "Vote Recorded" : "Not Yet Voted"}
              </p>
            </div>
          </div>

          {getVoteButton(voter)}
        </div>
      ))}
    </div>
  );
};

export default VoterCard;