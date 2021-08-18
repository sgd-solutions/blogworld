console.log("Users route called!", Date.now());

// ------------------ Core Modules ------------------- //
const path = require('path');
// ----------------------- X ------------------------- //

// ---------------- Third Party Modules -------------- //
const router = require('express').Router();
// ----------------------- X ------------------------- //

// -------------- User defined Modules --------------- //
const FileUpload = require('../modules/file_upload');
const Auth = require('../modules/auth');
// ----------------------- X ------------------------- //

const UserModel = require('../models/user');

const objAuth = new Auth();

const mwRegistration = (req, res, next) => {
    console.log('Entry: Registration MW');
    
    let objFileUpload;
    const filePath = path.join(__dirname, '../public/uploads/users/');
    const fileType = 'image';
    const fields = [{name: 'profile_pic', maxCount: 1}];
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
        // console.log(':: Within Multer ::');
        console.log('Body:', req.body);
        console.log('Files:', req.files);

        // Object to hold error and success statuses and messages in a json format to be returned as response
        let objMsgs = {error: false, success: false, messages: {}};

        let objFileErrMsg = {};
        if( errMulter )
        {
            objFileErrMsg = {'profile_pic': objFileUpload.getFileCustomErrorMessage(errMulter)};

            // console.error(errMulter);
            console.error(objFileErrMsg);
            objMsgs.error = true;
        }

        // console.log('Form:', req.body);
        let userData = {
            f_name: req.body.f_name,
            l_name: req.body.l_name,
            age: req.body.age,
            gender: req.body.gender,
            username: req.body.username,
            password: req.body.password,
            email: req.body.email
        };

        let objUserModel = new UserModel(userData);
        let objSchemaErrMsg = {};
        try
        {
            let hdnUsernameExist = req.body.hdnUsernameExist ? JSON.parse(req.body.hdnUsernameExist) : '';
            let hdnEmailExist = req.body.hdnEmailExist ? JSON.parse(req.body.hdnEmailExist) : '';

            console.log('hdnUsernameExist:', hdnUsernameExist);
            if( hdnUsernameExist && hdnUsernameExist.exist )
            {
                objMsgs.error = true;
                objSchemaErrMsg = Object.assign(objSchemaErrMsg, hdnUsernameExist.messages);
            }
            if( hdnEmailExist && hdnEmailExist.exist )
            {
                objMsgs.error = true;
                objSchemaErrMsg = Object.assign(objSchemaErrMsg, hdnEmailExist.messages);
            }

            // Validating field values agaist Schema validation
            validationResult = await objUserModel.validate();
            // console.log('Result:', validationResult);

            if( !validationResult )
            {
                if( !objMsgs.error )
                {
                    // If profile picture is uploaded, then add the file to user data
                    if( Object.keys(req.files).length )
                    {
                        let uploadedFiles = objFileUpload.getUploadedFileNames(req.files);
                        objUserModel.set('profile_pic', uploadedFiles['profile_pic'][0]);
                    }

                    await UserModel.init();

                    try
                    {
                        // Encrypting the password before saving into the Database
                        let hashedPassword = await UserModel.encryptPassword(objUserModel.get('password').trim());
                        objUserModel.set('password', hashedPassword);
                        
                        resultDoc = await objUserModel.save();

                        if( resultDoc )
                        {
                            console.info(resultDoc);
                            objMsgs.success = true;
                            objMsgs.messages = "Your registration has been successfully made! Redirecting to the 'Login' page...";
                            objMsgs.redirect = "/users/login";
                        }
                    }
                    catch( err )
                    {
                        throw err;
                    }
                }
            }
        }
        catch( err )
        {
            objMsgs.error = true;
            objSchemaErrMsg = Object.assign(objSchemaErrMsg, objUserModel.getSchemaValidationMessages(err));
            console.error('Catch error:', objSchemaErrMsg);
            // console.error(err.keyValue);
        }

        if( objMsgs.error )
        {
            console.error('objSchemaErrMsg:', objSchemaErrMsg);
            objMsgs.messages = getCombinedErrMsgs(objFileErrMsg, objSchemaErrMsg);

            // If the files are uploaded, but there is a form validation error, then delete the uploaded files from server
            if( req.files && Object.keys(req.files).length )
            {
                objFileUpload.deleteFiles(req.files);
            }
        }

        res.json(objMsgs);
    });

    console.log('Exit: Registration MW');
}

router.route('/check_email')
.post(async function(req, res) {
    let oUserModel = new UserModel(req.body);
    // console.info('Email:', req.body.email);
    
    // Object to hold error status and message in a json format to be returned as response
    let objMsgs = {error: false, exist: false, messages: {}};

    try
    {
        let resEmailValidate = await oUserModel.validate(['email']); // Validating a particular field
        
        if( !resEmailValidate )
        {
            try
            {
                let email = req.body.email.trim();
                let result = await UserModel.checkEmailExistence(email);
                
                if( result )
                {
                    objMsgs.error = true;
                    objMsgs.exist = true;
                    objMsgs.messages = {'email': `This email '${email}' is already registered`};
                }
                else
                {
                    objMsgs.messages = {'email': `'${email}' is available!`};
                }

                console.log('Result:', result);
            }
            catch( err )
            {
                throw err;
            }
        }
    }
    catch( err )
    {
        objMsgs.error = true;
        objMsgs.messages = oUserModel.getSchemaValidationMessages(err);
        console.error('Catch error:', objMsgs);
    }

    res.json(objMsgs);
});

router.route('/check_username')
.post(async function(req, res) {
    let oUserModel = new UserModel(req.body);
    console.info('Username:', req.body.username);
    
    // Object to hold error status and message in a json format to be returned as response
    let objMsgs = {error: false, exist: false, messages: {}};

    try
    {
        let resValidate = await oUserModel.validate(['username']); // Validating a particular field
        
        if( !resValidate )
        {
            try
            {
                let username = req.body.username.trim();
                let result = await UserModel.checkUsernameExistence(username);
                
                if( result )
                {
                    objMsgs.error = true;
                    objMsgs.exist = true;
                    objMsgs.messages = {'username': `The username '${username}' is already taken`};
                }
                else
                {
                    objMsgs.messages = {'username': `'${username}' is available`};
                }

                console.log('Result:', result);
            }
            catch( err )
            {
                throw err;
            }
        }
    }
    catch( err )
    {
        objMsgs.error = true;
        objMsgs.messages = oUserModel.getSchemaValidationMessages(err);
        console.error('Catch error:', objMsgs);
    }

    res.json(objMsgs);
});

router.route('/registration')
.get((req, res) => {
    let objPageData = {
        title: 'Registration',
        data: {
            errorOptions: {
                formFields: true,
                position: 'after',
                wrapper: 'div',
                errorClass: 'field-error',
                successClass: 'field-success',

                frmErrorClass: 'validation-error',
                frmSuccessClass: 'validation-success',
                elemId: 'divMsg'
            }
        }
    };

    res.render('users/registration', objPageData);
})

.post(mwRegistration);

router.route('/login')
.get((req, res, next) => {
    let objPageData = {
        title: 'Login',
        data: {}
    };

    res.render('users/login', objPageData);
})

.post(async (req, res, next) => {
    console.log('#POST Login');
    let json;
    
    try
    {
        json = await UserModel.authenticateUser(req.body.username, req.body.password);
        json.redirect = '/';
        
        // If there is no error, then the User is Authentic
        if( !json.error )
        {
            json.message = "Logged in successfully!";
            let userData = {
                id: json.user.id,
                profile_pic: json.user.profile_pic,
                full_name: json.user.full_name,
                username: json.user.username,
                gender: json.user.gender
            };
            
            console.log('userData:', userData);
            let accessToken = objAuth.createAccessToken(userData);

            res.setHeader('authorization', 'Bearer ' + accessToken);
            res.cookie('authorization', 'Bearer ' + accessToken, {maxAge: 1000 * 60 * 15, httpOnly: true, secure: true, sameSite: 'lax'});
        }
    }
    catch( err )
    {
        json.error = true;
        json.message = '#2. Something went wrong on the server side';
        console.error('Caught in Login:', err);
    }

    console.log(json);
    res.json(json);
});

router.route('/logout')
.get((req, res, next) => {
    res.clearCookie('authorization');
    // res.end("Logged out successfully!");
    res.redirect("/home");
});

// --------------------------- Custom functions ---------------------------------- //
const getCombinedErrMsgs = (objFileErrMsg, objSchemaErrMsgs) => {
    console.log('Inside getCombinedErrMsgs()', Date.now());
    let objCombinedErrors = {};

    objCombinedErrors = Object.assign(objCombinedErrors, objFileErrMsg);
    objCombinedErrors = Object.assign(objCombinedErrors, objSchemaErrMsgs);
    
    return objCombinedErrors;
}
// ---------------------------------- X ------------------------------------------ //

module.exports = router;