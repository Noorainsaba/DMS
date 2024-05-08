const router=require('express').Router()
require('dotenv').config();
const { initializeApp } = require("firebase/app");
const { getStorage, ref, getDownloadURL, uploadBytesResumable } =require("firebase/storage");
const firebaseConfig = require("../config/firebase.config");
const {ensureLoggedOut,ensureLoggedIn} = require("connect-ensure-login");
const User=require('../models/user.model')
const multer=require("multer");
//Initialize a firebase application
initializeApp(firebaseConfig);

// Initialize Cloud Storage and get a reference to the service
const storage = getStorage();

// Setting up multer as a middleware to grab photo uploads
const upload = multer({ storage: multer.memoryStorage() });

router.get('/upload', ensureLoggedIn({ redirectTo: '/auth/login' }),async (req, res, next) => {
    
    try {
        // Fetch existing usernames from the database
        const existingUsers = await User.find({}, 'username');
        // Render the form with dropdown options
        res.render('uploadfile', { existingUsers: existingUsers });
    } catch (error) {
        // Handle errors
        next(error);
    }
});

router.post("/upload",ensureLoggedIn({ redirectTo: '/auth/login' }),upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            throw new Error("No file uploaded.");
        }
        const user_name=req.user.username
        const dateTime = giveCurrentDateTime();
        const storageRef = ref(storage, `${user_name}/${req.file.originalname + " " + dateTime}`);
        const documentName=req.body.documentName
        const description=req.body.description
        const upload_by=req.body.upload_by
        const department=req.body.department
        const file_upload_date = giveCurrentDate();
        // Create file metadata including the content type
        const metadata = {
            contentType: req.file.mimetype,
        };
        // Upload the file in the bucket storage
        const snapshot = await uploadBytesResumable(storageRef, req.file.buffer, metadata);
        // Grab the public url
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log('File successfully uploaded.');
        // Save the download URL to the user's document in MongoDB
        const userId = req.user._id; // Assuming you have user authenticated and user data available in req.user
        await User.findByIdAndUpdate(userId, { $push: {uploadedFiles: { filename:documentName,url: downloadURL,date:file_upload_date,description:description,upload_by:upload_by,department:department}}});
        req.flash('success', 'File uploaded successfully');
        // return res.status(200).send({
        //     message: 'File uploaded successfully',
        //     filename: documentName,
        //     url: downloadURL,
        //     date: file_upload_date,
        //     description: description,
        //     upload_by: upload_by,
        //     department: department
        // });
        return res.redirect('/user/profile')
    } catch (error) {
        return res.status(400).send(error.message);
    }
});

const giveCurrentDateTime = () => {
    const today = new Date();
    const date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    const dateTime = date + ' ' + time;
    return dateTime;
};

const giveCurrentDate=()=>{
    const today=new Date();
    const date=today.getDate()  + '-' + (today.getMonth() + 1) + '-' + today.getFullYear();
    return date
}

router.get('/profile', async (req, res, next) => {
    try {
        const currentUser = req.user; // Assuming you have the current user object available in req.user
        const uploadedFiles = currentUser.uploadedFiles; // Assuming uploadedFiles is an array field in the user document
        res.render('profile', { person: currentUser, uploadedFiles: uploadedFiles });
    } catch (error) {
        next(error);
    }
});

router.get('/profile/:userId', async (req, res, next) => {
    try {
        const userId = req.params.userId;
        // Fetch user data based on userId from your database
        const user = await User.findById(userId);
        if (!user) {
            // Handle case where user is not found
            return res.status(404).send('User not found');
        }
        // Assuming uploadedFiles is an array field in the user document
        const uploadedFiles = user.uploadedFiles;
        res.render('profile', { person: user, uploadedFiles: uploadedFiles });
    } catch (error) {
        next(error);
    }
});


module.exports=router