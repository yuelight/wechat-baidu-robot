const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const wechat = require('wechat');

const jssdk = require('../libs/jssdk');

module.exports = function (app) {
    app.use('/wechat', router);
};

router.get('/hello', function(req, res, next) {
    jssdk.getSignPackage(`http://120.27.99.227${req.url}`, function (err, signPackage) {
        if (err) {
            return next(err);
        }

        res.render('index', {
            title: 'Hello Wechat from Aliyun ECS --> Express'
        });
    });
});

const config = {
    token: 'dmIKhkJ65yZ4cdLGWU40',
    appid: 'wx24ed2d4b06ace0fe'
}

const handleWechatRequest = wechat(config, function (req, res, next) {
    const message = req.weixin;
    console.log(message);

    res.reply('hello');
});

router.get('/conversation', handleWechatRequest);
router.post('/conversation', handleWechatRequest);
