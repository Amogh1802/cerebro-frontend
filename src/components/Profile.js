import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, Container, Box, List, ListItem, ListItemText } from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Profile = ({ role }) => {
  const navigate = useNavigate();

  const chartData = {
    labels: ['Session 1', 'Session 2', 'Session 3'],
    datasets: [{ label: 'Alpha Power', data: [12.4, 15.2, 10.8], borderColor: 'rgb(75, 192, 192)', tension: 0.1 }],
  };

  const options = { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'EEG Progress' } } };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4">Profile - {role}</Typography>
        <Button variant="outlined" onClick={() => navigate('/dashboard')} sx={{ mt: 2 }}>Back</Button>
      </Box>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">{role === 'DOCTOR' ? 'Patients History' : 'My History'}</Typography>
       <List>
         {sessions.map((session) => (
           <ListItem key={session.id}>
             <ListItemText
               primary={`EEG Report: ${session.mode}`}
               secondary={session.notes || "-"}
             />
           </ListItem>
         ))}
       </List>
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">EEG Graph</Typography>
          <Line data={chartData} options={options} />
        </Box>
      </Box>
    </Container>
  );
};

export default Profile;