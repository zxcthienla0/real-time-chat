const multer = require('multer');
const path = require('path');
const fs = require('fs');

const projectRoot = path.join(__dirname, '../../');
const uploadsRoot = path.join(projectRoot, 'uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = uploadsRoot + '/';

        if (file.mimetype.startsWith('image/')) {
            folder += 'images/';
        } else if (file.mimetype.startsWith('audio/')) {
            folder += 'audio/';
        } else {
            folder += 'files/';
        }

        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }

        cb(null, folder);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') ||
        file.mimetype.startsWith('audio/') ||
        file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Неподдерживаемый тип файла'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024,
        files: 1
    }
});

exports.uploadFile = upload.single('file');

exports.handleFileUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не загружен' });
        }

        console.log('📁 File upload details:', {
            originalName: req.file.originalname,
            filename: req.file.filename,
            path: req.file.path,
            destination: req.file.destination,
            mimetype: req.file.mimetype,
            size: req.file.size
        });

        let urlPath = '/uploads/';

        if (req.file.mimetype.startsWith('image/')) {
            urlPath += 'images/';
        } else if (req.file.mimetype.startsWith('audio/')) {
            urlPath += 'audio/';
        } else {
            urlPath += 'files/';
        }

        urlPath += req.file.filename;

        const fileData = {
            originalName: req.file.originalname,
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            mimeType: req.file.mimetype,
            url: urlPath
        };

        console.log('✅ File uploaded successfully:', fileData);

        res.json({
            success: true,
            file: fileData
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Ошибка при загрузке файла' });
    }
};