import React, { useState, useEffect, useContext } from "react";
import Image from "next/image";
import Countdown from "react-countdown";

//INTERNAL IMPORT
import { VotingContext } from "../context/Voter";
import Style from "../styles/index.module.css";
import Card from "../components/card/card";
import image from "../candidate.png";

const index = () => {
  const {
    getNewCandidate,
    candidateArray,
    giveVote,
    checkIfWalletIsConnected,
    candidateLength,
    getAllVoterData,
    currentAccount,
    voterLength,
    
    additionalCandidateData, 
  } = useContext(VotingContext);

  const [winner, setWinner] = useState(null);
  const [isVotingStarted, setIsVotingStarted] = useState(false);
  const [isVotingEnded, setIsVotingEnded] = useState(false);
  const [votingEndTime, setVotingEndTime] = useState(null);
  const [votingDuration] = useState(100000);

  const demoCandidates = [
    {
      id: "demo_1",
      candidateID: "demo_1",
      name: "Virat Kohli",
      age: 36,
      voteCount: 0,
      votes: 0,
      totalVote: 0,
      address: "0x1234567890123456789012345678901234567890",
      image: "/assets/virat.jpg", 
      _ipfs: "demo_candidate_001",
      isDemo: true
    },
    {
      id: "demo_2",
      candidateID: "demo_2",
      name: "Rohit Sharma ",
      age: 37,
      voteCount: 0,
      votes: 0,
      totalVote: 0,
      address: "0x2345678901234567890123456789012345678901",
      image: "/assets/rohit.jpg", 
      _ipfs: "demo_candidate_002",
      isDemo: true
    },
    {
      id: "demo_3",
      candidateID: "demo_3",
      name: "Jasprit Bumrah",
      age: 34,
      voteCount: 0,
      votes: 0,
      totalVote: 0,
      address: "0x3456789012345678901234567890123456789012",
      image: "/assets/jawi.jpg",
      _ipfs: "demo_candidate_003",
      isDemo: true
    }
  ];

  const [realCandidates, setRealCandidates] = useState([]);
  const [displayCandidates, setDisplayCandidates] = useState(demoCandidates);

  const mergeCandidateData = (candidate, additionalDataArray) => {
    if (!additionalDataArray || additionalDataArray.length === 0) {
      return candidate;
    }

    
    const matchingData = additionalDataArray.find(data => {
      
      if (data.name && candidate.name && data.name.toLowerCase() === candidate.name.toLowerCase()) {
        return true;
      }
      if (data.address && candidate.address && data.address.toLowerCase() === candidate.address.toLowerCase()) {
        return true;
      }
      if (data.candidateID && candidate.candidateID && data.candidateID === candidate.candidateID) {
        return true;
      }
      return false;
    });

    if (matchingData) {
      return {
        ...candidate,
        ...matchingData,
        voteCount: candidate.voteCount,
        votes: candidate.votes,
        totalVote: candidate.totalVote,
        candidateID: candidate.candidateID,
        isDemo: false
      };
    }

    return candidate;
  };

  const processRealCandidates = () => {
    if (!candidateArray || candidateArray.length === 0) {
      return [];
    }

    const additionalData = additionalCandidateData || [];

    return candidateArray.map((candidate, index) => {
      const processedCandidate = {
        id: candidate.candidateID || candidate.id || index,
        candidateID: candidate.candidateID || candidate.id || index,
        name: candidate.name || `Candidate ${index + 1}`,
        age: candidate.age || 0,
        voteCount: parseInt(candidate.voteCount || candidate.votes || candidate.totalVote || 0),
        votes: parseInt(candidate.votes || candidate.voteCount || candidate.totalVote || 0),
        totalVote: parseInt(candidate.totalVote || candidate.voteCount || candidate.votes || 0),
        address: candidate.address || '',
        image: candidate.image || image,
        _ipfs: candidate._ipfs || `candidate_${index}`,
        isDemo: false
      };

      const mergedCandidate = mergeCandidateData(processedCandidate, additionalData);

      console.log('Processed candidate:', mergedCandidate);
      return mergedCandidate;
    });
  };

  // Function to create display candidates 
  const createDisplayCandidates = (realCands) => {
    if (!realCands || realCands.length === 0) {
      console.log('No real candidates, showing demo candidates');
      return demoCandidates;
    }
    
    console.log('Real candidates found, showing real candidates:', realCands);
    return realCands;
  };

  // Function to get voting candidates 
  const getVotingCandidates = () => {
    return realCandidates;
  };

  const resetVotes = () => {
    const resetRealCandidates = realCandidates.map(candidate => ({
      ...candidate,
      voteCount: 0,
      votes: 0,
      totalVote: 0
    }));
    setRealCandidates(resetRealCandidates);
    setDisplayCandidates(createDisplayCandidates(resetRealCandidates));
  };

  // Function to start voting
  const startVoting = () => {
    const endTime = Date.now() + votingDuration;
    setVotingEndTime(endTime);
    setIsVotingStarted(true);
    setIsVotingEnded(false);
    setWinner(null);
  };

  // Function to check winner from real candidates only
  const determineWinner = () => {
    const votingCandidates = getVotingCandidates();
    
    if (!votingCandidates || votingCandidates.length === 0) {
      return { type: 'no_candidates', message: 'No registered candidates available for voting.' };
    }
    
    const sortedCandidates = [...votingCandidates].sort((a, b) => {
      const votesA = parseInt(a.voteCount || a.votes || a.totalVote || 0);
      const votesB = parseInt(b.voteCount || b.votes || b.totalVote || 0);
      return votesB - votesA;
    });
    
    const topCandidate = sortedCandidates[0];
    const topVotes = parseInt(topCandidate.voteCount || topCandidate.votes || topCandidate.totalVote || 0);
    
    if (topVotes === 0) {
      return { type: 'no_votes', message: 'No votes were cast.' };
    }
    
    const tiedCandidates = sortedCandidates.filter(candidate => 
      parseInt(candidate.voteCount || candidate.votes || candidate.totalVote || 0) === topVotes
    );
    
    if (tiedCandidates.length > 1) {
      return { type: 'tie', candidates: tiedCandidates, votes: topVotes };
    }
    
    return { type: 'winner', candidate: topCandidate, votes: topVotes };
  };

  // Countdown renderer
  const countdownRenderer = ({ hours, minutes, seconds, completed }) => {
    if (completed) {
      if (!isVotingEnded) {
        setIsVotingEnded(true);
        const result = determineWinner();
        setWinner(result);
      }
      return <span className={Style.voting_ended}>Voting Ended!</span>;
    } else {
      return (
        <span className={Style.countdown_time}>
          {hours.toString().padStart(2, '0')}:
          {minutes.toString().padStart(2, '0')}:
          {seconds.toString().padStart(2, '0')}
        </span>
      );
    }
  };

  // Vote function only works with real candidates
  const handleVote = ({ id, address }) => {
    console.log('Vote attempted for candidate ID:', id);
    
    const updatedRealCandidates = realCandidates.map(candidate => {
      if (candidate.id === id || candidate.candidateID === id) {
        const newVoteCount = (candidate.voteCount || 0) + 1;
        console.log(`Voting for ${candidate.name}: ${newVoteCount} votes`);
        return { 
          ...candidate, 
          voteCount: newVoteCount, 
          votes: newVoteCount,
          totalVote: newVoteCount
        };
      }
      return candidate;
    });
    
    setRealCandidates(updatedRealCandidates);
    setDisplayCandidates(createDisplayCandidates(updatedRealCandidates));
    
    if (giveVote && typeof giveVote === 'function') {
      try {
        giveVote({ id, address });
      } catch (error) {
        console.error('Error calling context giveVote:', error);
      }
    }
  };

  useEffect(() => {
    console.log('Context updated - candidateArray:', candidateArray);
    console.log('Context updated - additionalCandidateData:', additionalCandidateData);
    console.log('Context updated - candidateLength:', candidateLength);
    
    const processedRealCandidates = processRealCandidates();
    const newDisplayCandidates = createDisplayCandidates(processedRealCandidates);
    
    setRealCandidates(processedRealCandidates);
    setDisplayCandidates(newDisplayCandidates);
    
    console.log('Updated real candidates:', processedRealCandidates);
    console.log('Updated display candidates:', newDisplayCandidates);
    
    if (getAllVoterData && typeof getAllVoterData === 'function') {
      getAllVoterData();
    }
  }, [candidateArray, candidateLength, additionalCandidateData]); 

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        if (getNewCandidate && typeof getNewCandidate === 'function') {
          await getNewCandidate();
        }
        if (checkIfWalletIsConnected && typeof checkIfWalletIsConnected === 'function') {
          await checkIfWalletIsConnected();
        }
      } catch (error) {
        console.error('Error fetching candidates:', error);
      }
    };

    fetchCandidates();
  }, []);

  useEffect(() => {
    if (isVotingEnded) {
      const result = determineWinner();
      setWinner(result);
    }
  }, [realCandidates, isVotingEnded]);

  useEffect(() => {
    if (realCandidates.length === 0) {
      console.log('Initial load: Setting demo candidates');
      setDisplayCandidates(demoCandidates);
    }
  }, []);

  return (
    <div className={Style.home}>
      <div className={Style.winner}>
        <div className={Style.winner_info}>
          <div className={Style.candidate_list}>
            <p>
              Registered Candidates: <span>{realCandidates.length}</span>
            </p>
          </div>
          <div className={Style.candidate_list}>
            <p>
              Demo Candidates: <span>{demoCandidates.length}</span>
            </p>
          </div>
          <div className={Style.candidate_list}>
            <p>
              Registered Voters: <span>{voterLength || '0'}</span>
            </p>
          </div>
        </div>
        
        <div className={Style.winner_message}>
          {!isVotingStarted ? (
            <div className={Style.start_voting_container}>
              <h2 className={Style.start_title}>Ready to Begin Voting?</h2>
              <p className={Style.start_description}>
                {realCandidates.length > 0 
                  ? `${realCandidates.length} registered candidate(s) ready for voting. Voting duration: ${Math.floor(votingDuration / 1000)} seconds.`
                  : "No registered candidates yet. Demo candidates are shown for preview only."
                }
              </p>
              <button 
                className={Style.start_voting_button}
                onClick={startVoting}
                disabled={realCandidates.length === 0}
              >
                 Start Voting
              </button>
              
              {realCandidates.length === 0 && (
                <p className={Style.start_warning}>
                  Please register real candidates before starting the voting process. 
                  Demo candidates are for display only.
                </p>
              )}
            </div>
          ) : !isVotingEnded ? (
            <div className={Style.timer_container}>
              <h3 className={Style.timer_label}>Voting Ends In</h3>
              <div className={Style.timer_display}>
                <Countdown 
                  date={votingEndTime} 
                  renderer={countdownRenderer}
                />
              </div>
              <p className={Style.voting_status}>🟢 Voting is currently active</p>
              <p className={Style.voting_info}>
                {realCandidates.length} candidate(s) available for voting
              </p>
            </div>
          ) : (
            <div className={Style.winner_announcement}>
              {winner ? (
                winner.type === 'tie' ? (
                  <div className={Style.tie_result}>
                    <h2 className={Style.winner_title}>It's a Tie!</h2>
                    <p className={Style.tie_message}>
                      {winner.candidates.length} candidates tied with {winner.votes} votes each:
                    </p>
                    <div className={Style.tied_candidates}>
                      {winner.candidates.map((candidate, index) => (
                        <div key={candidate.id || index} className={Style.tied_candidate}>
                          <Image
                            src={candidate.image || image}
                            alt={candidate.name}
                            width={80}
                            height={80}
                            className={Style.candidate_image}
                          />
                          <p className={Style.candidate_name}>{candidate.name}</p>
                          <p className={Style.candidate_votes}>{winner.votes} votes</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : winner.type === 'winner' ? (
                  <div className={Style.winner_result}>
                    <h2 className={Style.winner_title}>🎉 We Have a Winner! 🎉</h2>
                    <div className={Style.winner_card}>
                      <Image
                        src={winner.candidate.image || image}
                        alt={winner.candidate.name}
                        width={150}
                        height={150}
                        className={Style.winner_image}
                      />
                      <h3 className={Style.winner_name}>{winner.candidate.name}</h3>
                      <p className={Style.winner_votes}>
                        Total Votes: <span className={Style.vote_count}>{winner.votes}</span>
                      </p>
                      {winner.candidate.age > 0 && (
                        <p className={Style.winner_detail}>Age: {winner.candidate.age}</p>
                      )}
                      <p className={Style.winner_detail}>ID: {winner.candidate._ipfs}</p>
                    </div>
                  </div>
                ) : (
                  <div className={Style.no_winner}>
                    <h2 className={Style.winner_title}>
                      {winner.type === 'no_candidates' ? 'No Candidates' : 'No Votes Cast'}
                    </h2>
                    <p>{winner.message}</p>
                  </div>
                )
              ) : (
                <div className={Style.no_winner}>
                  <h2 className={Style.winner_title}>Voting Completed</h2>
                  <p>Unable to determine results.</p>
                </div>
              )}
              
              <div className={Style.reset_container}>
                <button 
                  className={Style.reset_button}
                  onClick={() => {
                    setIsVotingStarted(false);
                    setIsVotingEnded(false);
                    setWinner(null);
                    setVotingEndTime(null);
                    resetVotes();
                  }}
                >
                  🔄 Start New Voting Round
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isVotingStarted && !isVotingEnded && realCandidates.length > 0 && (
        <div className={Style.voting_section}>
          <h3 className={Style.voting_title}>Cast Your Vote</h3>
          <Card 
            candidateArray={getVotingCandidates()} 
            giveVote={handleVote} 
          />
        </div>
      )}
      
      {!isVotingStarted && (
        <div className={Style.candidates_preview}>
          <h3 className={Style.preview_title}>
            {realCandidates.length > 0 
              ? `Registered Candidates (${realCandidates.length} total)` 
              : `Demo Candidates Preview (${demoCandidates.length} total)`
            }
          </h3>
          
          {realCandidates.length === 0 && (
            <p className={Style.demo_notice}>
              📋 These are demo candidates for preview only. Register real candidates to start voting.
            </p>
          )}
          
          <div className={Style.enhanced_preview_grid}>
            {displayCandidates && displayCandidates.length > 0 ? (
              displayCandidates.map((candidate, index) => (
                <div 
                  key={candidate.id || candidate.candidateID || index} 
                  className={`${Style.enhanced_preview_card} ${candidate.isDemo ? Style.demo_card : Style.real_card}`}
                >
                  {/* Candidate Header */}
                  <div className={Style.candidate_header}>
                    <div className={Style.candidate_image_container}>
                      <Image
                        src={candidate.image || image}
                        alt={candidate.name}
                        width={120}
                        height={120}
                        className={Style.candidate_image}
                      />
                      {candidate.isDemo ? (
                        <span className={Style.demo_badge}>Demo</span>
                      ) : (
                        <span className={Style.real_badge}>Registered</span>
                      )}
                    </div>
                    
                    <div className={Style.candidate_basic_info}>
                      <h4 className={Style.candidate_name}>{candidate.name}</h4>
                      {candidate.age > 0 && (
                        <p className={Style.candidate_age}>Age: {candidate.age}</p>
                      )}
                      <p className={Style.candidate_votes}>
                        Votes: {candidate.totalVote || candidate.voteCount || candidate.votes || 0}
                      </p>
                      <p className={Style.candidate_id}>
                        ID: {candidate.candidateID || candidate.id}
                      </p>
                    </div>
                  </div>

                  {/* Blockchain Information */}
                  <div className={Style.candidate_section}>
                    <h5 className={Style.section_title}>Blockchain Information</h5>
                    <div className={Style.blockchain_info}>
                      <div className={Style.address_container}>
                        <span className={Style.info_label}>Wallet Address:</span>
                        <span className={Style.address_value}>
                          {candidate.address ? 
                            `${candidate.address.substring(0, 6)}...${candidate.address.substring(candidate.address.length - 4)}` 
                            : 'N/A'
                          }
                        </span>
                      </div>
                      <div className={Style.ipfs_container}>
                        <span className={Style.info_label}>IPFS Hash:</span>
                        <span className={Style.ipfs_value}>{candidate._ipfs}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={Style.no_candidates}>
                <p>No candidates available for display.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Information Panel */}
      <div className={Style.info_panel}>
        <div className={Style.info_card}>
          <h4>📊 Voting Statistics</h4>
          <div className={Style.stats_grid}>
            <div className={Style.stat_item}>
              <span className={Style.stat_number}>{realCandidates.length}</span>
              <span className={Style.stat_label}> Registered Candidates</span>
            </div>
            <div className={Style.stat_item}>
              <span className={Style.stat_number}>{voterLength || 0}</span>
              <span className={Style.stat_label}> Registered Voters</span>
            </div>
            <div className={Style.stat_item}>
              <span className={Style.stat_number}>
                {realCandidates.reduce((total, candidate) => 
                  total + (parseInt(candidate.voteCount || candidate.votes || candidate.totalVote || 0)), 0
                )}
              </span>
              <span className={Style.stat_label}> Total Votes Cast</span>
            </div>
            <div className={Style.stat_item}>
              <span className={Style.stat_number}>{Math.floor(votingDuration / 1000)}s</span>
              <span className={Style.stat_label}> Voting Duration</span>
            </div>
          </div>
        </div>

        <div className={Style.info_card}>
          <h4>🔐 Blockchain Status</h4>
          <div className={Style.blockchain_status}>
            <div className={Style.status_item}>
              <span className={Style.status_label}>Wallet Connected:</span>
              <span className={`${Style.status_value} ${currentAccount ? Style.connected : Style.disconnected}`}>
                {currentAccount ? '✅ Connected' : '❌ Not Connected'}
              </span>
            </div>
            {currentAccount && (
              <div className={Style.status_item}>
                <span className={Style.status_label}>Account:</span>
                <span className={Style.status_value}>
                  {`${currentAccount.substring(0, 6)}...${currentAccount.substring(currentAccount.length - 4)}`}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className={Style.info_card}>
          <h4>ℹ️ How to Vote</h4>
          <div className={Style.instructions}>
            <ol className={Style.instruction_list}>
              <li>Ensure your wallet is connected to the blockchain</li>
              <li>Wait for the voting period to begin</li>
              <li>Review candidate information</li>
              <li>Click "Vote" on your preferred candidate's card</li>
              <li>Confirm the transaction in your wallet</li>
              <li>Wait for the voting period to end to see results</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Debug Information (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className={Style.debug_panel}>
          <h4>🔧 Debug Information</h4>
          <div className={Style.debug_info}>
            <p>Candidate Array Length: {candidateArray ? candidateArray.length : 0}</p>
            <p>Real Candidates: {realCandidates.length}</p>
            <p>Display Candidates: {displayCandidates.length}</p>
            <p>Voting Started: {isVotingStarted ? 'Yes' : 'No'}</p>
            <p>Voting Ended: {isVotingEnded ? 'Yes' : 'No'}</p>
            <p>Current Account: {currentAccount || 'Not connected'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default index;