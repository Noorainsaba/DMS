const express=require('express')
const createHttpError=require('http-errors')
const morgan=require('morgan')
require('dotenv').config();
const mongoose=require('mongoose')
const session=require('express-session')
const connectFlash=require('connect-flash')
const passport=require('passport')
const MongoStore = require("connect-mongo")
const dbString = "mongodb+srv://aishwaryas683:ncet_dms@dms-db.cvnk9nz.mongodb.net/?retryWrites=true&w=majority&appName=dms-db"
const connection = mongoose.createConnection(dbString)
const {ensureLoggedOut,ensureLoggedIn}=require('connect-ensure-login')
const { roles } = require('./utils/constants');
const path=require('path')
const app=express();

app.use(morgan('dev'))
app.set('view engine','ejs')
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({extended:false}))

mongoose.connect(process.env.MONGODB_URI, {
  dbName: process.env.DB_NAME,
  useNewUrlParser: true,
  useUnifiedTopology: true,
//   useCreateIndex: true // Deprecated, but still supported in some versions
})
.then(() => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => console.log(`🚀 @ http://localhost:${PORT}`));
}).catch((error) => {
  console.error('MongoDB connection error:', error);
  });

  const sessionStore = MongoStore.create({
    client: connection.getClient(),
    collection: 'session'
})


//Init session
app.use(session({
  secret:process.env.SESSION_SECRET,
  resave:false,
  saveUninitialized:false,
  cookie:{
    httpOnly:true,
  },
  store:sessionStore,
}))

//for passport js authentication
app.use(passport.initialize())
app.use(passport.session())
require('./utils/passport.auth')

app.use((req,res,next)=>{
res.locals.user=req.user
next()
})

app.use(connectFlash())
app.use((req,res,next)=>{
  res.locals.messages=req.flash();
  next();
})

app.use('/',require('./routes/index.route'))

app.use('/auth',require('./routes/auth.route'))

app.use('/user',ensureLoggedIn({redirectTo:"/auth/login"}),require('./routes/user.route'))

app.use('/admin',ensureLoggedIn({redirectTo:"/auth/login"}),ensureAdmin,require('./routes/admin.route'))

app.use((req,res,next)=>{
    next(createHttpError.NotFound())
})

app.use((error,req,res,next)=>{
    error.status=error.status||500
    res.status(error.status)
    res.render('error_40x',{error})
})

app.use((req, res, next) => {
  console.log(req.file); // Log the file object
  next();
});

const PORT = process.env.PORT || 3000;


// function ensureAuthenticated(req,res,next){
//   if(req.isAuthenticated()){
//     next()
//   }else{
//     res.redirect('/auth/login')
//   }
// }

function ensureAdmin(req,res,next){
  if(req.user.role===roles.admin){
    next()
  }else{
    req.flash('warning','you are not Authorized to see this route')
    res.redirect('/auth/login')
  }
}
