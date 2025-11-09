const Router = require('express')
const UserController = require('./user-controller')
const authMiddleware =require('./../middleware/auth-middleware')
const { uploadFile, handleFileUpload } = require('./../Message/uploadController');
const router = new Router()

router.post('/login', UserController.login)
router.post('/registration', UserController.registration)
router.post('/logout', UserController.logout)
router.get('/refresh', UserController.refresh)
router.get('/profile', authMiddleware, UserController.getProfile);
router.post('/upload', authMiddleware, uploadFile, handleFileUpload);

router.get('/debug-files', (req, res) => {
    const fs = require('fs');
    const path = require('path');

    try {
        const projectRoot = path.join(__dirname, '../../');
        const uploadsPath = path.join(projectRoot, 'uploads');

        const folders = ['images', 'audio', 'files'];
        folders.forEach(folder => {
            const folderPath = path.join(uploadsPath, folder);
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }
        });

        const result = {
            projectRoot: projectRoot,
            uploadsPath: uploadsPath,
            folders: {}
        };

        folders.forEach(folder => {
            const folderPath = path.join(uploadsPath, folder);
            result.folders[folder] = {
                path: folderPath,
                exists: fs.existsSync(folderPath),
                files: []
            };

            if (fs.existsSync(folderPath)) {
                result.folders[folder].files = fs.readdirSync(folderPath).map(file => ({
                    name: file,
                    url: `/uploads/${folder}/${file}`,
                    fullPath: path.join(folderPath, file),
                    accessible: false
                }));
            }
        });
        res.json(result);

    } catch (error) {
        console.error('❌ Debug files error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router