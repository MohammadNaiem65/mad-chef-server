const fs = require('fs');
const cloudinary = require('cloudinary').v2;

async function uploadImage(req, res, next) {
    const imgPath = req.file.path;
    const { userId } = req.user;

    if (!imgPath) {
        return res.status(400).json({ message: 'No payload found.' });
    }

    try {
        // delete the previous image
        await cloudinary.uploader.destroy(userId);

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(imgPath, {
            folder: 'mad-chef/profile-pictures',
            public_id: userId,
            resource_type: 'image',
        });

        // Delete local file after successful upload
        fs.unlinkSync(imgPath);

        // Set the data to req.body
        req.body = { img: result.secure_url };

        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error occurred while uploading image',
        });
    }
}
module.exports = uploadImage;
