//phase 2
Decision:
Store membership history using joinedAt and leftAt.

Reason:
The assignment requires handling members joining and leaving over time.
This also enables validation of expenses against membership periods.

//phase 3
Decision:
Validate membership timelines when creating expenses.

Reason:
Members should only participate in expenses during periods they belong to the group.
This prevents former members from being charged for future expenses.