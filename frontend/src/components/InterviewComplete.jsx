import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import { Button, Typography, Layout, Space } from 'antd';

const { Title, Text } = Typography;
const { Content } = Layout;

const InterviewComplete = () => {
    const navigate = useNavigate();
    const userId = sessionStorage.getItem('userId');
    const isAdmin = sessionStorage.getItem('isSuperUser') === 'true';

    const handleRedirectHistory = () => {
        navigate(`/interview-history/${userId}`);
    };

    const handleRedirectModule = () => {
        navigate(`/module`);
    };

    return (

        <Layout className="layoutInterviewComplete">
            <NavBar isAdmin={isAdmin} />
            <Content className="layoutIntCompContent">
                <Space direction="vertical" size="small">
                    <Title level={3} style={{ color: '#191e72', }}>Interview completed</Title>
                    <Text>A copy of your transcript has been saved in your records.</Text>
                </Space>
                <Space direction="horizontal" size="middle">
                    <Button type="primary" onClick={handleRedirectModule}>Back to Module Selection</Button>
                    <Button type="default" onClick={handleRedirectHistory}>View Interview History</Button>
                </Space>
            </Content>
        </Layout>
    );
};

export default InterviewComplete;
