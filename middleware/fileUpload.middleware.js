const multer = require('multer');
const path = require('path');

const configureFileUpload = () => {
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {

            if (
                file.mimetype === 'image/jpeg' ||
                file.mimetype === 'image/png'
            ) {
                cb(null, path.join(__dirname, '../upload/image'));
            }
            else {
                cb(new Error('Invalid file type'));
            }
        },
        filename: function (req, file, cb) {
            const name = Date.now() + '-' + file.originalname;
            cb(null, name);
        },
    });

    const fileFilter = (req, file, cb) => {

        const allowedFieldnames = ['uploadId', 'bannerImage'];

        if (allowedFieldnames.includes(file.fieldname)) {

            if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {


                cb(null, true)


            } else {
                cb(new Error('Invalid file type'));
            }

        } else {
            cb(new Error('Invalid fieldname'));
        }
    };

    const upload = multer({
        storage: storage,
        fileFilter: fileFilter,
        limits: {
            fileSize: 3 * 1024 * 1024
        },
    }).fields([
        { name: 'uploadId', maxCount: 1 },
        { name: 'bannerImage', maxCount: 1 },
    ]);;

    return upload;

};

module.exports = configureFileUpload;