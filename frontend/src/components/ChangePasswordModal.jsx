// ChangePasswordModal.jsx

import React, { useState } from "react";
import './ChangePasswordModal.css';

const ChangePasswordModal = ({ isOpen, onClose, onChangePassword }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    onChangePassword(currentPassword, newPassword);
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      {/* <div className="modal-content"> */}
        <form className="change-password" onSubmit={handleSubmit}>
            <h2>Change Password</h2>
          <div className="password">
            <label>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="current password"
              required
            />
          </div>
          <div className="password">
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="enter new password"
              required
            />
          </div>
          <div className="password">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="confirm new password"
              required
            />
          </div>
          {error && <p className="error">{error}</p>}
          <div className="buttons">
            <button className="btnchange-password" type="submit">Submit</button>
            <button className="btnchange-password" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      {/* </div> */}
    </div>
  );
};

export default ChangePasswordModal;
