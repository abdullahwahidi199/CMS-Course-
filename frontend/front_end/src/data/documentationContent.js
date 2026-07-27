export const documentationCategories = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Core workflows and system concepts.",
  },
  {
    id: "students",
    title: "Students",
    description: "Admission, student records, and student lifecycle.",
  },
  {
    id: "promotions",
    title: "Promotions",
    description: "End-of-year movement and academic progression.",
  },
  {
    id: "finance",
    title: "Finance",
    description: "Fee plans, invoices, payments, balances, and receipts.",
  },
  {
    id: "academic",
    title: "Academic",
    description: "Courses, batches, classes, teachers, and attendance.",
  },
];

const rawArticles = [
  {
    id: "student-management",
    slug: "student-management",
    title: "Student Management",
    category: "students",
    description: "Learn the complete process for adding, organizing, and maintaining student records.",
    keywords: [
      "students",
      "admission",
      "guardian",
      "academic year",
      "batch assignment",
      "fee plan",
      "student status",
    ],
    readingTime: 9,
    futureSupport: {
      images: [],
      codeBlocks: [],
    },
    sections: [
      {
        id: "purpose",
        title: "Purpose",
        blocks: [
          {
            type: "paragraph",
            text: "Student Management is the central place for creating and maintaining student identity, guardian contact details, enrollment information, billing setup, academic status, and lifecycle history. It exists so every module uses one reliable student record instead of separate manual records.",
          },
          {
            type: "callout",
            variant: "important",
            title: "One record powers many workflows",
            text: "A saved student can appear in batches, attendance, invoices, payment history, reports, assessments, and promotion records depending on the information entered during admission.",
          },
        ],
      },
      {
        id: "when-to-use",
        title: "When To Use Student Management",
        blocks: [
          {
            type: "list",
            items: [
              "Add a new student during admission.",
              "Review a student's current batch, course, guardian, balance, and status.",
              "Update student or guardian information when contact details change.",
              "Promote, archive, restore, activate, or deactivate students.",
              "Inspect historical attendance, invoices, payments, assessments, and promotion history.",
            ],
          },
        ],
      },
      {
        id: "prerequisites",
        title: "Prerequisites",
        blocks: [
          {
            type: "paragraph",
            text: "Before creating a student, make sure the academic structure and billing setup exist. This prevents incomplete records and avoids manual cleanup later.",
          },
          {
            type: "list",
            items: [
              "At least one course or academic program should exist when the student needs course tracking.",
              "The correct batch should already be created for the current academic year.",
              "A fee plan should be available if invoices will be generated for the student.",
              "The admission date and student status should be known.",
              "Guardian contact information should be confirmed before saving.",
            ],
          },
          {
            type: "callout",
            variant: "tip",
            title: "Prepare batches first",
            text: "Create the target batch before admission day. It keeps the admission workflow short and ensures attendance, invoice, and reports can use the correct class grouping immediately.",
          },
        ],
      },
      {
        id: "required-information",
        title: "Required Information",
        blocks: [
          {
            type: "paragraph",
            text: "A strong student record contains both identity information and operational information. Identity fields describe who the student is. Operational fields tell the system where the student belongs and how billing should work.",
          },
          {
            type: "list",
            items: [
              "Student information: name, phone, address, and any school-specific identifier.",
              "Guardian information: guardian name, relationship if available, and parent or guardian mobile number.",
              "Admission date: the date the student officially joins the institution.",
              "Batch assignment: the student's current class or cohort.",
              "Academic year: the school year connected with the enrollment.",
              "Fee plan: the billing rule used to create invoices.",
              "Student status: active, inactive, archived, completed, or another lifecycle state used by your school.",
            ],
          },
          {
            type: "callout",
            variant: "warning",
            title: "Do not skip guardian contact details",
            text: "Missing guardian phone numbers make fee reminders, attendance follow-up, and emergency contact workflows harder for staff.",
          },
        ],
      },
      {
        id: "add-student-workflow",
        title: "Add A Student",
        blocks: [
          {
            type: "steps",
            items: [
              "Open the Admission or Students area from the admin sidebar.",
              "Choose New Admission or Add Student.",
              "Enter the student's personal information exactly as it should appear on records and receipts.",
              "Enter guardian information, especially guardian name and mobile number.",
              "Select the admission date.",
              "Select the current academic year.",
              "Assign the student to the correct batch.",
              "Choose the fee plan that matches the student's billing agreement.",
              "Set the student status, usually Active for newly admitted students.",
              "Review the information and save the record.",
            ],
          },
          {
            type: "callout",
            variant: "note",
            title: "Review before saving",
            text: "Batch, academic year, and fee plan are operational fields. If they are wrong, attendance and finance records may be created under the wrong context.",
          },
        ],
      },
      {
        id: "after-saving",
        title: "What Happens After Saving",
        blocks: [
          {
            type: "paragraph",
            text: "After saving, the system creates the student identity record and connects it to the selected academic setup. Depending on the active billing and enrollment settings, related records may also be prepared automatically.",
          },
          {
            type: "list",
            items: [
              "A student profile becomes available in the Students list.",
              "An enrollment or class assignment connects the student to the selected batch.",
              "Billing information connects the student to the selected fee plan.",
              "The student becomes eligible for attendance tracking in the assigned batch.",
              "The student can be included in academic reports, finance reports, and promotion workflows.",
              "Invoices can be generated automatically or manually according to the configured fee plan.",
            ],
          },
          {
            type: "callout",
            variant: "success",
            title: "The student is now operational",
            text: "Once the student is saved with batch and fee plan information, staff can manage attendance, payments, invoices, and academic progress from the connected modules.",
          },
        ],
      },
      {
        id: "where-students-appear",
        title: "Where The Student Appears",
        blocks: [
          {
            type: "list",
            items: [
              "Students: as a searchable student profile and lifecycle record.",
              "Batches: under the assigned batch or class group.",
              "Attendance: in class attendance sheets for the relevant batch.",
              "Finance: on invoices, payments, ledgers, receipts, and balances.",
              "Reports: in student, attendance, assessment, and fee reports.",
              "Promotions: as an eligible student when moving from one batch to another.",
            ],
          },
        ],
      },
      {
        id: "best-practices",
        title: "Best Practices",
        blocks: [
          {
            type: "list",
            items: [
              "Use a consistent naming format for student names and guardian names.",
              "Confirm the batch and academic year before saving a new admission.",
              "Assign the fee plan during admission instead of waiting until invoice generation.",
              "Keep inactive students inactive rather than deleting historical records.",
              "Archive only when the student should be hidden from daily workflows but preserved for reporting.",
              "Review outstanding balances before changing status or promoting a student.",
            ],
          },
        ],
      },
      {
        id: "common-mistakes",
        title: "Common Mistakes",
        blocks: [
          {
            type: "list",
            items: [
              "Assigning the student to an old batch from a previous academic year.",
              "Using the wrong fee plan, causing invoices to generate with incorrect amounts.",
              "Saving duplicate student records instead of updating the existing profile.",
              "Leaving the student inactive after admission, which can hide them from operational screens.",
              "Changing batch information casually instead of using the promotion workflow when history matters.",
            ],
          },
        ],
      },
      {
        id: "faq",
        title: "Frequently Asked Questions",
        blocks: [
          {
            type: "faq",
            items: [
              {
                question: "Can I edit a student after saving?",
                answer: "Yes. Basic student and guardian details can be edited later. Be careful when changing batch or billing details because they affect connected workflows.",
              },
              {
                question: "Should I delete a student who left school?",
                answer: "Usually no. Deactivate, archive, or mark the student as completed so historical attendance, invoices, payments, and reports remain available.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "student-lifecycle",
    slug: "student-lifecycle",
    title: "Student Lifecycle",
    category: "students",
    description: "Understand how a student moves through admission, attendance, billing, progress, promotion, and completion.",
    keywords: ["student lifecycle", "admission", "attendance", "invoices", "promotion", "graduation", "completion"],
    readingTime: 8,
    futureSupport: { images: [], codeBlocks: [] },
    sections: [
      {
        id: "overview",
        title: "Overview",
        blocks: [
          {
            type: "paragraph",
            text: "The student lifecycle describes the complete journey of a student inside the Education Management System. It starts with admission and continues through batch assignment, attendance, billing, academic progress, promotion, and final completion or graduation.",
          },
          {
            type: "callout",
            variant: "note",
            title: "Lifecycle records create history",
            text: "Every stage should preserve context. Staff should be able to answer where the student studied, what was billed, what was paid, and how the student progressed over time.",
          },
        ],
      },
      {
        id: "lifecycle-flow",
        title: "Lifecycle Flow",
        blocks: [
          {
            type: "steps",
            items: [
              "Admission: create the student profile and collect required personal and guardian information.",
              "Assigned to batch: enroll the student into the correct batch for the academic year.",
              "Class attendance: track presence and absence through the assigned batch or class sessions.",
              "Invoices generated: create finance records according to the student's fee plan.",
              "Payments collected: record full or partial payments and update invoice balances.",
              "Academic progress: record assessments, marks, submissions, and performance indicators.",
              "Promotion: move the student from the current batch to the next destination batch.",
              "Graduation or completion: mark the student's lifecycle as complete while keeping historical records.",
            ],
          },
        ],
      },
      {
        id: "admission-stage",
        title: "Admission Stage",
        blocks: [
          {
            type: "paragraph",
            text: "Admission establishes the student's identity in the system. This is where staff collect the student's name, guardian details, admission date, initial batch, academic year, fee plan, and status.",
          },
          {
            type: "callout",
            variant: "tip",
            title: "Treat admission as setup",
            text: "Good admission data reduces later work for attendance, finance, reports, and promotions.",
          },
        ],
      },
      {
        id: "batch-and-attendance",
        title: "Batch Assignment And Attendance",
        blocks: [
          {
            type: "paragraph",
            text: "After admission, the batch assignment places the student into a learning group. Attendance is usually taken by batch, so correct batch assignment determines where the student appears for daily attendance.",
          },
          {
            type: "list",
            items: [
              "Students should be assigned to the active batch they attend.",
              "Teachers and administrators can use the batch to find students quickly.",
              "Attendance history should remain connected to the batch and date where it was recorded.",
            ],
          },
        ],
      },
      {
        id: "finance-stage",
        title: "Invoices And Payments",
        blocks: [
          {
            type: "paragraph",
            text: "Billing begins when fee plans generate invoices or when staff create manual invoices. Payments are recorded against invoices, reducing balances and creating payment history.",
          },
          {
            type: "callout",
            variant: "important",
            title: "Finance follows the student",
            text: "Invoices and payments should stay available even if the student is promoted, deactivated, archived, or completed.",
          },
        ],
      },
      {
        id: "academic-progress",
        title: "Academic Progress",
        blocks: [
          {
            type: "paragraph",
            text: "Academic progress includes attendance trends, assessments, marks, assignments, teacher feedback, and course completion. These records help staff decide whether the student is ready for promotion or completion.",
          },
        ],
      },
      {
        id: "promotion-and-completion",
        title: "Promotion And Completion",
        blocks: [
          {
            type: "paragraph",
            text: "Promotion moves a student to a new destination batch while preserving previous enrollment, attendance, invoice, and payment records. Completion or graduation ends the active lifecycle but should not remove historical records.",
          },
          {
            type: "callout",
            variant: "warning",
            title: "Do not overwrite history",
            text: "Avoid manually replacing old batch names in historical records. Use promotion or completion actions so reports remain accurate.",
          },
        ],
      },
    ],
  },
  {
    id: "student-promotion",
    slug: "student-promotion",
    title: "Student Promotion",
    category: "promotions",
    description: "A detailed guide to promoting students while preserving history.",
    keywords: [
      "promotion",
      "academic year",
      "current batch",
      "destination batch",
      "historical records",
      "attendance preservation",
      "invoice preservation",
    ],
    readingTime: 12,
    futureSupport: { images: [], codeBlocks: [] },
    sections: [
      {
        id: "what-promotion-means",
        title: "What Promotion Means",
        blocks: [
          {
            type: "paragraph",
            text: "Promotion means moving a student from one current batch to a destination batch, usually after completing a term, grade, level, or academic year. Promotion changes the student's active academic placement without deleting previous academic or financial history.",
          },
          {
            type: "callout",
            variant: "important",
            title: "Promotion is not a simple edit",
            text: "Promotion should be treated as a lifecycle event. It records movement from one batch to another and keeps previous records intact for audit and reporting.",
          },
        ],
      },
      {
        id: "why-promotions-exist",
        title: "Why Promotions Exist",
        blocks: [
          {
            type: "list",
            items: [
              "They keep student progress organized across academic years.",
              "They preserve previous batch attendance and assessment history.",
              "They prevent finance records from being mixed with the wrong class period.",
              "They help staff manage groups of students at the end of a year.",
              "They create a clear record of who moved, when they moved, and where they moved.",
            ],
          },
        ],
      },
      {
        id: "when-to-promote",
        title: "When Promotions Should Be Performed",
        blocks: [
          {
            type: "paragraph",
            text: "Promotions should normally be performed after a student has completed the requirements for the current batch and before regular attendance or billing starts for the next batch.",
          },
          {
            type: "list",
            items: [
              "At the end of an academic year.",
              "At the end of a course level or semester when students move to a new batch.",
              "After final attendance, assessment, and fee records are reviewed.",
              "Before teachers begin taking attendance for the new batch.",
            ],
          },
          {
            type: "callout",
            variant: "warning",
            title: "Do not promote too early",
            text: "If promotion is performed before final attendance, invoices, or marks are recorded, those remaining records may be entered under the wrong batch.",
          },
        ],
      },
      {
        id: "recommended-year-end-workflow",
        title: "Recommended Year-End Workflow",
        blocks: [
          {
            type: "steps",
            items: [
              "Complete attendance records for the current academic year.",
              "Review assessments, marks, and completion decisions.",
              "Generate any remaining invoices for the current batch.",
              "Record payments or document outstanding balances.",
              "Create destination batches for the new academic year.",
              "Confirm fee plans for the destination batches or students.",
              "Promote eligible students in controlled groups.",
              "Review reports after promotion to confirm counts and placements.",
            ],
          },
          {
            type: "callout",
            variant: "tip",
            title: "Promote in batches",
            text: "When many students are moving together, filter by current batch and promote the eligible group after confirming the destination batch.",
          },
        ],
      },
      {
        id: "promotion-process",
        title: "Promotion Process",
        blocks: [
          {
            type: "steps",
            items: [
              "Select Academic Year: choose the academic year connected to the current enrollment or promotion period.",
              "Select Current Batch: choose the batch students are moving from.",
              "Select Destination Batch: choose the new batch students will move into.",
              "Select Students: choose all eligible students from the current batch.",
              "Review: confirm names, current batch, destination batch, promotion date, and any remarks.",
              "Confirm Promotion: save the promotion so the active placement changes and the movement is recorded.",
            ],
          },
          {
            type: "callout",
            variant: "example",
            title: "Example",
            text: "Students in Grade 6 - 2025 can be promoted into Grade 7 - 2026 after final reports and fee balances are reviewed.",
          },
        ],
      },
      {
        id: "what-changes",
        title: "What Changes After Promotion",
        blocks: [
          {
            type: "list",
            items: [
              "The student's current active batch changes to the destination batch.",
              "The previous enrollment or batch assignment becomes historical.",
              "The student appears in the destination batch for future class management and attendance.",
              "Future reports use the new active batch when showing current placement.",
              "A promotion history record is created with the old batch, new batch, date, user, and remarks where supported.",
            ],
          },
        ],
      },
      {
        id: "what-does-not-change",
        title: "What Does Not Change",
        blocks: [
          {
            type: "list",
            items: [
              "Previous attendance records remain connected to the old batch and dates.",
              "Previous invoices remain connected to their original billing period and student.",
              "Previous payments and receipts remain part of the student's financial history.",
              "Assessment and academic records from earlier periods remain available.",
              "The student identity record, guardian details, and profile history remain intact unless edited separately.",
            ],
          },
          {
            type: "callout",
            variant: "success",
            title: "History stays intact",
            text: "Promotion should preserve the story of the student's earlier academic and financial activity while updating only the current placement.",
          },
        ],
      },
      {
        id: "historical-records",
        title: "Historical Records",
        blocks: [
          {
            type: "paragraph",
            text: "Historical records are preserved because they answer questions about the past. Staff may need to know a student's attendance in a previous batch, invoices from the old academic year, payments made before promotion, and assessments completed before moving forward.",
          },
          {
            type: "callout",
            variant: "important",
            title: "Reports depend on history",
            text: "Changing old records to match the new batch can damage year-end reports, finance audits, and attendance summaries.",
          },
        ],
      },
      {
        id: "common-mistakes",
        title: "Common Mistakes",
        blocks: [
          {
            type: "list",
            items: [
              "Editing the student's batch directly instead of using promotion.",
              "Promoting students before final invoices or attendance are complete.",
              "Selecting the wrong destination batch for the next academic year.",
              "Promoting inactive or archived students without reviewing why they are inactive.",
              "Ignoring outstanding balances before moving students forward.",
              "Promoting duplicate student profiles instead of merging or correcting records first.",
            ],
          },
        ],
      },
      {
        id: "best-practices",
        title: "Best Practices",
        blocks: [
          {
            type: "list",
            items: [
              "Create destination batches before starting the promotion process.",
              "Use filters to select only students from the same current batch.",
              "Review students who are inactive, archived, or financially overdue before promotion.",
              "Add remarks when a promotion is conditional, delayed, or exceptional.",
              "Run attendance and fee reports before and after promotion for confirmation.",
              "Promote only after academic staff approve the final progression list.",
            ],
          },
        ],
      },
      {
        id: "faq",
        title: "Frequently Asked Questions",
        blocks: [
          {
            type: "faq",
            items: [
              {
                question: "Can a student be promoted with unpaid invoices?",
                answer: "That depends on school policy. The system can preserve unpaid invoices after promotion, but staff should review outstanding balances before confirming movement.",
              },
              {
                question: "Does promotion delete old attendance?",
                answer: "No. Previous attendance should remain connected to the old batch and original dates.",
              },
              {
                question: "Can promotion be reversed?",
                answer: "If a mistake is made, correct it according to your school workflow. Keep a note explaining the correction so reports remain understandable.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "batches",
    slug: "batches",
    title: "Batches",
    category: "academic",
    description: "Use batches to group students, teachers, schedules, attendance, and academic years.",
    keywords: ["batches", "classes", "academic year", "teachers", "students", "courses"],
    readingTime: 8,
    futureSupport: { images: [], codeBlocks: [] },
    sections: [
      {
        id: "what-batches-are",
        title: "What Batches Are",
        blocks: [
          {
            type: "paragraph",
            text: "A batch is a group of students learning together in a specific academic context. In many schools, a batch represents a class section, grade group, course intake, or learning cohort.",
          },
          {
            type: "callout",
            variant: "note",
            title: "Batches connect modules",
            text: "Batches help the system connect students with academic years, teachers, schedules, attendance, invoices, and promotion workflows.",
          },
        ],
      },
      {
        id: "why-batches-exist",
        title: "Why Batches Exist",
        blocks: [
          {
            type: "list",
            items: [
              "They organize students into manageable learning groups.",
              "They help teachers find the correct students for attendance and academic work.",
              "They connect courses or programs to a specific academic year.",
              "They make promotion from one group to another possible.",
              "They improve reporting by grouping attendance, fees, and academic activity.",
            ],
          },
        ],
      },
      {
        id: "relationships",
        title: "Relationships",
        blocks: [
          {
            type: "list",
            items: [
              "Academic years: a batch normally belongs to one academic year or active academic period.",
              "Students: students are assigned to batches through admission, enrollment, or promotion.",
              "Teachers: teachers can be connected to batches for teaching, attendance, or class ownership.",
              "Classes: class sessions and schedules often use batches to know which students should attend.",
              "Courses: batches can represent a course intake or a class group inside a course.",
            ],
          },
        ],
      },
      {
        id: "creating-batches",
        title: "Creating Batches",
        blocks: [
          {
            type: "steps",
            items: [
              "Open the Batches or Classes area from the Academic sidebar.",
              "Choose Create Batch.",
              "Enter a clear batch name such as Grade 7 A - 2026.",
              "Select the course or academic program when required.",
              "Select the academic year or period.",
              "Assign teachers if your workflow uses teacher ownership.",
              "Set capacity, schedule, or room information where available.",
              "Save the batch.",
            ],
          },
        ],
      },
      {
        id: "editing-and-deactivating",
        title: "Editing And Deactivating Batches",
        blocks: [
          {
            type: "paragraph",
            text: "Batches can be edited when names, teachers, rooms, capacity, or schedule details change. Deactivate a batch when it should no longer be used for new daily work but still needs to remain available for reports.",
          },
          {
            type: "callout",
            variant: "warning",
            title: "Avoid changing old batch meaning",
            text: "Do not rename an old batch so it represents a new year. Create a new batch instead. This keeps reports and historical records clear.",
          },
        ],
      },
      {
        id: "assigning-and-removing-students",
        title: "Assigning And Removing Students",
        blocks: [
          {
            type: "steps",
            items: [
              "Open the student's admission or enrollment record.",
              "Select the correct active batch.",
              "Save the student or enrollment change.",
              "Confirm the student appears in the batch list.",
              "If removing a student, confirm whether the student should be transferred, promoted, deactivated, archived, or marked completed.",
            ],
          },
          {
            type: "callout",
            variant: "important",
            title: "Use lifecycle actions when history matters",
            text: "If a student is moving to another batch after completing work, use promotion instead of simply removing and reassigning.",
          },
        ],
      },
      {
        id: "best-practices",
        title: "Best Practices",
        blocks: [
          {
            type: "list",
            items: [
              "Include academic year or intake in the batch name.",
              "Create new batches for new academic years instead of reusing old ones.",
              "Assign teachers before classes begin.",
              "Deactivate completed batches instead of deleting them.",
              "Review student counts before attendance and invoice generation.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "fee-plans",
    slug: "fee-plans",
    title: "Fee Plans",
    category: "finance",
    description: "Configure billing rules that determine student invoice amounts and schedules.",
    keywords: ["fee plans", "monthly", "quarterly", "semester", "yearly", "custom", "invoice generation"],
    readingTime: 8,
    futureSupport: { images: [], codeBlocks: [] },
    sections: [
      {
        id: "purpose",
        title: "Purpose",
        blocks: [
          {
            type: "paragraph",
            text: "Fee plans define how much a student should be billed and how often invoices should be generated. They keep billing consistent across students, batches, and academic periods.",
          },
        ],
      },
      {
        id: "plan-types",
        title: "Plan Types",
        blocks: [
          {
            type: "list",
            items: [
              "Monthly plans: generate or expect invoices every month.",
              "Quarterly plans: group fees into four billing periods per year.",
              "Semester plans: bill once per semester or term.",
              "Yearly plans: bill the full annual amount in one cycle.",
              "Custom plans: support special agreements, discounts, scholarship structures, or nonstandard billing schedules.",
            ],
          },
          {
            type: "callout",
            variant: "tip",
            title: "Choose by collection policy",
            text: "The right fee plan should match how the school actually collects money, not only how the academic year is structured.",
          },
        ],
      },
      {
        id: "creating-fee-plans",
        title: "Creating Fee Plans",
        blocks: [
          {
            type: "steps",
            items: [
              "Open the Finance or Billing area.",
              "Go to Fee Plans.",
              "Choose Create Fee Plan.",
              "Enter the plan name, amount, billing cycle, and description.",
              "Connect the plan to a course, batch, or student category if applicable.",
              "Review the invoice generation rules.",
              "Save the fee plan.",
            ],
          },
        ],
      },
      {
        id: "editing-fee-plans",
        title: "Editing Fee Plans",
        blocks: [
          {
            type: "paragraph",
            text: "Edit fee plans when amounts, descriptions, or billing rules change. Be careful with plans already assigned to students because changes may affect future invoice generation.",
          },
          {
            type: "callout",
            variant: "warning",
            title: "Do not rewrite billing history",
            text: "If previous invoices must keep the old price, create a new fee plan for the new amount instead of changing the old plan in a way that makes history confusing.",
          },
        ],
      },
      {
        id: "assigning-fee-plans",
        title: "Assigning Fee Plans To Students",
        blocks: [
          {
            type: "steps",
            items: [
              "Open the student admission, enrollment, or billing profile.",
              "Select the correct fee plan.",
              "Confirm the billing cycle and amount.",
              "Save the change.",
              "Review upcoming invoices or regenerate invoices if your workflow requires it.",
            ],
          },
        ],
      },
      {
        id: "changing-fee-plans",
        title: "Changing Fee Plans",
        blocks: [
          {
            type: "paragraph",
            text: "A student's fee plan may change because of scholarship, discount, transfer, promotion, or a revised school policy. The change should affect future invoices, while paid or issued invoices should remain understandable.",
          },
          {
            type: "callout",
            variant: "important",
            title: "Review existing invoices first",
            text: "Before changing a fee plan, check whether invoices were already generated. Decide whether old invoices should remain, be cancelled, or be replaced according to school policy.",
          },
        ],
      },
      {
        id: "invoice-generation",
        title: "How Fee Plans Affect Invoice Generation",
        blocks: [
          {
            type: "paragraph",
            text: "Invoice generation reads the assigned fee plan to determine the amount, billing cycle, period, and due date rules. A monthly plan may create a new invoice each month, while a yearly plan may create one larger invoice for the full academic year.",
          },
        ],
      },
    ],
  },
  {
    id: "courses",
    slug: "courses",
    title: "Courses",
    category: "academic",
    description: "Create and manage the academic programs or subjects that batches and classes are built around.",
    keywords: ["courses", "programs", "subjects", "batches", "classes", "academic structure"],
    readingTime: 6,
    futureSupport: { images: [], codeBlocks: [] },
    sections: [
      {
        id: "purpose",
        title: "Purpose",
        blocks: [
          {
            type: "paragraph",
            text: "Courses define what the school teaches. A course may represent a program, grade curriculum, subject, training level, or academic offering. Batches and classes use courses so students, teachers, attendance, assessments, and reports stay connected to the correct learning area.",
          },
          {
            type: "callout",
            variant: "note",
            title: "Courses are the academic foundation",
            text: "Create courses before creating related batches when your school needs course-based billing, reports, or teacher assignment.",
          },
        ],
      },
      {
        id: "when-to-use",
        title: "When To Use Courses",
        blocks: [
          {
            type: "list",
            items: [
              "Create a new academic program or subject.",
              "Organize batches under a specific course or level.",
              "Separate students by curriculum, program, or training track.",
              "Connect assessments and reports to the correct academic offering.",
              "Prepare the structure before admission or batch creation.",
            ],
          },
        ],
      },
      {
        id: "relationships",
        title: "Relationships",
        blocks: [
          {
            type: "list",
            items: [
              "Batches: a course can have one or more batches for different years, sections, or intake groups.",
              "Students: students are usually connected to a course through their active batch or enrollment.",
              "Teachers: teachers may be assigned to courses, batches, or class sessions depending on the workflow.",
              "Fee plans: fee plans may be based on course pricing when different programs charge different amounts.",
              "Reports: course filters help staff compare academic, attendance, and finance activity.",
            ],
          },
        ],
      },
      {
        id: "creating-courses",
        title: "Creating Courses",
        blocks: [
          {
            type: "steps",
            items: [
              "Open the Academic area and choose Courses.",
              "Select Create Course.",
              "Enter a clear course name such as Grade 8, English Level 2, or Computer Basics.",
              "Add a description, duration, status, or other details supported by your setup.",
              "Save the course.",
              "Create batches under the course for the correct academic year or intake.",
            ],
          },
        ],
      },
      {
        id: "editing-and-deactivating",
        title: "Editing And Deactivating Courses",
        blocks: [
          {
            type: "paragraph",
            text: "Edit a course when its name, description, duration, or status changes. Deactivate a course when it should no longer accept new batches or students but must remain visible in historical reports.",
          },
          {
            type: "callout",
            variant: "warning",
            title: "Do not reuse old courses for different meanings",
            text: "If a program changes significantly, create a new course or document the change clearly. Reusing an old course for a different curriculum can make reports confusing.",
          },
        ],
      },
      {
        id: "best-practices",
        title: "Best Practices",
        blocks: [
          {
            type: "list",
            items: [
              "Use short, consistent course names that staff recognize.",
              "Keep course names stable after students and batches are attached.",
              "Create separate courses for programs with different pricing or curriculum.",
              "Deactivate old courses instead of deleting them.",
              "Review course setup before creating fee plans and batches.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "invoices",
    slug: "invoices",
    title: "Invoices",
    category: "finance",
    description: "Understand automatic and manual invoices, statuses, printing, and billing best practices.",
    keywords: ["invoices", "automatic invoice generation", "manual invoices", "pending", "paid", "partially paid", "overdue", "cancelled"],
    readingTime: 8,
    futureSupport: { images: [], codeBlocks: [] },
    sections: [
      {
        id: "purpose",
        title: "Purpose",
        blocks: [
          {
            type: "paragraph",
            text: "Invoices are formal billing records that show what a student owes for a billing period, service, course, admission charge, or other fee. They help staff track expected income, payment status, outstanding balances, and receipts.",
          },
        ],
      },
      {
        id: "automatic-and-manual",
        title: "Automatic And Manual Invoices",
        blocks: [
          {
            type: "list",
            items: [
              "Automatic invoices are created from assigned fee plans and billing cycles.",
              "Manual invoices are created by staff for one-time fees, adjustments, special charges, or exceptional cases.",
              "Both types should clearly show the student, amount, due date, period, and status.",
            ],
          },
          {
            type: "callout",
            variant: "note",
            title: "Automatic invoices reduce missed billing",
            text: "When fee plans are accurate, automatic generation helps staff avoid forgetting recurring monthly, quarterly, semester, or yearly charges.",
          },
        ],
      },
      {
        id: "statuses",
        title: "Invoice Statuses",
        blocks: [
          {
            type: "list",
            items: [
              "Pending: the invoice has been issued but no payment has fully settled it.",
              "Paid: the invoice balance is zero and the expected amount has been collected.",
              "Partially Paid: one or more payments were recorded, but a balance remains.",
              "Overdue: the invoice is unpaid or partially paid after the due date.",
              "Cancelled: the invoice should no longer be collected, usually because it was created in error or replaced.",
            ],
          },
        ],
      },
      {
        id: "viewing-invoices",
        title: "Viewing Invoices",
        blocks: [
          {
            type: "steps",
            items: [
              "Open Finance or Billing.",
              "Go to Invoices.",
              "Search or filter by student, date, batch, status, or billing period.",
              "Open the invoice to review amount, paid amount, balance, due date, and payment history.",
            ],
          },
        ],
      },
      {
        id: "editing-invoices",
        title: "Editing Invoices",
        blocks: [
          {
            type: "paragraph",
            text: "Invoices may be edited before collection if the amount, description, due date, discount, or status needs correction. After payments are recorded, changes should be handled carefully because they affect balances and receipts.",
          },
          {
            type: "callout",
            variant: "warning",
            title: "Be careful after payment",
            text: "Changing invoice amounts after payment can create confusing balances. Use adjustments, cancellation, or approved finance procedures where possible.",
          },
        ],
      },
      {
        id: "printing-invoices",
        title: "Printing Invoices",
        blocks: [
          {
            type: "steps",
            items: [
              "Open the invoice record.",
              "Confirm student name, invoice number, amount, due date, and status.",
              "Choose Print or Download where available.",
              "Share the invoice with the student or guardian according to school policy.",
            ],
          },
        ],
      },
      {
        id: "best-practices",
        title: "Best Practices",
        blocks: [
          {
            type: "list",
            items: [
              "Use consistent invoice descriptions.",
              "Review fee plan assignments before generating invoices.",
              "Do not delete invoices that have payments; preserve history.",
              "Use cancelled status for invoices created by mistake.",
              "Monitor overdue invoices regularly.",
              "Print or share invoices only after verifying the student's billing details.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "payments",
    slug: "payments",
    title: "Payments",
    category: "finance",
    description: "Record full and partial payments, maintain balances, and issue receipts.",
    keywords: ["payments", "partial payments", "full payments", "outstanding balances", "payment history", "receipts"],
    readingTime: 7,
    futureSupport: { images: [], codeBlocks: [] },
    sections: [
      {
        id: "purpose",
        title: "Purpose",
        blocks: [
          {
            type: "paragraph",
            text: "Payments record money collected from students or guardians. Each payment reduces an invoice balance, updates the student's financial position, and creates a history record for receipts and audits.",
          },
        ],
      },
      {
        id: "recording-payments",
        title: "Recording Payments",
        blocks: [
          {
            type: "steps",
            items: [
              "Open Finance or Billing.",
              "Find the student or invoice.",
              "Choose Record Payment.",
              "Enter the amount received.",
              "Select the payment date and payment method.",
              "Add receipt notes or reference numbers if required.",
              "Review the remaining balance.",
              "Save the payment and issue the receipt.",
            ],
          },
        ],
      },
      {
        id: "full-and-partial",
        title: "Full And Partial Payments",
        blocks: [
          {
            type: "list",
            items: [
              "Full payment: the amount received equals the invoice balance, so the invoice becomes paid.",
              "Partial payment: the amount received is less than the balance, so the invoice remains partially paid.",
              "Outstanding balance: the unpaid amount remaining after one or more payments.",
            ],
          },
          {
            type: "callout",
            variant: "example",
            title: "Example",
            text: "If an invoice is 1,000 and the guardian pays 400, the invoice becomes partially paid with a 600 outstanding balance.",
          },
        ],
      },
      {
        id: "payment-history",
        title: "Payment History And Receipts",
        blocks: [
          {
            type: "paragraph",
            text: "Payment history shows every collection event for a student or invoice. Receipts provide proof of payment and should include receipt number, student, amount, payment date, payment method, and related invoice where applicable.",
          },
          {
            type: "callout",
            variant: "success",
            title: "Receipts protect both sides",
            text: "A clear receipt helps the school and guardian confirm exactly what was paid and when it was paid.",
          },
        ],
      },
      {
        id: "effect-on-invoices",
        title: "How Payments Affect Invoices And Balances",
        blocks: [
          {
            type: "paragraph",
            text: "When a payment is saved, the invoice paid amount increases and the balance decreases. If the balance reaches zero, the invoice status becomes paid. If a balance remains, the status stays pending, partially paid, or overdue depending on due date rules.",
          },
        ],
      },
      {
        id: "common-mistakes",
        title: "Common Mistakes",
        blocks: [
          {
            type: "list",
            items: [
              "Recording a payment against the wrong student.",
              "Recording a payment against the wrong invoice.",
              "Entering the total invoice amount instead of the amount actually received.",
              "Forgetting to print or share the receipt.",
              "Cancelling or editing paid invoices without reviewing payment history.",
            ],
          },
        ],
      },
      {
        id: "best-practices",
        title: "Best Practices",
        blocks: [
          {
            type: "list",
            items: [
              "Search by student and invoice number before recording payment.",
              "Confirm the balance with the guardian before saving.",
              "Use payment notes for bank reference numbers, discounts, or special cases.",
              "Reconcile payment history with daily cash or bank totals.",
              "Keep receipts available for reprint when guardians request proof.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "classes",
    slug: "classes",
    title: "Classes",
    category: "academic",
    description: "Plan class sessions, connect them to batches, assign teachers, and support attendance.",
    keywords: ["classes", "courses", "batches", "teachers", "attendance", "scheduling"],
    readingTime: 7,
    futureSupport: { images: [], codeBlocks: [] },
    sections: [
      {
        id: "purpose",
        title: "Purpose",
        blocks: [
          {
            type: "paragraph",
            text: "Classes represent scheduled learning activity for students. A class may be connected to a batch, course, teacher, room, time, or attendance sheet depending on the school's setup.",
          },
        ],
      },
      {
        id: "relationships",
        title: "Relationships",
        blocks: [
          {
            type: "list",
            items: [
              "Batches: classes use batches to know which students should attend.",
              "Courses: classes may belong to a course or subject.",
              "Teachers: teachers can be assigned to run the class and manage attendance or academic work.",
              "Attendance: attendance sheets are created from the class, batch, date, or schedule.",
              "Schedules: recurring class times help staff and students know when sessions happen.",
            ],
          },
        ],
      },
      {
        id: "creating-classes",
        title: "Creating Classes",
        blocks: [
          {
            type: "steps",
            items: [
              "Open Academic and go to Courses, Batches, or Classes depending on your menu setup.",
              "Choose Create Class or Create Schedule.",
              "Select the batch that will attend the class.",
              "Select the course, subject, or module.",
              "Assign the teacher.",
              "Set day, time, room, and recurrence where available.",
              "Save the class.",
            ],
          },
        ],
      },
      {
        id: "scheduling-classes",
        title: "Scheduling Classes",
        blocks: [
          {
            type: "paragraph",
            text: "Scheduling defines when a class occurs. Good schedules prevent teacher conflicts, room conflicts, and missed attendance records.",
          },
          {
            type: "callout",
            variant: "tip",
            title: "Schedule before attendance begins",
            text: "Create class schedules before the first teaching day so attendance and teacher dashboards can show the correct sessions.",
          },
        ],
      },
      {
        id: "complete-workflow",
        title: "Complete Workflow",
        blocks: [
          {
            type: "steps",
            items: [
              "Create or confirm the course.",
              "Create the batch for the academic year.",
              "Assign students to the batch through admission, enrollment, or promotion.",
              "Assign the teacher to the batch or class.",
              "Create the class schedule.",
              "Take attendance during each session.",
              "Review attendance and academic reports regularly.",
            ],
          },
        ],
      },
      {
        id: "best-practices",
        title: "Best Practices",
        blocks: [
          {
            type: "list",
            items: [
              "Use clear class names that include course, batch, or section when helpful.",
              "Avoid scheduling two classes for the same teacher at the same time.",
              "Review batch student lists before taking attendance.",
              "Deactivate old class schedules instead of overwriting them for a new academic year.",
              "Keep teacher assignments current so dashboards and reports remain accurate.",
            ],
          },
        ],
      },
    ],
  },
];

function getPlainTextFromBlock(block) {
  if (block.text) return block.text;
  if (block.items) {
    return block.items
      .map((item) => {
        if (typeof item === "string") return item;
        return `${item.question || ""} ${item.answer || ""}`;
      })
      .join(" ");
  }
  return "";
}

function buildSearchText(article) {
  return [
    article.title,
    article.description,
    article.category,
    ...(article.keywords || []),
    ...article.sections.map((section) => section.title),
    ...article.sections.flatMap((section) => section.blocks.map(getPlainTextFromBlock)),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function buildHeadings(article) {
  return article.sections.map((section) => ({
    id: section.id,
    title: section.title,
    level: 2,
  }));
}

export const documentationArticles = rawArticles.map((article, index) => ({
  ...article,
  order: index,
  headings: buildHeadings(article),
  searchText: buildSearchText(article),
}));

export function getArticleBySlug(slug) {
  return documentationArticles.find((article) => article.slug === slug) || documentationArticles[0];
}

export function getCategoryById(categoryId) {
  return documentationCategories.find((category) => category.id === categoryId);
}

export function getArticlesByCategory(categoryId) {
  return documentationArticles.filter((article) => article.category === categoryId);
}

export function getAdjacentArticles(article) {
  const index = documentationArticles.findIndex((item) => item.slug === article.slug);
  return {
    previous: index > 0 ? documentationArticles[index - 1] : null,
    next: index >= 0 && index < documentationArticles.length - 1 ? documentationArticles[index + 1] : null,
  };
}

export function searchDocumentation(query) {
  const value = query.trim().toLowerCase();
  if (!value) return [];

  return documentationArticles
    .map((article) => {
      const titleMatch = article.title.toLowerCase().includes(value);
      const keywordMatch = article.keywords.some((keyword) => keyword.toLowerCase().includes(value));
      const headingMatch = article.headings.some((heading) => heading.title.toLowerCase().includes(value));
      const contentMatch = article.searchText.includes(value);

      if (!titleMatch && !keywordMatch && !headingMatch && !contentMatch) return null;

      const matchingBlock = article.sections
        .flatMap((section) => section.blocks.map((block) => getPlainTextFromBlock(block)))
        .find((text) => text.toLowerCase().includes(value));

      return {
        article,
        matchType: titleMatch ? "Title" : keywordMatch ? "Keyword" : headingMatch ? "Heading" : "Content",
        excerpt: matchingBlock || article.description,
      };
    })
    .filter(Boolean);
}
