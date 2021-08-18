console.log("Auth module called!", Date.now());

// ------------------ Core Modules ------------------- //
const path = require('path');
const fs = require('fs');
// ----------------------- X ------------------------- //

// ---------------- Third Party Modules -------------- //
const jwt = require('jsonwebtoken');
require('dotenv').config();
// ----------------------- X ------------------------- //

function Auth()
{
    const expirationTime = 600;

    this.checkAuthorization = req => {
        let json = {error: true, statusCode: 0, message: '', userData: null};

        // console.log('headers', req.headers.authorization);
        // console.log('cookies', req.cookies);

        let authorization = null;
        if( req.headers.authorization )
        {
            authorization = req.headers.authorization;
        }
        else if( req.cookies.authorization )
        {
            authorization = req.cookies.authorization;
        }

        if( authorization )
        {
            const clientAccessToken = authorization.split(' ')[1];
            console.log('Client Access Token:', clientAccessToken);

            if( clientAccessToken )
            {
                try
                {
                    const decryptedToken = jwt.verify(clientAccessToken, process.env.AUTH_SECRET_ACCESS_TOKEN);
                    
                    if( decryptedToken )
                    {
                        json.error = false;
                        json.userData = decryptedToken.userData;
                    }
                }
                catch( err )
                {
                    json.statusCode = 401;
                    json.message = err.message;
                    console.error('Invalid token:', err);
                }
            }
            else
            {
                json.statusCode = 403;
                json.message = "No token!!";
            }
        }
        else
        {
            json.statusCode = 403;
            json.message = "Unauthorized access!!";
        }
        
        console.log(json);
        return json;
    }

    this.createAccessToken = payload => jwt.sign({userData: payload}, process.env.AUTH_SECRET_ACCESS_TOKEN, {expiresIn: expirationTime});

    this.createRefreshToken = payload => jwt.sign({userData: payload}, process.env.AUTH_SECRET_REFRESH_TOKEN, {expiresIn: expirationTime});

    this.authorize = (req, res, next) => {
        let resultJSON = this.checkAuthorization(req);

        const pageName = path.basename(req.url);
        const arrLoggedInAccessiblePages = JSON.parse(process.env.LoggedInAccessiblePages);
        const arrLoggedInInaccessiblePages = JSON.parse(process.env.LoggedInInaccessiblePages);
        
        global.userData = {isLoggedIn: false};
        
        if( resultJSON.error )
        {
            // return res.status(resultJSON.statusCode).json({message: resultJSON.message});
            if( arrLoggedInAccessiblePages.includes(pageName) )
            {
                return res.redirect('/users/login');
            }
        }
        else
        {
            if( resultJSON.userData )
            {
                const SITE_ROOT = req.protocol + '://' + req.headers.host;

                global.userData = {
                    isLoggedIn: true,
                    id: resultJSON.userData.id,
                    profile_pic: SITE_ROOT + '/assets/img/no-image.jpg',
                    full_name: resultJSON.userData.full_name,
                    username: resultJSON.userData.username,
                    gender: resultJSON.userData.gender
                };
                
                if( resultJSON.userData.profile_pic )
                {
                    let filePath = path.join(__dirname, `../public/uploads/users/${resultJSON.userData.profile_pic}`);
                    if( fs.existsSync(filePath) )
                    {
                        global.userData.profile_pic = SITE_ROOT + `/uploads/users/${resultJSON.userData.profile_pic}`;
                    }
                }
            }

            if( arrLoggedInInaccessiblePages.includes(pageName) )
            {
                return res.redirect('/');
            }
        }
        
        next();
    }
}

module.exports = Auth;