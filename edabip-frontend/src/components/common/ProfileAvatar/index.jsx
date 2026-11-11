import { useRef } from "react";
import EditCircle from "../../../assets/dashboard/users/profile-edit-circle.svg";
import EditIcon from "../../../assets/dashboard/users/profile-edit.svg";
import DefaultAvatar from "../../../assets/dashboard/users/profile-avatar.svg";
import "./ProfileAvatar.css";

/**
 * Avatar with an optional edit badge for picking a new picture from the
 * local filesystem. There's no upload API yet, so the picked file is read
 * as a data URL and handed to onPictureChange for the caller to persist
 * (AuthContext stores it in localStorage, keyed by the user's email).
 */
function ProfileAvatar({ pictureUrl, size = 56, editable = false, onPictureChange }) {
  const fileInputRef = useRef(null);

  function handlePick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => onPictureChange?.(reader.result);
    reader.readAsDataURL(file);
  }

  return (
    <div className="pa-root" style={{ width: size, height: size }}>
      <img
        src={pictureUrl || DefaultAvatar}
        alt=""
        className="pa-image"
        width={size}
        height={size}
      />
      {editable && (
        <>
          <button
            type="button"
            className="pa-camera-btn"
            aria-label="Change profile picture"
            onClick={handlePick}
          >
            <img src={EditCircle} alt="" className="pa-camera-btn__circle" />
            <img src={EditIcon} alt="" className="pa-camera-btn__icon" width="16" height="16" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="pa-file-input"
            onChange={handleFileChange}
            aria-hidden="true"
            tabIndex={-1}
          />
        </>
      )}
    </div>
  );
}

export default ProfileAvatar;
