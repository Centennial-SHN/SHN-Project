import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { VITE_API_BASE_URL_LOCAL, VITE_API_BASE_URL_PROD } from "../constants";
import NavBar from "./NavBar";
import { Typography, Layout, Table} from 'antd';

const { Title } = Typography;
const { Content } = Layout;

const InterviewHistory = () => {
  const [interviews, setInterviews] = useState([]);
  const { userid } = useParams();
  const navigate = useNavigate();
  const isDevelopment = import.meta.env.MODE === "development";
  const baseUrl = isDevelopment ? VITE_API_BASE_URL_LOCAL : VITE_API_BASE_URL_PROD;
  const isAdmin = sessionStorage.getItem('isSuperUser') === 'true';
  const [pageSize, setPageSize] = useState(10);

  const backendUrl = baseUrl;

  const checkIfLoggedIn = () => {
    const storedUserId = sessionStorage.getItem("userId"); 
    return storedUserId === userid; 
  };

  useEffect(() => {
    if (!checkIfLoggedIn()) {
      navigate("/"); 
      return;
    }

    const fetchInterviews = async () => {
      try {
        const response = await fetch(
          `${backendUrl}/api/interview_history/${userid}/`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch interview history");
        }

        const data = await response.json();

        const filteredInterviews = data.filter(
          (interview) => interview.interviewlength !== "0:00:00"
        );
        setInterviews(filteredInterviews);
      } catch (error) {
        console.error("Error fetching interview history:", error);
      }
    };

    fetchInterviews();
  }, [userid, backendUrl]);

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
      link.setAttribute("download", `transcript_${interviewId}.csv`); // Updated to .csv
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading transcript:", error);
    }
  };

  const columns = [
    {
      title: 'Module Name',
      dataIndex: 'modulename',
      key: 'moduleName',
      width: '25%',
      sorter: (a, b) => a.modulename.localeCompare(b.modulename),
    },
    {
      title: 'Date',
      dataIndex: 'dateactive',
      key: 'date',
      width: '25%',
      sorter: (a, b) => new Date(a.dateactive) - new Date(b.dateactive),
    },
    {
      title: 'Interview Length',
      dataIndex: 'interviewlength',
      key: 'interviewLength',
      width: '25%',
    },
    {
      title: 'Transcript',
      key: 'transcript',
      width: '25%',
      render: (_, record) => (
        <a onClick={() => handleDownloadTranscript(record.interviewid)}>
          Download
        </a>
      ),
    },
  ];

  const dataSource = interviews.map((interview, index) => ({
    key: index,
    modulename: interview.modulename,
    dateactive: interview.dateactive,
    interviewlength: interview.interviewlength,
    interviewid: interview.interviewid,
  }));

  return (
    <Layout className="layoutInterviewHist">
      <NavBar isAdmin={isAdmin} />
      <Content className="layoutIntHistContent">
        <Title level={3} style={{ color: "#191E72" }}>Interview History</Title>
        {interviews.length === 0 ? (
          <p>No interviews found.</p>
        ) : (
          <Table
            dataSource={dataSource}
            columns={columns}
            size="large"
            pagination={dataSource.length > 10 ? {
              pageSize: pageSize,
              showSizeChanger: true,
              onShowSizeChange: (current, size) => setPageSize(size),
              pageSizeOptions: ['10', '20', '30', '50'],
            } : false}
            showSorterTooltip={{
              target: 'sorter-icon',
            }}
          />
        )}
      </Content>
    </Layout>
  );
};
export default InterviewHistory;
