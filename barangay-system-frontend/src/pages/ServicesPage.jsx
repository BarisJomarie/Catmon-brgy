// src/pages/ServicesPage.jsx
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  InputAdornment,
  TablePagination,
  Divider,
  Autocomplete,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import api from '../api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const emptyService = {
  id: null,
  service_name: '',
  description: '',
  service_date: '',
  location: '',
};

const emptyBeneficiary = {
  resident_id: '',
  notes: '',
};

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [residents, setResidents] = useState([]);

  // forms
  const [serviceForm, setServiceForm] = useState(emptyService);
  const [beneficiaryForm, setBeneficiaryForm] = useState(emptyBeneficiary);
  const [editData, setEditData] = useState(null);

  // dialogs
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [isEditingService, setIsEditingService] = useState(false);

  const [beneficiaryEditOpen, setBeneficiaryEditOpen] = useState(false);

  const [beneficiaryDialogOpen, setBeneficiaryDialogOpen] = useState(false);
  const [deleteServiceDialogOpen, setDeleteServiceDialogOpen] =
    useState(false);
  const [deleteBeneficiaryDialogOpen, setDeleteBeneficiaryDialogOpen] =
    useState(false);

  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [beneficiaryToDelete, setBeneficiaryToDelete] = useState(null);

  // loading / errors
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(false);
  const [savingService, setSavingService] = useState(false);
  const [savingBeneficiary, setSavingBeneficiary] = useState(false);
  const [deletingService, setDeletingService] = useState(false);
  const [deletingBeneficiary, setDeletingBeneficiary] = useState(false);
  const [errorService, setErrorService] = useState('');
  const [errorBeneficiary, setErrorBeneficiary] = useState('');

  // filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchText, setSearchText] = useState('');

  // load all
  useEffect(() => {
    loadServices();
    loadResidents();
  }, []);

  const loadServices = async () => {
    try {
      setLoadingServices(true);
      const res = await api.get('/services');
      setServices(res.data || []);
      // if current selected service was deleted, clear selection
      if (
        selectedService &&
        !res.data.find((s) => s.id === selectedService.id)
      ) {
        setSelectedService(null);
        setBeneficiaries([]);
      }
    } catch (err) {
      console.error('Error fetching services', err);
      alert('Error fetching services');
    } finally {
      setLoadingServices(false);
    }
  };

  const loadResidents = async () => {
    try {
      const res = await api.get('/residents');
      setResidents(res.data || []);
    } catch (err) {
      console.error('Error fetching residents', err);
      alert('Error fetching residents');
    }
  };

  const loadBeneficiaries = async (serviceId) => {
    if (!serviceId) return;
    try {
      setLoadingBeneficiaries(true);
      const res = await api.get(`/services/${serviceId}/beneficiaries`);
      setBeneficiaries(res.data || []);
    } catch (err) {
      console.error('Error fetching beneficiaries', err);
      alert('Error fetching beneficiaries');
    } finally {
      setLoadingBeneficiaries(false);
    }
  };

  const handleSelectService = (service) => {
    setSelectedService(service);
    loadBeneficiaries(service.id);
  };

  const handleServiceFormChange = (e) => {
    const { name, value } = e.target;
    setServiceForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBeneficiaryFormChange = (e) => {
    const { name, value } = e.target;
    setBeneficiaryForm((prev) => ({ ...prev, [name]: value }));
  };

  const openAddServiceDialog = () => {
    setIsEditingService(false);
    setServiceForm({
      ...emptyService,
      service_date: new Date().toISOString().slice(0, 10),
    });
    setErrorService('');
    setServiceDialogOpen(true);
  };

  const openEditServiceDialog = (service) => {
    setIsEditingService(true);
    setServiceForm({
      id: service.id,
      service_name: service.service_name || '',
      description: service.description || '',
      service_date: service.service_date
        ? service.service_date.slice(0, 10)
        : '',
      location: service.location || '',
    });
    setErrorService('');
    setServiceDialogOpen(true);
  };

  const closeServiceDialog = () => {
    setServiceDialogOpen(false);
  };

  const validateServiceForm = () => {
    if (!serviceForm.service_name.trim()) {
      return 'Service name is required.';
    }
    return '';
  };

  const handleSaveService = async () => {
    const validationError = validateServiceForm();
    if (validationError) {
      setErrorService(validationError);
      return;
    }

    try {
      setSavingService(true);
      if (isEditingService && serviceForm.id) {
        await api.put(`/services/${serviceForm.id}`, serviceForm);
      } else {
        await api.post('/services', serviceForm);
      }
      setServiceDialogOpen(false);
      await loadServices();
    } catch (err) {
      console.error('Error saving service', err);
      setErrorService(err.response?.data?.message || 'Error saving service');
    } finally {
      setSavingService(false);
    }
  };

  const openDeleteServiceDialog = (service) => {
    setServiceToDelete(service);
    setDeleteServiceDialogOpen(true);
  };

  const closeDeleteServiceDialog = () => {
    setDeleteServiceDialogOpen(false);
    setServiceToDelete(null);
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;
    try {
      setDeletingService(true);
      await api.delete(`/services/${serviceToDelete.id}`);
      setDeleteServiceDialogOpen(false);
      setServiceToDelete(null);
      await loadServices();
    } catch (err) {
      console.error('Error deleting service', err);
      alert(
        err.response?.data?.message ||
          'Error deleting service. Make sure it has no beneficiaries.'
      );
    } finally {
      setDeletingService(false);
    }
  };

  const openAddBeneficiaryDialog = () => {
    if (!selectedService) {
      alert('Please select a service first.');
      return;
    }
    setBeneficiaryForm(emptyBeneficiary);
    setErrorBeneficiary('');
    setBeneficiaryDialogOpen(true);
  };

  const closeBeneficiaryDialog = () => {
    setBeneficiaryDialogOpen(false);
  };

  const validateBeneficiaryForm = () => {
    if (!beneficiaryForm.resident_id) {
      return 'Please choose a resident.';
    }
    // check duplicate
    const exists = beneficiaries.some(
      (b) => String(b.resident_id) === String(beneficiaryForm.resident_id)
    );
    if (exists) {
      return 'This resident is already a beneficiary for this service.';
    }
    return '';
  };

  const handleSaveBeneficiary = async () => {
    const validationError = validateBeneficiaryForm();
    if (validationError) {
      setErrorBeneficiary(validationError);
      return;
    }
    if (!selectedService) return;

    try {
      setSavingBeneficiary(true);
      await api.post(`/services/${selectedService.id}/beneficiaries`, {
        resident_id: beneficiaryForm.resident_id,
        notes: beneficiaryForm.notes,
      });
      setBeneficiaryDialogOpen(false);
      await loadBeneficiaries(selectedService.id);
    } catch (err) {
      console.error('Error saving beneficiary', err);
      setErrorBeneficiary(
        err.response?.data?.message || 'Error saving beneficiary'
      );
    } finally {
      setSavingBeneficiary(false);
    }
  };

  // --- Beneficiary Edit Handlers ---
  const handleEditBeneficiaryClick = (beneficiary) => {
    setEditData({ ...beneficiary });
    setBeneficiaryEditOpen(true); 
  };

  const handleEditBeneficiaryChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBeneficiarySave = async () => {
    try {
      setSavingBeneficiary(true);
      await api.put(`/services/${selectedService.id}/beneficiaries/${editData.id}`, editData);
      setBeneficiaryEditOpen(false);
      setEditData(null);
      await loadBeneficiaries(selectedService.id);
    } catch (err) {
      console.error('Error updating beneficiary', err);
      alert(err.response?.data?.message || 'Error updating beneficiary');
    } finally {
      setSavingBeneficiary(false);
    }
  };

  const handleBeneficiaryClose = () => {
    setBeneficiaryEditOpen(false);
    setEditData(null);
  };


  const openDeleteBeneficiaryDialog = (beneficiary) => {
    setBeneficiaryToDelete(beneficiary);
    setDeleteBeneficiaryDialogOpen(true);
  };

  const closeDeleteBeneficiaryDialog = () => {
    setDeleteBeneficiaryDialogOpen(false);
    setBeneficiaryToDelete(null);
  };

  const handleDeleteBeneficiary = async () => {
    if (!selectedService || !beneficiaryToDelete) return;
    try {
      setDeletingBeneficiary(true);
      await api.delete(`/beneficiaries/${beneficiaryToDelete.id}`);
      setDeleteBeneficiaryDialogOpen(false);
      setBeneficiaryToDelete(null);
      await loadBeneficiaries(selectedService.id);
    } catch (err) {
      console.error('Error deleting beneficiary', err);
      alert(err.response?.data?.message || 'Error deleting beneficiary');
    } finally {
      setDeletingBeneficiary(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-PH', { dateStyle: 'medium' });
  };

  // filters and pagination
  const filteredServices = services.filter((s) => {
    const dateOnly = s.service_date ? s.service_date.slice(0, 10) : '';
    const matchFrom = !dateFrom || dateOnly >= dateFrom;
    const matchTo = !dateTo || dateOnly <= dateTo;
    const haystack = (
      `${s.service_name || ''} ${s.location || ''} ${s.description || ''}`
    )
      .toLowerCase()
      .trim();
    const matchSearch =
      !searchText.trim() ||
      haystack.includes(searchText.trim().toLowerCase());
    return matchFrom && matchTo && matchSearch;
  });


  const residentName = (id) => {
    const r = residents.find((x) => x.id === id);
    if (!r) return '';
    return `${r.last_name}, ${r.first_name}`;
  };

  // Export: PDF
  const handleExportPdf = () => {
    if (!selectedService) {
      alert('Select a service first.');
      return;
    }
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text('Barangay Service Report', 14, 18);
    doc.setFontSize(11);
    doc.text(`Service: ${selectedService.service_name}`, 14, 28);
    doc.text(
      `Date: ${
        selectedService.service_date
          ? formatDate(selectedService.service_date)
          : ''
      }`,
      14,
      34
    );
    doc.text(`Location: ${selectedService.location || ''}`, 14, 40);
    doc.text(`Description:`, 14, 46);
    const description = selectedService.description || '';
    const splitDesc = doc.splitTextToSize(description, 180);
    doc.text(splitDesc, 14, 52);

    const startY = 52 + splitDesc.length * 6 + 4;

    const body = beneficiaries.map((b, idx) => [
      idx + 1,
      `${b.last_name}, ${b.first_name}`,
      b.notes || '',
    ]);

    doc.autoTable({
      head: [['#', 'Name', 'Notes']],
      body,
      startY,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(
      `service_${selectedService.id}_${
        selectedService.service_name || 'report'
      }.pdf`
    );
  };

  // Export: Excel
  const handleExportExcel = () => {
    if (!selectedService) {
      alert('Select a service first.');
      return;
    }
    const data = beneficiaries.map((b, idx) => ({
      '#': idx + 1,
      'Last Name': b.last_name,
      'First Name': b.first_name,
      Notes: b.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Beneficiaries');
    const fileName = `service_${selectedService.id}_beneficiaries.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2}}>
        <Box sx={{ maxWidth: '20vw', minWidth: 200 }}>
          <Button 
            variant="contained"
            disabled={serviceDialogOpen}  
            onClick={openAddServiceDialog}
            size='large'
            sx={{mb: 2}}
            fullWidth
            >
            Add Service
          </Button>
          <Paper sx={{ p: 2 }} elevation={2}>
            <Typography variant="h6" sx={{mb: 2}} gutterBottom>Filter</Typography>
            <Box flexGrow={1}>
              <Grid container spacing={2}>
                <Grid size={{xs: 12, md: 12}}>
                  <TextField
                    label="Search (name / location / description)"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    fullWidth
                    size="small"
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
                    label="From"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    label="To"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Box>

        <Box sx={{ flex: 2, minWidth: 200, height: '100%'}}>
          <Paper elevation={2}>
            {loadingServices ? (
              <Typography>Loading services...</Typography>
            ) : (
              <>
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
                        <TableCell>Service Name</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Beneficiaries</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="center">Actions</TableCell>
                        <TableCell align='center'>Select</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredServices.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>{s.service_name}</TableCell>
                          <TableCell>
                            {formatDate(s.service_date)}
                          </TableCell>
                          <TableCell>{s.location || ''}</TableCell>
                          <TableCell>{s.beneficiary_count || 0}</TableCell>
                          <TableCell>{s.description}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditServiceDialog(s);
                              }}
                              sx={{ mr: 1 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteServiceDialog(s);
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                          <TableCell align='center'>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleSelectService(s)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredServices.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            No services found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Paper>
        </Box>

        {selectedService && (
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Paper sx={{ p: 2, position: 'relative' }} elevation={2}>
              <Button 
                onClick={() => {
                  setSelectedService(null);
                }}
                sx={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                }}
                >
                  Close
              </Button>
              <Typography variant="h6" gutterBottom>Service Details</Typography>
              <Box sx={{p: 2, border: '1px solid #ddd'}}>
                <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 1}}>
                  <Typography fontWeight={'bold'} textAlign={'left'}>Name: </Typography>
                  <Typography fontWeight={'regular'} textAlign={'right'}>{selectedService?.service_name}</Typography>
                </Box>
                <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 1}}>
                  <Typography fontWeight={'bold'} textAlign={'left'}>Date: </Typography>
                  <Typography fontWeight={'regular'} textAlign={'right'}>{selectedService?.service_date ? formatDate(selectedService.service_date) : ''}</Typography>
                </Box>
                <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 1}}>
                  <Typography fontWeight={'bold'} textAlign={'left'}>Location: </Typography>
                  <Typography fontWeight={'regular'} textAlign={'right'}>{selectedService?.location || ''}</Typography>
                </Box>
                <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
                  <Typography fontWeight={'bold'} textAlign={'left'}>Description: </Typography>
                  <Typography fontWeight={'regular'} textAlign={'right'}>{selectedService?.description || <em>No description</em>}</Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={openAddBeneficiaryDialog}
                >
                  Add Beneficiary
                </Button>
                {/* <Button
                  variant="outlined"
                  size="small"
                  onClick={handleExportPdf}
                  disabled={beneficiaries.length === 0}
                >
                  Export PDF
                </Button> */}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleExportExcel}
                  disabled={beneficiaries.length === 0}
                >
                  Export Excel
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>Beneficiaries</Typography>
              {loadingBeneficiaries ? (
                <Typography>Loading beneficiaries...</Typography>
              ) : beneficiaries.length === 0 ? (
                <Typography variant="body2">No beneficiaries yet for this service</Typography>
              ) : (
                <TableContainer
                  sx={{
                    maxHeight: '50vh',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    '&:hover': {
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(0,0,0,0.3) transparent',
                    } 
                  }}
                  >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Notes</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {beneficiaries.map((b, index) => (
                        <TableRow key={b.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            {b.last_name}, {b.first_name}
                          </TableCell>
                          <TableCell>{b.notes || ''}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => handleEditBeneficiaryClick(b)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => openDeleteBeneficiaryDialog(b)}
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
        )}
      </Box>

      {/* Service dialog */}
      <Dialog
        open={serviceDialogOpen}
        onClose={closeServiceDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isEditingService ? 'Edit Service' : 'Add Service'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ m: 2 }}>
            <Grid size={{xs: 12, md: 6}}>
              <TextField
                label="Service Name"
                name="service_name"
                value={serviceForm.service_name}
                onChange={handleServiceFormChange}
                fullWidth
                required
              />
            </Grid>
            <Grid size={{xs: 12, md: 6}}>
              <TextField
                label="Date"
                type="date"
                name="service_date"
                value={serviceForm.service_date}
                onChange={handleServiceFormChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{xs: 12, md: 12}}>
              <TextField
                label="Location"
                name="location"
                value={serviceForm.location}
                onChange={handleServiceFormChange}
                fullWidth
              />
            </Grid>
            <Grid size={{xs: 12, md: 12}}>
              <TextField
                label="Description"
                name="description"
                value={serviceForm.description}
                onChange={handleServiceFormChange}
                fullWidth
                multiline
                minRows={3}
                maxRows={6}
              />
            </Grid>
            {errorService && (
              <Grid item xs={12}>
                <Typography color="error" variant="body2">
                  {errorService}
                </Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeServiceDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveService}
            disabled={savingService}
          >
            {savingService ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Beneficiary dialog */}
      <Dialog
        open={beneficiaryDialogOpen}
        onClose={closeBeneficiaryDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Beneficiary</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ m: 2 }}>
            <Grid size={{xs: 12, md: 12}}>
              <Autocomplete 
                options={residents} 
                getOptionLabel={(option) => `${option.last_name}, ${option.first_name}`}
                value={residents.find((r) => r.id === beneficiaryForm.resident_id) || null}
                onChange={(event, newValue) => {
                  setBeneficiaryForm((prev) => ({
                    ...prev,
                    resident_id: newValue ? newValue.id : ""
                  }));
                }}
                renderInput={(params) => (<TextField {...params} label="Resident" name="resident_id" fullWidth required />)}
              />
            </Grid>
            <Grid size={{xs: 12, md: 12}}>
              <TextField
                label="Notes"
                name="notes"
                value={beneficiaryForm.notes}
                onChange={handleBeneficiaryFormChange}
                fullWidth
                multiline
                minRows={3}
                maxRows={6}
              />
            </Grid>
            {errorBeneficiary && (
              <Grid item xs={12}>
                <Typography color="error" variant="body2">
                  {errorBeneficiary}
                </Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeBeneficiaryDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveBeneficiary}
            disabled={savingBeneficiary}
          >
            {savingBeneficiary ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG EDIT BENEFICIARY */}
      <Dialog open={beneficiaryEditOpen} onClose={handleBeneficiaryClose} fullWidth maxWidth="sm">
        <DialogTitle>Edit Beneficiary: {editData ? `${editData.last_name}, ${editData.first_name}` : ""}</DialogTitle>
        <DialogContent dividers>
          {editData && (
            <Box sx={{ m: 2 }}>
              <TextField
                label="Notes"
                name="notes"
                value={editData.notes || ''}
                onChange={handleEditBeneficiaryChange}
                fullWidth
                multiline
                minRows={3}
                maxRows={6}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBeneficiaryClose}>Cancel</Button>
          <Button
            onClick={handleBeneficiarySave}
            variant="contained"
            disabled={savingBeneficiary}
          >
            {savingBeneficiary ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>


      {/* Delete service dialog */}
      <Dialog
        open={deleteServiceDialogOpen}
        onClose={closeDeleteServiceDialog}
      >
        <DialogTitle>Delete Service</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to delete service{' '}
            <strong>{serviceToDelete?.service_name}</strong>?
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            If this service has beneficiaries, you may need to remove them
            first.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteServiceDialog}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteService}
            disabled={deletingService}
          >
            {deletingService ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete beneficiary dialog */}
      <Dialog
        open={deleteBeneficiaryDialogOpen}
        onClose={closeDeleteBeneficiaryDialog}
      >
        <DialogTitle>Remove Beneficiary</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Remove{' '}
            <strong>
              {beneficiaryToDelete
                ? `${beneficiaryToDelete.last_name}, ${beneficiaryToDelete.first_name}`
                : ''}
            </strong>{' '}
            from this service?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteBeneficiaryDialog}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteBeneficiary}
            disabled={deletingBeneficiary}
          >
            {deletingBeneficiary ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServicesPage;
