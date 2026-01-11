// src/pages/HouseholdsPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
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
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import Autocomplete from '@mui/material/Autocomplete';
import api from '../api';

const initialHouseholdForm = {
  household_name: '',
  address: '',
  purok: '',
};

const HouseholdsPage = () => {
  const [households, setHouseholds] = useState([]);
  const [residents, setResidents] = useState([]);
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [members, setMembers] = useState([]);
  const [householdForm, setHouseholdForm] = useState(initialHouseholdForm);

  const [openMemberForm, setOpenMemberForm] = useState(false);
  const [memberForm, setMemberForm] = useState({
    resident_id: '',
    relation_to_head: '',
  });
  const [editMember, setEditMember] = useState(false);
  const [deleteMember, setDeleteMember] = useState(false);

  const [purokFilter, setPurokFilter] = useState('All');
  const [searchName, setSearchName] = useState('');
  const [memberMin, setMemberMin] = useState('');
  const [memberMax, setMemberMax] = useState('');

  const [addOpen, setAddOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchHouseholds = async () => {
    try {
      const res = await api.get('/households');
      setHouseholds(res.data);
    } catch (err) {
      console.error(err);
      alert('Error fetching households');
    }
  };

  const fetchResidents = async () => {
    try {
      const res = await api.get('/residents');
      setResidents(res.data);
    } catch (err) {
      console.error(err);
      alert('Error fetching residents');
    }
  };

  const fetchMembers = async (householdId) => {
    try {
      const res = await api.get(`/households/${householdId}/members`);
      setMembers(res.data);
    } catch (err) {
      console.error(err);
      alert('Error fetching household members');
    }
  };

  useEffect(() => {
    fetchHouseholds();
    fetchResidents();
  }, []);

  const onHouseholdFormChange = (e) => {
    const { name, value } = e.target;
    setHouseholdForm((prev) => ({ ...prev, [name]: value }));
  };

  const onMemberFormChange = (e) => {
    const { name, value } = e.target;
    setMemberForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddClick = () => {
    setAddOpen(true);
  };

  const handleCreateHousehold = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/households', householdForm);
      setHouseholdForm(initialHouseholdForm);
      fetchHouseholds();
      setSelectedHousehold(res.data);
      fetchMembers(res.data.id);
      setAddOpen(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error creating household');
    }
  };

  const handleAddClose = () => {
    setAddOpen(false);
  };

  const handleEditClick = (household) => {
    setEditData({ ...household });
    setEditOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSave = async () => {
    try {
      setSavingEdit(true);
      await api.put(`/households/${editData.id}`, editData);
      setEditOpen(false);
      setEditData(null);
      fetchHouseholds();
      if (selectedHousehold && selectedHousehold.id === editData.id) {
        setSelectedHousehold(editData);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error updating household');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditData(null);
  };

  const handleDeleteClick = (household) => {
    setDeleteTarget(household);
    setDeleteOpen(true);
  }; 

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(deleteTarget.id);
      await api.delete(`/households/${deleteTarget.id}`);
      setDeleteOpen(false);
      setDeleteTarget(null);
      setSelectedHousehold(null);
      fetchHouseholds();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error deleting household');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  const handleSelectHousehold = (h) => {
    setSelectedHousehold(h);
    fetchMembers(h.id);
  };




  const handleAddMemberClick = () => {
    setOpenMemberForm(true);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedHousehold) {
      alert('Select a household first.');
      return;
    }
    if (!memberForm.resident_id) {
      alert('Select a resident.');
      return;
    }

    try {
      await api.post(`/households/${selectedHousehold.id}/members`, memberForm);
      setMemberForm({ resident_id: '', relation_to_head: '' });
      fetchMembers(selectedHousehold.id);
      setOpenMemberForm(false);
    } catch (err) {
      console.error(err);
      alert('Error adding member');
    }
  };

  const handleCloseMemberClick = () => {
    setOpenMemberForm(false);
  };

  const handleEditMemberClick = (member) => {
    setEditData({ ...member });
    setEditMember(true);
  };

  const handleEditMemberChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditMemberSave = async () => {
    try {
      setSavingEdit(true);
      await api.put(`/households/${editData.household_id}/members/${editData.id}`,editData);
      setEditMember(false);
      setEditData(null);
      fetchMembers(editData.household_id);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error updating member');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleEditMemberClose = () => {
    setEditMember(false);
    setEditData(null);
  };

  const handleDeleteMemberClick = (member) => {
    setDeleteTarget(member);
    setDeleteMember(true);
  }; 

  const handleDeleteMemberConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(deleteTarget.id);
      await api.delete(`/member/${deleteTarget.id}`);
      setDeleteMember(false);
      setDeleteTarget(null);
      fetchMembers(deleteTarget.household_id);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error deleting member');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteMemberCancel = () => {
    setDeleteMember(false);
    setDeleteTarget(null);
  };

  // PUROK OPTIONS
  const purokOptions = useMemo(() => {
    const set = new Set();
    households.forEach((h) => {
      if (h.purok) set.add(h.purok);
    });
    return Array.from(set).sort();
  }, [households]);

  // Filters
  const filteredHouseholds = households.filter((h) => {
    const memberCount = h.member_count ?? 0;

    const matchPurok = purokFilter === 'All' || h.purok === purokFilter;

    const matchName =
      h.household_name?.toLowerCase().includes(searchName.toLowerCase()) ||
      h.address?.toLowerCase().includes(searchName.toLowerCase());

    const min = memberMin !== '' ? Number(memberMin) : null;
    const max = memberMax !== '' ? Number(memberMax) : null;

    const matchMembers =
      (min === null || memberCount >= min) &&
      (max === null || memberCount <= max);

    return matchPurok && matchName && matchMembers;
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
            Create Household
          </Button>
          <Paper sx={{p: 2}}>
            <Typography variant="h6" sx={{mb: 2}}>Filter</Typography>
            <Box flexGrow={1}>
              <Grid container spacing={2}>
                <Grid size={{xs: 12, md: 12}}>
                  <TextField
                    size="small"
                    label="Search (household / address)"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
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
                <Grid size={{xs: 12, md: 12}}>
                  <TextField
                    select
                    label="Purok"
                    name="Purok"
                    size='small'
                    value={purokFilter}
                    onChange={(e) => setPurokFilter(e.target.value)}
                    fullWidth
                  >
                    <MenuItem value="All">All</MenuItem>
                    {purokOptions.map((p) => (
                      <MenuItem key={p} value={p}>
                        {p}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{xs: 6, md: 6}}>
                  <TextField
                    size="small"
                    type="number"
                    label="Member Min"
                    inputProps={{ min: 0 }}
                    value={memberMin}
                    onChange={(e) => setMemberMin(e.target.value)}
                    fullWidth
                    />
                </Grid>
                <Grid size={{xs: 6, md: 6}}>
                  <TextField
                    size="small"
                    type="number"
                    label="Member Max"
                    value={memberMax}
                    onChange={(e) => setMemberMax(e.target.value)}
                    fullWidth
                    />
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Box>

        <Box sx={{ flex: 2, minWidth: 200, height: '100%'}}>
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
                    <TableCell>Household Name</TableCell>
                    <TableCell>Address</TableCell>
                    <TableCell>Purok</TableCell>
                    <TableCell>Members</TableCell>
                    <TableCell align="center">Actions</TableCell>
                    <TableCell align="center">Select</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredHouseholds.map((h, idx) => (
                    <TableRow
                      key={h.id}
                      hover
                      selected={selectedHousehold?.id === h.id}
                    >
                      <TableCell>{h.id}</TableCell>
                      <TableCell>{h.household_name}</TableCell>
                      <TableCell>{h.address}</TableCell>
                      <TableCell>{h.purok || ''}</TableCell>
                      <TableCell>{h.member_count}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleEditClick(h)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(h)}
                          disabled={deleting === h.id}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleSelectHousehold(h)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
        
        {selectedHousehold && (
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Paper sx={{ p: 2, position: 'relative' }} elevation={2}>
              <Button 
                onClick={() => {
                  setSelectedHousehold(null);
                }}
                sx={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                }}
                >
                  Close</Button>
              <Typography variant="h6" sx={{mb: 2}} gutterBottom>
                Members of: {selectedHousehold.household_name} <br/> (ID:{' '}
                {selectedHousehold.id})
              </Typography>
              <Button
                variant='contained' 
                disabled={addOpen} 
                onClick={() => handleAddMemberClick()}
                size='large'
                sx={{mb: 2, width: '100%'}}
                >
                Add Member
              </Button>
              <Divider sx={{ mb: 2 }} />

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
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Resident</TableCell>
                      <TableCell>Relation</TableCell>
                      <TableCell align='center'>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {members.map((m, idx) => (
                      <TableRow key={m.id}>
                        <TableCell>{m.id}</TableCell>
                        <TableCell>
                          {m.last_name}, {m.first_name}
                        </TableCell>
                        <TableCell>{m.relation_to_head || ''}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleEditMemberClick(m)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteMemberClick(m)}
                            disabled={deleting === m.id}
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
        )}
      </Box>

      
      {/* ADD HOUSEHOLD */}
      <Dialog open={addOpen} onClose={handleAddClose} maxWidth='md' fullWidth>
        <DialogTitle>Create Household</DialogTitle>
        <Box component="form" onSubmit={handleCreateHousehold} noValidate>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{m: 2}}>
              <Grid size={{xs: 12, md: 12}}>
                <TextField
                  label="Household Name"
                  name="household_name"
                  value={householdForm.household_name}
                  onChange={onHouseholdFormChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{xs: 12, md: 12}}>
                <TextField
                  label="Address"
                  name="address"
                  value={householdForm.address}
                  onChange={onHouseholdFormChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{xs: 12, md: 12}}>
                <TextField
                  label="Purok"
                  name="purok"
                  value={householdForm.purok}
                  onChange={onHouseholdFormChange}
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
              type='submit'
              variant='contained'
              >
                Save
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Edit Household Dialog */}
      <Dialog open={editOpen} onClose={handleEditClose}>
        <DialogTitle>Edit Household</DialogTitle>
        <DialogContent dividers>
          {editData && (
            <Box sx={{ mt: 1 }}>
              <TextField
                sx={{ mb: 2 }}
                label="Household Name"
                name="household_name"
                value={editData.household_name}
                onChange={handleEditChange}
                fullWidth
              />
              <TextField
                sx={{ mb: 2 }}
                label="Address"
                name="address"
                value={editData.address}
                onChange={handleEditChange}
                fullWidth
              />
              <TextField
                label="Purok"
                name="purok"
                value={editData.purok || ''}
                onChange={handleEditChange}
                fullWidth
              />
            </Box>
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

      {/* DELETE HOUSEHOLD */}
      <Dialog open={deleteOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Household</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to delete household{' '}
            <strong>#{deleteTarget?.id}</strong> (
            {deleteTarget?.household_name})
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

      {/* ADD MEMBER */}
      <Dialog open={openMemberForm} onClose={handleCloseMemberClick}>
        <DialogTitle>Add Member ({selectedHousehold?.household_name})</DialogTitle>
        <Box
          component="form"
          onSubmit={handleAddMember}
          noValidate
          sx={{ mb: 2 }}
          >
            <DialogContent dividers>
              <Grid container spacing={2} sx={{mx: 2, my: 5}}>
                <Grid size={{xs: 12, md: 12}}>
                  <Autocomplete
                    disablePortal
                    options={residents}
                    getOptionLabel={(resident) => `${resident.last_name}, ${resident.first_name}`}
                    value={residents.find(resident => resident.id === memberForm.resident_id) || null}
                    onChange={(event, newValue) => {
                      onMemberFormChange({
                        target: {name: 'resident_id', value: newValue ? newValue.id : ''}
                      });
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label='Resident' />
                    )}
                    ListboxProps={{
                      style: {
                        maxHeight: 100,
                        overflowY: 'auto',
                      }
                    }}
                    fullWidth/>
                </Grid>
                <Grid size={{xs: 12, md: 12}}>
                  <TextField
                    label="Relation to Head"
                    name="relation_to_head"
                    value={memberForm.relation_to_head}
                    onChange={onMemberFormChange}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button variant='text' onClick={() => handleCloseMemberClick()}>
                Cancel
              </Button>
              <Button type='submit' variant='contained'>
                Add
              </Button>
            </DialogActions>
        </Box>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={editMember} onClose={handleEditMemberClose}>
        <DialogTitle>Edit Member: {editData?.last_name}, {editData?.first_name}</DialogTitle>
        <DialogContent dividers>
          {editData && (
            <Box sx={{ mt: 1 }}>
              <TextField
                label="Relation to Head"
                name="relation_to_head"
                value={editData.relation_to_head || ''}
                onChange={handleEditMemberChange}
                fullWidth
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditMemberClose}>Cancel</Button>
          <Button
            onClick={handleEditMemberSave}
            variant="contained"
            disabled={savingEdit}
          >
            {savingEdit ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE MEMBER */}
      <Dialog open={deleteMember} onClose={handleDeleteMemberCancel}>
        <DialogTitle>Delete Member</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to delete member{' '}
            <strong>#{deleteTarget?.id}</strong> (
            {deleteTarget?.last_name}, {deleteTarget?.first_name})
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteMemberCancel}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteMemberConfirm}
            disabled={deleting === deleteTarget?.id}
          >
            {deleting === deleteTarget?.id ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HouseholdsPage;
