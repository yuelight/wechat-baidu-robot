const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const wechat = require('wechat');
const User = mongoose.model('User');

const jssdk = require('../libs/jssdk');

module.exports = function (app) {
    app.use('/wechat', router);
};

router.get('/hello', function (req, res, next) {
    jssdk.getSignPackage(`http://120.27.99.227${req.url}`, function (err, signPackage) {
        if (err) {
            return next(err);
        }

        res.render('index', {
            title: 'Hello Wechat from Aliyun ECS --> Express',
            signPackage: signPackage,
            pretty: true
        });
    });
});

const config = {
    token: 'dmIKhkJ65yZ4cdLGWU40',
    appid: 'wx24ed2d4b06ace0fe'
};

const handleWechatRequest = wechat(config, function (req, res, next) {
    const message = req.weixin;
    console.log(message);

    res.reply('hello');
});
const handleUserSync = function (req, res, next) {
    if (!req.query.openid) {
        return next();
    }

    const openid = req.query.openid;
    User.findOne({ openid }).exec(function (err, user) {
        if (err) {
            return next(err);
        }

        if (user) {
            console.log(`use existing user: ${openid}`);
            req.user = user;
            return next();
        }

        console.log(`create new user: ${openid}`);
        const newUser = new User({
            openid: openid,
            createdAt: new Date(),
            conversationCount: 0
        });

        newUser.save(function (e, u) {
            if (e) {
                return next(e);
            }

            req.user = u;
            next();
        });
    });
};
router.get('/conversation', handleWechatRequest);
router.post('/conversation', handleUserSync, handleWechatRequest);
