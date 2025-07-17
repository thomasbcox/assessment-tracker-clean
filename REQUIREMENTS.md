# Assessment Tracker - Requirements Document

## 📋 Project Overview

The Assessment Tracker is a 360-degree performance evaluation system designed to facilitate structured assessments across different organizational roles. The system supports role-based access control, assessment period management, and comprehensive reporting capabilities.

## 🎯 Business Rules

### **1. User Management & Authentication**

#### **User Roles & Permissions**
- **Super Admin**: Full system access, user management, system configuration
- **Admin**: User management, assessment period configuration, reporting access
- **Manager**: Team assessment oversight, subordinate evaluation, team reporting
- **User**: Self-assessment completion, personal dashboard access

#### **Authentication Rules**
- Passwordless authentication via magic link tokens
- Tokens expire after 24 hours
- Single-use tokens (cannot be reused)
- Email validation required for all users
- Session management via client-side storage (demo mode)

### **2. Assessment Management**

#### **Assessment Periods**
- Assessment periods must have unique names
- Only one period can be active at a time
- Periods must have start and end dates
- Periods cannot overlap in time
- Completed periods cannot be modified

#### **Assessment Types**
The system supports three distinct assessment types, each with specific purposes and question categories:

**1. Manager Self-Assessment**
- **Purpose**: The manager rates their own behaviors and habits
- **Categories**: 
  - **Sage Mind** – Staying calm, curious, and empathetic under pressure
  - **Relating** – Building trust through asking, listening, including, coaching, and encouraging
  - **Requiring** – Driving clarity and results through expectations, standards, follow-up, and confronting problems

**2. Team Member Assessment of the Manager**
- **Purpose**: Team members rate how their manager shows up and leads
- **Categories**:
  - **Sageness** – The team remains steady, calm, and thoughtful under pressure
  - **Trust & Psychological Safety** – People feel safe to speak up and take risks
  - **Communication & Feedback** – Clear direction, regular updates, and mutual feedback
  - **Engagement & Motivation** – Visible energy, purpose, and care for growth
  - **Accountability & Performance** – High standards, follow-through, and fairness
  - **Team Collaboration & Effectiveness** – Seamless teamwork, clear meetings, and productive relationships

**3. Director's MRI (Team Observation)**
- **Purpose**: A senior leader observes team behavior to infer manager effectiveness
- **Categories**:
  - **Sageness** – The team stays composed and clear-thinking under stress
  - **Trust & Psychological Safety** – Issues are surfaced openly and treated as learning opportunities
  - **Communication & Feedback** – Information flows clearly, usefully, and visibly shapes future work
  - **Engagement & Motivation** – Work is done with care and linked to purpose; the team is eager to learn
  - **Accountability & Performance** – The team hits deadlines, owns results, and applies consistent standards
  - **Team Collaboration & Effectiveness** – Smooth handoffs, cross-coverage, and energizing, focused meetings

#### **Assessment Template Versioning**
- Each assessment type can have multiple versions
- When creating a new version of an assessment template:
  1. Duplicate the original assessment template
  2. Create new questions that are copies of the source assessment's original questions
  3. New questions point to the new version as their parent
  4. New questions have new primary keys
  5. Each version maintains its own unique question set
- Assessment templates are versioned independently of assessment periods
- Users can be assigned to specific template versions

#### **Assessment Status Rules**
- **Pending**: Assessment created but not started
- **In Progress**: Assessment started but not completed
- **Completed**: Assessment finished with all questions answered
- **Overdue**: Assessment past due date but not completed

### **3. Question & Response Management**

#### **Question Structure**
- Every question must be attached to an assessment type
- Every question must have a category within its assessment type
- Questions are organized by category within each assessment type
- Questions maintain order within categories
- Assessment types can establish their own unique categories
- Categories are flexible and can be added/modified per assessment type

#### **Scoring System**
- 1-7 rating scale for all questions and prompts
- 1 = Strongly Disagree
- 2 = Disagree
- 3 = Slightly Disagree 
- 4 = Neutral
- 5 = Slightly Agree
- 6 = Agree
- 7 = Strongly Agree

#### **Response Validation**
- All questions must be answered to complete assessment
- Scores must be between 1-7
- Responses cannot be modified after submission
- Draft responses are saved automatically

### **4. Manager-Subordinate Relationships**

#### **Relationship Rules**
- Managers can only be evaluated by their direct subordinates and others whom they invite; each invitee is identified at invitation time whether they are a direct subordinate or have some other relationship to the manager being assessed
- **Multiple managers allowed per user per period** - users can have multiple managers in a given time period
- Manager relationships are period-specific
- Managers cannot evaluate themselves using the "team member assessment of their manager"
- Managers do evaluate themselves using the "self assessment for managers"
- Peer relationships are bidirectional
- When a director fills out the "MRI" assessment it's a description of a team's behavior but it's tied to that team's manager; it's in essence an assessment of how well that manager is running that team

#### **Access Control**
- Managers can view subordinate assessment progress in terms of filling out the team assessment or not
- Managers cannot modify subordinate responses
- Managers cannot view individual evaluations of them (the "team member assessment of their manager") and managers can only see summary data after there are at least 3 responses from 3 different subordinates in that assessment period
- Admin can view all relationships and assessments

### **5. Invitation System**

#### **Role-Based Invitation Permissions**
- **Superadmin**: Can invite Admins, Managers, and Users
- **Admin**: Can invite Managers and Users (users will assess the admin as if they were a manager)
- **Manager**: Can invite Users only
- **User**: Cannot invite anyone

#### **Invitation Process**
- **Manager Invites**: Invitee receives "Manager Self-Assessment" template
- **User Invites**: Invitee receives "Team Member Assessment" template (about the person who invited them)
- **Template Selection**: Use the specific template specified in the invitation (Approach A)
- **Multiple Invitations**: Allow multiple invitations for same user (no duplicate prevention)

#### **User Account Creation via Invitation**
- **New Users**: Create user account when invitation is accepted
- **Existing Users**: Link invitation to existing user account
- **Name Handling**: 
  - If firstName/lastName provided in invitation: Use provided names
  - If not provided: Use email prefix as firstName, leave lastName as null
- **Role Assignment**: Based on invitedRole field in invitation
- **Name Editing**: Users can edit their first and last names after account creation

#### **Assessment Instance Creation**
- **Timing**: Create assessment instance when invitation is accepted
- **Purpose**: Track invited users who never get around to logging in
- **Due Date**: 
  - Settable by manager during invitation
  - Defaults to max(period_end_date + 30 days, today + 14 days)
  - Stored as TEXT in ISO 8601 format

#### **Manager Relationship Creation**
- **Auto-Creation**: Create manager relationships automatically upon user creation
- **Multiple Managers**: Allow multiple managers per user per period
- **Relationship Type**: Only create relationships when inviter is manager/admin

#### **Post-Acceptance Flow**
- **New Users**: Send magic link for first login, redirect to login page with success message
- **Existing Users**: Redirect directly to assessment dashboard
- **All Users**: Show the specific assessment they were invited to complete

#### **Invitation Email Content**
- **Subject**: "You've been invited to complete an assessment"
- **Body**: 
  - Who invited them
  - What type of assessment (Manager Self-Assessment vs Team Member Assessment)
  - Due date
  - Link to accept invitation
  - Brief explanation of the assessment process

### **5. Data Management & Privacy**

#### **Data Retention**
- Assessment data retained for 7 years
- User accounts can be deactivated but not deleted
- Assessment periods archived after completion
- Magic link tokens deleted after use or expiration after 7 days

#### **Privacy Rules**
- Users can only view their own assessment responses
- Managers can only view their self-assessments, their team's summary data, and their director's MRI of their team
- Directors (managers of Managers) can see what their subordinate Managers can see
- Admins can view all data
- Personal information protected by role-based access

## 🚀 Functional Requirements

### **1. Authentication System**

#### **FR-AUTH-001: Magic Link Authentication**
- **Description**: Users authenticate via email magic links
- **Input**: Email address
- **Process**: 
  1. Validate email format
  2. Check if user exists in database
  3. Generate unique token with 7-day expiration
  4. Send magic link via email (console log in demo)
- **Output**: Success message or error
- **Error Handling**: Invalid email, user not found, system errors

#### **FR-AUTH-002: Token Verification**
- **Description**: Verify magic link tokens and create user session
- **Input**: Token from URL
- **Process**:
  1. Validate token format
  2. Check token expiration
  3. Mark token as used
  4. Retrieve user data
  5. Create user session good for 7 days from first login
- **Output**: User data and session
- **Error Handling**: Invalid token, expired token, already used

### **2. User Management**

#### **FR-USER-001: User Profile Management**
- **Description**: View and update user profile information
- **Input**: User ID, profile data
- **Process**:
  1. Validate user permissions
  2. Update profile information
  3. Maintain audit trail
- **Output**: Updated user profile
- **Error Handling**: Invalid data, permission denied

#### **FR-USER-002: Role-Based Dashboard**
- **Description**: Display role-appropriate dashboard content
- **Input**: User role and permissions
- **Process**:
  1. Determine user role
  2. Load role-specific components
  3. Display relevant statistics
- **Output**: Personalized dashboard
- **Error Handling**: Invalid role, missing permissions

### **3. Assessment Management**

#### **FR-ASSESS-001: Assessment Creation** 🚧 IN PROGRESS
- **Description**: Create new assessment instances for users
- **Input**: User ID, period ID, assessment type, template version
- **Process**:
  1. Validate user and period
  2. Check for existing assessments
  3. Create assessment instance with specified template version
  4. Assign questions based on assessment type and template version
- **Output**: Assessment instance with questions
- **Error Handling**: Invalid user/period, duplicate assessment
- **Status**: Database schema and API structure ready, implementation pending

#### **FR-ASSESS-002: Assessment Completion**
- **Description**: Complete assessment with all responses
- **Input**: Assessment ID, question responses
- **Process**:
  1. Validate all questions answered
  2. Save responses to database
  3. Mark assessment as completed
  4. Update completion timestamp
- **Output**: Completed assessment confirmation
- **Error Handling**: Missing responses, invalid scores

#### **FR-ASSESS-003: Assessment Progress Tracking**
- **Description**: Track and display assessment progress
- **Input**: User ID, period ID
- **Process**:
  1. Query user's assessments
  2. Calculate completion percentages
  3. Determine status (pending, in progress, completed)
- **Output**: Progress statistics and status
- **Error Handling**: No assessments found

### **4. Question Management**

#### **FR-QUEST-001: Question Display**
- **Description**: Display questions by category for assessment
- **Input**: Assessment ID, category filter
- **Process**:
  1. Retrieve questions for assessment type and template version
  2. Group by category
  3. Sort by question order
- **Output**: Organized question list
- **Error Handling**: No questions found, invalid category

#### **FR-QUEST-002: Response Validation**
- **Description**: Validate assessment responses
- **Input**: Question responses
- **Process**:
  1. Check all questions answered
  2. Validate score ranges (1-7)
  3. Ensure no duplicate responses
- **Output**: Validation result
- **Error Handling**: Missing responses, invalid scores

#### **FR-QUEST-003: Template Version Management** ✅ COMPLETED
- **Description**: Create new versions of assessment templates
- **Input**: Source template ID, new version data
- **Process**:
  1. Duplicate original assessment template
  2. Create new questions as copies of source questions
  3. Assign new primary keys to copied questions
  4. Link new questions to new template version
- **Output**: New template version with copied questions
- **Error Handling**: Invalid source template, duplicate version
- **Status**: Database schema and sample data implemented, admin interface pending

### **5. Reporting & Analytics**

#### **FR-REPORT-001: Individual Assessment Report**
- **Description**: Generate personal assessment report
- **Input**: User ID, assessment period
- **Process**:
  1. Retrieve assessment responses
  2. Calculate category averages
  3. Generate score breakdown
- **Output**: Detailed assessment report
- **Error Handling**: No assessment data found

#### **FR-REPORT-002: Team Assessment Report**
- **Description**: Generate team performance report (managers only)
- **Input**: Manager ID, period ID
- **Process**:
  1. Retrieve team member assessments
  2. Calculate team averages
  3. Identify trends and patterns
- **Output**: Team performance report
- **Error Handling**: No team data, insufficient permissions

#### **FR-REPORT-003: System Analytics**
- **Description**: Generate system-wide analytics (admin only)
- **Input**: Date range, filters
- **Process**:
  1. Aggregate assessment data
  2. Calculate completion rates
  3. Generate trend analysis
- **Output**: System analytics report
- **Error Handling**: Invalid date range, insufficient permissions

### **6. Admin Functions**

#### **FR-ADMIN-001: User Management**
- **Description**: Create, update, and deactivate user accounts
- **Input**: User data, action type
- **Process**:
  1. Validate user data
  2. Check for duplicates
  3. Perform requested action
  4. Maintain audit trail
- **Output**: User management confirmation
- **Error Handling**: Invalid data, duplicate users

#### **FR-ADMIN-002: Assessment Period Management**
- **Description**: Create and manage assessment periods
- **Input**: Period data, action type
- **Process**:
  1. Validate period dates
  2. Check for overlaps
  3. Manage active period status
- **Output**: Period management confirmation
- **Error Handling**: Invalid dates, overlapping periods

#### **FR-ADMIN-003: Question Management**
- **Description**: Create and manage assessment questions
- **Input**: Question data, action type, assessment type, category
- **Process**:
  1. Validate question format
  2. Assign to assessment type and category
  3. Maintain question order
- **Output**: Question management confirmation
- **Error Handling**: Invalid question format, duplicate questions

## 🔒 Security Requirements

### **SR-001: Data Protection**
- All data transmitted over HTTPS
- User passwords never stored (magic link system)
- Session data encrypted
- Database access restricted by role

### **SR-002: Access Control**
- Role-based access control enforced
- API endpoints protected by authentication
- User data isolated by permissions
- Audit trail for all data access

### **SR-003: Input Validation**
- All user inputs validated
- SQL injection prevention
- XSS protection implemented
- File upload restrictions

## 📊 Performance Requirements

### **PR-001: Response Time**
- Page load times < 3 seconds
- API response times < 1 second
- Database queries optimized
- Caching implemented for static data

### **PR-002: Scalability**
- Support 100+ concurrent users
- Database optimized for large datasets
- Efficient query patterns
- Horizontal scaling capability

### **PR-003: Availability**
- 99.9% uptime target
- Graceful error handling
- Data backup procedures
- Disaster recovery plan

## 🧪 Quality Assurance

### **QA-001: Testing Requirements**
- Unit tests for all business logic
- Integration tests for API endpoints
- End-to-end tests for user workflows
- Performance testing for scalability

### **QA-002: Code Quality**
- TypeScript strict mode enabled
- ESLint configuration enforced
- Code review process required
- Documentation standards maintained

---

*This document serves as the foundation for development and should be updated as requirements evolve.* 