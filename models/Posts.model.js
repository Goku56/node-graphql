const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    title: String,
    body: String
})

const Post = mongoose.model('Post',postSchema);

module.exports = Post;  