#AI Tools Used
During the implementation of SettleWise, I used AI tools as engineering assistants rather than autonomous developers.

#Tools Used
1.ChatGPT (Architecture planning, code review, debugging, documentation)
2.Antigravity 2.0 (Code generation assistance and implementation acceleration)

All generated code was manually reviewed, tested, modified where necessary, and integrated into the final solution by me.

#Typical Prompts Used
Examples of prompts used during development:
*Design a PostgreSQL schema for a shared expense management system with membership timelines.
*Review my Prisma schema and identify missing constraints.
*Generate Express controller structure for JWT authentication.
*Review balance calculation logic for debt simplification.
*Suggest anomaly detection strategies for CSV import workflows.
*Generate React Query hooks for CRUD operations.
*Review deployment configuration for Render and Vercel.

#How AI Was Used
AI was primarily used for:
*Brainstorming architecture
*Generating boilerplate code
*Reviewing API design
*Identifying edge cases
*Explaining framework-specific issues
*Deployment troubleshooting

All business rules, anomaly handling decisions, validation policies, and testing were reviewed manually.

Cases Where AI Output Was Incorrect

Case 1: Settlement Balance Formula
AI initially suggested:
net = paid - owed + settlementsSent - settlementsReceived

After manually testing settlement scenarios, I identified that the formula produced incorrect balances.

Example:
If Rohan pays Aisha ₹1000:

*Rohan's liability should decrease.
*Aisha's receivable should decrease.

I corrected the implementation to:
net = paid - owed - settlementsSent + settlementsReceived

and re-tested settlement calculations.


Case 2: Prisma Migration Deployment Strategy
AI initially suggested deploying with:
npx prisma migrate deploy
During deployment testing, Prisma reported that the database was not managed by Prisma Migrate because the schema had been created using db push.

I identified the issue by running:
npx prisma migrate status
and modified the deployment strategy accordingly.

Case 3: Production Frontend Configuration

AI-generated frontend code assumed localhost API endpoints.
After deployment, login requests were still targeting:
http://localhost:5000

I identified this through browser developer tools and fixed the implementation to use:

VITE_API_URL

with environment-based configuration.


Verification Process

For every major feature:

1.Generate implementation.
2.Review generated code.
3.Verify business logic manually.
4.Execute API tests using Postman.
5.Test edge cases.
6.Refactor where necessary.
7.Commit only after validation.

This process ensured I remained responsible for the final codebase and behavior of the application.
