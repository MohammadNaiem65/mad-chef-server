const fs = require('fs');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;

async function uploadImage(req, res, next) {
    // If it's recipe edit request and no photo has been updated then move to next middleware
    if (req.path.includes('/edit-recipe') && !req.file) {
        return next(); // Add return here
    } else if (!req.file) {
        return res.status(400).json({ message: 'No payload found.' });
    }

    const imgPath = req.file.path;
    const { imgId } = req.body;
    const { userId } = req.user;

    try {
        let folder = '/mad-chef';
        let public_id;

        // Set the folder and public_id based on the request path
        if (req.path.includes('/upload-profile-picture')) {
            folder += '/profile-pictures';
            public_id = userId;

            // delete the previous profile picture
            await cloudinary.uploader.destroy(userId);
        } else if (req.path.includes('/post-recipe')) {
            folder += '/recipe-pictures';

            // Generate public_id
            const randomID = crypto.randomBytes(16).toString('hex');
            public_id = `${userId}-${randomID}`;
        } else if (req.path.includes('/edit-recipe')) {
            folder += '/recipe-pictures';
            public_id = imgId;

            // delete the previous image
            await cloudinary.uploader.destroy(public_id);
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(imgPath, {
            folder,
            public_id,
            resource_type: 'image',
        });

        // Delete temporary file after successful upload
        fs.unlinkSync(imgPath);

        // Set the data to req.body
        req.body = {
            ...req.body,
            img: result.secure_url,
            imgId: public_id,
        };

        next();
    } catch (error) {
        console.log('Error in uploadImage:', error);
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
