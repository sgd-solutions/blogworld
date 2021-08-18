console.log("Blogs route called!", Date.now());

// ------------------ Core Modules ------------------- //
const fs = require('fs');
const path = require('path');
// ----------------------- X ------------------------- //

// ---------------- Third Party Modules -------------- //
const express = require('express');
// ----------------------- X ------------------------- //

// -------------- User defined Modules --------------- //
const FileUpload = require('../modules/file_upload');
// ----------------------- X ------------------------- //

const BlogModel = require('../models/blog');

const router = express.Router();

router.use((req, res, next) => {
    console.log("First hit!", Date.now());
    console.log('blogs - globalVar:', global);

    next();
});

router.get('/create', (req, res, next) => {
    console.log('Create');
    let objPageData = {
        title: 'Create',
        data: {
            msg: '',
            err: false,
            fields: {}
        }
    };

    // res.sendFile(`${__dirname}/views/blogs/create.html`);
    res.render(`blogs/create`, objPageData, function(err, html) {
        console.log("Inside render");

        if( err )
        {
            console.error(err);
            res.send(err);
            return;
        }

        // console.log(html);
        res.send(html);
    });
});

router.post('/create', (req, res, next) => {
    console.log('Inside POST create', Date.now());

    let objFileUpload;
    const filePath = path.join(__dirname, '../public/uploads/blogs/');
    const fileType = 'image';
    const fields = [
        {name: 'photos', maxCount: 2},
        {name: 'documents', maxCount: 1}
    ];
    const fileSizeLimit = 1024 * 1024 * 7; // 7 Mb

    try
    {
        objFileUpload = new FileUpload(filePath, fileType, fields, fileSizeLimit);
        // console.log('objFileUpload:', objFileUpload);
    }
    catch( e )
    {
        console.error(e);
        return res.status(501).end(e);
    }
    
    objFileUpload.upload()(req, res, async (errMulter) => {
        console.log('Inside multer upload', Date.now());

        // This object will hold the data for the page
        let objPageData = {
            title: 'Create',
            data: {
                msg: '',
                hasErr: false,
                objError: {},
                fields: req.body
            }
        };
        
        try
        {
            // console.log('Body:', req.body);
            // console.log('Files:', req.files);
            
            let objFileErrMsg = {}, arrFiles = null;
            if( errMulter )
            {
                objFileErrMsg = objFileUpload.getFileCustomErrorMessage(errMulter);
                console.error(objFileErrMsg);
                objPageData.data.hasErr = true;
                objPageData.data.msg = 'File validation error';
                // res.json(objFileErrMsg);
            }
            else
            {
                if( Object.keys(req.files).length )
                {
                    arrFiles = objFileUpload.getUploadedFileNames(req.files); // Set the file names for Collection's field
                    console.log('arrFiles:', arrFiles);
                }
            }

            // -------- Instantiate BlogModel for database entry ------ //
            let blogData = {
                title: req.body.title,
                description: req.body.description,
                user_id: global.userData.id
            };

            if( arrFiles && arrFiles.photos.length )
            {
                blogData.photos = arrFiles.photos;
            }
            
            let objBlog = new BlogModel(blogData); // Creating a new document instance
            console.log('objBlog:', objBlog);
            // ---------------------------- X ------------------------- //

            // let objBlogErr = objBlog.validateSync(); // Validate data against Schema
            let objBlogErr = await objBlog.validate().catch(err => err); // Validate data against Schema
            // console.log('objBlogErr aftr await:', objBlogErr);

            let objSchemaErrMsgs = {};
            if( objBlogErr )
            {
                // console.log('objBlogErr B4:', objBlogErr);
                objSchemaErrMsgs = objBlog.getSchemaValidationMessages(objBlogErr); // Get formatted Schema messages
                console.log('objBlogErr Aftr:', objSchemaErrMsgs);

                objPageData.data.hasErr = true;
                objPageData.data.msg = 'Form validation error';
            }

            if( objPageData.data.hasErr )
            {
                objPageData.data.objError = getCombinedErrMsgs(objFileErrMsg, objSchemaErrMsgs); // Get a combined error messages for both File and Schema
            }
            else
            {
                // BlogModel.init();
                // objBlog.save(blogData).then(doc => {
                //     console.log(doc);
                //     objPageData.data.msg = 'Blog has been saved successfully!';
                // }).catch(err => {
                //     console.error('Error in saving document.', err.message);
                //     objPageData.data.hasErr = true;
                //     objPageData.data.msg = 'Error in saving document. ' + err.message;
                // });

                try
                {
                    // BlogModel.init();
                    let savedDoc = await objBlog.save(blogData);
                    console.info(savedDoc);
                    objPageData.data.msg = 'Blog has been saved successfully!';
                }
                catch( err )
                {
                    console.error('Error in saving document.', err);
                    objPageData.data.hasErr = true;
                    objPageData.data.msg = 'Error in saving document. ' + err;
                    objPageData.data.objError = {save: 'Error in saving record. ' + err};
                }
            }

            if( objPageData.data.hasErr )
            {
                // If the files are uploaded, but there is a form validation error, then delete the uploaded files from server
                if( arrFiles )
                {
                    objFileUpload.deleteFiles(req.files);
                }
            }
        }
        catch (error)
        {
            console.error('Outer catch:', error);
        }

        console.log('objPageData:', objPageData);
        // res.json(objPageData);

        if( !objPageData.data.hasErr )
        {
            return res.redirect('list/?success=true');
        }

        res.render('blogs/create', objPageData, (err, html) => {
            if( err )
            {
                console.error(err);
                res.json(err);
                return;
            }

            // console.log(html);
            res.send(html);
        });
    });

    // console.log('Outside:', Object.assign(req.body, req.files));
    // res.json(Object.assign(req.body, req.files));
});

router.get(['/', '/list'], async (req, res, next) => {
    console.log('List');

    let dataset = null;
    let totalRcds = 0;
    let rcdsPerPage = 3;
    let pageNumber = 1;
    let numberOfPages = 0;
    let msg = '';
    
    if( req.query.success )
    {
        msg = req.query.success;
    }

    if( req.query.page && parseInt(req.query.page) > 0 )
    {
        pageNumber = parseInt(req.query.page);
    }

    let promiseBlogCount = BlogModel.countDocuments();
    let promiseBlogRcds = BlogModel.find()
                                    .populate('user_id', ['username', 'age'])
                                    .limit(rcdsPerPage)
                                    .skip(rcdsPerPage * (pageNumber - 1))
                                    .exec();
    
    try
    {
        let arrPromRes = await Promise.all([promiseBlogCount, promiseBlogRcds]);

        totalRcds = arrPromRes[0];
        dataset = arrPromRes[1];

        numberOfPages = Math.ceil(totalRcds / rcdsPerPage);
    }
    catch( err )
    {
        console.error(err);
        res.status(422).json(err);
    }

    res.render('blogs/list', {
        title: 'List',
        data: {
            msg: msg,
            totalRcds: totalRcds,
            dataset: dataset,
            numberOfPages: numberOfPages,
            page: pageNumber
        }
    }, (err, html) => {
        if( err )
        {
            console.error(err);
            return;
        }

        res.send(html);
    });

    console.log('Outside:', {
        msg: msg,
        totalRcds: totalRcds,
        dataset: dataset,
        numberOfPages: numberOfPages,
        page: pageNumber
    });
    // res.render('blogs/list', {data: {dataset: dataset}});
});

router.get('/update/:id', (req, res, next) => {
    console.log('GET: Update');
    res.render('blogs/update');
});

router.put('/update/:id', (req, res, next) => {
    console.log('PUT: Update');
    res.render('blogs/update');
});

// --------------------------- Custom functions ---------------------------------- //
const getCombinedErrMsgs = (objFileErrMsg, objSchemaErrMsgs) => {
    console.log('Inside getCombinedErrMsgs()', Date.now());
    let objCombinedErrors = {};

    objCombinedErrors = Object.assign(objCombinedErrors, objFileErrMsg);
    objCombinedErrors = Object.assign(objCombinedErrors, objSchemaErrMsgs);
    
    return objCombinedErrors;
}
// --------------------------------- X --------------------------------------- //

module.exports = router;