import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { QRCode } from 'react-qr-code';
import { Download, Printer, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { tablesAPI, qrAPI } from '../../../services/api';
import jsPDF from 'jspdf';

const QRCodeGenerator = () => {
  const [tables, setTables] = useState([]);
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedTables, setSelectedTables] = useState([]);
  const qrRefs = useRef({});

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const data = await tablesAPI.getAll();
      setTables(data);
      // Select all tables by default
      setSelectedTables(data.map(t => t.id));
    } catch (err) {
      setError('Failed to load tables');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCodes = async () => {
    if (selectedTables.length === 0) {
      setError('Please select at least one table');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await qrAPI.generateBatch(selectedTables);
      setQrCodes(response.qr_codes);
      setSuccess(`Generated ${response.qr_codes.length} QR codes successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to generate QR codes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTableSelection = (tableId) => {
    setSelectedTables(prev => 
      prev.includes(tableId) 
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    );
  };

  const selectAll = () => {
    setSelectedTables(tables.map(t => t.id));
  };

  const deselectAll = () => {
    setSelectedTables([]);
  };

  const downloadQR = async (qrCode) => {
    try {
      const canvas = document.createElement('canvas');
      const svg = qrRefs.current[qrCode.table_id];
      if (!svg) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 512, 512);
        
        canvas.toBlob((blob) => {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `table-${qrCode.table_number}-qr.png`;
          link.click();
          URL.revokeObjectURL(url);
        });
      };
      
      img.src = url;
    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to download QR code');
    }
  };

  const printAllQRCodes = () => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const qrSize = 50;
      const cols = 3;
      const rows = 4;
      const marginX = 15;
      const marginY = 20;
      const spacingX = (pageWidth - 2 * marginX - cols * qrSize) / (cols - 1);
      const spacingY = (pageHeight - 2 * marginY - rows * qrSize) / (rows - 1);

      let currentPage = 0;
      let currentRow = 0;
      let currentCol = 0;

      qrCodes.forEach((qrCode, index) => {
        if (index > 0 && index % (cols * rows) === 0) {
          pdf.addPage();
          currentPage++;
          currentRow = 0;
          currentCol = 0;
        }

        const x = marginX + currentCol * (qrSize + spacingX);
        const y = marginY + currentRow * (qrSize + spacingY);

        // Add QR code image (base64 from backend)
        pdf.addImage(qrCode.qr_data, 'PNG', x, y, qrSize, qrSize);
        
        // Add table number label
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Table ${qrCode.table_number}`, x + qrSize / 2, y + qrSize + 5, { align: 'center' });

        currentCol++;
        if (currentCol >= cols) {
          currentCol = 0;
          currentRow++;
        }
      });

      pdf.save('table-qr-codes.pdf');
      setSuccess('QR codes downloaded as PDF successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Print failed:', err);
      setError('Failed to generate PDF');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">QR Code Generator</h2>
            <p className="text-gray-600 mt-1">Generate QR codes for table menu access</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchTables}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            title="Refresh tables"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>

        {/* Notifications */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{success}</span>
          </motion.div>
        )}

        {/* Table Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Select Tables</h3>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Select All
              </button>
              <span className="text-gray-400">|</span>
              <button
                onClick={deselectAll}
                className="text-sm text-gray-600 hover:text-gray-700 font-medium"
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {tables.map((table) => (
              <motion.button
                key={table.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleTableSelection(table.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedTables.includes(table.id)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">Table {table.table_number}</div>
                <div className="text-xs mt-1">{table.capacity} seats</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generateQRCodes}
            disabled={loading || selectedTables.length === 0}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : `Generate QR Codes (${selectedTables.length})`}
          </motion.button>

          {qrCodes.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={printAllQRCodes}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700"
            >
              <Printer className="w-5 h-5" />
              Print All to PDF
            </motion.button>
          )}
        </div>
      </div>

      {/* QR Code Grid */}
      {qrCodes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Generated QR Codes</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {qrCodes.map((qrCode) => (
              <motion.div
                key={qrCode.table_id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-50 rounded-lg p-6 border border-gray-200"
              >
                <div className="bg-white p-4 rounded-lg mb-4">
                  <QRCode
                    value={qrCode.url}
                    size={200}
                    level="H"
                    ref={(el) => (qrRefs.current[qrCode.table_id] = el)}
                    className="w-full h-auto"
                  />
                </div>
                
                <div className="text-center mb-4">
                  <h4 className="font-bold text-lg text-gray-900">
                    Table {qrCode.table_number}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1 break-all">
                    {qrCode.url}
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => downloadQR(qrCode)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
                >
                  <Download className="w-4 h-4" />
                  Download PNG
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6 border border-blue-100">
        <h3 className="text-lg font-bold text-gray-900 mb-3">How to Use</h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">1.</span>
            <span>Select the tables you want to generate QR codes for</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">2.</span>
            <span>Click "Generate QR Codes" to create QR codes for selected tables</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">3.</span>
            <span>Download individual QR codes as PNG images for digital use</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">4.</span>
            <span>Click "Print All to PDF" to create a printable sheet with all QR codes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">5.</span>
            <span>Print and place QR codes on respective tables for customers to scan</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
