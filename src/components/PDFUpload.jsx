import { useState } from 'react';
import { Upload, File } from 'lucide-react';

export default function PDFUpload() {
  const [file, setFile] = useState(null);
  const [type, setType] = useState('ncert');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [pdfClass, setPdfClass] = useState('');
  const [year, setYear] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a file');
      return;
    }

    setUploading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('subject', subject);
    formData.append('chapter', chapter);
    formData.append('class', pdfClass);
    formData.append('year', year);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/pdfs/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`✓ Uploaded: ${data.filename}`);
        setFile(null);
        setSubject('');
        setChapter('');
        setPdfClass('');
        setYear('');
      } else {
        setMessage(`✗ Error: ${data.error}`);
      }
    } catch (err) {
      setMessage(`✗ Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Upload size={24} /> Upload PDF
      </h2>

      <form onSubmit={handleUpload} className="space-y-4">
        {/* Type */}
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="ncert">NCERT</option>
            <option value="neet">NEET Question Paper</option>
            <option value="jee">JEE Question Paper</option>
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Physics, Chemistry, Biology..."
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Chapter/Topic */}
        <div>
          <label className="block text-sm font-medium mb-1">Chapter/Topic</label>
          <input
            type="text"
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            placeholder="Kinematics, Atomic Structure..."
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Class */}
        <div>
          <label className="block text-sm font-medium mb-1">Class</label>
          <input
            type="text"
            value={pdfClass}
            onChange={(e) => setPdfClass(e.target.value)}
            placeholder="11, 12, etc."
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Year (for papers) */}
        <div>
          <label className="block text-sm font-medium mb-1">Year</label>
          <input
            type="text"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="2023, 2024..."
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* File Input */}
        <div className="border-2 border-dashed rounded-lg p-4">
          <label className="flex flex-col items-center cursor-pointer">
            <File size={32} className="text-gray-400 mb-2" />
            <span className="text-sm font-medium">
              {file ? file.name : 'Click to select PDF'}
            </span>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Upload Button */}
        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:bg-gray-400"
        >
          {uploading ? 'Uploading...' : 'Upload PDF'}
        </button>
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded text-sm ${
          message.startsWith('✓') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}
