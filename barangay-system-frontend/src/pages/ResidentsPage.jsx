// src/pages/ResidentsPage.jsx
import React, { useEffect, useState } from 'react';
import {
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import api from '../api';

const initialForm = {
  last_name: '',
  first_name: '',
  middle_name: '',
  suffix: '',
  sex: 'Male',
  birthdate: '',
  civil_status: '',
  contact_no: '',
  address: '',
};

const ResidentsPage = () => {
  const [residents, setResidents] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [sexFilter, setSexFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [addOpen, setAddOpen] = useState(false);


  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [updating, setUpdating] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchResidents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/residents');
      setResidents(res.data);
    } catch (err) {
      console.error(err);
      alert('Error fetching residents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.post('/residents', form);
      setForm(initialForm);
      fetchResidents();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error saving resident');
    } finally {
      setSaving(false);
      setAddOpen(false);
    }
  };

  const handleAddClick = () => {
    setAddOpen(true);
  }

  const handleEditClick = (resident) => {
    setEditData({ ...resident });
    setEditOpen(true);
  };

  const handleDeleteClick = (resident) => {
      setDeleteTarget(resident);
      setDeleteOpen(true);
    }; 

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSave = async () => {
    try {
      setUpdating(true);
      await api.put(`/residents/${editData.id}`, editData);
      setEditOpen(false);
      setEditData(null);
      fetchResidents();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error updating resident');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddClose = () => {
    setAddOpen(false);
  }

  const handleEditClose = () => {
    setEditOpen(false);
    setEditData(null);
  };

  const handleDeleteCancel = () => {
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(deleteTarget.id);
      await api.delete(`/residents/${deleteTarget.id}`);
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchResidents();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error deleting resident');
    } finally {
      setDeleting(null);
    }
  };

  const filteredResidents = residents.filter((r) => {
    const str = (
      `${r.last_name} ${r.first_name} ${r.middle_name || ''} ${
        r.address || ''
      }`
    ).toLowerCase();
    const matchSearch = str.includes(search.toLowerCase());
    const matchSex = sexFilter === 'All' || r.sex === sexFilter;
    const matchStatus = statusFilter === 'All' || r.civil_status === statusFilter;
    return matchSearch && matchSex && matchStatus;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2}}>
        <Box sx={{ maxWidth: '20vw', minWidth: 200 }}>
          <Button 
            variant='contained' 
            disabled={addOpen} 
            onClick={() => handleAddClick()}
            size='large'
            sx={{mb: 2, width: '100%'}}
            >
            Add Resident
          </Button>
          <Paper sx={{ p: 2}}>
            <Typography variant="h6" sx={{mb: 2}}>Filter</Typography>
            <Box sx={{flexGrow: 1}}>
              <Grid container spacing={2}>
                <Grid size={{xs: 12, md: 12}}>
                  <TextField
                    size='small'
                    label='Search (name / address)'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    select
                    label="Sex"
                    name="sex"
                    size='small'
                    value={sexFilter}
                    onChange={(e) => setSexFilter(e.target.value)}
                    fullWidth
                  >
                    <MenuItem value="All">All</MenuItem>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    select
                    label="Status"
                    name="status"
                    size='small'
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    fullWidth
                  >
                    <MenuItem value="All">All</MenuItem>
                    {[...new Set(residents.map(resident => resident.civil_status))].map((status, idx) => (
                      <MenuItem key={idx} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Box>

        <Box sx={{ flex: 1, minWidth: 700, height: '100%'}}>
          <Paper elevation={2}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column',gap: 3,height: '40vh' }}>
                  <CircularProgress />
                  <Typography variant="h6" sx={{mb: 2}}>Fetching Residents...</Typography>
              </Box>
            ) : (
              <Box>
                <TableContainer sx={{
                  maxHeight: '90vh',
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  '&:hover': {
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(0,0,0,0.3) transparent',
                  } 
                }}>
                  <Table size="medium" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Full Name</TableCell>
                        <TableCell>Sex</TableCell>
                        <TableCell>Birthdate</TableCell>
                        <TableCell>Civil Status</TableCell>
                        <TableCell>Contact</TableCell>
                        <TableCell>Address</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredResidents.map((r, idx) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.id}</TableCell>
                          <TableCell>
                            {r.last_name}, {r.first_name} {r.middle_name || ''}{' '}
                            {r.suffix || ''}
                          </TableCell>
                          <TableCell>{r.sex}</TableCell>
                          <TableCell>{r.birthdate || ''}</TableCell>
                          <TableCell>{r.civil_status || ''}</TableCell>
                          <TableCell>{r.contact_no || ''}</TableCell>
                          <TableCell>{r.address || ''}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => handleEditClick(r)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClick(r)}
                              disabled={deleting === r.id}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
      


      

      <Dialog open={addOpen} onClose={handleAddClose} maxWidth="md" fullWidth>
        <DialogTitle>Add Resident</DialogTitle>
        {addOpen && (
          <Box sx={{flexGrow: 1}} component="form" onSubmit={handleSubmit}>
            <DialogContent dividers>
              <Grid container spacing={2} sx={{m: 2}}>

                {/* ROW 1 */}
                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    label="Last Name"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    label="First Name"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                </Grid>

                {/* ROW 2 */}
                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    label="Middle Name"
                    name="middle_name"
                    value={form.middle_name}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>
                <Grid size={{xs: 12, md: 3}}>
                  <TextField
                    label="Suffix"
                    name="suffix"
                    value={form.suffix}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>           
                <Grid size={{xs: 12, md: 3}}>
                  <TextField
                    select
                    label="Sex"
                    name="sex"
                    value={form.sex}
                    onChange={handleChange}
                    fullWidth
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                </Grid>

                {/* ROW 3 */}
                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    type="date"
                    label="Birthdate"
                    name="birthdate"
                    value={form.birthdate}
                    onChange={handleChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    label="Civil Status"
                    name="civil_status"
                    value={form.civil_status}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>

                {/* ROW 4 */}
                <Grid size={{xs: 12, md: 3}}>
                  <TextField
                    label="Contact No"
                    name="contact_no"
                    value={form.contact_no}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>
                <Grid size={{xs: 12, md: 9  }}>
                  <TextField
                    label="Address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={handleAddClose} 
                variant='text'
                >
                  Cancel
              </Button>

              <Button
                variant="contained"
                type='submit'
                disabled={saving}
                loading={saving}
                loadingPosition='start'
                startIcon={<SaveIcon/>}

              >
                Save
              </Button>
            </DialogActions>
          </Box>
        )}
      </Dialog>

      

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="md" fullWidth>
        <DialogTitle>Edit Resident</DialogTitle>
        <DialogContent dividers>
          {editData && (
            <Box sx={{flexGrow: 1}}>
              <Grid container spacing={2} sx={{ m: 2 }}>
                {/* ROW 1 */}
                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    label="Last Name"
                    name="last_name"
                    value={editData.last_name}
                    onChange={handleEditChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    label="First Name"
                    name="first_name"
                    value={editData.first_name}
                    onChange={handleEditChange}
                    fullWidth
                    required
                  />
                </Grid>

                {/* ROW 2 */}
                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    label="Middle Name"
                    name="middle_name"
                    value={editData.middle_name || ''}
                    onChange={handleEditChange}
                    fullWidth
                  />
                </Grid>

                <Grid size={{xs: 12, md: 3}}>
                  <TextField
                    label="Suffix"
                    name="suffix"
                    value={editData.suffix || ''}
                    onChange={handleEditChange}
                    fullWidth
                  />
                </Grid>
                <Grid size={{xs: 12, md: 3}}>
                  <TextField
                    select
                    label="Sex"
                    name="sex"
                    value={editData.sex}
                    onChange={handleEditChange}
                    fullWidth
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                </Grid>

                {/* ROW 3 */}
                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    type="date"
                    label="Birthdate"
                    name="birthdate"
                    value={editData.birthdate || ''}
                    onChange={handleEditChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    label="Civil Status"
                    name="civil_status"
                    value={editData.civil_status || ''}
                    onChange={handleEditChange}
                    fullWidth
                  />
                </Grid>

                {/* ROW 4 */}
                <Grid size={{xs: 12, md: 3}}>
                  <TextField
                    label="Contact No"
                    name="contact_no"
                    value={editData.contact_no || ''}
                    onChange={handleEditChange}
                    fullWidth
                  />
                </Grid>
                <Grid size={{xs: 12, md: 9}}>
                  <TextField
                    label="Address"
                    name="address"
                    value={editData.address || ''}
                    onChange={handleEditChange}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Box>
            
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            disabled={updating}
          >
            {updating ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      
      <Dialog open={deleteOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Resident</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to delete resident{' '}
            <strong>#{deleteTarget?.id}</strong> (
            {deleteTarget?.last_name})
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteConfirm}
            disabled={deleting === deleteTarget?.id}
          >
            {deleting === deleteTarget?.id ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResidentsPage;
