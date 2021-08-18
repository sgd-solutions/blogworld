console.log("Auth route called!", Date.now());

const router = require('express').Router();
const Auth = require('../modules/auth');

const oAuth  = new Auth();

router.route('/')
.get((req, res, next) => {
    let json = oAuth.authorize(req);
    res.json(json);
})
.post((req, res, next) => {
    console.log('userId', req.body.userId);
    const token = oAuth.createAccessToken(req.body.userId);
    res.json({token});
});

module.exports = router;