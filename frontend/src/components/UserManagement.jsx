import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import './UserManagement.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { VITE_API_BASE_URL_LOCAL, VITE_API_BASE_URL_PROD } from "../constants";
import Cookies from 'js-cookie';
import ChangePasswordModal from './ChangePasswordModal';
import './navbar.css';

const UserManagement = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [newEmail, setNewEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false); // State for toggling the menu
  const [iconColor, setIconColor] = useState("black");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const isDevelopment = import.meta.env.MODE === "development";
  const baseUrl = isDevelopment ? VITE_API_BASE_URL_LOCAL : VITE_API_BASE_URL_PROD;
  const backendUrl = baseUrl;
  
  const csrfToken = Cookies.get('csrftoken');

  const hasCheckedSuperuser = useRef(false);

  const [isChangePasswordOpen, setChangePasswordOpen] = useState(false);

  const checkSuperuser = () => {
    const storedIsSuperuser = sessionStorage.getItem("isSuperUser");
    const storedUserId = sessionStorage.getItem("userId");

    if (!storedIsSuperuser || storedIsSuperuser !== "true" || !storedUserId) {
      alert('Only admins are allowed to access this page.');
      navigate("/");
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (!hasCheckedSuperuser.current) {
      hasCheckedSuperuser.current = true;
      if (checkSuperuser()) return;
    }
    

    const fetchUserEmail = async () => {
      try {
        console.log("Fetching user with ID:", userId);
        const response = await fetch(`${backendUrl}/api/admin/users/${userId}/`,{
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrfToken,
          },
          credentials: 'include',
      });
        if (!response.ok) {
          if (response.status === 404) {
            console.error("User not found");
            setUser(null);
            return;
          }
          throw new Error("Failed to fetch user data");
        }
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.error("Error fetching user email:", error);
      }
    };
  
    fetchUserEmail();
  }, [userId, backendUrl]);

  const handleLogout = () => {
    sessionStorage.removeItem("userId"); // Clear userId from sessionStorage
    navigate("/"); // Redirect to login page
  };

  const toggleMenu = () => {
    setMenuOpen((prev) => {
      setIconColor(prev ? "black" : "#4DBDB1");
      return !prev;
    });
  };

  const handleChangeEmail = async () => {
    try {
      // const csrfTokenElement = document.querySelector('[name=csrfmiddlewaretoken]');
      // const csrfToken = csrfTokenElement ? csrfTokenElement.value : null;
      console.log("csrf token:",csrfToken);
      const response = await fetch(`${backendUrl}/api/admin/user/${userId}/change-email/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({ email: newEmail }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error("Failed to change email address");
      }

      alert("Email address updated successfully.");
      setUser(prev => ({ ...prev, email: newEmail }));
      setNewEmail("");
      closeModal();
    } catch (error) {
      console.error("Error changing email address:", error);
    }
  };

  const handlePermission=async()=>{
    const confirmation = window.confirm("Are you sure you want to grant admin permissions to this user?");
    if (!confirmation) return;

    try {
      const response = await fetch(`${backendUrl}/api/admin/user/${userId}/make-admin/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error("Failed to grant admin permissions");
      }

      alert("Admin permissions granted successfully.");
      // Optionally, update the UI to reflect the new superuser status
    } catch (error) {
      console.error("Error granting admin permissions:", error);
    }
  };

  const handleResetPassword = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/user/${userId}/reset-password/`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to reset password");
      }

      alert("Password reset successfully. Check your email for the new password.");
    } catch (error) {
      console.error("Error resetting password:", error);
    }
  };

  const handleDeleteRecords = async () => {
    const confirmation = window.confirm("Are you sure you want to delete this user's records?");
    if (!confirmation) return;
    try {
      const response = await fetch(`${backendUrl}/api/admin/user/${userId}/delete-records/`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken // Include CSRF token if needed
        },
        credentials:'include',
      });
      console.log(response)

      if (!response.ok) {
        throw new Error("Failed to delete user records");
      }

      alert("User records deleted successfully.");
    } catch (error) {
      console.error("Error deleting user records:", error);
    }
  };

  const handleDeleteUser = async () => {
    const confirmation = window.confirm("Are you sure you want to delete this user?");
    if (!confirmation) return;

    try {
      const response = await fetch(`${backendUrl}/api/admin/user/${userId}/delete/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error("Failed to delete user account");
      }

      alert("User account deleted successfully.");
      navigate("/admin/user-logs"); // Redirect to user list page after deletion
    } catch (error) {
      console.error("Error deleting user account:", error);
    }
  };

  const handleDownloadUserData = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/user/${userId}/download-data/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            'X-CSRFToken': csrfToken,
          },
          credentials: 'include',
      });

      if (!response.ok) {
          throw new Error("Failed to download user data");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `user_data_${userId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading user data:", error);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewEmail(""); // Clear the email input when modal closes
  };

  const toggleChangePasswordModal = () => {
    setChangePasswordOpen(!isChangePasswordOpen);
  };

  const handleChangePassword = async (currentPassword, newPassword) => {
    try {
      const response = await fetch(`${backendUrl}/api/change-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'X-CSRFToken': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to change password");
      }

      alert("Password changed successfully!");
      setChangePasswordOpen(false);
    } catch (error) {
      console.error("Error changing password:", error);
      alert("Failed to change password. Please try again.");
    }
  };

  if (!user) {
    return <div>Loading user details...</div>; // Loading state
  }

  return (
    <div className="user-management">
      <header>
        <nav>
          <div className="hamburger" onClick={toggleMenu}>
            <FontAwesomeIcon icon={faBars} size="2x" color={iconColor} />
          </div>
          <ul className={`nav-menu ${menuOpen ? "show" : ""}`}>
            <li onClick={() => navigate('/admin/module-list')}>Modules</li>
            <li onClick={() => navigate('/admin/user-logs')}>User Logs</li>
            <li onClick={() => navigate('/module')}>Switch to user</li>
            <li onClick={toggleChangePasswordModal}>Change Password</li>
            <li onClick={handleLogout}>Logout</li>
          </ul>
        </nav>
      </header>
      <div className="email-container">
        <button onClick={() => navigate(-1)}>Back</button>
        <h2>{user.email}</h2>
      </div>
      <button onClick={openModal}>Change Email</button>
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Change Email</h3>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter new email"
              required
            />
            <div className="modal-buttons">
              <button onClick={handleChangeEmail}>Submit</button>
              <button onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <button onClick={handleResetPassword}>Reset Password</button>
      <button onClick={handlePermission}>Change to Admin</button>
      <button onClick={handleDeleteRecords}>Delete User Records</button>
      <button onClick={handleDeleteUser}>Delete User Account</button>
      <button onClick={handleDownloadUserData}>Download User Data</button>
      <br />
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={toggleChangePasswordModal}
        onChangePassword={handleChangePassword}
      />
    </div>
  );
};

export default UserManagement;

//task
//reset password
