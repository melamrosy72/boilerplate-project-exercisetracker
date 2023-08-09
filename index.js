const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose=require('mongoose')
const bodyParser = require('body-parser')

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

try {
  mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
} catch (err) {
  console.log(err)
}

// Model
const userSchema = new mongoose.Schema(
  {
      username: { type: String, required: true },
      log:[{     
        description:{type: String},
        duration:{type: Number},
        date:{type: Date , default : Date.now},
      }]
  }
);
const User = mongoose.model('User', userSchema);

// creating new user
app.post('/api/users',async(req, res) => {
  const username=req.body.username
  const newUser=new User({username})
  await newUser.save()
  res.status(200).json({username: newUser.username , _id: newUser._id})
})

// fetching all users
app.get('/api/users',async(req,res)=>{
  const users=await User.find()
  res.status(200).json(users)
})

// creatiing new exercise 
app.post('/api/users/:_id/exercises',async(req,res)=>{
  const {description,duration}=req.body
  const date=new Date(req.body.date).toDateString() || new Date().toDateString()
  const {_id}=req.params
  const newLog={description,duration,date}
  const updatedUser=await User.findByIdAndUpdate(_id,{$push:{log:newLog}},{new:true}) 
  res.status(200).json({username:updatedUser.username , description , duration , date , _id:updatedUser._id})
})

//fetching user log && ability to specify date
app.get('/api/users/:_id/logs',async(req,res)=>{
  const {_id  }=req.params
  const {dateFrom ,dateTo , limit}=req.query

  const user=await User.findById(_id)

  let filteredLogs = user.log;

  if (dateFrom && dateTo) { 
    filteredLogs = user.log.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= new Date(dateFrom) && logDate <= new Date(dateTo);
    });
  }
  if(limit){
    filteredLogs=filteredLogs.slice(0, parseInt(limit))
  }
  const transformedResponse = {
    username: user.username,
    count: user.log.length,
    _id: user._id,
    log: filteredLogs.map(item => ({
      description: item.description.trim(),
      duration: item.duration,
      date: new Date(item.date).toDateString(),
    })),
  };
  res.status(200).json(transformedResponse)
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
