const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const userSchema = new mongoose.Schema({
    name: String,
    username: String,
    email: String,
    password: String,
    phone: String,
    website: String,
    address: String,
    posts: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }
})

userSchema.pre('save', async function (next) {
    const user = this;
    if (!user.isModified('password')) return next()
    
    if (user.password) {
        bcrypt.genSalt(12, (err, salt) => {
            if (err) return next(err);

            bcrypt.hash(user.password, salt, (err2, hash) => {
                if (err2) return next();

                user.password = hash
                next();
            })
        })
    }
})

userSchema.methods.comparePassword = async (user, hash) => bcrypt.compare(user, hash)

const   User = mongoose.model('User', userSchema);

module.exports = User;
