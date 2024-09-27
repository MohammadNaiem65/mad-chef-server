const fs = require('fs');
const cloudinary = require('cloudinary').v2;

async function uploadImage(req, res, next) {
    if (!req.file) {
        return res.status(400).json({ message: 'No payload found.' });
    }

    const imgPath = req.file.path;
    const { userId } = req.user;

    try {
        // delete the previous image
        await cloudinary.uploader.destroy(userId);

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(imgPath, {
            folder: 'mad-chef/profile-pictures',
            public_id: userId,
            resource_type: 'image',
        });

        // Delete temporary file after successful upload
        fs.unlinkSync(imgPath);

        // Set the data to req.body
        req.body = { img: result.secure_url };

        next();
    } catch (error) {
        console.error(error);
        // Ensure cleaning up the temporary file even if an error occurs
        if (fs.existsSync(imgPath)) {
            fs.unlinkSync(imgPath);
        }
        res.status(500).json({
            message: 'Error occurred while uploading image',
        });
    }
}

module.exports = uploadImage;
