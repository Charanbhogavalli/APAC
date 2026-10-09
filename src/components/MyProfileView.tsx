import React, { useState, useEffect, useRef } from 'react';
import { Participant, ViewState, LocalSessionProfile, ContactVisibility, ContactFieldKey } from '../types';
import { 
  fetchParticipantById, 
  updateParticipant, 
  deleteParticipant,
  uploadProfilePhoto 
} from '../services/participantService';
import { CameraCaptureModal } from './CameraCaptureModal';
import { PhoneInputField } from './PhoneInputField';
import { parsePhoneNumber, formatFullPhoneNumber } from '../utils/countryCodes';

interface MyProfileViewProps {
  session: LocalSessionProfile | null;
  onNavigate: (view: ViewState) => void;
  onProfileUpdated: (updated: Participant) => void;
  onProfileDeleted?: () => void;
}

export const MyProfileView: React.FC<MyProfileViewProps> = ({
  session,
  onNavigate,
  onProfileUpdated,
  onProfileDeleted,
}) => {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Editable Form fields
  const [name, setName] = useState('');
  const [ideaName, setIdeaName] = useState('');
  const [organization, setOrganization] = useState('');
  const [country, setCountry] = useState('');
  const [role, setRole] = useState('');
  const [bio, setBio] = useState('');
  const [phoneDialCode, setPhoneDialCode] = useState('+94');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappDialCode, setWhatsappDialCode] = useState('+94');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [expertiseInput, setExpertiseInput] = useState('');
  const [expertiseList, setExpertiseList] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<ContactVisibility>({
    phone: 'public',
    whatsapp: 'public',
    email: 'public',
    linkedin: 'public',
    website: 'public',
    instagram: 'public',
  });

  // Photo editing
  const [newPhotoBlob, setNewPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await fetchParticipantById(session!.profileId);
        if (!isMounted) return;
        if (data) {
          setParticipant(data);
          populateForm(data);
        } else {
          setParticipant(null);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching own profile:', err);
        setLoadError('Unable to load your profile details from database.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [session]);

  const populateForm = (data: Participant) => {
    setName(data.name || '');
    setIdeaName(data.ideaName || '');
    setOrganization(data.organization || '');
    setCountry(data.country || '');
    setRole(data.role || '');
    setBio(data.bio || '');

    const parsedPhone = parsePhoneNumber(data.phone);
    setPhoneDialCode(parsedPhone.dialCode);
    setPhoneNumber(parsedPhone.localNumber);

    const parsedWhatsapp = parsePhoneNumber(data.whatsapp);
    setWhatsappDialCode(parsedWhatsapp.dialCode);
    setWhatsappNumber(parsedWhatsapp.localNumber);

    setEmail(data.email || '');
    setLinkedin(data.linkedin || '');
    setWebsite(data.website || '');
    setInstagram(data.instagram || '');
    setExpertiseList(data.expertise || []);
    setVisibility(data.visibility || {
      phone: 'public',
      whatsapp: 'public',
      email: 'public',
      linkedin: 'public',
      website: 'public',
      instagram: 'public',
    });
    setPhotoPreview(data.photoUrl || null);
    setNewPhotoBlob(null);
  };

  const handleCancelEdit = () => {
    if (participant) {
      populateForm(participant);
    }
    setIsEditing(false);
    setSaveError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewPhotoBlob(file);
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  const handleCameraCapture = (blob: Blob) => {
    setNewPhotoBlob(blob);
    const url = URL.createObjectURL(blob);
    setPhotoPreview(url);
  };

  const toggleVisibility = (key: ContactFieldKey) => {
    setVisibility((prev) => ({
      ...prev,
      [key]: prev[key] === 'public' ? 'private' : 'public',
    }));
  };

  const handleAddExpertise = () => {
    const val = expertiseInput.trim();
    if (val && !expertiseList.includes(val)) {
      setExpertiseList([...expertiseList, val]);
      setExpertiseInput('');
    }
  };

  const handleRemoveExpertise = (tag: string) => {
    setExpertiseList(expertiseList.filter((t) => t !== tag));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !participant) return;

    if (!name.trim() || !ideaName.trim() || !organization.trim() || !country.trim() || !role.trim()) {
      setSaveError('Name, Idea Name, Organization, Country, and Role are required.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      let finalPhotoUrl = participant.photoUrl;

      if (newPhotoBlob) {
        finalPhotoUrl = await uploadProfilePhoto(newPhotoBlob, participant.profileId);
      }

      const formattedPhone = formatFullPhoneNumber(phoneDialCode, phoneNumber);
      const formattedWhatsapp = formatFullPhoneNumber(whatsappDialCode, whatsappNumber);

      const updates: Partial<Participant> = {
        name: name.trim(),
        ideaName: ideaName.trim(),
        organization: organization.trim(),
        country: country.trim(),
        role: role.trim(),
        bio: bio.trim() || undefined,
        phone: formattedPhone || undefined,
        whatsapp: formattedWhatsapp || undefined,
        email: email.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
        website: website.trim() || undefined,
        instagram: instagram.trim() || undefined,
        expertise: expertiseList,
        visibility,
        photoUrl: finalPhotoUrl || undefined,
      };

      await updateParticipant(session.profileId, session.editToken, updates);

      const merged: Participant = {
        ...participant,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      setParticipant(merged);
      onProfileUpdated(merged);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Save profile error:', err);
      setSaveError('Unable to update your profile. Please check connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!session || !participant) return;
    setIsDeleting(true);
    setSaveError(null);
    try {
      await deleteParticipant(session.profileId, session.editToken);
      if (onProfileDeleted) {
        onProfileDeleted();
      } else {
        onNavigate({ type: 'home' });
      }
    } catch (err) {
      console.error('Failed to delete profile:', err);
      setSaveError('Unable to delete profile from database. Please check connection and try again.');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 border-4 border-[#3a4efb] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[16px] font-semibold text-[#161a33]">Loading your profile...</p>
      </div>
    );
  }

  // No profile created yet
  if (!session || !participant) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="w-16 h-16 rounded-3xl bg-[#edecff] text-[#152de4] mx-auto flex items-center justify-center mb-4 shadow-sm">
          <span className="material-symbols-outlined text-[32px]">badge</span>
        </div>
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#152de4]">
          Accreditation
        </span>
        <h2 className="text-3xl font-bold text-[#161a33] mt-1 mb-2">No profile created yet</h2>
        <p className="text-[15px] text-[#444656] max-w-md mx-auto mb-8 leading-relaxed">
          Create your official conference profile to connect with fellow delegates, publish your innovation, and generate your digital badge.
        </p>
        <button
          onClick={() => onNavigate({ type: 'create' })}
          className="px-8 py-3.5 rounded-full bg-[#d4f029] text-[#191e00] font-bold text-[14px] hover:scale-105 transition-all shadow-md cursor-pointer"
        >
          Create Profile
        </button>
      </div>
    );
  }

  // View & Edit mode
  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-6 pb-20">
        {/* Top Controls / Notice */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#152de4] bg-[#edecff] px-3 py-1 rounded-full">
              My Official Conference Credential
            </span>
            {saveSuccess && (
              <span className="text-[12px] font-bold text-[#576400] bg-[#d4f029]/40 px-3 py-1 rounded-full animate-fade">
                Changes saved to database!
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-5 py-2.5 rounded-full bg-[#f4f2ff] hover:bg-[#edecff] text-[#161a33] font-bold text-[13px] flex items-center gap-1.5 transition-all cursor-pointer border border-[#dee0ed]"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  <span>Edit Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate({ type: 'qr', profileId: participant.profileId })}
                  className="px-5 py-2.5 rounded-full bg-[#d4f029] text-[#191e00] font-bold text-[13px] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-105"
                >
                  <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                  <span>My QR Badge</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-5 py-2.5 rounded-full bg-[#f4f2ff] hover:bg-[#edecff] text-[#444656] font-bold text-[13px] cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {loadError && (
          <div className="p-4 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] text-[14px] mb-6">
            {loadError}
          </div>
        )}

        {/* If Editing Mode */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-[#dee0ed]">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#161a33] mb-1">Edit My Profile</h2>
              <p className="text-[14px] text-[#444656]">
                Changes are saved directly to the live Firebase database.
              </p>
            </div>

            {saveError && (
              <div className="p-4 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] text-[14px] mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">error</span>
                <span>{saveError}</span>
              </div>
            )}

            {/* Photo Edit */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-[#f4f2ff] mb-8">
              <div className="relative">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt={name}
                    className="w-24 h-24 rounded-2xl object-cover ring-2 ring-[#3a4efb]"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-[#edecff] text-[#152de4] font-extrabold text-3xl flex items-center justify-center">
                    {name ? name.charAt(0).toUpperCase() : 'A'}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-white text-[#161a33] font-bold text-[13px] border border-[#dee0ed] hover:bg-[#edecff] cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#3a4efb]">upload</span>
                  <span>Upload New Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="px-4 py-2 rounded-xl bg-white text-[#161a33] font-bold text-[13px] border border-[#dee0ed] hover:bg-[#edecff] cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#3a4efb]">photo_camera</span>
                  <span>Take Photo</span>
                </button>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-[#161a33] mb-1.5">
                    Full Name <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#dee0ed] bg-[#fbf8ff] text-[#161a33] text-[14px]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#161a33] mb-1.5">
                    Idea / Innovation Name <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    type="text"
                    value={ideaName}
                    onChange={(e) => setIdeaName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#dee0ed] bg-[#fbf8ff] text-[#161a33] text-[14px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-[#161a33] mb-1.5">
                    Organization <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#dee0ed] bg-[#fbf8ff] text-[#161a33] text-[14px]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#161a33] mb-1.5">
                    Country <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#dee0ed] bg-[#fbf8ff] text-[#161a33] text-[14px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#161a33] mb-1.5">
                  Role / Position <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#dee0ed] bg-[#fbf8ff] text-[#161a33] text-[14px]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#161a33] mb-1.5">
                  Bio / Project Brief
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={800}
                  className="w-full px-4 py-3 rounded-xl border border-[#dee0ed] bg-[#fbf8ff] text-[#161a33] text-[14px]"
                />
              </div>

              {/* Contact Information & Privacy */}
              <div className="p-5 rounded-2xl bg-[#f4f2ff] space-y-4">
                <h3 className="text-[14px] font-bold text-[#161a33]">
                  Contact Details &amp; Privacy Controls
                </h3>

                {/* Email */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[12px] font-bold text-[#444656]">Email</label>
                    <button
                      type="button"
                      onClick={() => toggleVisibility('email')}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        visibility.email === 'public'
                          ? 'bg-[#d4f029] text-[#191e00]'
                          : 'bg-[#444656] text-white'
                      }`}
                    >
                      {visibility.email === 'public' ? 'Public' : 'Private'}
                    </button>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#dee0ed] bg-white text-[14px]"
                  />
                </div>

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

                {/* LinkedIn */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[12px] font-bold text-[#444656]">LinkedIn</label>
                    <button
                      type="button"
                      onClick={() => toggleVisibility('linkedin')}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        visibility.linkedin === 'public'
                          ? 'bg-[#d4f029] text-[#191e00]'
                          : 'bg-[#444656] text-white'
                      }`}
                    >
                      {visibility.linkedin === 'public' ? 'Public' : 'Private'}
                    </button>
                  </div>
                  <input
                    type="url"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#dee0ed] bg-white text-[14px]"
                  />
                </div>

                {/* Website */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[12px] font-bold text-[#444656]">Website</label>
                    <button
                      type="button"
                      onClick={() => toggleVisibility('website')}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        visibility.website === 'public'
                          ? 'bg-[#d4f029] text-[#191e00]'
                          : 'bg-[#444656] text-white'
                      }`}
                    >
                      {visibility.website === 'public' ? 'Public' : 'Private'}
                    </button>
                  </div>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#dee0ed] bg-white text-[14px]"
                  />
                </div>

                {/* Instagram */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[12px] font-bold text-[#444656]">Instagram</label>
                    <button
                      type="button"
                      onClick={() => toggleVisibility('instagram')}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        visibility.instagram === 'public'
                          ? 'bg-[#d4f029] text-[#191e00]'
                          : 'bg-[#444656] text-white'
                      }`}
                    >
                      {visibility.instagram === 'public' ? 'Public' : 'Private'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#dee0ed] bg-white text-[14px]"
                  />
                </div>
              </div>

              {/* Expertise Tag management */}
              <div>
                <label className="block text-[13px] font-bold text-[#161a33] mb-1.5">
                  Expertise Tags
                </label>
                <div className="flex gap-2 mb-2">
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
                    placeholder="Add an expertise tag"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[#dee0ed] bg-[#fbf8ff] text-[14px]"
                  />
                  <button
                    type="button"
                    onClick={handleAddExpertise}
                    className="px-5 py-2.5 rounded-xl bg-[#3a4efb] text-white font-bold text-[13px] cursor-pointer"
                  >
                    Add
                  </button>
                </div>
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
            </div>

            <div className="mt-8 pt-6 border-t border-[#dee0ed] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-6 py-3 rounded-full text-[#444656] hover:text-[#161a33] font-bold text-[14px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3.5 rounded-full bg-[#d4f029] text-[#191e00] font-bold text-[14px] hover:scale-102 transition-all cursor-pointer shadow-md flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Viewing My Profile */
          <div className="space-y-8">
            {/* Header Bento */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-[#dee0ed]/60">
              <div className="h-48 sm:h-60 bg-gradient-to-r from-[#152de4] via-[#3a4efb] to-[#006aaa] relative p-6">
                <div className="absolute top-5 right-5 flex items-center gap-2 bg-[#2b2f49]/80 backdrop-blur-md px-3.5 py-1.5 rounded-full text-white">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#d4f029] animate-pulse"></span>
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#d4f029]">
                    My Conference Credential
                  </span>
                </div>
              </div>

              <div className="px-6 sm:px-10 pb-8 relative -mt-16 sm:-mt-20">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 mb-6">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden shadow-2xl bg-white p-1.5 bg-gradient-to-tr from-[#152de4] to-[#d4f029]">
                    {participant.photoUrl ? (
                      <img
                        src={participant.photoUrl}
                        alt={participant.name}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      <div className="w-full h-full rounded-2xl bg-[#edecff] text-[#152de4] font-extrabold text-5xl flex items-center justify-center">
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="bg-[#edecff] text-[#152de4] px-3 py-1 rounded-full text-[11px] font-extrabold uppercase">
                        {participant.country}
                      </span>
                      <span className="bg-[#3a4efb]/10 text-[#3a4efb] px-3 py-1 rounded-full text-[11px] font-extrabold uppercase">
                        {participant.role}
                      </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-[#161a33]">{participant.name}</h1>
                    <p className="text-[15px] text-[#444656] flex items-center gap-1.5 mt-1">
                      <span className="material-symbols-outlined text-[18px] text-[#152de4]">domain</span>
                      <span>{participant.organization}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#dee0ed] pt-6">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-[#444656]">Rural Innovation</span>
                    <p className="text-[16px] font-bold text-[#152de4]">{participant.ideaName}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase text-[#444656]">Accreditation ID</span>
                    <p className="text-[15px] font-semibold text-[#161a33] font-mono">{participant.profileId}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Details Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bio & Expertise */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#dee0ed]/60 space-y-6">
                {participant.bio && (
                  <div>
                    <h3 className="text-lg font-bold text-[#161a33] mb-2">Biography</h3>
                    <p className="text-[14px] text-[#444656] leading-relaxed whitespace-pre-wrap">
                      {participant.bio}
                    </p>
                  </div>
                )}

                {participant.expertise && participant.expertise.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-[#161a33] mb-2">Expertise</h3>
                    <div className="flex flex-wrap gap-2">
                      {participant.expertise.map((exp, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full bg-[#edecff] text-[#152de4] text-[12px] font-bold"
                        >
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Hub with Privacy Status */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#dee0ed]/60">
                <h3 className="text-lg font-bold text-[#161a33] mb-4">Contact Details &amp; Privacy</h3>
                <div className="space-y-3">
                  {participant.email && (
                    <div className="p-3 rounded-xl bg-[#f4f2ff] flex items-center justify-between text-[13px]">
                      <span className="text-[#161a33] font-medium">{participant.email}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#444656] uppercase">
                        {participant.visibility?.email || 'public'}
                      </span>
                    </div>
                  )}
                  {participant.whatsapp && (
                    <div className="p-3 rounded-xl bg-[#f4f2ff] flex items-center justify-between text-[13px]">
                      <span className="text-[#161a33] font-medium">{participant.whatsapp}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#444656] uppercase">
                        {participant.visibility?.whatsapp || 'public'}
                      </span>
                    </div>
                  )}
                  {participant.phone && (
                    <div className="p-3 rounded-xl bg-[#f4f2ff] flex items-center justify-between text-[13px]">
                      <span className="text-[#161a33] font-medium">{participant.phone}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#444656] uppercase">
                        {participant.visibility?.phone || 'public'}
                      </span>
                    </div>
                  )}
                  {participant.linkedin && (
                    <div className="p-3 rounded-xl bg-[#f4f2ff] flex items-center justify-between text-[13px]">
                      <span className="text-[#161a33] font-medium truncate max-w-xs">{participant.linkedin}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#444656] uppercase">
                        {participant.visibility?.linkedin || 'public'}
                      </span>
                    </div>
                  )}
                  {participant.website && (
                    <div className="p-3 rounded-xl bg-[#f4f2ff] flex items-center justify-between text-[13px]">
                      <span className="text-[#161a33] font-medium truncate max-w-xs">{participant.website}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#444656] uppercase">
                        {participant.visibility?.website || 'public'}
                      </span>
                    </div>
                  )}
                  {participant.instagram && (
                    <div className="p-3 rounded-xl bg-[#f4f2ff] flex items-center justify-between text-[13px]">
                      <span className="text-[#161a33] font-medium truncate max-w-xs">{participant.instagram}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#444656] uppercase">
                        {participant.visibility?.instagram || 'public'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Danger Zone: Delete Account */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#ffdad6] mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-[20px]">delete_forever</span>
                  <h3 className="text-base font-bold text-[#ba1a1a]">Delete Account</h3>
                </div>
                <p className="text-[13px] text-[#747688] mb-4 leading-relaxed">
                  Permanently remove your profile and digital badge from the conference database and directory.
                </p>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2.5 rounded-xl border border-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffdad6]/30 font-bold text-[13px] flex items-center gap-2 transition-colors cursor-pointer w-full justify-center"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  <span>Delete Profile from Database</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#dee0ed]">
            <div className="w-12 h-12 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[28px]">warning</span>
            </div>
            <h3 className="text-xl font-bold text-[#161a33] mb-2">Delete profile permanently?</h3>
            <p className="text-[14px] text-[#444656] mb-6 leading-relaxed">
              This will permanently remove your profile, data, and digital badge for <strong>{participant.name}</strong> from the database. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="px-5 py-2.5 rounded-full bg-[#f4f2ff] hover:bg-[#edecff] text-[#444656] font-bold text-[13px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteProfile}
                className="px-5 py-2.5 rounded-full bg-[#ba1a1a] hover:bg-[#93000a] text-white font-bold text-[13px] flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                    <span>Yes, Delete Account</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
