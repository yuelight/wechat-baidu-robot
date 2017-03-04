const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const wechat = require('wechat');
const Article = mongoose.model('Article');

module.exports = function (app) {
    app.use('/wechat', router);
};

router.get('/hello', function (req, res, next) {
    Article.find(function (err, articles) {
        if (err) return next(err);
        res.render('index', {
          title: 'Generator-Express MVC',
          articles: articles
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
