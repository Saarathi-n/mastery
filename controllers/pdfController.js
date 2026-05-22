
import multer from 'multer';
import { GridFSBucket } from 'mongodb';
import mongoose from 'mongoose';
import path from 'path';
import PDF from '../models/PDF.js';
import cloudinary from '../utils/cloudinary.js';
import config from '../config/index.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

export async function uploadPDF(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const { type, subject, chapter, class: _class, year } = req.body;
    const useCloud = config.cloudinary.useCloudinary;
    
    if (useCloud) {
      const pubId = path.parse(req.file.originalname).name;
      const folder = req.body.cloudinaryFolder || config.cloudinary.defaultFolder;

      const stream = cloudinary.uploader.upload_stream({
        resource_type: 'raw',
        folder,
        public_id: pubId,
        use_filename: true,
        unique_filename: false
      }, async (error, result) => {
        if (error) {
          return res.status(500).json({ error: 'Cloud upload failed', details: error.message });
        }

        const pdf = await PDF.create({
          filename: req.file.originalname,
          cloudinary_public_id: result.public_id,
          cloudinary_url: result.secure_url,
          cloudinary_folder: folder,
          type,
          subject,
          chapter,
          class: _class,
          year,
          uploadedBy: req.user.id,
          fileSize: req.file.size
        });

        res.json({
          id: pdf._id,
          fileId: null,
          filename: pdf.filename,
          cloudinary_url: result.secure_url,
          message: 'PDF uploaded successfully'
        });
      });

      stream.end(req.file.buffer);
    } else {
      const db = mongoose.connection.getClient().db(mongoose.connection.name);
      const bucket = new GridFSBucket(db);
      const uploadStream = bucket.openUploadStream(req.file.originalname, {
        contentType: 'application/pdf'
      });

      uploadStream.end(req.file.buffer);

      uploadStream.on('finish', async () => {
        const pdf = await PDF.create({
          filename: req.file.originalname,
          fileId: uploadStream.id,
          type,
          subject,
          chapter,
          class: _class,
          year,
          uploadedBy: req.user.id,
          fileSize: req.file.size
        });

        res.json({
          id: pdf._id,
          fileId: uploadStream.id,
          filename: req.file.originalname,
          message: "PDF uploaded successfully"
        });
      });

      uploadStream.on('error', (err) => {
        res.status(500).json({ error: "Upload failed", details: err.message });
      });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
}

export async function getPDFs(req, res) {
  try {
    const { type, subject, class: _class } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (subject) filter.subject = subject;
    if (_class) filter.class = _class;

    const pdfs = await PDF.find(filter).select("filename type subject chapter class year uploadedAt fileSize cloudinary_url cloudinary_public_id fileId");
    res.json(pdfs.map(p => {
      const obj = p.toObject();
      obj.id = obj._id;
      obj.fileId = obj.cloudinary_url ? String(obj._id) : obj.fileId;
      return obj;
    }));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

export async function downloadPDF(req, res) {
  try {
    const param = req.params.fileId;
    let pdf = null;

    if (mongoose.Types.ObjectId.isValid(param)) {
      const objId = new mongoose.Types.ObjectId(param);
      pdf = await PDF.findOne({ $or: [{ fileId: objId }, { _id: objId }] });
    }

    if (!pdf) {
      pdf = await PDF.findOne({ cloudinary_public_id: param });
    }

    if (!pdf) {
      return res.status(404).json({ error: "PDF not found" });
    }

    if (pdf.cloudinary_url) {
      res.setHeader('Content-Disposition', `attachment; filename="${pdf.filename}"`);
      const { resourceDownloadUrl } = await import('../utils/cloudinary.js');
      res.redirect(resourceDownloadUrl({ 
        public_id: pdf.cloudinary_public_id, 
        format: path.extname(pdf.filename).replace('.', '') || 'pdf' 
      }));
      return;
    }

    if (!pdf.fileId) {
      return res.status(404).json({ error: 'No file stored on server for this PDF' });
    }

    const db = mongoose.connection.getClient().db(mongoose.connection.name);
    const bucket = new GridFSBucket(db);
    const downloadStream = bucket.openDownloadStream(pdf.fileId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdf.filename}"`);
    downloadStream.pipe(res);

    downloadStream.on('error', () => {
      res.status(404).json({ error: "File not found" });
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
}

export { upload };

