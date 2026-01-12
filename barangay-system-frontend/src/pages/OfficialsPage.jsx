// src/pages/OfficialsPage.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  IconButton,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import api from '../api';

const POSITIONS = [
  'Punong Barangay',
  'Barangay Kagawad',
  'Sangguniang Kabataan Chairperson',
  'Barangay Secretary',
  'Barangay Treasurer',
  'Barangay Clerk',
];

const API_ROOT = 'http://localhost:5000';

const emptyForm = {
  id: null,
  full_name: '',
  position: 'Punong Barangay',
  order_no: 0,
  is_captain: false,
  is_secretary: false,
};

const OfficialsPage = () => {
  const [officials, setOfficials] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('All');

  const [form, setForm] = useState(emptyForm);
  const [signatureFile, setSignatureFile] = useState(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadOfficials = async () => {
    try {
      setLoading(true);
      const res = await api.get('/officials');
      setOfficials(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOfficials();
  }, []);

  const filteredOfficials = officials.filter((o) => {
    const matchSearch = o.full_name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchPosition =
      positionFilter === 'All' || o.position === positionFilter;
    return matchSearch && matchPosition;
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) =>
        fd.append(k, typeof v === 'boolean' ? (v ? '1' : '0') : v)
      );
      if (signatureFile) fd.append('signature', signatureFile);

      if (form.id) {
        await api.put(`/officials/${form.id}`, fd);
      } else {
        await api.post('/officials', fd);
      }

      setAddOpen(false);
      setEditOpen(false);
      setForm(emptyForm);
      loadOfficials();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/officials/${selected.id}`);
      setDeleteOpen(false);
      loadOfficials();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* LEFT PANEL */}
        <Box sx={{ maxWidth: '20vw', minWidth: 220 }}>
          {/* ADD BUTTON */}
          <Grid container spacing={1} sx={{ mb: 2 }}>
             <Grid size={{xs: 12, md: 12}}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={() => {
                  setForm(emptyForm);
                  setAddOpen(true);
                }}
              >
                ADD OFFICIAL
              </Button>
            </Grid>
          </Grid>

          {/* FILTER CARD */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Filter
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  size="small"
                  label="Search (name)"
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

              <Grid item xs={12}>
                <TextField
                  select
                  size="small"
                  label="Position"
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  fullWidth
                >
                  <MenuItem value="All">All</MenuItem>
                  {POSITIONS.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        {/* RIGHT PANEL */}
        <Box sx={{ flex: 1, minWidth: 700 }}>
          <Paper elevation={2}>
            {loading ? (
              <Box
                sx={{
                  height: '40vh',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                }}
              >
                <CircularProgress />
                <Typography>Fetching Officials...</Typography>
              </Box>
            ) : (
              <TableContainer
                sx={{
                  maxHeight: '90vh',
                  overflowX: 'auto',
                }}
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Order</TableCell>
                      <TableCell>Full Name</TableCell>
                      <TableCell>Position</TableCell>
                      <TableCell>Captain</TableCell>
                      <TableCell>Secretary</TableCell>
                      <TableCell>Signature</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredOfficials.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell>{o.order_no}</TableCell>
                        <TableCell>{o.full_name}</TableCell>
                        <TableCell>{o.position}</TableCell>
                        <TableCell>{o.is_captain ? 'Yes' : ''}</TableCell>
                        <TableCell>{o.is_secretary ? 'Yes' : ''}</TableCell>
                        <TableCell>
                          {o.signature_path ? (
                            <img
                              src={`${API_ROOT}${o.signature_path}`}
                              alt="Signature"
                              height={35}
                            />
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setForm(o);
                              setEditOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setSelected(o);
                              setDeleteOpen(true);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>
      </Box>

      {/* ADD / EDIT DIALOG */}
      <Dialog open={addOpen || editOpen} maxWidth="sm" fullWidth>
        <DialogTitle>
          {form.id ? 'Edit Official' : 'Add Official'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Full Name"
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                label="Position"
                value={form.position}
                onChange={(e) =>
                  setForm({
                    ...form,
                    position: e.target.value,
                    is_captain: e.target.value === 'Punong Barangay',
                    is_secretary:
                      e.target.value === 'Barangay Secretary',
                  })
                }
                fullWidth
              >
                {POSITIONS.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <TextField
                type="number"
                label="Order No."
                value={form.order_no}
                onChange={(e) =>
                  setForm({ ...form, order_no: e.target.value })
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <Button component="label" variant="outlined">
                Upload Signature
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) =>
                    setSignatureFile(e.target.files[0])
                  }
                />
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddOpen(false);
              setEditOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE DIALOG */}
      <Dialog open={deleteOpen}>
        <DialogTitle>Delete Official</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Delete <strong>{selected?.full_name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OfficialsPage;
