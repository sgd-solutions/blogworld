console.log("Users route called!", Date.now());

const express = require('express');
const path = require('path');

const UserModel = require('../models/user');
const FileUpload = require('../modules/file_upload');

const router = express.Router();

const middleware = (req, res, next) => {
    console.log('Entry: final MW');
    req.append = 'MW-';
    console.log(':: B4 Multer ::');

    let filePath = path.join(__dirname, '../public/uploads/users/');
    let fileType = 'image';
    let fields = [{name: 'photos', maxCount: 1}];
    let fileSizeLimit = 1024 * 1024 * 5;

    let objFileUpload;
    try
    {
        objFileUpload = new FileUpload(filePath, fileType, fields, fileSizeLimit);
        console.log('objFileUpload:', objFileUpload);
    }
    catch(eF)
    {
        console.error(eF);
    }

    objFileUpload.upload()(req, res, async (err) => {
        console.log('Inside multer upload', Date.now());
        
        console.log(':: Within Multer ::');
        console.log('Age:', req.body.age);
        console.log('Files:', req.files);
        req.append += 'Mul-';

        let objFileErrMsg = {};
        if( err )
        {
            objFileErrMsg = objFileUpload.getFileCustomErrorMessage(err);

            console.error(objFileErrMsg);
            req.errFlag = true;
        }

        // req.errFlag = false;

        let oUserModel = new UserModel(req.body);
        // console.log(UserModel.schema.path('age').required(true, "Age required"));

        let objErr = {};
        try
        {
            // ------------- First way -------------
            // objErr = UserModel.checkUsernameExistence(req.body.username, (err, res) => {
            //     if( err )
            //     {
            //         return console.error('Callback:', err);
            //     }

            //     console.info('Res:', res);

            // });

            // ------------- Second way -------------
            // objErr = UserModel.checkUsernameExistence(req.body.username)
            // .then(res => console.info('Res:', res))
            // .catch(err => console.error('Callback:', err));
            
            // ------------- Third way -------------
            // objErr = await UserModel.checkUsernameExistence(req.body.username);
            objErr = await UserModel.checkEmailExistence(req.body.email);
            
            // Validating a particular field['username']

            // objErr = await oUserModel.validate(['username']); // Validating a particular field['email']
            // objErr = oUserModel.getSchemaValidationMessages(objErr);
            console.log('Result:', objErr);
        }
        catch(err)
        {
            objErr = oUserModel.getSchemaValidationMessages(err);
            console.error('Catch error:', objErr);
        }

        res.json(getCombinedErrMsgs(objFileErrMsg, objErr));
        // next();
        // regMW_3(req, res, next); // Similar to calling next()
    });

    console.log(':: Aftr Multer ::');
    console.log('Age:', req.body.age);
    console.log('Files:', req.files);

    // res.send('POST Registration');

    // next();
    console.log('Exit: final MW');
}


router.route('/validations')
.post(async function(req, res) {
    let oUserModel = new UserModel(req.body);
    console.info(oUserModel);
    // console.log(UserModel.schema.path('age').required(true, "Age required"));

    let objErr = null;
    try
    {
        objErr = await oUserModel.validate(['email']); // Validating a particular field
        // objErr = oUserModel.getSchemaValidationMessages(objErr);
        console.log('Result:', objErr);
    }
    catch(err)
    {
        objErr = oUserModel.getSchemaValidationMessages(err);
        console.error('Catch error:', objErr);
    }

    res.json(objErr);
});

router.route('/registration')
.post(middleware, regMW_3)

.get((req, res) => {
    res.end('GET Registration');
});

async function regMW_3(req, res, next)
{
    console.log('Entry: regMW_3');
    req.append += 'Last';
    console.log('Append:', req.append);
    console.log('Age:', req.body.age);
    console.log('Username:', req.body.username);
    console.log('Error Flag:', req.errFlag);
    console.log('Files:', req.files);

    /* let oUserModel = new UserModel(req.body);
    // console.log(UserModel.schema.path('age').required(true, "Age required"));

    try
    {
        let objErr = await oUserModel.validate(['email']); // Validating a particular field
        // objErr = oUserModel.getSchemaValidationMessages(objErr);
        console.log('Result:', objErr);
    }
    catch(objErr)
    {
        objErr = oUserModel.getSchemaValidationMessages(objErr);
        console.error('Catch error:', objErr);
    } */
    
    /* try
    {
        let result2 = await oUserModel.validate(['age']); // Validating a particular field
        console.log('Result 2:', result2);
    }
    catch(err)
    {
        let objErr = oUserModel.getSchemaValidationMessages(err);
        console.error(objErr);
    } */

    res.send('POST Registration >> Last');
    // next();
    console.log('Exit: regMW_3');
}

// --------------------------- Custom functions ---------------------------------- //
const getCombinedErrMsgs = (objFileErrMsg, objSchemaErrMsgs) => {
    console.log('Inside getCombinedErrMsgs()', Date.now());
    let objCombinedErrors = {};

    objCombinedErrors = Object.assign(objCombinedErrors, objFileErrMsg);
    objCombinedErrors = Object.assign(objCombinedErrors, objSchemaErrMsgs);
    
    return objCombinedErrors;
}
// ---------------------------------- X ------------------------------------------ //

//#start router export 
module.exports = router; // Export the router object
//#end router export