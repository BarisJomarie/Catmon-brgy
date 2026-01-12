// src/pages/CertificatesPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Divider,
  Autocomplete,
} from '@mui/material';
import api from '../api';
import jsPDF from 'jspdf';

const CERTIFICATE_TYPES = [
  { value: 'residency', label: 'Certificate of Residency' },
  { value: 'indigency', label: 'Certificate of Indigency' },
  { value: 'clearance', label: 'Barangay Clearance' },
];

const CertificatesPage = () => {
  const [residents, setResidents] = useState([]);
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [certType, setCertType] = useState('residency');
  const [purpose, setPurpose] = useState('');
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [barangayName, setBarangayName] = useState('Catmon');
  const [municipality, setMunicipality] = useState('Malabon');
  const [province, setProvince] = useState('Metro Manila');
  const [captainName, setCaptainName] = useState('');
  const [secretaryName, setSecretaryName] = useState('');
  const [placeIssued, setPlaceIssued] = useState('Barangay Hall');
  const [orNumber, setOrNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  // ---- NEW: officials state comes BEFORE effects that use it
  const [officials, setOfficials] = useState([]);

  // Load residents
  useEffect(() => {
    const loadResidents = async () => {
      try {
        const res = await api.get('/residents');
        setResidents(res.data || []);
      } catch (err) {
        console.error('Error loading residents', err);
        setError('Failed to load residents.');
      }
    };
    loadResidents();
  }, []);

// useEffect(() => {
//   const loadProfile = async () => {
//     try {
//       setProfileLoading(true);
//       const res = await api.get('/barangay-profile');
//       if (res.data) {
//         setBarangayName(res.data.barangay_name);
//         setMunicipality(res.data.municipality);
//         setProvince(res.data.province);
//         setPlaceIssued(res.data.place_issued || 'Barangay Hall');
//       }
//     } catch (err) {
//       console.error('Error loading barangay profile', err);
//       // optional: setError('Failed to load barangay profile.');
//     } finally {
//       setProfileLoading(false);
//     }
//   };
//   loadProfile();
// }, []);

  // Load officials
  useEffect(() => {
    const loadOfficials = async () => {
      try {
        const res = await api.get('/officials');
        setOfficials(res.data || []);
        console.log(res.data);
      } catch (err) {
        console.error('Error loading officials for certificates', err);
      }
    };
    loadOfficials();
  }, []);

  // When officials change, auto-set captain & secretary names
  useEffect(() => {
    if (!officials.length) return;

    const captain =
      officials.find(
        (o) => o.is_captain || o.position === 'Punong Barangay'
      ) || null;
    const secretary =
      officials.find(
        (o) => o.is_secretary || o.position === 'Barangay Secretary'
      ) || null;

    if (captain) setCaptainName(captain.full_name);
    if (secretary) setSecretaryName(secretary.full_name);
  }, [officials]);

  const selectedResident = useMemo(
    () => residents.find((r) => String(r.id) === String(selectedResidentId)),
    [residents, selectedResidentId]
  );

  const buildFullName = (r) => {
    if (!r) return '';
    const parts = [
      r.first_name,
      r.middle_name ? `${r.middle_name.charAt(0)}.` : '',
      r.last_name,
      r.suffix || '',
    ].filter(Boolean);
    return parts.join(' ');
  };

  const buildCertificateBody = () => {
    if (!selectedResident) return '';

    const fullName = buildFullName(selectedResident);
    const address =
      selectedResident.address ||
      `${barangayName}, ${municipality}, ${province}`;

    const lowerPurpose = purpose
      ? purpose[0].toLowerCase() + purpose.slice(1)
      : '';

    switch (certType) {
      case 'residency':
        return (
          `This is to certify that ${fullName.toUpperCase()}, ` +
          `a resident of ${address}, is a bona fide resident of ${barangayName}, ${municipality}, ${province}. ` +
          `This certification is being issued upon the request of the above-named person ` +
          (purpose
            ? `for ${lowerPurpose}.`
            : 'for whatever legal purpose it may serve.')
        );
      case 'indigency':
        return (
          `This is to certify that ${fullName.toUpperCase()}, ` +
          `a resident of ${address}, is known to this office as an indigent. ` +
          `This certification is issued to attest to his/her indigent status ` +
          (purpose
            ? `for ${lowerPurpose}.`
            : 'for any legal and lawful purpose it may serve.')
        );
      case 'clearance':
        return (
          `This is to certify that, based on the records of this Barangay, ` +
          `${fullName.toUpperCase()}, a resident of ${address}, has no derogatory record filed in this office ` +
          `at the time of issuance of this certification. ` +
          (purpose
            ? `This certification is issued upon his/her request for ${lowerPurpose}.`
            : 'This certification is issued upon his/her request for whatever legal purpose it may serve.')
        );
      default:
        return '';
    }
  };

  const certificateBody = useMemo(buildCertificateBody, [
    selectedResident,
    certType,
    purpose,
    barangayName,
    municipality,
    province,
  ]);

  const handleGeneratePdf = () => {
    setError('');

    if (!selectedResident) {
      setError('Please select a resident.');
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'A4',
    });

    const marginX = 20;
    let cursorY = 20;

    // Header
    doc.setFont('Times', 'Normal');
    doc.setFontSize(10);
    doc.text('Republic of the Philippines', 105, cursorY, { align: 'center' });
    cursorY += 5;
    doc.text('Province of ' + province, 105, cursorY, { align: 'center' });
    cursorY += 5;
    doc.text('City/Municipality of ' + municipality, 105, cursorY, {
      align: 'center',
    });
    cursorY += 5;
    doc.text('BARANGAY ' + barangayName.toUpperCase(), 105, cursorY, {
      align: 'center',
    });

    cursorY += 12;
    doc.setLineWidth(0.5);
    doc.line(marginX, cursorY, 210 - marginX, cursorY);
    cursorY += 10;

    // Title
    const certTitle =
      CERTIFICATE_TYPES.find((c) => c.value === certType)?.label ||
      'CERTIFICATE';
    doc.setFontSize(16);
    doc.setFont('Times', 'Bold');
    doc.text(certTitle.toUpperCase(), 105, cursorY, { align: 'center' });

    cursorY += 12;
    doc.setFontSize(12);
    doc.setFont('Times', 'Normal');

    // Intro
    const intro = `TO WHOM IT MAY CONCERN:`;
    doc.text(intro, marginX, cursorY);
    cursorY += 8;

    // Body
    const bodyLines = doc.splitTextToSize(certificateBody, 210 - marginX * 2);
    doc.text(bodyLines, marginX, cursorY);
    cursorY += bodyLines.length * 6 + 6;

    // Date & place
    const issueText = `Issued this ${new Date(issueDate).toLocaleDateString(
      'en-PH',
      { day: 'numeric', month: 'long', year: 'numeric' }
    )} at ${placeIssued}, ${barangayName}, ${municipality}, ${province}.`;
    const issueLines = doc.splitTextToSize(issueText, 210 - marginX * 2);
    doc.text(issueLines, marginX, cursorY);
    cursorY += issueLines.length * 6 + 10;

    // OR / amount (optional)
    if (orNumber || amount) {
      let orText = 'OR No.: ' + (orNumber || 'N/A');
      if (amount) {
        orText += ` | Amount: PHP ${amount}`;
      }
      doc.setFontSize(10);
      doc.text(orText, marginX, cursorY);
      cursorY += 10;
      doc.setFontSize(12);
    }

    // Signatories
    const signY = cursorY + 10;
    doc.setFont('Times', 'Bold');
    doc.text(captainName.toUpperCase(), 210 - marginX, signY, {
      align: 'right',
    });
    doc.setFont('Times', 'Normal');
    doc.text('Punong Barangay', 210 - marginX, signY + 5, {
      align: 'right',
    });

    const secY = signY + 20;
    doc.setFont('Times', 'Bold');
    doc.text(secretaryName.toUpperCase(), 210 - marginX, secY, {
      align: 'right',
    });
    doc.setFont('Times', 'Normal');
    doc.text('Barangay Secretary', 210 - marginX, secY + 5, {
      align: 'right',
    });

    const fileName = `certificate_${certType}_${buildFullName(
      selectedResident
    )
      .replace(/\s+/g, '_')
      .toLowerCase()}.pdf`;

    doc.save(fileName);
  };

  return (
    <Box>
      <Box sx={{display: 'flex', gap: 10}}>
        <Box sx={{flex: 1}}>
          <Paper sx={{ p: 2, mb: 2 }} elevation={2}>
            <Typography variant="h6" gutterBottom>Resident & Certificate Details</Typography>
            <Grid container spacing={2} sx={{m: 2}}>
              <Grid size={{xs: 12, md: 3}}>
                <Autocomplete 
                  options={residents} 
                  getOptionLabel={(option) => `${option.last_name}, ${option.first_name}`}
                  value={residents.find((r) => r.id === selectedResidentId) || null}
                  onChange={(event, newValue) => {
                    setSelectedResidentId(newValue ? newValue.id : "");
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Resident" fullWidth/>
                  )}
                />
              </Grid>

              <Grid size={{xs: 12, md: 3}}>
                <TextField
                  select
                  label="Certificate Type"
                  value={certType}
                  onChange={(e) => setCertType(e.target.value)}
                  fullWidth
                >
                  {CERTIFICATE_TYPES.map((c) => (
                    <MenuItem key={c.value} value={c.value}>
                      {c.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{xs: 12, md: 3}}>
                <TextField
                  label="Purpose"
                  placeholder="e.g., employment, scholarship, school requirement"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid size={{xs: 12, md: 3}}>
                <TextField
                  label="Issue Date"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid size={{xs: 12, md: 4}}>
                <TextField
                  label="Place of Issuance"
                  value={placeIssued}
                  onChange={(e) => setPlaceIssued(e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid size={{xs: 12, md: 4}}>
                <TextField
                  label="OR Number"
                  value={orNumber}
                  onChange={(e) => setOrNumber(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{xs: 12, md: 4}}>
                <TextField
                  label="Amount (₱)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Paper>
          <Paper sx={{ p: 2, mb: 2 }} elevation={2}>
            <Typography variant="h6" gutterBottom>Barangay Header & Officials</Typography>
            <Grid container spacing={2} sx={{m: 2}}>
              <Grid size={{xs: 12, md: 4}}>
                <TextField
                  label="Barangay Name"
                  value={barangayName}
                  onChange={(e) => setBarangayName(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{xs: 12, md: 4}}>
                <TextField
                  label="Municipality / City"
                  value={municipality}
                  onChange={(e) => setMunicipality(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{xs: 12, md: 4}}>
                <TextField
                  label="Province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{xs: 12, md: 6}}>
                <Autocomplete 
                  options={officials.filter(o => o.is_captain === 1)}
                  getOptionLabel={(option) => option.full_name}
                  value={officials.find(o => o.full_name === captainName) || null}
                  onChange={(event, newValue) => setCaptainName(newValue ? newValue.full_name : "")}
                  renderInput={(params) => (
                    <TextField {...params} label="Punong Barangay" fullWidth />
                  )}
                />
              </Grid>
              <Grid size={{xs: 12, md: 6}}>
                <Autocomplete 
                  options={officials.filter(o => o.is_secretary === 1)} 
                  getOptionLabel={(option) => option.full_name} 
                  value={officials.find(o => o.full_name === secretaryName) || null} 
                  onChange={(event, newValue) => setSecretaryName(newValue ? newValue.full_name : "")} 
                  renderInput={(params) => ( 
                    <TextField {...params} label="Barangay Secretary" fullWidth /> 
                  )} 
                />
              </Grid>
            </Grid>
          </Paper>
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
          <Box sx={{ mt: 2}}>
            <Button variant="contained" onClick={handleGeneratePdf}>
              Generate PDF
            </Button>
          </Box>
        </Box>
        <Box sx={{flex: 1, p: 2, backgroundColor: '#ddd'}}>
          <Typography variant="h6" gutterBottom sx={{color: 'black'}}>Certificate Preview</Typography>
          <Divider sx={{ mb: 2 }} />
          <Paper sx={{ p: 3, minHeight: 400 }} elevation={2}>
            <Typography
              variant="subtitle2"
              align="center"
              sx={{ textTransform: 'uppercase' }}
            >
              Republic of the Philippines
            </Typography>
            <Typography
              variant="subtitle2"
              align="center"
              sx={{ textTransform: 'uppercase' }}
            >
              Province of {province}
            </Typography>
            <Typography
              variant="subtitle2"
              align="center"
              sx={{ textTransform: 'uppercase' }}
            >
              {municipality}
            </Typography>
            <Typography
              variant="subtitle2"
              align="center"
              sx={{ textTransform: 'uppercase', mb: 2 }}
            >
              Barangay {barangayName}
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <Typography
              variant="h6"
              align="center"
              sx={{ textTransform: 'uppercase', mb: 3 }}
            >
              {
                CERTIFICATE_TYPES.find((c) => c.value === certType)?.label ??
                'Certificate'
              }
            </Typography>

            <Typography variant="body1" sx={{ mb: 2 }}>
              TO WHOM IT MAY CONCERN:
            </Typography>

            <Typography variant="body1" sx={{ textAlign: 'justify', mb: 3 }}>
              {selectedResident ? (
                certificateBody
              ) : (
                <em>
                  Select a resident and fill in the details on the left to
                  preview the certificate text here.
                </em>
              )}
            </Typography>

            <Typography variant="body1" sx={{ mb: 1 }}>
              Issued this{' '}
              {new Date(issueDate).toLocaleDateString('en-PH', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}{' '}
              at {placeIssued}, {barangayName}, {municipality}, {province}.
            </Typography>

            {(orNumber || amount) && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                OR No.: {orNumber || 'N/A'}{' '}
                {amount ? ` | Amount: PHP ${amount}` : ''}
              </Typography>
            )}

            <Box
              sx={{
                mt: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 4,
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ textTransform: 'uppercase' }}>
                  {captainName}
                </Typography>
                <Typography variant="body2">Punong Barangay</Typography>
              </Box>

              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ textTransform: 'uppercase' }}>
                  {secretaryName}
                </Typography>
                <Typography variant="body2">Barangay Secretary</Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default CertificatesPage;
