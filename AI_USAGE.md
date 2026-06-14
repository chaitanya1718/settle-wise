
//PHASE 2
Tool:
Antigravity 2.0

Task:
Generate authentication and group management modules.

Issue:
Suggested hardcoded JWT secret.

Fix:
Moved secret to environment variables and excluded .env from version control.


//phase 3
Tool:
Antigravity 2.0

Task:
Expense Engine generation

Issue:
Suggested rejecting all non-EQUAL split types.

Problem:
Assignment requires support for multiple split types.

Fix:
Added extensible service architecture with placeholders for EXACT, PERCENTAGE, and SHARES calculations.

//phase 4
Tool:
Antigravity 2.0

Task:
Balance Engine generation.

Issue:
Initial algorithm ignored settlement records.

Problem:
Balances would remain unchanged after debt repayment.

Fix:
Included settlements in the net balance calculation formula.