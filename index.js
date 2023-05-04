require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const db = require("./db/connection");
const bodyParser = require('body-parser');


const app = express();


// Connect to MongoDB
db();

app.use(express.json());
app.use(bodyParser.json());

// Define the schemas
const mentorSchema = new mongoose.Schema({
  name: String,
  email: String,
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
});
const studentSchema = new mongoose.Schema({
  name: String,
  email: String,
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor' },
});

// Define the models
const Mentor = mongoose.model('Mentor', mentorSchema);
const Student = mongoose.model('Student', studentSchema);


// Define the APIs

// Create a mentor
app.post('/mentors', async (req, res) => {
  const { name, email } = req.body;
  const mentor = new Mentor({ name, email });
  await mentor.save();
  res.json({ message: 'Mentor created successfully' });
});

// Create a student
app.post('/students', async (req, res) => {
  const { name, email } = req.body;
  const student = new Student({ name, email });
  await student.save();
  res.json({ message: 'Student created successfully' });
});

// Assign a student to a mentor
app.put('/students/:studentId/mentor/:mentorId', async (req, res) => {
  const { studentId, mentorId } = req.params;
  const mentor = await Mentor.findById(mentorId);
  const student = await Student.findById(studentId);
  mentor.students.push(studentId);
  student.mentor = mentorId;
  await mentor.save();
  await student.save();
  res.json({ message: 'Student assigned to mentor successfully' });
});

// Select one mentor and add multiple students
app.put('/mentors/:mentorId/students', async (req, res) => {
  const { mentorId } = req.params;
  const { studentIds } = req.body;
  const mentor = await Mentor.findById(mentorId);
  mentor.students.push(...studentIds);
  await mentor.save();
  res.json({ message: 'Students added to mentor successfully' });
});

// Show all students of a particular mentor
app.get('/mentors/:mentorId/students', async (req, res) => {
  const { mentorId } = req.params;
  const mentor = await Mentor.findById(mentorId).populate('students');
  const students = mentor.students;
  res.json(students);
});

// Assign or change mentor of a particular student
app.put("/students/:studentId/mentor", async (req, res) => {
  const { studentId } = req.params;
  const { currentMentorId, newMentorId } = req.body;
  const currentMentor = await Mentor.findById(currentMentorId);
  const newMentor = await Mentor.findById(newMentorId);
  const student = await Student.findById(studentId);
  currentMentor.students = currentMentor.students.filter(
    (id) => id.toString() !== studentId
  );
  newMentor.students.push(studentId);
  student.mentor = newMentorId;
  await currentMentor.save();
  await newMentor.save();
  await student.save();
  res.json({ message: "Mentor of student changed successfully" });
});

// Show the previously assigned mentor of a particular student
app.get("/students/:studentId/mentor", async (req, res) => {
  const { studentId } = req.params;
  const student = await Student.findById(studentId).populate("mentor");
  const previousMentor = student.mentor;
  res.json(previousMentor);
});

// To Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
