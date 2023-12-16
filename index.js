const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
dotenv.config()

const app = express()

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.set('view enfine', 'ejs')

//MIDDLEWARE
// Authentication
const isLoggedIn = (req, res, next) => {
    try{
        const {jwttoken} = req.headers
        const user = jwt.verify(jwttoken, process.env.JWT_SECRET )
        req.user = user
        next()
    }
    catch(error){
        console.log(error)
        res.json({
            status: 'FAILED',
            message: 'You have not logged in. Please login'
        })
    }
    
}

// Authorization

const isPremium = (req, res, next) => {
    
    if(req.user.isPremium){
        next()
    }else{
        res.json({
            status: 'FAILED',
            message: 'You are not a premium user. Please buy a premium plan'
        })
    }
}
const User = mongoose.model('User', {
    fullName: String,
    email: String,
    password: String,
    isPremium: String
})

//Public routes/ API
app.get('/', (req, res) =>{
    res.json({
        status: "SUCCESS",
        message: "Server Connected Succesffully!"
    })
})

//Private route/ API
app.get('/dashboard', isLoggedIn, async(req,res) => {
  
        res.send("WELCOME TO DASHBOARD PAGE!")
})

app.get('/premium', isLoggedIn, isPremium, async(req,res) => {
    
        res.send('Welcome to the premium Page!')
   
})

app.get('/users', async(req,res) => {
    try{
        const user = await User.find({})
        res.json({
            status: 'SUCCESS',
            data:user
        })
    } catch (error) {
        res.json({
            status: 'FAILED',
            message: 'Something Went Wrong'
        })
    }
})

app.post('/signup', async(req,res) => {
    try{ 
        
        const {fullName, email, password, isPremium} = req.body
        const encryptedPassword = await bcrypt.hash(password, 10)
        await User.create({fullName, email, password: encryptedPassword, isPremium})
        const user = await User.find({})
        res.json({
            status: 'SUCCESS',
            message: 'You have signed in  Successfully'
        })
    } catch (error) {
        res.json({
            status: 'FAILED',
            message: 'Something Went Wrong'
        })
    }
})

app.post('/login', async(req,res) => {
    try{ 
        const {email, password} = req.body
        const user = await User.findOne({email})
        console.log(user)
        if(user){
            let hasPasswordMatched = await bcrypt.compare(password, user.password)
            if(hasPasswordMatched){
                const jwtToken = jwt.sign(user.toJSON(), process.env.JWT_SECRET, {expiresIn: 15})
                 res.json({
                    status: 'SUCCESS',
                    message: 'You have logged in  Successfully',
                    jwtToken
            })
            }else {
                res.json({
                    status: 'FAILED',
                    message: 'Incorrect credentials! please try again'
                })
            }
           
        }else{
            res.json({
                status: 'FAILED',
                message: 'User does not exist'
            })
        }
    } catch (error) {
        console.log(error)
        res.json({
            status: 'FAILED',
            message: 'Incorrect credentials! please try again'
        })
    }
})

app.listen(process.env.PORT,()=>
   mongoose
   .connect(process.env.MONGODB_URL)
   .then(() => console.log(`Server running on http://localhost:${process.env.PORT}`))
   .catch(error => console.log(error))
)

/*

  ## AUTHENTICATION & AUTHORIZATION
  Authenication: Verify user's identity (Who are you?)
  Authorization: Verify user's access (What access do you have?)

  ##bcrypt - encrpyt your password
  ##JWT (JSON Web Token)

//SIMPLE MIDDLEWARE EXAMPLE  to check if user is logged in - 
const isLoggedIn = (req, res, next) => {
    let loggedIn = false
    if(loggedIn){
        next()
    }else{
        res.json({
            status: 'FAILED',
            message: 'You have not logged in. Please login'
        })
    }
}


//encryption and Decryption example
Encryption
ANKIT - Original text 
CPMKV - encrypted text 

Decryption
CPMKV - encrypted text
ANKIT - Original text

*/


