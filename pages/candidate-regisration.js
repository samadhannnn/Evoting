import { useState, useMemo, useCallback, useContext, useEffect } from "react";
import { useRouter } from "next/router";
import { useDropzone } from "react-dropzone";
import Image from "next/image";

//INTERNAL IMPORT
import { VotingContext } from "../context/Voter";
import Style from "../styles/allowedVoter.module.css";
import images from "../assets";
import Button from "../components/Button/Button";
import Input from "../components/Input/Input";
import Loader from "../components/Loader";

const candidateRegistration = () => {
  const [fileUrl, setFileUrl] = useState(null);
  const [currentSection, setCurrentSection] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [completedSections, setCompletedSections] = useState(new Set());
  
  const {
    uploadToIPFSCandidate,
    setCandidate,
    getNewCandidate,
    candidateArray,
    loader,
  } = useContext(VotingContext);
  
  // Enhanced form state with additional fields
  const [candidateForm, setCandidateForm] = useState({
    name: "",
    address: "",
    age: "",
    politicalParty: "",
    education: "",
    profession: "",
    experience: "",
    manifesto: "",
    email: "",
    phone: "",
    constituency: "",
    slogan: "",
    previousOffices: "",
    achievements: "",
    socialMediaLinks: {
      twitter: "",
      facebook: "",
      instagram: "",
      linkedin: ""
    }
  });

  const [ageError, setAgeError] = useState("");

  const router = useRouter();

  // Store additional candidate data in memory instead of localStorage
  const [additionalCandidateData, setAdditionalCandidateData] = useState([]);

  const saveAdditionalCandidateData = (candidateData) => {
    try {
      const newCandidateData = {
        ...candidateData,
        id: Date.now(),
        registrationDate: new Date().toISOString(),
        image: fileUrl
      };
      setAdditionalCandidateData(prev => [...prev, newCandidateData]);
    } catch (error) {
      console.error('Error saving additional candidate data:', error);
    }
  };

  // Age validation function
  const validateAge = (age) => {
    const numAge = parseInt(age);
    if (isNaN(numAge)) {
      setAgeError("Please enter a valid age");
      return false;
    }
    if (numAge < 18) {
      setAgeError("Candidate must be at least 18 years old");
      return false;
    }
    if (numAge > 120) {
      setAgeError("Please enter a valid age");
      return false;
    }
    setAgeError("");
    return true;
  };

  const validateBasicInfo = () => {
    return candidateForm.name && 
           candidateForm.address && 
           candidateForm.age && 
           candidateForm.email && 
           candidateForm.phone &&
           validateAge(candidateForm.age);
  };

  const validatePoliticalInfo = () => {
    return candidateForm.politicalParty && candidateForm.constituency;
  };

  const validateProfessionalInfo = () => {
    return candidateForm.education && candidateForm.profession;
  };

  const validateAdditionalInfo = () => {
    return candidateForm.manifesto.trim().length > 0;
  };

  const validateSocialMedia = () => {
    return true;
  };

  const [sectionData, setSectionData] = useState({});

  const saveSectionData = (sectionName) => {
    try {
      const newSectionData = {
        ...sectionData,
        [sectionName]: {
          ...candidateForm,
          timestamp: new Date().toISOString()
        }
      };
      setSectionData(newSectionData);
      
      // Mark section as completed
      setCompletedSections(prev => new Set([...prev, sectionName]));
      
      alert(`${sectionName} section saved successfully!`);
    } catch (error) {
      console.error(`Error saving ${sectionName} section:`, error);
      alert(`Error saving ${sectionName} section. Please try again.`);
    }
  };

  // Check if all required sections are completed
  const allSectionsCompleted = () => {
    return completedSections.has('basic') && 
           completedSections.has('political') && 
           completedSections.has('professional') &&
           fileUrl;
  };

  // Check if user can navigate to a section
  const canNavigateToSection = (section) => {
    switch(section) {
      case 'basic':
        return true;
      case 'political':
        return completedSections.has('basic');
      case 'professional':
        return completedSections.has('basic') && completedSections.has('political');
      case 'additional':
        return completedSections.has('basic') && completedSections.has('political') && completedSections.has('professional');
      case 'social':
        return completedSections.has('basic') && completedSections.has('political') && completedSections.has('professional');
      default:
        return false;
    }
  };

  //-------------VOTERS
  const onDrop = useCallback(async (acceptedFile) => {
    try {
      setIsLoading(true);
      const url = await uploadToIPFSCandidate(acceptedFile[0]);
      console.log('Uploaded to IPFS:', url);
      setFileUrl(url);
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [uploadToIPFSCandidate]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: "image/*",
    maxSize: 5000000,
  });

  // Enhanced submit handler
  const handleCandidateSubmit = async () => {
    try {
      if (!allSectionsCompleted()) {
        alert('Please complete all required sections before registering.');
        return;
      }

      setIsLoading(true);

      // Save additional data
      saveAdditionalCandidateData(candidateForm);
      
      // Call original smart contract function with required fields only
      await setCandidate(
        {
          name: candidateForm.name,
          address: candidateForm.address,
          age: candidateForm.age
        }, 
        fileUrl, 
        router
      );
    } catch (error) {
      console.error('Error registering candidate:', error);
      alert("Only Admin can register the candidate's ");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const fetchCandidates = async () => {
      try {
        if (getNewCandidate && typeof getNewCandidate === 'function') {
          await getNewCandidate();
        }
      } catch (error) {
        console.error('Error fetching candidates:', error);
      }
    };

    if (isMounted && getNewCandidate) {
      fetchCandidates();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Section navigation
  const goToSection = (section) => {
    if (canNavigateToSection(section)) {
      setCurrentSection(section);
    } else {
      alert('Please complete previous sections first.');
    }
  };

  const goToNextSection = (currentSec, nextSec, validator) => {
    if (validator()) {
      saveSectionData(currentSec);
      setCurrentSection(nextSec);
    } else {
      alert(`Please fill in all required fields in the ${currentSec} section.`);
    }
  };

  const renderSectionButtons = () => (
    <div className={Style.sectionButtons}>
      <button
        onClick={() => goToSection('basic')}
        className={`${Style.sectionButton} ${currentSection === 'basic' ? Style.active : ''} ${completedSections.has('basic') ? Style.completed : ''}`}
        disabled={!canNavigateToSection('basic')}
      >
        Basic Info {completedSections.has('basic') && '✓'}
      </button>
      <button
        onClick={() => goToSection('political')}
        className={`${Style.sectionButton} ${currentSection === 'political' ? Style.active : ''} ${completedSections.has('political') ? Style.completed : ''}`}
        disabled={!canNavigateToSection('political')}
      >
        Political Info {completedSections.has('political') && '✓'}
      </button>
      <button
        onClick={() => goToSection('professional')}
        className={`${Style.sectionButton} ${currentSection === 'professional' ? Style.active : ''} ${completedSections.has('professional') ? Style.completed : ''}`}
        disabled={!canNavigateToSection('professional')}
      >
        Professional {completedSections.has('professional') && '✓'}
      </button>
      <button
        onClick={() => goToSection('additional')}
        className={`${Style.sectionButton} ${currentSection === 'additional' ? Style.active : ''} ${completedSections.has('additional') ? Style.completed : ''}`}
        disabled={!canNavigateToSection('additional')}
      >
        Additional Info {completedSections.has('additional') && '✓'}
      </button>
      <button
        onClick={() => goToSection('social')}
        className={`${Style.sectionButton} ${currentSection === 'social' ? Style.active : ''} ${completedSections.has('social') ? Style.completed : ''}`}
        disabled={!canNavigateToSection('social')}
      >
        Social Media {completedSections.has('social') && '✓'}
      </button>
    </div>
  );

  const renderBasicInfoSection = () => (
    <div className={`${Style.section} ${currentSection === 'basic' ? Style.activeSection : Style.hiddenSection}`}>
      <h3 className={Style.sectionTitle}>
        Basic Information *Required
      </h3>
      
      <Input
        inputType="text"
        title="Full Name *"
        placeholder="Candidate Full Name"
        value={candidateForm.name}
        handleClick={(e) =>
          setCandidateForm({ ...candidateForm, name: e.target.value })
        }
      />
      <Input
        inputType="text"
        title="Wallet Address *"
        placeholder="Ethereum Wallet Address"
        value={candidateForm.address}
        handleClick={(e) =>
          setCandidateForm({ ...candidateForm, address: e.target.value })
        }
      />
      <div>
        <Input
          inputType="text"
          title="Age *"
          placeholder="Candidate Age (minimum 18)"
          value={candidateForm.age}
          handleClick={(e) => {
            setCandidateForm({ ...candidateForm, age: e.target.value });
            if (e.target.value) {
              validateAge(e.target.value);
            }
          }}
        />
        {ageError && <div className={Style.errorMessage}>{ageError}</div>}
      </div>
      <Input
        inputType="email"
        title="Email Address *"
        placeholder="candidate@example.com"
        value={candidateForm.email}
        handleClick={(e) =>
          setCandidateForm({ ...candidateForm, email: e.target.value })
        }
      />
      <Input
        inputType="tel"
        title="Phone Number *"
        placeholder="+91 98765XXXXX"
        value={candidateForm.phone}
        handleClick={(e) =>
          setCandidateForm({ ...candidateForm, phone: e.target.value })
        }
      />

      <div className={Style.sectionButtons}>
        <Button
          btnName="Save Basic Info"
          handleClick={() => saveSectionData('basic')}
        />
        <Button
          btnName="Next: Political Info"
          handleClick={() => goToNextSection('basic', 'political', validateBasicInfo)}
        />
      </div>
    </div>
  );

  const renderPoliticalInfoSection = () => (
    <div className={`${Style.section} ${currentSection === 'political' ? Style.activeSection : Style.hiddenSection}`}>
      <h3 className={Style.sectionTitle}>
        Political Information *Required
      </h3>
      
      <Input
        inputType="text"
        title="Political Party *"
        placeholder="Party Affiliation"
        value={candidateForm.politicalParty}
        handleClick={(e) =>
          setCandidateForm({ ...candidateForm, politicalParty: e.target.value })
        }
      />
      <Input
        inputType="text"
        title="Constituency *"
        placeholder="Electoral Constituency/District"
        value={candidateForm.constituency}
        handleClick={(e) =>
          setCandidateForm({ ...candidateForm, constituency: e.target.value })
        }
      />
      <Input
        inputType="text"
        title="Campaign Slogan"
        placeholder="Your campaign slogan"
        value={candidateForm.slogan}
        handleClick={(e) =>
          setCandidateForm({ ...candidateForm, slogan: e.target.value })
        }
      />

      <div className={Style.sectionButtons}>
        <Button
          btnName="Previous: Basic Info"
          handleClick={() => goToSection('basic')}
        />
        <Button
          btnName="Save Political Info"
          handleClick={() => saveSectionData('political')}
        />
        <Button
          btnName="Next: Professional"
          handleClick={() => goToNextSection('political', 'professional', validatePoliticalInfo)}
        />
      </div>
    </div>
  );

  const renderProfessionalInfoSection = () => (
    <div className={`${Style.section} ${currentSection === 'professional' ? Style.activeSection : Style.hiddenSection}`}>
      <h3 className={Style.sectionTitle}>
        Professional Background *Required
      </h3>
      
      <Input
        inputType="text"
        title="Education *"
        placeholder="Educational Qualifications"
        value={candidateForm.education}
        handleClick={(e) =>
          setCandidateForm({ ...candidateForm, education: e.target.value })
        }
      />
      <Input
        inputType="text"
        title="Profession/Occupation *"
        placeholder="Current/Previous Profession"
        value={candidateForm.profession}
        handleClick={(e) =>
          setCandidateForm({ ...candidateForm, profession: e.target.value })
        }
      />
      <Input
        inputType="text"
        title="Years of Experience"
        placeholder="Professional/Political Experience"
        value={candidateForm.experience}
        handleClick={(e) =>
          setCandidateForm({ ...candidateForm, experience: e.target.value })
        }
      />
      <Input
        inputType="text"
        title="Previous Offices Held"
        placeholder="Any previous elected positions"
        value={candidateForm.previousOffices}
        handleClick={(e) =>
          setCandidateForm({ ...candidateForm, previousOffices: e.target.value })
        }
      />

      <div className={Style.sectionButtons}>
        <Button
          btnName="Previous: Political"
          handleClick={() => goToSection('political')}
        />
        <Button
          btnName="Save Professional Info"
          handleClick={() => saveSectionData('professional')}
        />
        <Button
          btnName="Next: Additional Info"
          handleClick={() => goToNextSection('professional', 'additional', validateProfessionalInfo)}
        />
      </div>
    </div>
  );

  const renderAdditionalInfoSection = () => (
    <div className={`${Style.section} ${currentSection === 'additional' ? Style.activeSection : Style.hiddenSection}`}>
      <h3 className={Style.sectionTitle}>
        Additional Information
      </h3>
      
      <div className={Style.textareaContainer}>
        <label className={Style.textareaLabel}>
          Key Agenda *
        </label>
        <textarea
          placeholder="Describe your key political agenda and promises to voters"
          rows="4"
          value={candidateForm.manifesto}
          className={Style.textarea}
          onChange={(e) =>
            setCandidateForm({ ...candidateForm, manifesto: e.target.value })
          }
        />
      </div>

      <div className={Style.textareaContainer}>
        <label className={Style.textareaLabel}>
          Key Achievements
        </label>
        <textarea
          placeholder="List your major achievements and contributions"
          rows="3"
          value={candidateForm.achievements}
          className={Style.textarea}
          onChange={(e) =>
            setCandidateForm({ ...candidateForm, achievements: e.target.value })
          }
        />
      </div>

      <div className={Style.sectionButtons}>
        <Button
          btnName="Previous: Professional"
          handleClick={() => goToSection('professional')}
        />
        <Button
          btnName="Save Additional Info"
          handleClick={() => saveSectionData('additional')}
        />
        <Button
          btnName="Next: Social Media"
          handleClick={() => {
            saveSectionData('additional');
            goToSection('social');
          }}
        />
      </div>
    </div>
  );

  const renderSocialMediaSection = () => (
    <div className={`${Style.section} ${currentSection === 'social' ? Style.activeSection : Style.hiddenSection}`}>
      <h3 className={Style.sectionTitle}>
        Social Media Presence (Optional)
      </h3>
      
      <Input
        inputType="url"
        title="Twitter/X Profile"
        placeholder="https://twitter.com/yourhandle"
        value={candidateForm.socialMediaLinks.twitter}
        handleClick={(e) =>
          setCandidateForm({ 
            ...candidateForm, 
            socialMediaLinks: {
              ...candidateForm.socialMediaLinks,
              twitter: e.target.value
            }
          })
        }
      />
      <Input
        inputType="url"
        title="Facebook Profile"
        placeholder="https://facebook.com/yourprofile"
        value={candidateForm.socialMediaLinks.facebook}
        handleClick={(e) =>
          setCandidateForm({ 
            ...candidateForm, 
            socialMediaLinks: {
              ...candidateForm.socialMediaLinks,
              facebook: e.target.value
            }
          })
        }
      />
      <Input
        inputType="url"
        title="Instagram Profile"
        placeholder="https://instagram.com/yourprofile"
        value={candidateForm.socialMediaLinks.instagram}
        handleClick={(e) =>
          setCandidateForm({ 
            ...candidateForm, 
            socialMediaLinks: {
              ...candidateForm.socialMediaLinks,
              instagram: e.target.value
            }
          })
        }
      />
      <Input
        inputType="url"
        title="LinkedIn Profile"
        placeholder="https://linkedin.com/in/yourprofile"
        value={candidateForm.socialMediaLinks.linkedin}
        handleClick={(e) =>
          setCandidateForm({ 
            ...candidateForm, 
            socialMediaLinks: {
              ...candidateForm.socialMediaLinks,
              linkedin: e.target.value
            }
          })
        }
      />

      <div className={Style.sectionButtons}>
        <Button
          btnName="Previous: Additional"
          handleClick={() => goToSection('additional')}
        />
        <Button
          btnName="Save Social Media"
          handleClick={() => saveSectionData('social')}
        />
      </div>
    </div>
  );

  return (
    <div className={Style.createVoter}>
      <div>
        {fileUrl && (
          <div className={Style.voterInfo}>
            <img src={fileUrl} alt="asset_file" />
            <div className={Style.voterInfo_paragraph}>
              <p>
                Name: <span>&nbsp;{candidateForm.name}</span>
              </p>
              <p>
                Add:&nbsp; <span>{candidateForm.address.slice(0, 20)} </span>
              </p>
              <p>
                Age:&nbsp;<span>{candidateForm.age}</span>
              </p>
              <p>
                Party:&nbsp;<span>{candidateForm.politicalParty}</span>
              </p>
              <p>
                Constituency:&nbsp;<span>{candidateForm.constituency}</span>
              </p>
              <p>
                Education:&nbsp;<span>{candidateForm.education}</span>
              </p>
            </div>
          </div>
        )}

        {!fileUrl && (
          <div className={Style.sideInfo}>
            <div className={Style.sideInfo_box}>
              <h4>Create Candidate For Voting</h4>
              <p>
                Blockchain voting organization, provide ethereum blockchain eco
                system
              </p>
              <p className={Style.sideInfo_para}>Contract Candidate List</p>
            </div>
            <div className={Style.car}>
              {candidateArray && candidateArray.length > 0 ? (
                candidateArray
                  .map((el, i) => (
                    <div key={i + 1} className={Style.card_box}>
                      <div className={Style.image}>
                        <img src={el?.image} alt="Profile photo" />
                      </div>

                      <div className={Style.card_info}>
                        <p>Age: {el?.age}</p>
                        <p>ID: #{el?.candidateID}</p>
                        <p>Address: {el?.address?.slice(0, 7)}..</p>
                      </div>
                    </div>
                  ))
                  .slice(0, 4)
              ) : (
                <p>No candidates found</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={Style.voter}>
        <div className={Style.voter__container}>
          <h1>Register New Candidate</h1>
          <div className={Style.voter__container__box}>
            <div className={Style.voter__container__box__div}>
              <div {...getRootProps()}>
                <input {...getInputProps()} />

                <div className={Style.voter__container__box__div_info}>
                  <p>Upload File: JPG, PNG, GIF, WEBM MAX 100MB</p>

                  <div className={Style.voter__container__box__div__image}>
                    <Image
                      src={images.upload}
                      width={150}
                      height={150}
                      objectFit="contain"
                      alt="file upload"
                    />
                  </div>

                  <p>Drag & Drop File</p>
                  <p>or Browse media on your device</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={Style.input__container}>
          {/* Section Navigation Buttons */}
          {renderSectionButtons()}

          {/* Section Content */}
          {renderBasicInfoSection()}
          {renderPoliticalInfoSection()}
          {renderProfessionalInfoSection()}
          {renderAdditionalInfoSection()}
          {renderSocialMediaSection()}

          {/* Final Submit Button - Only visible when all sections are completed */}
          {allSectionsCompleted() && (
            <div className={Style.finalSubmitButton}>
              <Button
                btnName={isLoading ? "Registering..." : "Register Candidate"}
                handleClick={handleCandidateSubmit}
              />
            </div>
          )}
        </div>
      </div>

      <div className={Style.createdVorter}>
        <div className={Style.createdVorter__info}>
          <Image src={images.creator} alt="user profile" />
          <p>Notice</p>
          <p>
            Organizer <span>0xf39Fd6e51..</span>
          </p>
          <p>
            Only organizer of the voting contract can create voter and candidate
            for voting election. Complete sections in order: Basic Info → Political Info → Professional → Additional Info → Social Media. 
            The Register Candidate button will appear only after all required sections are completed.
          </p>
        </div>
      </div>
      {(loader || isLoading) && <Loader />}
    </div>
  );
};

export default candidateRegistration;