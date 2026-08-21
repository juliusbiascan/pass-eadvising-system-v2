Product Requirements Document (PRD)
Project Title: A Web-Based Course Evaluation and Academic Advising System for PASS College
1. Project Overview
The proposed system is a web-based academic advising and course evaluation platform designed for PASS College. The system will help students evaluate their academic status before enrollment by analyzing their grades, passed and failed subjects, and subject prerequisites.
The platform is not an official enrollment system. Instead, it serves as a pre-evaluation and study planning tool where students can identify the subjects they are eligible to take for the next semester. Final confirmation and official enrollment will still be handled by the registrar.
The system will have two main user levels:
•	Admin 
•	Student 
2. Problem Statement
PASS College currently lacks an automated system that helps students identify which subjects they can take based on their academic performance and curriculum requirements. Manual checking of prerequisites and failed subjects can cause delays, confusion, and enrollment errors.
Students often struggle to determine:
•	Which subjects they passed or failed 
•	Which subjects are available for the next semester 
•	Which subjects are restricted due to prerequisites 
The institution also needs a centralized system for managing student curriculum records and academic evaluations.
3. Objectives
General Objective
To develop a web-based course evaluation and academic advising system that automates subject evaluation and academic planning for PASS College students.
Specific Objectives
1.	To allow admins to manage student information and curriculum data. 
2.	To allow students to input their grades for evaluation. 
3.	To automatically determine passed and failed subjects. 
4.	To automatically recommend subjects available for the next semester. 
5.	To prevent students from taking subjects with unmet prerequisites. 
6.	To provide students with an organized academic study plan before enrollment confirmation. 


4. Scope of the System
The system will:
•	Manage student records 
•	Store curriculum and subject prerequisites 
•	Allow grade input and evaluation 
•	Generate recommended subjects for the next semester 
•	Restrict subjects with failed prerequisites 
•	Display academic progress 
The system will NOT:
•	Process official enrollment 
•	Handle payments 
•	Generate official registrar transactions 
•	Process schedules or sectioning 

5. User Roles
5.1 Admin
Admin Capabilities
•	Login securely 
•	Manage student accounts 
•	Register student information 
•	Upload/manage curriculum 
•	Manage subject prerequisites 
•	View student evaluations 
•	Edit academic records 
•	Manage semesters and academic years 
•	Generate reports 







5.2 Student
Student Capabilities
•	Login securely 
•	View curriculum 
•	Input grades per subject 
•	Submit evaluation request 
•	View passed and failed subjects 
•	View eligible subjects for next semester 
•	View blocked subjects due to prerequisites 
•	View academic progress/study plan 
6. Functional Requirements
6.1 Authentication Module
Features
•	Login 
•	Logout 
•	Role-based access control 
•	Password encryption 
6.2 Student Management Module
Admin Functions
•	Add student 
•	Edit student information 
•	Delete student 
•	Assign curriculum 
Student Information Includes
•	Student ID 
•	Full Name 
•	Course 
•	Year Level 
•	Curriculum 




6.3 Curriculum Management Module
Admin Functions
•	Add curriculum 
•	Add subjects 
•	Set prerequisites 
•	Edit curriculum 
•	Delete curriculum 
Subject Information Includes
•	Subject Code 
•	Subject Description 
•	Units 
•	Prerequisite Subject 
•	Semester Offered 

6.4 Grade Evaluation Module
Student Functions
•	Input grades 
•	Save grades 
•	Submit evaluation 
System Process
The system will:
1.	Analyze grades 
2.	Determine pass/fail status 
3.	Check prerequisite completion 
4.	Identify eligible subjects 
5.	Restrict subjects with failed prerequisites 







6.5 Academic Advising Module
Features
•	Recommended subjects list 
•	Blocked subjects display 
•	Academic progress tracking 
•	Remaining subjects display 
Advising Rules
•	Passed prerequisite → subject becomes available 
•	Failed prerequisite → dependent subjects remain locked 
•	Failed subjects may be retaken 

6.6 Reports Module
Admin Reports
•	Student evaluation report 
•	Curriculum report 
•	Subject performance summary 
•	Academic progress report 

7. Non-Functional Requirements
Performance
•	Fast subject evaluation processing 
•	Responsive interface 
Security
•	Encrypted passwords 
•	Role-based access 
Usability
•	User-friendly interface 
•	Mobile-responsive design 
Reliability
•	Accurate prerequisite checking 
•	Accurate grade evaluation 


8. System Workflow
Admin Workflow
1.	Login 
2.	Register student 
3.	Upload/manage curriculum 
4.	Configure prerequisites 
5.	Monitor evaluations 

Student Workflow
1.	Login 
2.	View curriculum 
3.	Input grades 
4.	Submit evaluation 
5.	System analyzes records 
6.	View recommended subjects 
7.	Confirm with registrar 

9. Business Rules
1.	Students cannot take subjects with unmet prerequisites. 
2.	Failed prerequisite subjects automatically lock dependent subjects. 
3.	Only admins can manage curriculum and student records. 
4.	Students can only evaluate their own records. 
5.	Subject recommendations are advisory only and subject to registrar confirmation. 










10. Proposed Technology Stack
Frontend
•	Next.js 
•	React.js 
•	Tailwind CSS 
•	TypeScript 
Backend
•	Next.js API Routes 
•	Node.js 
ORM
•	Prisma ORM 
Database
•	PostgreSQL 
Authentication
•	NextAuth.js / JWT Authentication 
Hosting & Deployment
•	Vercel (Frontend & Backend) 
•	Supabase / Neon PostgreSQL (Database Hosting) 
Version Control
•	GitHub

11. Database Entities
Main Tables
•	Users 
•	Students 
•	Curriculums 
•	Subjects 
•	Prerequisites 
•	Grades 
•	Evaluations 
•	Academic Years 
•	Semesters 

12. Sample System Process
Example:
Scenario
•	Student failed: Math 101 
•	Math 101 is prerequisite of Math 102 
System Result
•	Math 102 becomes unavailable 
•	Student is advised to retake Math 101 
•	Other eligible subjects are displayed 

13. Expected Output
The system should provide:
•	Automated subject evaluation 
•	Accurate prerequisite validation 
•	Organized study planning 
•	Faster academic advising process 
•	Reduced enrollment errors 

14. Future Enhancements
Possible future features:
•	Official enrollment integration 
•	Registrar approval workflow 
•	SMS/email notifications 
•	Student portal dashboard 
•	Grade import from registrar system 
•	AI-based academic recommendations 

15. Conclusion
The Web-Based Course Evaluation and Academic Advising System for PASS College aims to simplify academic evaluation and study planning by automating prerequisite checking and subject recommendations. The system will improve efficiency for both students and administrators while reducing errors during the advising and enrollment preparation process.

