import React, { useState, useRef } from 'react';
import { Participant, ViewState, ContactVisibility, ContactFieldKey } from '../types';
import { 
  createParticipant, 
  generateProfileId, 
  generateEditToken, 
  uploadProfilePhoto,
  saveLocalSession 
} from '../services/participantService';
import { CameraCaptureModal } from './CameraCaptureModal';
import { PhoneInputField } from './PhoneInputField';
import { formatFullPhoneNumber, COUNTRY_DIAL_CODES } from '../utils/countryCodes';

interface CreateProfileViewProps {
  onSuccess: (participant: Participant) => void;
  onNavigate: (view: ViewState) => void;
}

export const CreateProfileView: React.FC<CreateProfileViewProps> = ({
  onSuccess,
  onNavigate,
}) => {
  // Steps: 1: Basic, 2: Photo, 3: Contact & Bio, 4: Review, 5: Created
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Basic Details (All start empty)
  const [name, setName] = useState('');
  const [ideaName, setIdeaName] = useState('');
  const [organization, setOrganization] = useState('');
  const [country, setCountry] = useState('');
  const [role, setRole] = useState('');

  // Step 2: Photo
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 3: Contact & Details (All start empty)
  const [phoneDialCode, setPhoneDialCode] = useState('+94');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappDialCode, setWhatsappDialCode] = useState('+94');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [bio, setBio] = useState('');
  const [expertiseInput, setExpertiseInput] = useState('');
  const [expertiseList, setExpertiseList] = useState<string[]>([]);

  // Visibility controls (default: public or private as preferred)
  const [visibility, setVisibility] = useState<ContactVisibility>({
    phone: 'public',
    whatsapp: 'public',
    email: 'public',
    linkedin: 'public',
    website: 'public',
    instagram: 'public',
  });

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdParticipant, setCreatedParticipant] = useState<Participant | null>(null);

  // Step 1 validation
  const isStep1Valid =
    name.trim().length > 0 &&
    ideaName.trim().length > 0 &&
    organization.trim().length > 0 &&
    country.trim().length > 0 &&
    role.trim().length > 0;

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoBlob(file);
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  const handleCameraCapture = (blob: Blob) => {
    setPhotoBlob(blob);
    const url = URL.createObjectURL(blob);
    setPhotoPreview(url);
  };

  const handleRemovePhoto = () => {
    setPhotoBlob(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Expertise tag addition
  const handleAddExpertise = (tagToAdd?: string) => {
    const val = (tagToAdd || expertiseInput).trim();
    if (val && !expertiseList.includes(val)) {
      setExpertiseList([...expertiseList, val]);
      setExpertiseInput('');
    }
  };

  const handleRemoveExpertise = (tag: string) => {
    setExpertiseList(expertiseList.filter((t) => t !== tag));
  };

  const toggleVisibility = (key: ContactFieldKey) => {
    setVisibility((prev) => ({
      ...prev,
      [key]: prev[key] === 'public' ? 'private' : 'public',
    }));
  };

  // Submit profile to Firebase
  const handleSubmitProfile = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const profileId = generateProfileId(name);
      const editToken = generateEditToken();
      let finalPhotoUrl = '';

      if (photoBlob) {
        finalPhotoUrl = await uploadProfilePhoto(photoBlob, profileId);
      }

      const formattedPhone = formatFullPhoneNumber(phoneDialCode, phoneNumber);
      const formattedWhatsapp = formatFullPhoneNumber(whatsappDialCode, whatsappNumber);

      const newParticipant: Participant = {
        profileId,
        name: name.trim(),
        ideaName: ideaName.trim(),
        organization: organization.trim(),
        country: country.trim(),
        role: role.trim(),
        photoUrl: finalPhotoUrl || undefined,
        phone: formattedPhone || undefined,
        whatsapp: formattedWhatsapp || undefined,
        email: email.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
        website: website.trim() || undefined,
        instagram: instagram.trim() || undefined,
        expertise: expertiseList,
        bio: bio.trim() || undefined,
        visibility,
        editToken,
        createdAt: new Date().toISOString(),
      };

      await createParticipant(newParticipant);

      // Save local session for edit privileges
      saveLocalSession({
        profileId,
        editToken,
        name: newParticipant.name,
      });

      setCreatedParticipant(newParticipant);
      setStep(5);
      onSuccess(newParticipant);
    } catch (err) {
      console.error('Error creating profile:', err);
      setSubmitError('Unable to create your profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Step Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#152de4]">
            Official Delegation Registration
          </span>
          <span className="text-[13px] font-bold text-[#444656]">
            Step {step} of 5
          </span>
        </div>

        {/* Progress bar track */}
        <div className="w-full h-2 bg-[#edecff] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#152de4] to-[#3a4efb] transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* STEP 1: Basic Details */}
      {step === 1 && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-[#dee0ed]/80">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#161a33] mb-1">Basic Details</h2>
            <p className="text-[14px] text-[#444656]">
              All fields are required to identify you in the official conference directory.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-[13px] font-bold text-[#161a33] mb-1.5">
                Full Name <span className="text-[#ba1a1a]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder=""
                className="w-full px-4 py-3.5 rounded-xl border border-[#dee0ed] bg-[#fbf8ff] text-[#161a33] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3a4efb] text-[15px]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#161a33] mb-1.5">
                Idea / Project Name <span className="text-[#ba1a1a]">*</span>
              </label>
              <input
                type="text"
                value={ideaName}
                onChange={(e) => setIdeaName(e.target.value)}
                placeholder=""
                className="w-full px-4 py-3.5 rounded-xl border border-[#dee0ed] bg-[#fbf8ff] text-[#161a33] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3a4efb] text-[15px]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#161a33] mb-1.5">
                Organization / Institution <span className="text-[#ba1a1a]">*</span>
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder=""
                className="w-full px-4 py-3.5 rounded-xl border border-[#dee0ed] bg-[#fbf8ff] text-[#161a33] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3a4efb] text-[15px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-bold text-[#161a33] mb-1.5">
                  Country <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCountry(val);
                    if (!phoneNumber.trim()) {
                      const matched = COUNTRY_DIAL_CODES.find((c) =>
                        c.name.toLowerCase().includes(val.trim().toLowerCase())
                      );
                      if (matched) {
                        setPhoneDialCode(matched.dialCode);
                        setWhatsappDialCode(matched.dialCode);
                      }
                    }
                  }}
                  placeholder=""
                  className="w-full px-4 py-3.5 rounded-xl border border-[#dee0ed] bg-[#fbf8ff] text-[#161a33] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3a4efb] text-[15px]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#161a33] mb-1.5">
                  Role / Position <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder=""
                  className="w-full px-4 py-3.5 rounded-xl border border-[#dee0ed] bg-[#fbf8ff] text-[#161a33] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3a4efb] text-[15px]"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#dee0ed] flex justify-end">
            <button
              type="button"
              disabled={!isStep1Valid}
              onClick={() => setStep(2)}
              className="px-8 py-3.5 bg-[#3a4efb] text-white font-bold text-[14px] rounded-full hover:bg-[#152de4] transition-all disabled:opacity-40 cursor-pointer shadow-md flex items-center gap-2"
            >
              <span>Continue to Profile Photo</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Profile Photo */}
      {step === 2 && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-[#dee0ed]/80">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#161a33] mb-1">Profile Photo</h2>
            <p className="text-[14px] text-[#444656]">
              Add a photo for your delegate badge and conference directory listing.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center my-6">
            {photoPreview ? (
              <div className="relative group">
                <img
                  src={photoPreview}
                  alt="Delegate preview"
                  className="w-40 h-40 rounded-3xl object-cover ring-4 ring-[#edecff] shadow-lg"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer"
                  title="Remove Photo"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            ) : (
              <div className="w-40 h-40 rounded-3xl bg-[#f4f2ff] border-2 border-dashed border-[#dee0ed] flex flex-col items-center justify-center text-[#757688]">
                <span className="material-symbols-outlined text-[48px] mb-2 text-[#3a4efb]">
                  account_circle
                </span>
                <span className="text-[12px] font-semibold text-[#444656]">Neutral Avatar</span>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-3 px-4 rounded-xl border border-[#dee0ed] bg-[#fbf8ff] hover:bg-[#edecff] text-[#161a33] font-bold text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] text-[#3a4efb]">upload</span>
              <span>Upload Photo</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="py-3 px-4 rounded-xl border border-[#dee0ed] bg-[#fbf8ff] hover:bg-[#edecff] text-[#161a33] font-bold text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] text-[#3a4efb]">photo_camera</span>
              <span>Take Photo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                handleRemovePhoto();
                setStep(3);
              }}
              className="py-3 px-4 rounded-xl bg-[#f4f2ff] hover:bg-[#edecff] text-[#444656] font-bold text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Skip for Now</span>
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-[#dee0ed] flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 py-2.5 rounded-full text-[#444656] hover:text-[#161a33] font-bold text-[14px] cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-8 py-3.5 bg-[#3a4efb] text-white font-bold text-[14px] rounded-full hover:bg-[#152de4] transition-all cursor-pointer shadow-md flex items-center gap-2"
            >
              <span>Continue to Contact Details</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Contact & Professional Details */}
      {step === 3 && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-[#dee0ed]/80">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#161a33] mb-1">
              Contact &amp; Professional Details
            </h2>
            <p className="text-[14px] text-[#444656]">
              Control the visibility of each contact method. Set items to Private if you do not want them displayed publicly.
            </p>
          </div>

          <div className="space-y-5">
            {/* Phone with Country Code */}
            <PhoneInputField
              label="Phone Number"
              iconName="call"
              dialCode={phoneDialCode}
              number={phoneNumber}
              onDialCodeChange={setPhoneDialCode}
              onNumberChange={setPhoneNumber}
              visibility={visibility.phone}
              onToggleVisibility={() => toggleVisibility('phone')}
              placeholder="e.g. 771234567"
            />

            {/* WhatsApp with Country Code & Sync */}
            <PhoneInputField
              label="WhatsApp Direct"
              iconName="chat"
              iconColorClass="text-[#576400]"
              dialCode={whatsappDialCode}
              number={whatsappNumber}
              onDialCodeChange={setWhatsappDialCode}
              onNumberChange={setWhatsappNumber}
              visibility={visibility.whatsapp}
              onToggleVisibility={() => toggleVisibility('whatsapp')}
              placeholder="e.g. 771234567"
              showCopyFromPhone={Boolean(phoneNumber.trim())}
              onCopyFromPhone={() => {
                setWhatsappDialCode(phoneDialCode);
                setWhatsappNumber(phoneNumber);
              }}
            />

            {/* Email */}
            <div className="p-4 rounded-2xl bg-[#fbf8ff] border border-[#dee0ed]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[13px] font-bold text-[#161a33] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#3a4efb]">mail</span>
                  Email Address
                </label>
                <button
                  type="button"
                  onClick={() => toggleVisibility('email')}
                  className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase transition-colors cursor-pointer ${
                    visibility.email === 'public'
                      ? 'bg-[#d4f029] text-[#191e00]'
                      : 'bg-[#444656] text-white'
                  }`}
                >
                  {visibility.email === 'public' ? 'Visible' : 'Private'}
                </button>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                className="w-full px-4 py-2.5 rounded-xl border border-[#dee0ed] bg-white text-[#161a33] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3a4efb]"
              />
            </div>

            {/* LinkedIn */}
            <div className="p-4 rounded-2xl bg-[#fbf8ff] border border-[#dee0ed]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[13px] font-bold text-[#161a33] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#005184]">work</span>
                  LinkedIn Profile URL
                </label>
                <button
                  type="button"
                  onClick={() => toggleVisibility('linkedin')}
                  className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase transition-colors cursor-pointer ${
                    visibility.linkedin === 'public'
                      ? 'bg-[#d4f029] text-[#191e00]'
                      : 'bg-[#444656] text-white'
                  }`}
                >
                  {visibility.linkedin === 'public' ? 'Visible' : 'Private'}
                </button>
              </div>
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder=""
                className="w-full px-4 py-2.5 rounded-xl border border-[#dee0ed] bg-white text-[#161a33] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3a4efb]"
              />
            </div>

            {/* Website */}
            <div className="p-4 rounded-2xl bg-[#fbf8ff] border border-[#dee0ed]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[13px] font-bold text-[#161a33] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#3a4efb]">language</span>
                  Website / Project Link
                </label>
                <button
                  type="button"
                  onClick={() => toggleVisibility('website')}
                  className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase transition-colors cursor-pointer ${
                    visibility.website === 'public'
                      ? 'bg-[#d4f029] text-[#191e00]'
                      : 'bg-[#444656] text-white'
                  }`}
                >
                  {visibility.website === 'public' ? 'Visible' : 'Private'}
                </button>
              </div>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder=""
                className="w-full px-4 py-2.5 rounded-xl border border-[#dee0ed] bg-white text-[#161a33] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3a4efb]"
              />
            </div>

            {/* Instagram */}
            <div className="p-4 rounded-2xl bg-[#fbf8ff] border border-[#dee0ed]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[13px] font-bold text-[#161a33] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#3a4efb]">photo_camera</span>
                  Instagram Handle / URL
                </label>
                <button
                  type="button"
                  onClick={() => toggleVisibility('instagram')}
                  className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase transition-colors cursor-pointer ${
                    visibility.instagram === 'public'
                      ? 'bg-[#d4f029] text-[#191e00]'
                      : 'bg-[#444656] text-white'
                  }`}
                >
                  {visibility.instagram === 'public' ? 'Visible' : 'Private'}
                </button>
              </div>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder=""
                className="w-full px-4 py-2.5 rounded-xl border border-[#dee0ed] bg-white text-[#161a33] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3a4efb]"
              />
            </div>

            {/* Expertise Tags */}
            <div className="p-4 rounded-2xl bg-[#fbf8ff] border border-[#dee0ed]">
              <label className="block text-[13px] font-bold text-[#161a33] mb-2">
                Expertise &amp; Focus Areas
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={expertiseInput}
                  onChange={(e) => setExpertiseInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddExpertise();
                    }
                  }}
                  placeholder="Type an expertise tag and press Add"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#dee0ed] bg-white text-[#161a33] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3a4efb]"
                />
                <button
                  type="button"
                  onClick={() => handleAddExpertise()}
                  className="px-5 py-2.5 rounded-xl bg-[#3a4efb] text-white font-bold text-[13px] hover:bg-[#152de4] cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* Tag pills */}
              {expertiseList.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {expertiseList.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#edecff] text-[#152de4] text-[12px] font-bold"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExpertise(tag)}
                        className="hover:text-[#ba1a1a] cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-[13px] font-bold text-[#161a33] mb-1.5">
                Short Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder=""
                maxLength={800}
                className="w-full px-4 py-3 rounded-xl border border-[#dee0ed] bg-[#fbf8ff] text-[#161a33] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3a4efb] text-[14px]"
              />
              <span className="text-[11px] text-[#444656] text-right block mt-1">
                {bio.length}/800 characters
              </span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#dee0ed] flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-2.5 rounded-full text-[#444656] hover:text-[#161a33] font-bold text-[14px] cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="px-8 py-3.5 bg-[#3a4efb] text-white font-bold text-[14px] rounded-full hover:bg-[#152de4] transition-all cursor-pointer shadow-md flex items-center gap-2"
            >
              <span>Review Profile</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Review Details */}
      {step === 4 && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-[#dee0ed]/80">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#161a33] mb-1">Review Your Profile</h2>
            <p className="text-[14px] text-[#444656]">
              Please verify your information before saving to the official conference directory.
            </p>
          </div>

          {submitError && (
            <div className="p-4 rounded-2xl bg-[#ffdad6] text-[#93000a] text-[14px] mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <span>{submitError}</span>
            </div>
          )}

          <div className="space-y-6">
            {/* Identity Card Preview */}
            <div className="p-6 rounded-2xl bg-[#f4f2ff] flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt={name}
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-[#3a4efb]/20 flex-shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-[#edecff] text-[#152de4] font-extrabold text-2xl flex items-center justify-center flex-shrink-0">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 text-center sm:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                  <h3 className="text-xl font-bold text-[#161a33]">{name}</h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#d4f029] text-[#191e00] uppercase">
                    {country}
                  </span>
                </div>
                <p className="text-[14px] text-[#3a4efb] font-semibold">{role}</p>
                <p className="text-[13px] text-[#444656]">{organization}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[12px] font-bold text-[#152de4] shadow-xs">
                  <span className="material-symbols-outlined text-[14px]">lightbulb</span>
                  <span>Idea: {ideaName}</span>
                </div>
              </div>
            </div>

            {/* Bio Review */}
            {bio.trim() && (
              <div>
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#444656] mb-1">
                  Biography
                </h4>
                <p className="text-[14px] text-[#161a33] leading-relaxed bg-[#fbf8ff] p-4 rounded-xl border border-[#dee0ed]">
                  {bio}
                </p>
              </div>
            )}

            {/* Expertise Review */}
            {expertiseList.length > 0 && (
              <div>
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#444656] mb-2">
                  Expertise Areas
                </h4>
                <div className="flex flex-wrap gap-2">
                  {expertiseList.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full bg-[#edecff] text-[#152de4] text-[12px] font-bold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Details Review */}
            <div>
              <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#444656] mb-2">
                Contact Preferences
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                {phoneNumber.trim() && (
                  <div className="p-3 rounded-xl bg-[#fbf8ff] border border-[#dee0ed] flex items-center justify-between">
                    <span className="text-[#444656]">
                      Phone: <strong className="text-[#161a33]">{formatFullPhoneNumber(phoneDialCode, phoneNumber)}</strong>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#161a33]">
                      {visibility.phone}
                    </span>
                  </div>
                )}
                {whatsappNumber.trim() && (
                  <div className="p-3 rounded-xl bg-[#fbf8ff] border border-[#dee0ed] flex items-center justify-between">
                    <span className="text-[#444656]">
                      WhatsApp: <strong className="text-[#161a33]">{formatFullPhoneNumber(whatsappDialCode, whatsappNumber)}</strong>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#161a33]">
                      {visibility.whatsapp}
                    </span>
                  </div>
                )}
                {email && (
                  <div className="p-3 rounded-xl bg-[#fbf8ff] border border-[#dee0ed] flex items-center justify-between">
                    <span className="text-[#444656]">Email: {email}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#161a33]">
                      {visibility.email}
                    </span>
                  </div>
                )}
                {linkedin && (
                  <div className="p-3 rounded-xl bg-[#fbf8ff] border border-[#dee0ed] flex items-center justify-between">
                    <span className="text-[#444656] truncate">LinkedIn: {linkedin}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#161a33]">
                      {visibility.linkedin}
                    </span>
                  </div>
                )}
                {website && (
                  <div className="p-3 rounded-xl bg-[#fbf8ff] border border-[#dee0ed] flex items-center justify-between">
                    <span className="text-[#444656] truncate">Website: {website}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#161a33]">
                      {visibility.website}
                    </span>
                  </div>
                )}
                {instagram && (
                  <div className="p-3 rounded-xl bg-[#fbf8ff] border border-[#dee0ed] flex items-center justify-between">
                    <span className="text-[#444656] truncate">Instagram: {instagram}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#161a33]">
                      {visibility.instagram}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#dee0ed] flex items-center justify-between">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setStep(3)}
              className="px-6 py-2.5 rounded-full text-[#444656] hover:text-[#161a33] font-bold text-[14px] cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitProfile}
              className="px-8 py-3.5 bg-[#d4f029] text-[#191e00] font-bold text-[14px] rounded-full hover:scale-102 transition-all cursor-pointer shadow-lg flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                  <span>Saving to Firebase...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>Create Official Profile</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Success & Confirmation */}
      {step === 5 && createdParticipant && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-[#dee0ed] text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-[#d4f029] text-[#191e00] flex items-center justify-center shadow-md mb-5">
            <span className="material-symbols-outlined text-[40px]">check</span>
          </div>

          <span className="text-[12px] font-extrabold uppercase tracking-widest text-[#152de4] mb-1">
            Registration Complete
          </span>
          <h2 className="text-3xl font-bold text-[#161a33] mb-2">Profile Created</h2>
          <p className="text-[15px] text-[#444656] max-w-md mb-8">
            Your official profile for <strong className="text-[#161a33]">{createdParticipant.name}</strong> is now live in the APAC Rural Connect directory.
          </p>

          <div className="w-full max-w-md bg-[#f4f2ff] p-5 rounded-2xl mb-8 text-left border border-[#dee0ed]">
            <div className="flex items-center gap-4">
              {createdParticipant.photoUrl ? (
                <img
                  src={createdParticipant.photoUrl}
                  alt={createdParticipant.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#3a4efb]/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#edecff] text-[#152de4] font-extrabold text-xl flex items-center justify-center">
                  {createdParticipant.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-[17px] font-bold text-[#161a33] truncate">
                  {createdParticipant.name}
                </h3>
                <p className="text-[13px] text-[#3a4efb] font-medium truncate">
                  Idea: {createdParticipant.ideaName}
                </p>
                <p className="text-[12px] text-[#444656] truncate">
                  {createdParticipant.role} • {createdParticipant.country}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
            <button
              onClick={() => onNavigate({ type: 'my-profile' })}
              className="w-full sm:flex-1 py-3.5 px-6 rounded-full bg-[#3a4efb] text-white font-bold text-[14px] hover:bg-[#152de4] transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">badge</span>
              <span>View My Profile</span>
            </button>
            <button
              onClick={() => onNavigate({ type: 'qr', profileId: createdParticipant.profileId })}
              className="w-full sm:flex-1 py-3.5 px-6 rounded-full bg-[#d4f029] text-[#191e00] font-bold text-[14px] hover:scale-102 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
              <span>Get QR Badge</span>
            </button>
          </div>

          <button
            onClick={() => onNavigate({ type: 'explore' })}
            className="mt-4 text-[13px] font-bold text-[#444656] hover:text-[#161a33] transition-colors cursor-pointer"
          >
            Explore Directory
          </button>
        </div>
      )}

      {/* Camera Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
};
