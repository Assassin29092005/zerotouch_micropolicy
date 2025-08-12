import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Shield,
  Flight,
  DirectionsCar,
  LocalShipping,
  WbCloudy,
  AttachMoney,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { policyService } from '../services/api';

const Dashboard = () => {
  const [policies, setPolicies] = useState([]);
  const [policyTypes, setPolicyTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [purchaseDialog, setPurchaseDialog] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [purchasing, setPurchasing] = useState(false);

  const { user } = useAuth();

  const policyIcons = {
    'Rain Delay Cover': <WbCloudy />,
    'Flight Delay Cover': <Flight />,
    'Traffic Jam Cover': <DirectionsCar />,
    'Package Delay Cover': <LocalShipping />,
  };

  const statusColors = {
    'active': 'success',
    'claimed': 'info',
    'expired': 'warning',
    'cancelled': 'error',
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [policiesResponse, typesResponse] = await Promise.all([
        policyService.getMyPolicies(),
        policyService.getPolicyTypes()
      ]);

      if (policiesResponse.success) {
        setPolicies(policiesResponse.policies);
      }

      if (typesResponse.success) {
        setPolicyTypes(typesResponse.policyTypes);
      }
    } catch (error) {
      setError('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseClick = (policyType) => {
    setSelectedPolicy(policyType);
    setPurchaseDialog(true);
  };

  const handlePurchase = async () => {
    setPurchasing(true);
    setError('');
    setSuccess('');

    try {
      const purchaseData = {
        policyType: selectedPolicy.name,
        price: selectedPolicy.price,
        description: selectedPolicy.description
      };

      const response = await policyService.purchasePolicy(purchaseData);
      
      if (response.success) {
        setSuccess('Policy purchased successfully!');
        setPurchaseDialog(false);
        loadDashboardData(); // Reload to show new policy
      } else {
        setError(response.message || 'Purchase failed');
      }
    } catch (error) {
      setError(error.message || 'An error occurred during purchase');
    } finally {
      setPurchasing(false);
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
          Welcome back, {user?.username}!
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage your micro-policies and stay protected.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* My Policies Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          <Shield sx={{ mr: 1, verticalAlign: 'middle' }} />
          My Policies ({policies.length})
        </Typography>
        
        {policies.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="textSecondary">
              You haven't purchased any policies yet. Browse available policies below.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {policies.map((policy) => (
              <Grid item xs={12} md={6} key={policy._id}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      {policyIcons[policy.policyType]}
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        {policy.policyType}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {policy.description}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                      <Typography variant="h6" color="primary">
                        ${policy.price}
                      </Typography>
                      <Chip 
                        label={policy.status.toUpperCase()}
                        color={statusColors[policy.status]}
                        size="small"
                      />
                    </Box>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Purchased: {new Date(policy.purchaseDate).toLocaleDateString()}
                    </Typography>
                    {policy.claimDate && (
                      <Typography variant="caption" display="block" color="success.main">
                        Claimed: {new Date(policy.claimDate).toLocaleDateString()}
                        {policy.claimAmount && ` - Payout: $${policy.claimAmount}`}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Available Policies Section */}
      <Box>
        <Typography variant="h5" gutterBottom>
          <AttachMoney sx={{ mr: 1, verticalAlign: 'middle' }} />
          Available Policies
        </Typography>
        
        <Grid container spacing={3}>
          {policyTypes.map((policyType) => (
            <Grid item xs={12} sm={6} md={3} key={policyType.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Box sx={{ fontSize: 32 }}>{policyType.icon}</Box>
                    <Typography variant="h6" sx={{ ml: 1 }}>
                      {policyType.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {policyType.description}
                  </Typography>
                  <Typography variant="h5" color="primary" sx={{ mt: 2 }}>
                    ${policyType.price}
                  </Typography>
                  <Chip 
                    label={policyType.category.toUpperCase()}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
                <CardActions>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handlePurchaseClick(policyType)}
                  >
                    Purchase Policy
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialog} onClose={() => setPurchaseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Confirm Purchase
        </DialogTitle>
        <DialogContent>
          {selectedPolicy && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedPolicy.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {selectedPolicy.description}
              </Typography>
              <Typography variant="h5" color="primary" sx={{ mt: 2 }}>
                ${selectedPolicy.price}
              </Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>
                Are you sure you want to purchase this policy? This action cannot be undone.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPurchaseDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handlePurchase} 
            variant="contained"
            disabled={purchasing}
          >
            {purchasing ? 'Processing...' : 'Confirm Purchase'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;

