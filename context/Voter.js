import React, { useState, useEffect } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import axios from "axios";
import { useRouter } from "next/router";

//INTERNAL IMPORT
import {
  VotingAddress,
  VotingAddressABI,
  handleNetworkSwitch,
  CONTRACT_OWNER,
} from "./constants";

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_SECRECT_KEY = process.env.NEXT_PUBLIC_PINATA_SECRECT_KEY;
const PINATA_POST_URL = process.env.NEXT_PUBLIC_PINATA_POST_URL;
const PINATA_HASH_URL = process.env.NEXT_PUBLIC_PINATA_HASH_URL;
const PINATA_POST_JSON_URL = process.env.NEXT_PUBLIC_PINATA_POST_JSON_URL;

const fetchContract = (signerOrProvider) =>
  new ethers.Contract(VotingAddress, VotingAddressABI, signerOrProvider);

export const VotingContext = React.createContext();

export const VotingProvider = ({ children }) => {
  const router = useRouter();
  const [currentAccount, setCurrentAccount] = useState("");
  const [candidateLength, setCandidateLength] = useState("");
  const [loader, setLoader] = useState(false);
  const pushCandidate = [];
  const candidateIndex = [];
  const [candidateArray, setCandidateArray] = useState([]);

  const [error, setError] = useState("");
  const higestVote = [];

  const pushVoter = [];
  const [voterArray, setVoterArray] = useState([]);
  const [voterLength, setVoterLength] = useState("");
  const [voterAddress, setVoterAddress] = useState([]);

  const [votingSuccess, setVotingSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const checkIfWalletIsConnected = async () => {
    if (!window.ethereum) return setError("Please Install MetaMask");
    const network = await handleNetworkSwitch();
    const account = await window.ethereum.request({ method: "eth_accounts" });

    if (account.length) {
      setCurrentAccount(account[0]);
      return account[0];
    } else {
      setError("Please Install MetaMask Or Connect & Reload");
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask");
    const network = await handleNetworkSwitch();
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    setCurrentAccount(accounts[0]);
    setError("");
  };

  const uploadToIPFS = async (file) => {
    if (file) {
      try {
        const address = await checkIfWalletIsConnected();
        if (address) {
          setLoader(true);
          const formData = new FormData();
          formData.append("file", file);

          const response = await axios({
            method: "post",
            url: `${PINATA_POST_URL}`,
            data: formData,
            headers: {
              pinata_api_key: PINATA_API_KEY,
              pinata_secret_api_key: PINATA_SECRECT_KEY,
              "Content-Type": "multipart/form-data",
            },
          });
          const ImgHash = `${PINATA_HASH_URL}${response.data.IpfsHash}`;
          console.log("Image IPFS Hash:", response.data.IpfsHash);
          console.log("Full Image URL:", ImgHash);
          setLoader(false);
          return ImgHash;
        } else {
          setLoader(false);
          console.log("Kindly connect to your wallet");
        }
      } catch (error) {
        console.log("Unable to upload image to Pinata");
        setLoader(false);
      }
    }
  };

  const uploadToIPFSCandidate = async (file) => {
    if (file) {
      try {
        setLoader(true);
        const formData = new FormData();
        formData.append("file", file);

        const response = await axios({
          method: "post",
          url: `${PINATA_POST_URL}`,
          data: formData,
          headers: {
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRECT_KEY,
            "Content-Type": "multipart/form-data",
          },
        });
        const ImgHash = `${PINATA_HASH_URL}${response.data.IpfsHash}`;
        console.log("Candidate Image IPFS Hash:", response.data.IpfsHash);
        console.log("Candidate Full Image URL:", ImgHash);
        setLoader(false);
        return ImgHash;
      } catch (error) {
        setLoader(false);
        console.log("Unable to upload image to Pinata");
      }
    }
  };

  const createVoter = async (formInput, fileUrl) => {
    try {
      const { name, address, position } = formInput;
      const connectAddress = await checkIfWalletIsConnected();
      if (connectAddress == CONTRACT_OWNER)
        return setError("Only Owner Of Contract Can Create Voter");

      if (!name || !address || !position)
        return setError("Input Data is missing");
      setLoader(true);
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      const contract = fetchContract(signer);

      const data = JSON.stringify({ name, address, position, image: fileUrl });

      const response = await axios({
        method: "POST",
        url: `${PINATA_POST_JSON_URL}`,
        data: data,
        headers: {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRECT_KEY,
          "Content-Type": "application/json",
        },
      });

      const url = `${PINATA_HASH_URL}${response.data.IpfsHash}`;
      console.log("Voter Metadata IPFS Hash:", response.data.IpfsHash);
      console.log("Voter Metadata URL:", url);

      const voter = await contract.voterRight(address, name, url, fileUrl, {
        gasLimit: ethers.utils.hexlify(8000000),
      });
      await voter.wait();
      setLoader(false);
      window.location.href = "/voterList";
    } catch (error) {
      setLoader(false);
      setError("error: Check your API key and data");
    }
  };

  const setCandidate = async (candidateForm, fileUrl, router) => {
    const { name, address, age } = candidateForm;
    const connectAddress = await checkIfWalletIsConnected();
    if (connectAddress == CONTRACT_OWNER)
      return setError("Only Owner Of Contract Can Create Candidate");
    try {
      if (!name || !address || !age) return console.log("Data Missing");
      setLoader(true);
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      const contract = fetchContract(signer);

      const data = JSON.stringify({
        name,
        address,
        image: fileUrl,
        age,
      });

      const response = await axios({
        method: "POST",
        url: `${PINATA_POST_JSON_URL}`,
        data: data,
        headers: {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRECT_KEY,
          "Content-Type": "application/json",
        },
      });

      const url = `${PINATA_HASH_URL}${response.data.IpfsHash}`;
      
      // Console log the candidate hash values
      console.log("=== CANDIDATE HASH VALUES ===");
      console.log("Candidate Metadata IPFS Hash:", response.data.IpfsHash);
      console.log("Candidate Metadata URL:", url);
      console.log("Candidate Image URL:", fileUrl);
      console.log("Candidate Name:", name);
      console.log("Candidate Address:", address);
      console.log("Candidate Age:", age);
      console.log("=============================");

      const candidate = await contract.setCandidate(
        address,
        age,
        name,
        fileUrl,
        url,
        {
          gasLimit: ethers.utils.hexlify(8000000),
        }
      );
      await candidate.wait();
      setLoader(false);
      window.location.href = "/";
    } catch (error) {
      setLoader(false);
      setError("Something went wrong, check your API Key");
    }
  };

  const getAllVoterData = async () => {
    try {
      const address = await checkIfWalletIsConnected();
      if (address) {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();
        const contract = fetchContract(signer);
        //VOTER LIST
        const voterListData = await contract.getVoterList();
        setVoterAddress(voterListData);

        const items = await Promise.all(
          voterListData.map(async (el) => {
            try {
              const singleVoterData = await contract.getVoterData(el);
              
              if (!singleVoterData || singleVoterData.length < 7) {
                console.warn(`Incomplete voter data for address: ${el}`);
                return null;
              }

              return {
                voterID: singleVoterData[0]?.toNumber() || 0,
                name: singleVoterData[1] || "",
                image: singleVoterData[4] || "",
                voterVote: singleVoterData[5]?.toNumber() || 0,
                ipfs: singleVoterData[2] || "",
                address: singleVoterData[3] || el,
                votingStatus: singleVoterData[6] || false,
              };
            } catch (error) {
              console.error(`Error fetching voter data for ${el}:`, error);
              return null;
            }
          })
        );
        
        const validItems = items.filter(item => item !== null);
        setVoterArray(validItems);

        //VOTER LENGTH
        const voterList = await contract.getVoterLength();
        setVoterLength(voterList.toNumber());
      } else {
        setError("Connect to wallet");
      }
    } catch (error) {
      console.error("Error in getAllVoterData:", error);
      setError("Something went wrong");
    }
  };

  const refreshVotingData = async () => {
    try {
      await Promise.all([
        getNewCandidate(),
        getAllVoterData()
      ]);
    } catch (error) {
      console.error("Error refreshing voting data:", error);
    }
  };

  const giveVote = async (id) => {
    try {
      const connectAddress = await checkIfWalletIsConnected();
      if (connectAddress == CONTRACT_OWNER)
        return setError("Owner Can not give vote");
      
      setLoader(true);
      setError(""); 
      setVotingSuccess(false); 
      
      const voterAddress = id.address;
      const voterId = id.id;
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      const contract = fetchContract(signer);

      const voteredList = await contract.vote(voterAddress, voterId, {
        gasLimit: ethers.utils.hexlify(8000000),
      });

      await voteredList.wait();
      
      setLoader(false);
      setVotingSuccess(true);
      setSuccessMessage("Vote cast successfully!");
      
      await refreshVotingData();
      
      setTimeout(() => {
        setVotingSuccess(false);
        setSuccessMessage("");
      }, 3000);
      
    } catch (error) {
      setError("Sorry!, You have already voted or an error occurred");
      setLoader(false);
      setVotingSuccess(false);
      console.error("Voting error:", error);
    }
  };

  // New castVote function - alternative approach for votercard.js
  const castVote = async (candidateData) => {
    try {
      console.log("Casting vote for candidate:", candidateData);
      
      const connectAddress = await checkIfWalletIsConnected();
      if (!connectAddress) {
        setError("Please connect your wallet first");
        return false;
      }

      if (connectAddress.toLowerCase() === CONTRACT_OWNER.toLowerCase()) {
        setError("Contract owner cannot vote");
        return false;
      }
      
      setLoader(true);
      setError("");
      setVotingSuccess(false);
      
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      const contract = fetchContract(signer);

      let candidateAddress, candidateId;
      
      if (candidateData.address && candidateData.candidateID !== undefined) {
        candidateAddress = candidateData.address;
        candidateId = candidateData.candidateID;
      } else if (candidateData.id && candidateData.address) {
        candidateAddress = candidateData.address;
        candidateId = candidateData.id;
      } else {
        throw new Error("Invalid candidate data structure");
      }

      console.log("Voting with parameters:", {
        candidateAddress,
        candidateId
      });

      const voteTransaction = await contract.vote(candidateAddress, candidateId, {
        gasLimit: ethers.utils.hexlify(8000000),
      });

      console.log("Vote transaction submitted:", voteTransaction.hash);
      
      const receipt = await voteTransaction.wait();
      console.log("Vote transaction confirmed:", receipt);
      
      setLoader(false);
      setVotingSuccess(true);
      setSuccessMessage(`Vote cast successfully for ${candidateData.name || 'candidate'}!`);
      
      await refreshVotingData();
      
      setTimeout(() => {
        setVotingSuccess(false);
        setSuccessMessage("");
      }, 5000);
      
      return true;
      
    } catch (error) {
      console.error("Error casting vote:", error);
      setLoader(false);
      setVotingSuccess(false);
      
      if (error.message.includes("already voted")) {
        setError("You have already voted in this election");
      } else if (error.message.includes("not authorized")) {
        setError("You are not authorized to vote");
      } else if (error.message.includes("user rejected")) {
        setError("Transaction was rejected");
      } else {
        setError("Failed to cast vote. Please try again.");
      }
      
      return false;
    }
  };

  // Function to check if current user has already voted
  const checkVotingStatus = async () => {
    try {
      const connectAddress = await checkIfWalletIsConnected();
      if (!connectAddress) return false;

      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      const contract = fetchContract(signer);

      // Check if  current address has voted
      const voterData = await contract.getVoterData(connectAddress);
      return voterData[6]; // votingStatus
    } catch (error) {
      console.error("Error checking voting status:", error);
      return false;
    }
  };

  const getNewCandidate = async () => {
    try {
      const address = await checkIfWalletIsConnected();
      if (!address) {
        setError("Connect to wallet");
        return;
      }

      setLoader(true);
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      const contract = fetchContract(signer);
      
      // Get all candidate addresses
      const allCandidate = await contract.getCandidate();
      console.log("All candidate addresses:", allCandidate);

      if (!allCandidate || allCandidate.length === 0) {
        console.log("No candidates found");
        setCandidateArray([]);
        setCandidateLength(0);
        setLoader(false);
        return;
      }

      const items = await Promise.all(
        allCandidate.map(async (candidateAddress, index) => {
          try {
            console.log(`Fetching data for candidate ${index + 1}:`, candidateAddress);
            
            const singleCandidateData = await contract.getCandidateData(candidateAddress);
            console.log("Raw candidate data:", singleCandidateData);

            if (!singleCandidateData || singleCandidateData.length < 6) {
              console.warn(`Incomplete candidate data for address: ${candidateAddress}`);
              return null;
            }

            const candidateInfo = {
              age: singleCandidateData[0] ? singleCandidateData[0].toString() : "0",
              name: singleCandidateData[1] || "Unknown",
              candidateID: singleCandidateData[2] ? singleCandidateData[2].toNumber() : index,
              image: singleCandidateData[3] || "",
              totalVote: singleCandidateData[4] ? singleCandidateData[4].toNumber() : 0,
              ipfs: singleCandidateData[5] || "",
              address: candidateAddress
            };

            // Console log each candidate's hash values
            console.log("=== RETRIEVED CANDIDATE DATA ===");
            console.log("Candidate Address:", candidateAddress);
            console.log("Candidate Name:", candidateInfo.name);
            console.log("Candidate ID:", candidateInfo.candidateID);
            console.log("Candidate Image Hash:", candidateInfo.image);
            console.log("Candidate IPFS Hash:", candidateInfo.ipfs);
            console.log("Total Votes:", candidateInfo.totalVote);
            console.log("Age:", candidateInfo.age);
            console.log("===============================");

            return candidateInfo;
          } catch (error) {
            console.error(`Error fetching candidate data for ${candidateAddress}:`, error);
            return null;
          }
        })
      );

      // Filter out null values (failed requests)
      const validCandidates = items.filter(item => item !== null);
      
      setCandidateArray(validCandidates);
      console.log("Valid candidates array:", validCandidates);

      // Get candidate length from contract
      try {
        const allCandidateLength = await contract.getCandidateLength();
        setCandidateLength(allCandidateLength.toNumber());
      } catch (error) {
        console.error("Error getting candidate length:", error);
        setCandidateLength(validCandidates.length);
      }

      setLoader(false);
    } catch (error) {
      console.error("Error in getNewCandidate:", error);
      setError("Error fetching candidates. Please try again.");
      setLoader(false);
      setCandidateArray([]);
      setCandidateLength(0);
    }
  };

  return (
    <VotingContext.Provider
      value={{
        currentAccount,
        connectWallet,
        uploadToIPFS,
        createVoter,
        setCandidate,
        getNewCandidate,
        giveVote,
        castVote, 
        checkVotingStatus, 
        pushCandidate,
        candidateArray,
        uploadToIPFSCandidate,
        getAllVoterData,
        voterArray,
        checkIfWalletIsConnected,
        error,
        candidateLength,
        voterLength,
        loader,
        votingSuccess,
        successMessage,
        refreshVotingData,
      }}
    >
      {children}
    </VotingContext.Provider>
  );
};