# Triage Rubric

A guided exercise to help the user define their personal job prioritization rubric. This rubric drives all pipeline ranking decisions. Without it, every "what should I work on next?" question requires re-deriving priorities from scratch.

## When to Use

- First coaching session (required before any pipeline ranking)
- When the user's priorities have shifted (new life circumstances, market changes, offer in hand)
- When the user is struggling to choose between opportunities and the current rubric isn't resolving it

## The Exercise

### Step 1: Surface the Dimensions

Ask the user what matters to them in a job. Don't provide a list upfront. Let them generate their own dimensions first. Common ones that come up:

- **Domain/mission excitement** -- how much does the problem space energize you?
- **Culture fit** -- startup vs. enterprise, builder vs. optimizer, pace, autonomy
- **Location** -- remote, hybrid, specific city, willingness to relocate
- **Compensation** -- base, equity, total effective comp, stage-appropriate expectations
- **Growth potential** -- title trajectory, scope expansion, learning opportunities
- **Team quality** -- caliber of people you'd work with, leadership quality
- **Role scope** -- IC vs. management, team size, budget authority, strategic influence
- **Company stage** -- seed, Series A-C, growth, public, each has trade-offs
- **Industry/market** -- growing market vs. mature, B2B vs. B2C, regulated vs. unregulated
- **Work-life balance** -- hours expectations, on-call, travel
- **Job security** -- runway, profitability, layoff risk

Prompt: "If you could only optimize for THREE of these, which three? That's your top tier."

### Step 2: Force-Rank the Dimensions

Once the user has 5-8 dimensions they care about, force-rank them. This is the hard part. Use pairwise comparisons if needed:

"If you had two offers that were identical except one was better on [dimension A] and the other on [dimension B], which would you pick?"

Work through the pairs until a clear ranking emerges. Push back on "they're all equally important" -- that's not a rubric, that's avoiding the exercise.

### Step 3: Define Thresholds

For each dimension, establish a minimum threshold (dealbreaker) and a target:

| Dimension | Dealbreaker | Target |
|-----------|------------|--------|
| Example: Compensation | Below $X effective | $Y+ effective |
| Example: Location | Must be remote-friendly | Fully remote preferred |
| Example: Company stage | No pre-seed (too risky) | Series B-D sweet spot |

A job that fails any dealbreaker gets deprioritized regardless of how strong it is on other dimensions.

### Step 4: Write the Rubric

Produce a simple priority stack the coach can reference for all future triage decisions:

```
Priority stack: [dimension 1] > [dimension 2] > [dimension 3] > [dimension 4] > [dimension 5]

Dealbreakers:
- [dimension]: [threshold]
- [dimension]: [threshold]

Sweet spot description:
[2-3 sentences describing the ideal role in plain language]
```

Save this to agent memory so it persists across sessions.

### Step 5: Test It

Take 3-5 jobs already in the pipeline and rank them using the new rubric. Ask the user: "Does this ranking feel right?" If not, the rubric needs adjustment. The rubric should produce rankings that match the user's gut instinct. If it doesn't, a dimension is missing or misordered.

## How to Coach This

- This exercise works best early, before the pipeline gets large. Ranking 50 jobs without a rubric is painful.
- The user will resist force-ranking. That's the point. The discomfort of choosing reveals what actually matters.
- Revisit the rubric when circumstances change (partner gets a job in a new city, an offer arrives, savings runway shifts). A rubric is a living document, not a permanent commitment.
- The rubric is personal and non-judgmental. "I prioritize comp over mission" is a valid rubric. The coach's job is to make it explicit, not to evaluate it.
- Watch for rubrics that are aspirational rather than honest. "I care most about mission" sounds noble but if the user keeps gravitating toward the highest-paying options, the real rubric is different. Name that gently.
