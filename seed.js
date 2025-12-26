const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Assignment = require('./src/models/Assignment');
const Submission = require('./src/models/Submission');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/assignment_portal';

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Assignment.deleteMany({});
    await Submission.deleteMany({});
    console.log('Cleared existing data...');

    // Create teacher
    const teacher = await User.create({
      name: 'John Teacher',
      email: 'teacher@example.com',
      password: 'password123',
      role: 'teacher'
    });
    console.log('Created teacher...');

    // Create students
    const students = await User.create([
      {
        name: 'Alice Student',
        email: 'student1@example.com',
        password: 'password123',
        role: 'student'
      },
      {
        name: 'Bob Student',
        email: 'student2@example.com',
        password: 'password123',
        role: 'student'
      },
      {
        name: 'Charlie Student',
        email: 'student3@example.com',
        password: 'password123',
        role: 'student'
      }
    ]);
    console.log('Created students...');

    // Create assignments
    const assignments = await Assignment.create([
      {
        title: 'Math Homework - Algebra Basics',
        description: 'Solve the following quadratic equations:\n1. x² - 5x + 6 = 0\n2. 2x² + 3x - 2 = 0\n3. x² - 4 = 0\n\nShow all your work and steps.',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'published',
        createdBy: teacher._id,
        publishedAt: new Date()
      },
      {
        title: 'Science Project - Renewable Energy',
        description: 'Research and write a 1000-word report on renewable energy sources. Focus on:\n- Solar power\n- Wind energy\n- Hydroelectric power\n- Environmental impact\n- Future prospects',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 
        status: 'draft',
        createdBy: teacher._id
      },
      {
        title: 'History Essay - World War II',
        description: 'Write an essay discussing the causes and consequences of World War II. Include:\n- Key events\n- Major figures\n- Impact on global politics\n- Lessons learned',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), 
        status: 'published',
        createdBy: teacher._id,
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) 
      },
      {
        title: 'Completed Assignment - Sample',
        description: 'This is a completed assignment for testing. It should show in the completed tab.',
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        status: 'completed',
        createdBy: teacher._id,
        publishedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ]);
    console.log('Created assignments...');

    // Create submissions for the published assignment
    const mathAssignment = assignments[0];
    const submissions = await Submission.create([
      {
        assignment: mathAssignment._id,
        student: students[0]._id,
        answer: '1. x² - 5x + 6 = 0 factors to (x-2)(x-3)=0, so x=2 or x=3\n2. Using quadratic formula: x = [-3 ± √(9+16)]/4 = [-3 ± 5]/4, so x=0.5 or x=-2\n3. x² - 4 = 0 gives x²=4, so x=2 or x=-2',
        submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        assignment: mathAssignment._id,
        student: students[1]._id,
        answer: 'For question 1: The solutions are x=2 and x=3. I solved by factoring.\nFor question 2: I got x=0.5 and x=-2.\nFor question 3: x=±2',
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        reviewed: true,
        feedback: 'Good work! Remember to show all steps clearly.',
        reviewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ]);
    console.log('Created submissions...');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('Teacher: teacher@example.com / password123');
    console.log('Student 1: student1@example.com / password123');
    console.log('Student 2: student2@example.com / password123');
    console.log('Student 3: student3@example.com / password123');
    console.log('\nRun the app and start testing!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();