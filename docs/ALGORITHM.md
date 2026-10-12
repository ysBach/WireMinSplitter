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

A plan is a list of transfers. Each transfer goes from one payer to one receiver. The tool gives each plan a score of two numbers:

$$
\operatorname{lexmin}\,(C, B), \qquad B = \sum_{i \in U} \max(0,\, d_i - 1)
$$

- $C$: Number of transfers. The result shows it as Transactions.
- $B$: Burden penalty. Each payer in $U$ adds 1 for each transfer after its first. The result shows it as Burden penalty.
- $d_{i}$: Number of transfers that payer $i$ sends
- $U$: Payers that are not marked Preferred Multi-Payer

The tool picks the plan with the smallest $C$. If plans tie on $C$, it picks the plan with the smallest $B$. In the formulas, lexmin means this order.

Strict preference mode adds a rule: each payer in $U$ sends at most 1 transfer. Receivers have no limit. If no plan obeys this rule, the result shows a no-plan error.

## 5. Search the plans

The search builds a plan one transfer at a time. It tries every useful next transfer, depth first, and keeps the best score.

A state $S$ shows what is still open. Payer $i$ still owes $a_{i}$. Receiver $j$ still waits for $r_{j}$. Each payer also has two flags: preferred, and sent (it already sent a transfer).

A move sends $\min (a_{i},r_{j})$ from payer $i$ to receiver $j$. This settles payer $i$, receiver $j$, or both. So each move removes at least 1 person, and the search always ends.

$$
\bigl(C(S),\, B(S)\bigr) = \operatorname*{lexmin}_{(i,j)} \bigl(1 + C(S_{ij}),\; e_i + B(S_{ij})\bigr)
$$

- $S_{ij}$: State after the move from payer $i$ to receiver $j$
- $e_{i}$: 1 if payer $i$ is in $U$ and its sent flag is on, otherwise 0

An empty state $\varnothing$ has the score $(0,0)$. The search skips a move if the state after it has no valid plan. In strict preference mode, it also skips every move with $e_{i}=1$.

These shortcuts make the search faster:

- One payer or one receiver left: each open person must connect to that person. A direct formula gives $C$ and $B$ and applies the strict rule.
- Equal choices: payers are equal if their amounts and both flags match. Receivers are equal if their amounts match. The search tries equal choices only once.
- Memory: the search stores the score of each solved state and reuses it. The key is the sorted payers and the sorted receivers.
- Lower bound: let $P'$ and $R'$ be the open payers and receivers after a move. Each of them needs at least 1 more transfer. So at least $\max (|P'|,|R'|)$ more transfers are necessary.
- Pruning: the search skips a move if $1+\max (|P'|,|R'|)$ is more than the best $C$ found so far for this state. A tie stays, so $B$ can still decide.

If two moves give the same score, the search keeps the first one. It uses a fixed order: amount, then flags, then name. So the same input always gives the same plan.

## 6. Why the plan is optimal

Claim: the search returns the smallest score $(C,B)$ for the cent balances. Draw a plan as a graph. Each person is a node, and each transfer is an edge.

1. Remove cycles. Suppose some edges form a cycle (ignore their directions). Add $+\delta$ and $-\delta$ to the cycle edges in turn. Each person on the cycle gets one $+\delta$ and one $-\delta$, so no balance changes.
2. Set $\delta$ to the smallest amount on the $-\delta$ edges. Then at least 1 edge drops to 0, and the plan has fewer transfers. No payer sends more transfers, so the strict rule still holds. So an optimal plan has no cycle. Its graph is a forest.
3. Find a leaf. A forest with at least 1 edge has a leaf: a person with exactly 1 transfer. That transfer carries the leaf's full open amount. The other person's amount is at least as large. So the transfer is $\min (a_{i},r_{j})$, a move that the search tries (or an equal choice).
4. Shrink the problem. Remove that transfer. The rest of the plan settles the smaller state $S_{ij}$ with the score $(C-1,B-e_{i})$. The same argument applies to $S_{ij}$, so the search finds a score there that is at least this good. Each round removes at least 1 person, so the argument ends.
5. Check the shortcuts. Pruning skips only moves that cannot win. The other shortcuts give exact scores. So the search returns the optimal score $(C,B)$.

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
