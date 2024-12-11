import { useState } from "react";
import { Form, Input, Button, Typography, Modal, Alert } from 'antd';

const { Title, Text } = Typography;

const ChangePasswordModal = ({ isOpen, onClose, onChangePassword }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const resetFields = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password cannot be the same as the current password.");
      return;
    }

    if (currentPassword.length < 8 || newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    onChangePassword(currentPassword, newPassword).then(() => {
      resetFields();
      onClose();
    })
    .catch((err) => {
      setError(err.message || "An error occurred. Please try again.");
    })
  
  };

  return (
    <Modal
      className="change-password-modal"
      open={isOpen}
      onOk={handleSubmit}
      onCancel={() => {
        resetFields();
        onClose();
      }}
      footer={[
        <Button key="cancel" onClick={() => {
          resetFields();
          onClose();
        }}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          Submit
        </Button>,
      ]}
    >
      <Title level={4} style={{marginBottom:"24px"}}>Change Password</Title>
      <Form layout="vertical" onFinish={handleSubmit}>
        <Form.Item label="Current Password" required>
          <Input.Password
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
          />
        </Form.Item>
        <Form.Item label="New Password" required>
          <Input.Password
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
          />
        </Form.Item>
        <Form.Item label="Confirm New Password" required>
          <Input.Password
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
          />
        </Form.Item>
        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: "24px" }}/>}
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal;
