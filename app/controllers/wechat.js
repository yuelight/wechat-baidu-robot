const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const wechat = require('wechat');
const cheerio = require('cheerio');
const request = require('request');
const moment = require('moment');
const User = mongoose.model('User');
const Conversation = mongoose.model('Conversation');

const jssdk = require('../libs/jssdk');
const baseUrl = 'http://120.27.99.227';

module.exports = function (app) {
    app.use('/wechat', router);
};

router.get('/hello', function (req, res, next) {
    jssdk.getSignPackage(`${baseUrl}${req.url}`, function (err, signPackage) {
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

router.get('/history/:userid', function (req, res, next) {
    if (!req.params.userid) {
        return next(new Error('非法请求，缺少userid参数'));
    }

    User.findOne({ _id: req.params.userid }).exec(function (err, user) {
        if (err || !user) {
            return next(new Error('没有找到用户'));
        }

        console.log(`find user: ${user}`);
        Conversation.find({ user  }).exec(function (e, conversations) {
            if (e) {
                return next(new Error('查找问答历史出错'));
            }

            res.render('history', {
                title: '问答历史',
                user: user,
                conversations: conversations,
                moment: moment,
                pretty: true
            });
        });
    });
});

const config = {
    token: 'dmIKhkJ65yZ4cdLGWU40',
    appid: 'wx24ed2d4b06ace0fe'
};

// 只处理文本消息
const handleWechatTextMessage = function (req, res, next, message) {
    if (!message.Content) {
        return res.reply('你没有提出任何问题');
    }

    request.get({
        url: `https://www.baidu.com/s?word=${encodeURIComponent(message.Content)}`,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
        }
    }, function (err, response, body) {
        if (err) {
            console.error(err);
            return res.reply('寻找答案时发生错误');
        }

        const $ = cheerio.load(body);
        const results = $('.result.c-container');

        if (results.length === 0) {
            return res.reply('没有找到任何答案');
        }

        const result = $(results.get(0));
        const answer = result.find('.c-abstract').text();

        res.reply(answer ? answer : '找到了空答案');

        // 保存回话历史
        const conversation = new Conversation({
            user: req.user,
            question: message.Content,
            answer: answer,
            createdAt: new Date()
        });

        conversation.save(function (e, conversation) {
            if (e) {
                return console.error('conversation save error:', e);
            }

            // 更新回话次数
            req.user.conversationCount += 1;
            req.user.save(function (_e, u) {
                if (_e) {
                    return console.error('user save error:', e);
                }
            });
        });
    });
};

// 处理事件消息
const handleWechatEventMessage = function (req, res, next) {
    const message = req.weixin;
    const event = message.Event;
    const eventKey = message.EventKey;

    if (event === 'CLICK') {
        if (eventKey === 'conversation-history') {
            res.reply(`${baseUrl}/wechat/history/${req.user._id.toString()}`);
        } else {
            res.reply('无法处理的事件类型');
        }
    } else {
        res.reply('无法处理的事件类型');
    }
};

const handleWechatRequest = wechat(config, function (req, res, next) {
    const message = req.weixin;
    console.log(message);
    
    if (message.MsgType === 'text') {
        handleWechatTextMessage(req, res, next, message);
    } else if (message.MsgType === 'event') {
        handleWechatEventMessage(req, res, next);
    } else {
        res.reply('无法处理的消息类型');
    }

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
