var express = require('express');
var router = express.Router();
const userModel = require('./users');

const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


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


/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', {login: false});
});


/* GET Users-List page. users.ejs */
router.get('/userslist', (req, res)=>{
  userModel.find()
  .then(users => {
    res.render('usersp', {data: users, login: true});
  });
});

/* Login-Page page. */

router.get('/loginp', (req, res)=>{
  res.render('loginp', {login: false});
});

/* Profile page. */
router.get('/profile/:id', (req, res)=>{
  userModel.findById(req.params.id)
  .then(fuser =>{
    res.render('profile', {data: fuser, login: true});
  }).
  catch(err => res.send(err));
});

/* Profile-Pic-Upload Route. */
router.post('/uploadpic/:id', upload.single('profilepic'), (req, res)=>{
  userModel.findById(req.params.id)
  .then(fuser=>{
    fuser.profilepic = `${req.file.filename}`;
    fuser.save()
    .then(s =>{
      res.redirect(`/profile/${s._id}`);
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
            res.redirect(`/profile/${sUser._id}`);
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
  .then(fuser =>{
    if(!fuser) res.send('user not found!');

    bcrypt.compare(password, fuser.password)
    .then(isMatch =>{
      if(!isMatch) res.send('incorrect password!');

      const token = jwt.sign({fuser}, 'djiefdj3df;dkd', { expiresIn: 3600 });
      req.header('auth-token', token);
      res.redirect(`/profile/${fuser._id}`);
    });
  });

});

router.get('/logout', (req, res)=>{

});


module.exports = router;
