import { useEffect, useState } from "react";
import Modal from "../../../components/common/Modal/index.jsx";
import ProfileAvatar from "../../../components/common/ProfileAvatar/index.jsx";
import { useAuthContext } from "../../../context/AuthContext.jsx";
import { getWelcomeDisplayName } from "../../auth/utils/getWelcomeDisplayName.js";
import { isMockAuthEnabled } from "../../auth/utils/mockSession.js";
import { updateProfile } from "../../auth/api/authApi.js";
import CancelIcon from "../../../assets/dashboard/users/cancel.svg";
import "./ProfileDetailsModal.css";

function ProfileDetailsModal({ isOpen, onClose }) {
  const { user, profilePictureUrl, updateProfilePicture, updateUser } = useAuthContext();
  const displayName = getWelcomeDisplayName(user);

  const [name, setName] = useState(displayName);
  const [mobile, setMobile] = useState(user?.mobileNumber || "");
  const [location, setLocation] = useState("USA");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(displayName);
      setMobile(user?.mobileNumber || "");
      setError("");
    }
  }, [isOpen, displayName, user?.mobileNumber]);

  // This modal only edits Name/Mobile, but the backend's PATCH /auth/me
  // requires the full General Settings shape — carry the rest of the
  // current user's values through unchanged so they aren't wiped out.
  const handleSave = async () => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ");

    if (!firstName) {
      setError("First name can't be empty.");
      return;
    }
    if (!lastName) {
      setError("Last name can't be empty.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (isMockAuthEnabled) {
        updateUser({
          fullName: `${firstName} ${lastName}`.trim(),
          mobileNumber: mobile,
        });
      } else {
        const backendUser = await updateProfile({
          firstName,
          lastName,
          mobileNumber: mobile,
          applicationName: user?.applicationName || "EDABIP",
          timezone: user?.timezone || "UTC",
          companySize: user?.companySize || "",
          industry: user?.industry || "",
          emailNotifications: user?.emailNotifications ?? true,
        });
        updateUser(backendUser);
      }
      onClose();
    } catch {
      setError("Could not save changes. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Full Profile" overlayClassName="pdm-overlay">
      <div className="pdm-root">
        <button type="button" className="pdm-close" aria-label="Close" onClick={onClose}>
          <img src={CancelIcon} alt="" width="12" height="12" />
        </button>

        <div className="pdm-header">
          <ProfileAvatar
            pictureUrl={profilePictureUrl}
            size={56}
            editable
            onPictureChange={updateProfilePicture}
          />
          <div className="pdm-identity">
            <p className="pdm-name">{displayName}</p>
            <p className="pdm-email">{user?.email}</p>
          </div>
        </div>

        <div className="pdm-divider" />

        <div className="pdm-row">
          <span className="pdm-label">Name</span>
          <input
            className="pdm-value-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="your name"
          />
        </div>
        <div className="pdm-divider" />

        <div className="pdm-row">
          <span className="pdm-label">Email account</span>
          <span className="pdm-value">{user?.email}</span>
        </div>
        <div className="pdm-divider" />

        <div className="pdm-row">
          <span className="pdm-label">Mobile number</span>
          <input
            className="pdm-value-input"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="Add number"
          />
        </div>
        <div className="pdm-divider" />

        <div className="pdm-row">
          <span className="pdm-label">Location</span>
          <input
            className="pdm-value-input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Add location"
          />
        </div>

        {error ? <p className="pdm-error">{error}</p> : null}

        <div className="pdm-footer">
          <button
            type="button"
            className="pdm-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Change"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ProfileDetailsModal;