# Assessment Tracker - Database Schema

## Complete Database Schema Diagram

```mermaid
erDiagram
    %% User Management
    users {
        text id PK
        text email UK
        text first_name
        text last_name
        text role
        datetime created_at
        boolean is_active
    }

    %% Assessment Periods
    assessment_periods {
        integer id PK
        text name UK
        datetime start_date
        datetime end_date
        boolean is_active
        datetime created_at
    }

    %% Assessment Types
    assessment_types {
        integer id PK
        text name UK
        text description
        text purpose
        boolean is_active
        datetime created_at
    }

    %% Assessment Categories
    assessment_categories {
        integer id PK
        integer assessment_type_id FK
        text name UK
        text description
        integer display_order
        boolean is_active
        datetime created_at
    }

    %% Assessment Templates (Collections of Questions)
    assessment_templates {
        integer id PK
        integer assessment_type_id FK
        text name UK
        text version
        text description
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    %% Questions/Prompts
    assessment_questions {
        integer id PK
        integer template_id FK
        integer category_id FK
        text question_text
        integer display_order
        boolean is_active
        datetime created_at
    }

    %% Assessment Instances (User + Template + Period)
    assessment_instances {
        integer id PK
        text user_id FK
        integer period_id FK
        integer template_id FK
        text status
        datetime started_at
        datetime completed_at
        datetime due_date
        datetime created_at
    }

    %% User Responses to Questions
    assessment_responses {
        integer id PK
        integer instance_id FK
        integer question_id FK
        integer score
        text notes
        datetime created_at
        datetime updated_at
    }

    %% Manager-Subordinate Relationships
    manager_relationships {
        integer id PK
        text manager_id FK
        text subordinate_id FK
        integer period_id FK
        datetime created_at
    }

    %% Invitation Management
    invitations {
        integer id PK
        text manager_id FK
        integer template_id FK
        integer period_id FK
        text email
        text first_name
        text last_name
        text status
        text token
        datetime invited_at
        datetime accepted_at
        datetime expires_at
        integer reminder_count
        datetime last_reminder_sent
    }

    %% Magic Link Authentication
    magic_links {
        integer id PK
        text email FK
        text token UK
        datetime expires_at
        boolean used
        datetime created_at
    }

    %% Relationships
    users ||--o{ assessment_instances : "has"
    users ||--o{ manager_relationships : "manages"
    users ||--o{ manager_relationships : "is_subordinate"
    users ||--o{ invitations : "invites"
    users ||--o{ magic_links : "authenticates"

    assessment_periods ||--o{ assessment_instances : "contains"
    assessment_periods ||--o{ manager_relationships : "defines"
    assessment_periods ||--o{ invitations : "defines"

    invitations ||--o{ assessment_templates : "references"
    invitations ||--o{ assessment_instances : "creates"

    assessment_types ||--o{ assessment_categories : "has"
    assessment_types ||--o{ assessment_templates : "defines"

    assessment_categories ||--o{ assessment_questions : "groups"
    assessment_templates ||--o{ assessment_questions : "contains"
    assessment_templates ||--o{ assessment_instances : "instantiated_as"

    assessment_instances ||--o{ assessment_responses : "collects"
    assessment_questions ||--o{ assessment_responses : "answered_by"

    invitations ||--o{ magic_links : "creates"
```

## Key Design Principles

### **Template System**
- **Assessment Templates** are collections of questions organized by categories
- Each template belongs to an assessment type (Manager Self-Assessment, Team Member Assessment, Director's MRI)
- Templates can be versioned - new versions become new templates, old versions retain their instances
- Questions are organized by categories within each template

### **Instance System**
- **Assessment Instances** link a specific user to a specific template for a specific period
- Each instance gets its own set of response records
- Instances track completion status and timing

### **Response System**
- **Assessment Responses** store individual answers to questions
- Each response links to both the instance and the specific question
- Responses include the 1-7 score and optional notes

### **Invitation System**
- **Invitations** directly reference assessment templates and periods
- Managers can bulk-invite by providing names and emails
- System tracks invitation status and reminder history
- When invitations are accepted, assessment instances are created from the referenced template

### **Relationship System**
- **Manager Relationships** define who reports to whom in each period
- Relationships are period-specific to handle organizational changes
- Used to determine who can assess whom

## Sample Data Flow

1. **Admin creates** assessment types, categories, templates, and questions
2. **Manager invites** subordinates by providing names/emails and selecting templates
3. **System creates** invitations (linked to templates and periods)
4. **Subordinates accept** invitations → system creates assessment instances from templates
5. **Subordinates complete** assessments → responses stored per question
6. **System tracks** completion and sends reminders as needed
7. **Managers view** team completion status and results

## Template Versioning Strategy

- **New template versions** become new template records
- **Old templates** retain all their existing instances and invitations
- **Future invitations** reference the new template version
- **No FK updates** needed - each template version maintains its own relationships 