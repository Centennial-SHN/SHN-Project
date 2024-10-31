import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from 'react-router-dom';
// import './UserAdmin.css';
import Cookies from 'js-cookie';
import ChangePasswordModal from './ChangePasswordModal';
import { VITE_API_BASE_URL_LOCAL, VITE_API_BASE_URL_PROD } from "../constants";
import NavBar from "./NavBar";
import { Typography, Layout, Table, Pagination, Space, Tooltip, Input, Button } from 'antd';
import { EditOutlined } from "@ant-design/icons";

const { Title, Link } = Typography;
const { Content } = Layout;
const { Search } = Input;

const UserAdmin = () => {
  const [users, setUsers] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false); // State for toggling the menu
  const [iconColor, setIconColor] = useState("black");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const isDevelopment = import.meta.env.MODE === "development";
  const baseUrl = isDevelopment ? VITE_API_BASE_URL_LOCAL : VITE_API_BASE_URL_PROD;
  const backendUrl = baseUrl;
  const csrfToken = Cookies.get('csrftoken');
  const [isChangePasswordOpen, setChangePasswordOpen] = useState(false);
  const isAdmin = sessionStorage.getItem('isSuperUser') === 'true';
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const hasCheckedSuperuser = useRef(false);

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

    const fetchUsers = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/admin/users/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
        // Log the users data to verify structure


        const usersWithInterviews = await Promise.all(
          data.map(async (user) => {
            // Log user data to verify user.id


            if (!user.userid) {

              return user;
            }

            // Fetch interviews for each user based on userId
            const interviewsResponse = await fetch(`${backendUrl}/api/interview_history/${user.userid}/`);
            if (!interviewsResponse.ok) {
              throw new Error(`Failed to fetch interviews for user ${user.userid}`);
            }
            const interviews = await interviewsResponse.json();
            // Log interviews for each user

            const filteredInterviews = interviews.filter(
              (interview) => interview.interviewlength !== "0:00:00" // Assuming interview_length is in seconds
            );
            return { ...user, interviews: filteredInterviews }; // Attach interviews to each user object
          })
        );

        setUsers(usersWithInterviews);
      } catch (error) {
        console.error("Error fetching users or interviews:", error);
      }
    };

    fetchUsers();
  }, [backendUrl]);

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

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadTranscript = async (interviewId) => {

    try {
      const response = await fetch(
        `${backendUrl}/api/download_transcript/${interviewId}/`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download transcript");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `transcript_${interviewId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading transcript:", error);
    }
  };

  const convertTimeToSeconds = (time) => {
    const parts = time.split(":").map(Number);
    let seconds = 0;

    if (parts.length === 3) {
      // HH:MM:SS
      seconds += parts[0] * 3600;
      seconds += parts[1] * 60;
      seconds += parts[2];
    } else if (parts.length === 2) {
      // MM:SS
      seconds += parts[0] * 60;
      seconds += parts[1];
    }

    return seconds;
  };

  // Format total seconds to "HH:MM:SS"
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleShowAllUsers = () => {
    setSearchTerm("");
  };

  const toggleChangePasswordModal = () => {
    setChangePasswordOpen(!isChangePasswordOpen);
  };

  // Function to handle password change
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
  const handleDeleteInterview = async (interviewId, userId) => {
    try {

      const response = await fetch(`${backendUrl}/api/admin/interview/${interviewId}/delete/`, {
        method: "DELETE",
        headers: {
          'X-CSRFToken': csrfToken,  // Add CSRF token if required
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error("Failed to delete interview");
      }

      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.userid === userId
            ? { ...user, interviews: user.interviews.filter(interview => interview.interviewid !== interviewId) }
            : user
        )
      );

      alert("Interview deleted successfully!");
    } catch (error) {
      console.error("Error deleting interview:", error);
      alert("Failed to delete interview. Please try again.");
    }
  };

  const handleClearBlobStorage = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/clear-temp-audio/`, {
        method: 'DELETE',
        headers: {
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to clear blob storage");
      }


      if (data.files_deleted > 0) {
        alert(`${data.files_deleted} files have been deleted from the container.`);
      } else {
        alert("The container is already empty.");
      }

    } catch (error) {
      console.error("Error clearing blob storage:", error);
      alert("Failed to clear blob storage. Please try again.");
    }
  };

  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = users.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      // fixed: 'left',
      width:300,
      sorter: (a, b) => a.email.localeCompare(b.email),
    },
    {
      title: 'Total Interviews',
      dataIndex: 'totalInterviews',
      key: 'totalInterviews',
      width:200,
      render: (_, record) => record.interviews.length,
    },
    {
      title: 'Total Interview Time',
      dataIndex: 'totalInterviewTime',
      key: 'totalInterviewTime',
      width:200,
      render: (_, record) => {
        const totalSeconds = record.interviews.reduce((acc, interview) => {
          const [hours, minutes, seconds] = interview.interviewlength.split(":").map(Number);
          return acc + hours * 3600 + minutes * 60 + seconds;
        }, 0);

        const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');

        return `${hours}:${minutes}:${seconds}`;
      },
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width:120,
      render: (_, record) => record.interviews.length === 1 ? record.interviews[0].dateactive : "",
    },
    {
      title: 'Module',
      dataIndex: 'module',
      key: 'module',
      width:300,
      render: (_, record) => record.interviews.length === 1 ? record.interviews[0].modulename : "",
    },
    {
      title: 'Interview Logs',
      dataIndex: 'interviewLogs',
      key: 'interviewLogs',
      width:200,
      render: (_, record) => (
        record.interviews.length === 1
          ? <Link onClick={() => handleDownloadTranscript(record.interviews[0].interviewid)}>Download Transcript</Link>
          : ""
      ),
    },
    {
      title: 'Delete Log',
      dataIndex: 'delete',
      key: 'delete',
      width:120,
      render: (_, record) => (
        record.interviews.length === 1
          ? <Link onClick={() => handleDeleteInterview(record.interviews[0].interviewid, record.userid)} className="linkDelete">Delete</Link>
          : ""
      ),
    },
    {
      title: 'Edit User',
      dataIndex: 'editUser',
      key: 'editUser',
      width:120,
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => handleEditUser(record.userid)}
        />
      ),
    },
  ];

  const expandedRowRender = (record) => (
    <Table
      columns={[
        { title: '', dataIndex: '', key: 'spacer', width:53 },
        { title: '', dataIndex: '', key: 'spacer2', width:300 },
        { title: '', dataIndex: '', key: 'spacer3', width:200 },
        { title: 'Total Interview Time', dataIndex: 'interviewlength', key: 'interviewlength', width:200 },
        { title: 'Date', dataIndex: 'dateactive', key: 'dateactive', width:120 },
        { title: 'Module', dataIndex: 'modulename', key: 'modulename', width:300 },
        {
          title: 'Interview Logs',
          key: 'logs',
          width:200,
          render: (_, interview) => (
            <Link onClick={() => handleDownloadTranscript(interview.interviewid)}>Download Transcript</Link>
          ),
        },
        {
          title: 'Delete Log',
          key: 'delete',
          width:120,
          render: (_, interview) => (
            <Link onClick={() => handleDeleteInterview(interview.interviewid, record.userid)} className="linkDelete">Delete</Link>
          ),
        },
        { title: '', dataIndex: '', key: 'spacer4', width:120 },
      ]}
      dataSource={record.interviews}
      pagination={false}
      rowKey="interviewid"
    />
  );


  return (
    <Layout className="layoutUserLog">
      <NavBar isAdmin={isAdmin} />
      <Content className="layoutUserLogContent">
        <Space direction="horizontal" size="large" className="spaceContentStart">
          <Title level={3} style={{ color: "#191E72", marginBottom: 0 }}>User Logs</Title>
          <Tooltip
            title="This will clear audio files from incomplete interviews in your storage."
            color="#fff"
            overlayInnerStyle={{ color: "#5C5E84", padding: "8px 12px" }}
          >
            <Link onClick={handleClearBlobStorage}>Clear Temporary Audio Files</Link>
          </Tooltip>
        </Space>
        <Space direction="horizontal" size="large" className="spaceContentBetween">
          <Search
            placeholder="Search by email (i.e. johndoe@example.com)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="primary" onClick={handleShowAllUsers}>Show All</Button>
        </Space>

        <Table
          columns={columns}
          dataSource={paginatedUsers}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: users.length,
            onChange: handlePageChange,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '30', '50'],
          }}
          scroll={{
            x: 'max-content',
          }}
          showSorterTooltip={{
            target: 'sorter-icon',
          }}
          expandable={{
            expandedRowRender: (record) => record.interviews.length > 1 && expandedRowRender(record),
            rowExpandable: (record) => record.interviews.length > 1
          }}
          dataSource={users}
          rowKey="userid"
        />

        {/* <table>

          <thead>
            <tr>
              <th>Email</th>
              <th>Total Interviews</th>
              <th>Total Interview Time</th>
              <th>Date</th>
              <th>Module</th>
              <th>Interview Logs</th>
              <th>Delete</th>
              <th>Edit User</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map(user => {
              const totalInterviews = user.interviews.length;
              const totalTime = user.interviews.reduce(
                (acc, interview) => acc + convertTimeToSeconds(interview.interviewlength),
                0
              );

              return (
                <React.Fragment key={user.id}>
                  {(
                    // First row with Email, Total Interviews, Total Interview Time, and blank for Date, Module, Logs
                    <tr>
                      <td>{user.email}</td>
                      <td>{totalInterviews}</td>
                      <td>{formatTime(totalTime)}</td> {/* Total Interview Time /}
                      {/* Blank cells for Date, Module, and Logs /}
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td><button onClick={() => navigate(`/admin/manage-user/${user.userid}`)}>
                        Edit
                      </button></td>
                    </tr>
                  )}

                  {/* Sub-rows for each interview /}
                  {user.interviews.map((interview, index) => {
                    const moduleName = interview.module_name || interview.modulename || "N/A";
                    return (
                      <tr key={index}>
                        <td></td> {/* Blank Email column for sub-rows /}
                        <td></td> {/* Blank Total Interviews column for sub-rows /}
                        <td>{interview.interviewlength}</td> {/* Interview Length under Total Interview Time /}
                        <td>{interview.dateactive || "No Date Available"}</td>
                        <td>{moduleName}</td>
                        <td>
                          <button onClick={() => handleDownloadTranscript(interview.interviewid)}>
                            Download Transcript
                          </button>

                        </td>
                        <td><button onClick={() => handleDeleteInterview(interview.interviewid, user.userid)}>
                          Delete
                        </button></td>
                        <td></td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table> */}
      </Content>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={toggleChangePasswordModal}
        onChangePassword={handleChangePassword}
      />

    </Layout>
  );
};

export default UserAdmin;
