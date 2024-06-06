require('dotenv').config()
const { ApolloServer, gql } = require('apollo-server');
const { ApolloServerPluginLandingPageGraphQLPlayground } = require('apollo-server-core')
const { users, posts } = require('./fakedb.js')
const mongoose = require('mongoose');
const User = require('./models/users.model.js')
const Post = require('./models/Posts.model.js')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

mongoose.connect(process.env.MONGO_URL).then(() => {
    console.log("MongoDB connected")
})

const typeDefs = gql`
    type Query{
        users:[User]
        user(_id:ID):User
        posts:[Posts]
        post(userId:ID):Post
    }

    type Posts{
        userId: UserData,
        _id: ID,
        title: String,
        body: String
    }

    type UserData{
        _id: ID!
        name: String
        username: String
        email: String
    }
    
    type Mutation{
        SignUp(userinput:UserInput):User
        SignIn(userSign:UserSignIn):Token
        createPost(postinput:PostInput):Post
    }

    input PostInput{
        title:String!
        body:String!
    }

    type User{
        _id: ID!
        name: String
        username: String
        email: String
        password: String
        phone: String
        website: String
        address: String
        posts: [Post]              
    }

    type Post{
        userId: ID,
        _id: ID,
        title: String,
        body: String
    }


    type Token{
        token:String
    }

    input UserSignIn{
        email:String!
        password:String!
    }

    input UserInput{
        name:String!
        username:String!
        email:String!
        password:String!
    }
`

const resolvers = {
    Query: {
        users: async () => await User.find({}).populate("posts", "title body userId"),
        posts: async () => await Post.find({}),
        user: async (_, { _id }) => await User.findOne({ _id }),
        post: async (_, { userId }) => await Post.find({ _id: userId })
    },
    User: {
        posts: async (user) => await Post.find({ _id: user })
    },
    Mutation: {
        SignUp: async (_, { userinput }) => {
            const user = await User.exists({ email: userinput.email })
            if (user) throw new Error("User already exist with this email")
            const newPassword = await bcrypt.hash(userinput.password, 12)
            const newUser = new User({
                ...userinput,
                password: newPassword
            })
            // console.log(newUser)
            const data = await User.create(newUser)
            console.log(data)
            return data;
        },
        SignIn: async (_, { userSign }) => {
            console.log(userSign)
            const user = await User.findOne({ email: userSign.email })
            if (!user) throw new Error("User does not exist")
            const match = await bcrypt.compare(userSign.password, user.password)
            if (!match) {
                throw new Error("Invalid Email or Password")
            }

            const token = jwt.sign({ userId: user._id }, process.env.JWT_SCERET)
            return { token };
        },
        createPost: async (_, { postinput },{userId}) => {
            if(!userId) throw new Error("user not logged in")

            const newPost = new Post({
                userId,
               ...postinput
            })
            const data = await Post.create(newPost)
            console.log(data)
            return data;
        }
    }
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
        const { authorization } = req.headers
        console.log(authorization)
        if (authorization) {
            const { userId } = jwt.verify(authorization , process.env.JWT_SCERET)
            return {userId}
        }
    },
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()]
})

server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`)
})