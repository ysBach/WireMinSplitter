<!-- Generated file: edit scripts/algorithm-content.mjs, then run npm run docs:algorithm. -->

# How the algorithm works

English · [한국어](ALGORITHM.ko.md) · [日本語](ALGORITHM.ja.md) · [中文](ALGORITHM.zh.md)

The tool finds the plan with the fewest transfers. First, it computes each person's balance in whole cents. Then an exact search finds the best plan. Section 6 proves that this plan is optimal.

## 1. Check the input

- Each name must be unique and not empty. The tool applies Unicode NFC, removes white space at both ends, and keeps at most 120 code points.
- The tool reads every amount as an exact fraction. It uses no floating-point numbers for money.
- Spent must be 0 or more. The multiplier $m$ must be more than 0. The Extra Get total must equal the Extra Pay total.
- A row with Repeat $n\gt 1$ becomes $n$ people. Each name gets a number with as many digits as $n$. For example, Repeat 12 gives Team 01 to Team 12. A row with $n=1$ keeps its name.

## 2. Compute each balance

The tool first computes the exact balance $b_{i}$ of each person $i$, in cents:

$$
b_i = 100\,m\left(s_i - \frac{T}{N} + g_i - p_i\right), \qquad T = \sum_{j=1}^{N} s_j
$$

- $b_{i}$: Exact balance of person $i$ in cents. It can be a fraction.
- $s_{i},g_{i},p_{i}$: Spent, Extra Get, and Extra Pay of person $i$
- $T,N$: Total Spent and number of people
- $m$: Multiplier

$T/N$ is the equal share of the spending. A person with $b_{i}\gt 0$ gets money. A person with $b_{i}\lt 0$ pays money.

## 3. Round to whole cents

Transfers use whole cents. The tool changes each $b_{i}$ to a whole number $c_{i}$ and keeps the total at exactly 0:

1. Round each $b_{i}$ down to $\lfloor b_{i}\rfloor$, the largest whole number that is not more than $b_{i}$. For example, −33⅓ becomes −34.
2. Count the missing cents $k$ with the formula below.
3. Add 1 cent to the $k$ people with the largest remainders $b_{i}-\lfloor b_{i}\rfloor$. If remainders tie, the name that comes first in Unicode code point order gets the cent first.

$$
k = -\sum_{i=1}^{N} \lfloor b_i \rfloor = \sum_{i=1}^{N} \left(b_i - \lfloor b_i \rfloor\right), \qquad 0 \le k \lt N
$$

The $b_{i}$ add up to 0, so $k$ is the sum of the remainders. Each remainder is at least 0 and less than 1. So $k$ is a whole number and $0\le k\lt N$.

Result: the $c_{i}$ add up to exactly 0. Each $c_{i}$ differs from $b_{i}$ by less than 1 cent. Two people with the same inputs can get balances that differ by 1 cent.

A person with $c_{i}\lt 0$ is a payer. A person with $c_{i}\gt 0$ is a receiver. A person with $c_{i}=0$ takes no part in the search.

### Example

A spent 1.00. B and C spent 0. The multiplier is 1. The equal share is 33⅓ cents. All values in the table are in cents.

| Person | $b_{i}$ | $\lfloor b_{i}\rfloor$ | $b_{i}-\lfloor b_{i}\rfloor$ | $c_{i}$ |
| --- | ---: | ---: | ---: | ---: |
| A | 66⅔ | 66 | ⅔ | 67 |
| B | −33⅓ | −34 | ⅔ | −33 |
| C | −33⅓ | −34 | ⅔ | −34 |

The rounded-down values add up to −2, so $k=2$. All three remainders are ⅔. A and B come first by name, so each gets 1 cent. The plan is B → A 0.33 and C → A 0.34.

## 4. Define the best plan

A plan is a list of transfers. Each transfer goes from one payer to one receiver. The tool gives each plan a score $(C,B)$:

$$
B = \sum_{i \in U} \max(0,\, d_i - 1)
$$

- $C$: Number of transfers. The result shows it as Transactions.
- $B$: Burden penalty. Each payer in $U$ adds 1 for each transfer after its first. The result shows it as Burden penalty.
- $d_{i}$: Number of transfers that payer $i$ sends
- $U$: Payers that are not marked Preferred Multi-Payer

The tool picks the plan with the smallest $C$. If plans tie on $C$, it picks the plan with the smallest $B$.

Strict preference mode adds a rule: each payer in $U$ sends at most 1 transfer. Receivers have no limit. If no plan obeys this rule, the result shows a no-plan error.

## 5. Search the plans

The search builds a plan one transfer at a time. At each step, it does this:

1. Pick a payer and a receiver who both still have an open amount.
2. Send the smaller of the two open amounts. This settles the payer, the receiver, or both.
3. Go back to step 1 until no open amount is left. Each step settles at least 1 person, so the search always ends.

The search tries every choice at each step and keeps the plan with the best score. It counts the score as it goes. Each transfer adds 1 to $C$. A transfer also adds 1 to $B$ if its payer is in $U$ and already sent a transfer.

In strict preference mode, the search never makes a transfer that adds to $B$, so no payer in $U$ sends twice. It drops any choice that leaves no valid plan.

Four shortcuts make the search faster without changing the result:

- One payer or one receiver left: every open person must deal with that one person. The search computes the score directly and applies the strict rule.
- Equal choices: two payers are equal if they have the same open amount and the same flags (preferred, already sent). Receivers are equal if they have the same open amount. The search tries equal choices only once.
- Memory: the search saves the best score for each situation that it solves. If the same situation comes back, it reuses that score.
- Lower bound: every open payer needs at least 1 more transfer, and so does every open receiver. So the rest of the plan has at least as many transfers as the larger of these two groups. If even this minimum makes $C$ larger than the best $C$ found so far for this situation, the search skips the choice. A tie stays, so $B$ can still decide.

If two plans have the same score, the search keeps the one that comes first in a fixed order: amount, then flags, then name. So the same input always gives the same plan.

## 6. Why the plan is optimal

Claim: the search returns the smallest score $(C,B)$ for the cent balances. Draw a plan as a graph. Each person is a node, and each transfer is an edge.

1. Remove cycles. Suppose some edges form a cycle (ignore their directions). Add $+\delta$ and $-\delta$ to the cycle edges in turn. Each person on the cycle gets one $+\delta$ and one $-\delta$, so no balance changes.
2. Set $\delta$ to the smallest amount on the $-\delta$ edges. Then at least 1 edge drops to 0, and the plan has fewer transfers. No payer sends more transfers, so the strict rule still holds. So an optimal plan has no cycle. Its graph is a forest.
3. Find a leaf. A forest with at least 1 edge has a leaf: a person with exactly 1 transfer. That transfer carries the leaf's full open amount. The other person's open amount is at least as large. So the transfer sends the smaller of the two open amounts. That is a choice that the search tries (or an equal choice).
4. Shrink the problem. Remove that transfer. The rest of the plan settles the amounts that are still open. Its score is the full score minus the share of the removed transfer. The same argument applies to this smaller problem, so the search finds a score there that is at least this good. Each round removes at least 1 person, so the argument ends.
5. Check the shortcuts. The lower bound skips only choices that cannot win. The other shortcuts give exact scores. So the search returns the smallest score $(C,B)$.

Scope: the plan is optimal for the cent balances $c_{i}$, among plans in which each transfer goes from a payer to a receiver. The tool makes no claim about other kinds of plan. Other plans can have the same score.

## 7. Two plans with a multiplier

- If $m=1$, the tool makes one plan.
- If $m\ne 1$, the tool makes two plans. The Multiplied Settlement Plan uses $m$. The Original Settlement Plan uses $m=1$.
- The tool computes each plan separately. In strict preference mode, one plan can show a no-plan error while the other shows a plan.
- The rounding controls change only the numbers on screen. A unit other than 0.01 shows approximate values. Use 0.01 for exact payment instructions.

## 8. Limits

- The run time can grow exponentially with the number of payers and receivers.
- The search runs in a background worker in your browser. It works offline after your browser caches the app.
- The solver has no time limit and no limit on the number of people. Use Cancel to stop a long search.
- Cancel, or a memory or stack failure, is not a no-plan result. It does not show whether a plan exists.
- Only a search that completes returns the optimal plan for the cent balances.

[View the solver source code (JavaScript)](../web/solver.js)
