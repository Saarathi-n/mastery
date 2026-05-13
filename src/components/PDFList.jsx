import { useState, useEffect } from 'react';
import { Download, FileText } from 'lucide-react';

export default function PDFList() {
  const [pdfs, setPdfs] = useState([]);
  const [filter, setFilter] = useState({ type: '', subject: '', class: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPDFs();
  }, [filter]);

  const fetchPDFs = async () => {
    try {
      const token = localStorage.getItem('token');
      const query = new URLSearchParams(
        Object.fromEntries(Object.entries(filter).filter(([_, v]) => v))
      ).toString();

      const response = await fetch(`/api/pdfs${query ? '?' + query : ''}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      setPdfs(data);
    } catch (err) {
      console.error('Error fetching PDFs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId, filename) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/pdfs/download/${fileId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FileText size={24} /> PDF Library
      </h2>

      {/* Filters */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <select
          value={filter.type}
          onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          className="border rounded px-3 py-2"
        >
          <option value="">All Types</option>
          <option value="ncert">NCERT</option>
          <option value="neet">NEET</option>
          <option value="jee">JEE</option>
        </select>

        <input
          type="text"
          placeholder="Subject"
          value={filter.subject}
          onChange={(e) => setFilter({ ...filter, subject: e.target.value })}
          className="border rounded px-3 py-2"
        />

        <input
          type="text"
          placeholder="Class"
          value={filter.class}
          onChange={(e) => setFilter({ ...filter, class: e.target.value })}
          className="border rounded px-3 py-2"
        />
      </div>

      {/* PDF List */}
      <div className="space-y-2">
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : pdfs.length === 0 ? (
          <p className="text-center text-gray-500">No PDFs found</p>
        ) : (
          pdfs.map((pdf) => (
            <div
              key={pdf.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition"
            >
              <div className="flex-1">
                <p className="font-medium">{pdf.filename}</p>
                <p className="text-sm text-gray-600">
                  {pdf.type.toUpperCase()} • {pdf.subject} • Class {pdf.class}
                  {pdf.year && ` • ${pdf.year}`}
                </p>
              </div>
              <button
                onClick={() => handleDownload(pdf.fileId, pdf.filename)}
                className="ml-4 p-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
              >
                <Download size={18} /> Download
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
