import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People,
  Policy,
  Event,
  AttachMoney,
  PlayArrow,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { adminService } from '../services/api';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [simulateDialog, setSimulateDialog] = useState(false);
  const [eventData, setEventData] = useState({
    eventType: '',
    description: ''
  });
  const [simulating, setSimulating] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [dashboardResponse, usersResponse, eventsResponse] = await Promise.all([
        adminService.getDashboardData(),
        adminService.getUsers(),
        adminService.getEvents()
      ]);

      if (dashboardResponse.success) {
        setDashboardData(dashboardResponse.dashboard);
      }

      if (usersResponse.success) {
        setUsers(usersResponse.users);
      }

      if (eventsResponse.success) {
        setEvents(eventsResponse.events);
      }
    } catch (error) {
      setError('Failed to load admin data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateEvent = async () => {
    setSimulating(true);
    setError('');
    setSuccess('');

    try {
      const response = await adminService.simulateEvent(eventData);
      
      if (response.success) {
        setSuccess(`${response.message} - Total Payout: $${response.event.totalPayout}`);
        setSimulateDialog(false);
        setEventData({ eventType: '', description: '' });
        loadAdminData(); // Reload data to show updated stats
      } else {
        setError(response.message || 'Event simulation failed');
      }
    } catch (error) {
      setError(error.message || 'An error occurred during event simulation');
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          <DashboardIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Welcome back, {user?.username}! Manage policies and simulate events.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Stats Cards */}
      {dashboardData && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <People sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h4">
                      {dashboardData.summary.totalUsers}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Users
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Policy sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h4">
                      {dashboardData.summary.totalActivePolicies}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Active Policies
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Event sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h4">
                      {dashboardData.summary.totalEvents}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Events
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <AttachMoney sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h4">
                      ${dashboardData.summary.totalRevenue}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Revenue
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Event Simulation */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Event Simulation
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Simulate events to trigger policy payouts
            </Typography>
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={() => setSimulateDialog(true)}
              fullWidth
            >
              Simulate Event
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Policy Statistics
            </Typography>
            {dashboardData?.policyStats?.map((stat) => (
              <Box key={stat._id} display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">{stat._id}</Typography>
                <Typography variant="body2">{stat.count} policies (${stat.totalValue})</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Users Table */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Recent Users
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Joined</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.slice(0, 10).map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip label={user.role} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.isActive ? 'Active' : 'Inactive'} 
                      color={user.isActive ? 'success' : 'error'}
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Recent Events Table */}
      <Paper>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Recent Events
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Event Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Triggered By</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.slice(0, 10).map((event) => (
                <TableRow key={event._id}>
                  <TableCell>
                    <Chip label={event.eventType.toUpperCase()} size="small" />
                  </TableCell>
                  <TableCell>{event.description}</TableCell>
                  <TableCell>{event.triggeredBy?.username || 'System'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={event.status.toUpperCase()} 
                      color={event.status === 'active' ? 'success' : 'default'}
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(event.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Event Simulation Dialog */}
      <Dialog open={simulateDialog} onClose={() => setSimulateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Simulate Event</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Event Type</InputLabel>
            <Select
              value={eventData.eventType}
              onChange={(e) => setEventData({ ...eventData, eventType: e.target.value })}
            >
              <MenuItem value="rain">Rain Delay</MenuItem>
              <MenuItem value="flight">Flight Delay</MenuItem>
              <MenuItem value="traffic">Traffic Jam</MenuItem>
              <MenuItem value="package">Package Delay</MenuItem>
              <MenuItem value="fake">Test Event (No Payouts)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="normal"
            label="Description (Optional)"
            multiline
            rows={3}
            value={eventData.description}
            onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSimulateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSimulateEvent} 
            variant="contained"
            disabled={simulating || !eventData.eventType}
          >
            {simulating ? 'Simulating...' : 'Simulate Event'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
