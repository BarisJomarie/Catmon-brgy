// src/App.jsx
import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  createTheme,
  ThemeProvider,
  ButtonGroup,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import PeopleIcon from '@mui/icons-material/People';
import HomeIcon from '@mui/icons-material/Home';
import ReportIcon from '@mui/icons-material/Report';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import ArticleIcon from '@mui/icons-material/Article';
import LogoutIcon from '@mui/icons-material/Logout';
import CertificatesPage from './pages/CertificatesPage';
import ResidentsPage from './pages/ResidentsPage.jsx';
import HouseholdsPage from './pages/HouseholdsPage.jsx';
import IncidentsPage from './pages/IncidentsPage.jsx';
import ServicesPage from './pages/ServicesPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import { setAuthToken } from './api.js';
import OfficialsPage from './pages/OfficialsPage.jsx';

const App = () => {
  const [page, setPage] = useState('residents');
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const handleLogin = ({ token, user }) => {
    setToken(token);
    setUser(user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthToken(null);
  };

  const renderPage = () => {
    switch (page) {
      case 'residents':
        return <ResidentsPage />;
      case 'households':
        return <HouseholdsPage />;
      case 'incidents':
        return <IncidentsPage />;
      case 'services':
        return <ServicesPage />;
      case 'certificates':
        return <CertificatesPage />;
      case 'officials':
        return <OfficialsPage />;
      default:
        return <ResidentsPage />;
    }
  };

  const theme = createTheme({
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            '&:focus': {
              outline: 'none'
            },
            '&:focus-visible': {
              outline: 'none',
            },
          },
        },
      },
      MuiTypography: {
        root: {
          color: 'black',
        },
      },
      MuiTableRow: { 
        styleOverrides: { 
          root: { 
            '&:nth-of-type(odd)': { 
              backgroundColor: '#f5f5f5', 
            },
            '& th': { 
              backgroundColor: '#0080ff', 
              color: 'white', 
              fontWeight: 600, 
            }, 
          }, 
        }, 
      },
    },
  });


  // If not logged in, show AuthPage
  if (!token || !user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', width: '100vw', bgcolor: '#f5f5f5' }}>
        <AppBar position="static" sx={{background: 'transparent', boxShadow: '0 1px #888888'}}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, color: '#1976d2' }}>
              Barangay Information System
            </Typography>

            <ButtonGroup variant='text' aria-label="Basic button group">
              <Button
                sx={{ 
                  color: page === 'residents' ? '#1976d2' : 'black', padding: '4px 8px',
                  fontWeight: page === 'residents' ? '700' : '300'
                 }}
                startIcon={<PeopleIcon />}
                onClick={() => setPage('residents')}
              >
                Residents
              </Button>
              <Button
                sx={{ 
                  color: page === 'households' ? '#1976d2' : 'black', padding: '4px 8px', 
                  fontWeight: page === 'households' ? '700' : '300'
                }}
                startIcon={<HomeIcon />}
                onClick={() => setPage('households')}
              >
                Households
              </Button>
              <Button
                sx={{ 
                  color: page === 'incidents' ? '#1976d2' : 'black', padding: '4px 8px',
                  fontWeight: page === 'incidents' ? '700' : '300'
                 }}
                startIcon={<ReportIcon />}
                onClick={() => setPage('incidents')}
              >
                Incidents
              </Button>
              <Button
                sx={{ 
                  color: page === 'services' ? '#1976d2' : 'black', padding: '4px 8px',
                  fontWeight: page === 'services' ? '700' : '300'
                 }}
                startIcon={<VolunteerActivismIcon />}
                onClick={() => setPage('services')}
              >
                Services
              </Button>
              <Button
                sx={{ 
                  color: page === 'certificates' ? '#1976d2' : 'black', padding: '4px 8px',
                  fontWeight: page === 'certificates' ? '700' : '300'
                 }}
                startIcon={<ArticleIcon/>}
                onClick={() => setPage('certificates')}
              >
                Certificates
              </Button>

              <Button
                sx={{ 
                  color: page === 'officials' ? '#1976d2' : 'black', padding: '4px 8px',
                  fontWeight: page === 'officials' ? '700' : '300'
                 }}
                startIcon={<GroupsIcon />}
                onClick={() => setPage('officials')}
              >
                Officials
              </Button>
            </ButtonGroup>
            


            <Typography variant="body2" sx={{ mx: 2, color: 'black' }}>
              {user?.full_name} ({user?.role})
            </Typography>
            <Button
              sx={{color: 'black'}}
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Toolbar>
        </AppBar>

        <Container sx={{py: 2}} maxWidth={false}>
          {renderPage()}
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App;
