const express = require("express");
const app = express();
const cors = require("cors");
const mongodb = require("mongodb");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
const router = express.Router();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
dotenv.config({ path: "../../config.env" });
const bodyparser= require("body-parser")
const multer = require('multer');
const GridFSBucket = require("mongodb").GridFSBucket;
const fs = require("fs");

app.use(cookieParser());
app.use(cors());

const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) return res.sendStatus(401)
  jwt.verify(token, 'secret_key', (err, user) => {

    console.log(err)
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })
}
const databaseUrl =  process.env.DATABASE;
// Add User
router.post("/", async (req, res) => {
  const newUser = req.body;
  const users = await loadUsers();
  const query = { email: newUser.email };
  let userAlreadyRegistered = await users.find(query).toArray();
  if (userAlreadyRegistered[0]) {
    console.log("Already registered");
    res.send({ msg: "There already is an acount with this email" });
    return;
  }
  await bcrypt.hash(newUser.password, 10, async function (err, hashedPass) {
    newUser.password = hashedPass;
    delete newUser.confirmPassword;
    await users.insertOne(newUser, function (err, res) {
      if (err) throw err;
    });
  });
  res.status(201).send();
});
//Verify password
router.post("/passCompare", async (req, res) => {
  const pendingUser = req.body.email;
  const query = { email: pendingUser };
  const users = await loadUsers();
  const currentUser = await users.find(query).toArray();
  const userName = currentUser[0].name;
  if (!currentUser[0]) {
    res.json({ status: "fail" });
    return;
  }
  const passwordCheck = await bcrypt.compare(
    req.body.password,
    currentUser[0].password
  );
  if (!passwordCheck) {
    res.json({ status: "fail" });
    return;
  }
  if (passwordCheck) {
    const token = jwt.sign({ user: userName }, "secret_key", {
      expiresIn: 500000,
    });
    res.json({
      status: "succes",
      token,
      currentUser,
    });
  }
});

router.get("/", async (req, res) => {
 const users = await loadUsers();
   const query = { _id: new ObjectId(req.query.id) }
  const response= await users.findOne(query)
  res.send(response)
});
router.get("/contacts",async (req, res) => {
 const users = await loadUsers();
  if(!req.query.contacts) return
  const contacts = req.query.contacts;
  let updatedIds = contacts.map((contact)=>new ObjectId(`${contact}`))
  let query = {_id: {$in: updatedIds}}
  const projection = { name: 1, avatar: 1 }; 

const cursor = await users.find(query).project(projection);
  const response = await cursor.toArray()
  res.send(response)
});

router.get("/currentContact",async (req, res) => {
 const users = await loadUsers();
  const currentId = req.query.id;
  let updatedId = new ObjectId(`${currentId}`)
 const response = await users.findOne(updatedId);
  res.send(response)
});

router.patch("/",  async (req, res) => {
 try{
  const users = await loadUsers();
  const {id,...query}=req.body
  const selector = { _id: new ObjectId(id) };
   if(query.password){
     const hashedPass = await bcrypt.hash(query.password, 10)
     query.password = hashedPass
   }
   await users.updateOne(selector,{$set:query})
  res.status(200).json({ message: 'Actualizare cu succes' });
 }catch (error){
   console.error('Eroare:', error);
    res.status(500).json({ error: 'Eroare la actualizare' });
  
 }
})
async function loadUsers() {
  const client = await mongodb.MongoClient.connect(databaseUrl);

  return client.db("cards").collection("users");
}
module.exports = router;
