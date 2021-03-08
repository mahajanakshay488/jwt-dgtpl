var express = require('express');
var router = express.Router();
const userModel = require('./users');

const nodemailer = require('nodemailer');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const {isLoggedIn} = require('./verifyToken');
const nodemon = require('nodemon');
const { getMaxListeners } = require('./users');

let G_Token = null;


/* Multer Code for Upload Image */
var storage = multer.diskStorage({
  destination: (req, file, cb)=>{
    cb(null, './public/images/Uploads');
  },

  filename: (req, file, cb)=>{
    cb(null, Date.now() + file.originalname);
  }
});

var upload = multer({storage: storage});

router.get('/*', (req,res,next)=>{
  req.header('auth-token', G_Token);
  next();
});


/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', {login: false});
});

/* GET Users-List page. users.ejs */
router.get('/userslist', isLoggedIn,(req, res)=>{
  userModel.find()
  .then(users => {
    // console.log(req.user);
    // res.send(req.user);
    res.render('usersp', {data: users, login: true, token: G_Token});
  });
});

/* Login-Page page. */
router.get('/loginp', (req, res)=>{
  res.render('loginp', {login: false});
});

/* Profile page. */
router.get('/profile', isLoggedIn ,(req, res)=>{
  userModel.findById(req.user._id)
  .then(user =>{
    res.render('profile', {data: user, login: true});
  }).
  catch(err => res.send(err));
});

/* Edit Profile page */
router.get('/edit/:id', (req, res)=>{
  userModel.findById(req.params.id)
  .then(data =>{
    res.render('editp', {login: false, data});
  })
  .catch(err => res.send(err));
});

/* Reset-Pass-page. */
router.get('/resetpass', isLoggedIn, (req, res)=>{
  res.render('resetpass', {login: true});
});

/* Forget-Pass-page. */
router.get('/forgetpass', (req, res)=>{
  res.render('forgetpass', {login: false});
});

/* Update Profile route */
router.post('/updateinfo/:id', (req, res)=>{
  
  const { name, email, contact } = req.body;
  const updatedUser = { name, email, contact };

  userModel.findByIdAndUpdate(
    req.params.id, 
    {$set: updatedUser}, 
    {new: true, useFindAndModify: false} 
  )
  .then(u =>{
    const token = jwt.sign({u}, 'djiefdj3df;dkd', { expiresIn: 3600 });
    req.header('auth-token', token);
    res.redirect('/profile');
  })
  .catch(err=> res.send('internal server problem !'));
});

/* Reset-Password Route. */
router.post('/resetpassword', isLoggedIn, (req, res)=>{

  // const errors = validationResult(req);
  // if(!errors.isEmpty()) res.send(errors.errors);

  const {newpassword, oldpassword} = req.body;

  userModel.findById(req.user._id)
  .then(user=>{

    if(!user) return res.status(401).json({message: 'User not found'});

    bcrypt.compare(oldpassword, user.password)
    .then(isMatch =>{
      if(!isMatch) res.send('incorrect Password!');

      bcrypt.genSalt(10, (err, salt) =>{
        bcrypt.hash(newpassword, salt, (err, hash)=>{
          if(err) throw err;
          user.password = hash;
          user.save()
          .then(s =>{
            res.send(s);
          });
        });
      });
    });

  })
  .catch(err=>res.json({message: 'some error!', val: err}));
});

/* Forget-Password Route. */
router.post('/forgetpassword', (req, res) => {
  const email = req.body.email;

  // generate password
   var password = '';
   var passchar       = 'ABCDEFGHIJKLMNOP2467777QRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charlength = passchar.length;
   for ( var i = 0; i < 8; i++ ) {
      password += passchar.charAt(Math.floor(Math.random() * charlength));
   }
  
  userModel.findOne({email: email})
  .then(user =>{
    if(!user) res.send('user not found!');

    const transporter = nodemailer.createTransport({
      service: 'hotmail',
      auth:{
        user: 'mahajanakshay488@outlook.com',
        pass: 'Akshay@2001', 
      }
    });

    const mailOptions = {
      from: "'JWT Auth' <mahajanakshay488@outlook.com>",
      to: email.trim(),
      subject: "Auto Generated Password",
      text: `Your password is: "${password}".`
    };

    transporter.sendMail(mailOptions, (err, info)=>{
      if(err) res.send(err);

      bcrypt.genSalt(10, (err, salt)=>{
        bcrypt.hash(password, salt, (err, hash) => {
          if(err) throw err;
          user.password = hash;
          user.save()
          .then( s => res.redirect('/loginp') );
        });
      });
    });
  })
  .catch(err => res.send(err));
});

/* Profile-Pic-Upload Route. */
router.post('/uploadpic/:id', upload.single('profilepic'), (req, res)=>{
  userModel.findById(req.params.id)
  .then(user=>{
    user.profilepic = `${req.file.filename}`;
    user.save()
    .then(s =>{
      res.redirect('/profile');
    });
  });
});

/* User Register Route. */
router.post('/reg', (req, res)=>{
  const { name, email, contact, password } = req.body;

  const profilepic = '../images/Uploads/def.webp';

  const newUser = new userModel({ name, email, profilepic, contact, password});
  
  userModel.findOne({email})
  .then(user => {
    if(user) res.send('email is already taken!');

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newUser.password, salt, (err, hash) => {
          if(err) res.send(err);
          newUser.password = hash;
          newUser.save()
          .then(sUser=>{
            console.log(sUser);
            res.redirect(`/profile`);
          })
          .catch(err=>{
            console.log(err);
            res.send(err);
          });
      });
    });
  });
});

/* User Login Route. */
router.post('/login', (req, res)=>{

  const { email, password } = req.body;

  userModel.findOne({email})
  .then(user =>{
    if(!user) res.send('user not found!');

    bcrypt.compare(password, user.password)
    .then(isMatch =>{
      if(!isMatch) res.send('incorrect password!');

      const token = jwt.sign({user}, 'djiefdj3df;dkd', { expiresIn: 3600 });
      G_Token = token;
      //req.header('auth-token', token);
      res.cookie('auth-token', token, {
        httpOnly: true
        })
      .redirect(`/profile`);
    });
  });
});

module.exports = router;
