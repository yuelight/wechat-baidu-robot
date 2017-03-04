
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var ConversationSchema = new Schema({
    user: {
        type: Schema,
        ref: 'User',
        required: '`user`是必填字段'
    },
    question: {
        type: String,
        reqyured: '`question`是必填参数'
    },
    qanswer: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        reqyured: '`createdAt`是必填参数'
    }
});

mongoose.model('Conversation', ConversationSchema);


