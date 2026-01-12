// src/pages/IncidentsPage.jsx
import React, { useEffect, useState } from 'react';
import {
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  TablePagination,
  Autocomplete,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import api from '../api';

const INCIDENT_TYPES = [
  'Complaint',
  'Blotter',
  'Domestic Violence',
  'Theft',
  'Vandalism',
  'Noise Disturbance',
  'Others',
];

const STATUS_OPTIONS = ['Open', 'Under Investigation', 'Closed'];

const initialForm = {
  incident_date: '',
  incident_type: 'Complaint',
  location: '',
  description: '',
  complainant_id: '',
  respondent_id: '',
  status: 'Open',
};

const IncidentsPage = () => {
  const [residents, setResidents] = useState([]);
  const [incidents, setIncidents] = useState([]);

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [incidentFilter, setIncidentFilter] = useState('All');
  const [searchText, setSearchText] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [errorEdit, setErrorEdit] = useState('');

  // Delete confirmation
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchResidents = async () => {
    try {
      const res = await api.get('/residents');
      setResidents(res.data);
    } catch (err) {
      console.error(err);
      alert('Error fetching residents');
    }
  };

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/incidents');
      setIncidents(res.data);
    } catch (err) {
      console.error(err);
      alert('Error fetching incidents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();
    fetchIncidents();
  }, []);

  const handleAddClick = () => {
    setAddOpen(true);
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorForm('');

    if (!form.incident_date || !form.incident_type) {
      setErrorForm('Date & time and Incident Type are required.');
      return;
    }

    try {
      setSaving(true);
      await api.post('/incidents', form);
      setForm(initialForm);
      await fetchIncidents();
      setAddOpen(false);
    } catch (err) {
      console.error(err);
      setErrorForm(err.response?.data?.message || 'Error saving incident');
    } finally {
      setSaving(false);
    }
  };

  const handleAddClose = () => {
    setAddOpen(false);
  }

  const residentName = (id) => {
    const r = residents.find((x) => x.id === id);
    if (!r) return '';
    return `${r.last_name}, ${r.first_name}`;
  };

  const formatDateTime = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString('en-PH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const filteredIncidents = incidents.filter((i) => {
    const dateOnly = i.incident_date ? i.incident_date.slice(0, 10) : '';
    const matchFrom = !dateFrom || dateOnly >= dateFrom;
    const matchTo = !dateTo || dateOnly <= dateTo;
    const matchStatus = statusFilter === 'All' || i.status === statusFilter;
    const matchIncident = incidentFilter === 'All' || i.incident_type === incidentFilter;

    // searchType/Location/Names
    const complainant = residentName(i.complainant_id);
    const respondent = residentName(i.respondent_id);
    const haystack = (
      `${i.location || ''} ${complainant} ${respondent}`
    ).toLowerCase();
    const matchSearch =
      !searchText.trim() ||
      haystack.includes(searchText.trim().toLowerCase());

    return matchFrom && matchTo && matchStatus && matchSearch && matchIncident;
  });

  // Edit
  const handleEditClick = (incident) => {
    setErrorEdit('');
    setEditData({
      ...incident,
      incident_date: incident.incident_date
        ? incident.incident_date.slice(0, 16)
        : '',
    });
    setEditOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSave = async () => {
    setErrorEdit('');
    if (!editData.incident_date || !editData.incident_type) {
      setErrorEdit('Date & time and Incident Type are required.');
      return;
    }

    try {
      setSavingEdit(true);
      await api.put(`/incidents/${editData.id}`, editData);
      setEditOpen(false);
      setEditData(null);
      await fetchIncidents();
    } catch (err) {
      console.error(err);
      setErrorEdit(err.response?.data?.message || 'Error updating incident');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditData(null);
  };

  // Delete
  const handleDeleteClick = (incident) => {
    setDeleteTarget(incident);
    setDeleteOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/incidents/${deleteTarget.id}`);
      setDeleteOpen(false);
      setDeleteTarget(null);
      await fetchIncidents();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error deleting incident');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2}}>
        <Box sx={{ maxWidth: '20vw', minWidth: 200 }}>
          <Button 
            variant='contained' 
            disabled={addOpen} 
            onClick={() => handleAddClick()}
            size='large'
            sx={{mb: 2}}
            fullWidth
            >
            Add Incident
          </Button>
          <Paper sx={{ p: 2 }} elevation={2}>
            <Typography variant="h6" sx={{mb: 2}} gutterBottom>Filter</Typography>
            <Box flexGrow={1}>
              <Grid container spacing={2}>
                <Grid size={{xs: 12, md: 12}}>
                  <TextField
                    size="small"
                    label="Search (location / name)"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
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
                    type="date"
                    size="small"
                    label="From"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    type="date"
                    size="small"
                    label="To"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
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
                    {STATUS_OPTIONS.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    select
                    label="Incident Type"
                    name="incident_type"
                    size='small'
                    value={incidentFilter}
                    onChange={(e) => setIncidentFilter(e.target.value)}
                    fullWidth
                  >
                    <MenuItem value="All">All</MenuItem>
                    {INCIDENT_TYPES.map((i) => (
                      <MenuItem key={i} value={i}>
                        {i}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Box>

        <Box sx={{ flex: 1, minWidth: 200, height: '100%'}}>
          <Paper elevation={2}>
            <TableContainer
              sx={{
                maxHeight: '90vh',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                '&:hover': {
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(0,0,0,0.3) transparent',
                } 
              }}
              >
              <Table size="medium" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Date/Time</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Complainant</TableCell>
                    <TableCell>Respondent</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredIncidents.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>{i.id}</TableCell>
                      <TableCell>{formatDateTime(i.incident_date)}</TableCell>
                      <TableCell>{i.incident_type}</TableCell>
                      <TableCell>{i.location || ''}</TableCell>
                      <TableCell>{residentName(i.complainant_id)}</TableCell>
                      <TableCell>{residentName(i.respondent_id)}</TableCell>
                      <TableCell>{i.status}</TableCell>
                      <TableCell>{i.description}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleEditClick(i)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(i)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Box>   
      
      
      

      {/* ADD OPEN */}
      <Dialog open={addOpen} onClose={handleAddClose} maxWidth='md' fullWidth>
        <DialogTitle>Add Incident</DialogTitle>
        {addOpen && (
          <Box sx={{flexGrow: 1}} component="form" onSubmit={handleSubmit}>
            <DialogContent dividers>
              <Grid container spacing={2} sx={{m: 2}}>
                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    type="datetime-local"
                    label="Date & Time"
                    name="incident_date"
                    value={form.incident_date}
                    onChange={handleChange}
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    select
                    label="Incedent Type"
                    name="incident_type"
                    value={form.incident_type}
                    onChange={handleChange}
                    fullWidth
                  >
                    {INCIDENT_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{xs: 12, md: 12}}>
                  <TextField
                    label="Location"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>

                <Grid size={{xs: 12, md: 4}}>
                  <Autocomplete 
                    options={residents}
                    getOptionLabel={(r) => `${r.last_name}, ${r.first_name}`}
                    value={residents.find((r) => r.id === form.complainant_id) || null}
                    onChange={(event, newValue) => {
                      setForm((prev) => ({
                        ...prev, complainant_id: newValue ? newValue.id : ''
                      }));
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Complainant" fullWidth required />
                    )}
                    />
                </Grid>
                <Grid size={{xs: 12, md: 4}}>
                  <Autocomplete 
                    options={residents}
                    getOptionLabel={(r) => `${r.last_name}, ${r.first_name}`}
                    value={residents.find((r) => r.id === form.respondent_id) || null}
                    onChange={(event, newValue) => {
                      setForm((prev) => ({
                        ...prev,
                        respondent_id: newValue ? newValue.id : ''
                      }));
                    }}
                    renderInput={(params) => (<TextField {...params} label="Respondent" fullWidth required />)}
                    />
                </Grid>
                <Grid size={{xs: 12, md: 4}}>
                  <TextField
                    select
                    label="Status"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    fullWidth
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{xs: 12, md: 12}}>
                  <TextField
                    label="Description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    minRows={3}
                    maxRows={6}
                  />
                </Grid>
                {errorForm && (
                  <Grid size={{xs: 12, md: 12}}>
                    <Typography color="error" variant="body2">
                      {errorForm}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button
                variant='text'
                onClick={() => handleAddClose()}>
                Close
              </Button>
              <Button
                type='submit'
                variant='contained'
                disabled={saving}>
                Save
              </Button>
            </DialogActions>
        </Box>
        )}
      </Dialog>

      {/* Edit Incident Dialog */}
      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="md" fullWidth>
        <DialogTitle>Edit Incident</DialogTitle>
        <DialogContent dividers>
          {editData && (
            <Grid container spacing={2} sx={{ m: 2 }}>
              <Grid size={{xs: 12, md: 6}}>
                <TextField
                  type="datetime-local"
                  label="Date & Time"
                  name="incident_date"
                  value={editData.incident_date || ''}
                  onChange={handleEditChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{xs: 12, md: 6}}>
                <TextField
                  select
                  label="Incedent Type"
                  name="incident_type"
                  value={editData.incident_type || ''}
                  onChange={handleEditChange}
                  fullWidth
                >
                  {INCIDENT_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{xs: 12, md: 12}}>
                <TextField
                  label="Location"
                  name="location"
                  value={editData.location || ''}
                  onChange={handleEditChange}
                  fullWidth
                />
              </Grid>

              <Grid size={{xs: 12, md: 4}}>
                <Autocomplete 
                  options={residents}
                  getOptionLabel={(r) => `${r.last_name}, ${r.first_name}`}
                  value={residents.find((r) => r.id === editData.complainant_id) || null}
                  onChange={(event, newValue) => {
                    setEditData((prev) => ({
                      ...prev, complainant_id: newValue ? newValue.id : ''
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Complainant" fullWidth required />
                  )}
                  />
              </Grid>
              <Grid size={{xs: 12, md: 4}}>
                <Autocomplete 
                  options={residents}
                  getOptionLabel={(r) => `${r.last_name}, ${r.first_name}`}
                  value={residents.find((r) => r.id === editData.respondent_id) || null}
                  onChange={(event, newValue) => {
                    setEditData((prev) => ({
                      ...prev, respondent_id: newValue ? newValue.id : ''
                    }));
                  }}
                  renderInput={(params) => (<TextField {...params} label="Respondent" fullWidth required />)}
                  />
              </Grid>

              <Grid size={{xs: 12, md: 4}}>
                 <TextField
                  select
                  label="Status"
                  name="status"
                  value={editData.status || ''}
                  onChange={handleEditChange}
                  fullWidth
                >
                  {STATUS_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{xs: 12, md: 12}}>
                <TextField
                label="Description"
                name="description"
                value={editData.description || ''}
                onChange={handleEditChange}
                fullWidth
                multiline
                minRows={3}
                maxRows={6}
                />
              </Grid>

              {errorEdit && (
                <Grid item xs={12}>
                  <Typography color="error" variant="body2">
                    {errorEdit}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            disabled={savingEdit}
          >
            {savingEdit ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Incident</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to delete incident{' '}
            <strong>#{deleteTarget?.id}</strong> (
            {deleteTarget?.incident_type})?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteConfirm}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IncidentsPage;
