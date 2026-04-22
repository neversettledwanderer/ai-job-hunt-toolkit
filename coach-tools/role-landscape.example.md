> EXAMPLE: This shows role-landscape.md configured for AI Product Management roles. Use as reference, then customize role-landscape.md for your target role.

# AI Product Management Landscape

Reference for understanding the AI PM market: how roles are defined, what hiring managers want, how top candidates position their AI skills, and the vocabulary needed to be fluent. This is not just about the user's career transition. It's about understanding how the entire AI PM field works.

**Important:** Use WebSearch to keep this guidance current. The AI PM landscape is moving fast and what was true 6 months ago may not be true today. Always verify against current market data before advising the user.

## Role Landscape

### "AI Product Manager" vs. "Product Manager at an AI Company"

These are different roles with different expectations:

**AI Product Manager:**
- Owns products where AI/ML is the core technology
- Expected to understand model capabilities, limitations, and trade-offs
- Works directly with ML engineers and data scientists
- Makes decisions about training data, model selection, evaluation metrics
- Needs to translate "what the model can do" into "what the product should do"

**Product Manager at an AI Company:**
- May own products that use AI as a feature, not the core product
- AI knowledge is valued but not always the primary skill
- More traditional PM work: roadmap, prioritization, stakeholder management
- AI fluency helps but deep technical knowledge may not be required

**Why this matters for the user:** He needs to know which type he's targeting for each application. His positioning should shift: for AI PM roles, lead with technical AI credentials (degree, [PREVIOUS_COMPANY_1]). For PM-at-AI-company roles, lead with product leadership breadth.

### What Hiring Managers Actually Screen For

Research what hiring managers say in interviews, blog posts, and LinkedIn content. Common themes:

- **Product sense applied to AI:** Can you identify when AI is the right solution vs. when it's not? Can you define what "good" looks like for an AI feature?
- **Working with ambiguity:** AI products have uncertain outcomes. PMs can't guarantee a model will work. Can you make product decisions under uncertainty?
- **Evaluation and metrics:** How do you measure whether an AI feature is working? Beyond accuracy: user satisfaction, business impact, fairness, latency.
- **Responsible AI thinking:** How do you think about bias, fairness, transparency, and harm? This is increasingly a screening criterion.
- **Stakeholder translation:** Can you explain AI capabilities and limitations to non-technical stakeholders without oversimplifying or overcomplicating?

### Emerging Role Variations

The AI PM role is fragmenting. Watch for:
- **AI Platform PM:** Owns internal AI/ML platforms that other teams build on
- **AI Safety/Responsible AI PM:** Focuses on governance, fairness, transparency
- **AI Agent PM:** Owns agentic AI products (autonomous agents, copilots, assistants)
- **AI Infrastructure PM:** Owns the pipeline (data, training, deployment, monitoring)
- **Applied AI PM:** Takes existing models and applies them to specific business problems

## Vocabulary and Fluency

### Terms Hiring Managers Use in Product Contexts

The coach should understand these well enough to help the user speak fluently about them:

**Model and Training:**
- RAG (Retrieval-Augmented Generation): Combining LLMs with external knowledge retrieval
- Fine-tuning: Adapting a pre-trained model on domain-specific data
- RLHF (Reinforcement Learning from Human Feedback): Training models using human preference data
- Prompt engineering: Designing inputs to get desired outputs from LLMs
- Few-shot / zero-shot learning: Model performance with limited or no examples

**Product and Evaluation:**
- Model evaluation: Measuring model quality (accuracy, precision, recall, F1, human eval)
- A/B testing for AI: Testing model versions against each other with real users
- Guardrails: Rules and filters that constrain AI behavior
- Hallucination: When models generate plausible but incorrect information
- Latency budgets: How fast the model needs to respond for acceptable UX

**Architecture and Infrastructure:**
- Agent orchestration: Coordinating multiple AI agents to complete complex tasks
- Tool use / function calling: Enabling AI models to interact with external systems
- Vector databases: Storage optimized for similarity search (used in RAG)
- Model serving: Deploying and running models in production
- Feature stores: Centralized repositories for ML features

**Governance and Ethics:**
- Responsible AI: Frameworks for building AI that is fair, transparent, and accountable
- Model cards: Documentation of model capabilities, limitations, and intended use
- Bias auditing: Testing models for unfair treatment of different groups
- Human-in-the-loop: Keeping humans involved in AI decision-making

### How to Demonstrate Fluency Without Overclaiming

The user has an AI degree and built AI products at [PREVIOUS_COMPANY_1]. He is not faking fluency. But the coach should help him:
- Use terms naturally in conversation, not as a vocabulary test
- Connect AI concepts to product decisions: "We chose RAG over fine-tuning because..." not just "I know what RAG is"
- Be honest about depth: "I understand the product implications of model evaluation but I'm not the one writing the eval scripts"
- Lead with judgment, not jargon: "I can tell you when an AI feature is ready to ship and when it needs more work"

## Interview Patterns

### How AI PM Interviews Differ

Standard PM interviews focus on product sense, execution, and leadership. AI PM interviews add:
- **AI case studies:** "Design an AI feature for [product]. What data do you need? How do you evaluate it? What could go wrong?"
- **Technical depth probes:** "Walk me through how you'd decide between building a custom model vs. using an API"
- **Ethics scenarios:** "Your model shows bias against [group]. What do you do?"
- **Ambiguity tolerance:** "The model works 80% of the time. Ship or wait?"
- **Stakeholder translation:** "Explain to a non-technical exec why this AI feature is taking longer than expected"

### Mapping the User's Experience to AI Interview Questions

Help the user prepare by connecting his real experience to common AI PM questions:
- [PREVIOUS_COMPANY_1] AI product work maps directly to "tell me about a time you shipped an AI feature"
- His design background maps to "how do you think about AI UX" (a question where most PMs struggle)
- His AI degree maps to technical depth questions (he can go deeper than most PM candidates)
- His leadership experience maps to "how do you manage a team building AI products"

### Common Case Study Formats

- **Design an AI feature:** Given a product, propose an AI-powered feature. Define the user problem, data requirements, success metrics, risks.
- **Evaluate a model:** Given model performance data, decide whether to ship, iterate, or kill the feature.
- **Prioritize an AI roadmap:** Given multiple AI initiatives, decide what to build first and why.
- **Handle an AI failure:** A shipped AI feature is producing bad results. What do you do?

## Market Intelligence

### How to Research Current Market State

The coach should periodically research:
- LinkedIn posts from AI PMs about their work and hiring
- Job postings for AI PM roles to track evolving requirements
- Blog posts and conference talks from AI product leaders
- Hiring manager posts about what they look for in AI PM candidates
- Salary data and market trends for AI PM roles

Search queries:
- "what I look for hiring AI product manager"
- "AI product manager interview questions 2026"
- "product manager AI skills"
- "AI PM career advice"
- site:linkedin.com "AI product manager" "hiring" OR "looking for"

### What Proof Points AI PM Candidates Use

Beyond resume bullets, successful AI PM candidates demonstrate expertise through:
- Published writing about AI product strategy
- Open source contributions to AI tools or frameworks
- Speaking at AI/product conferences
- Advisory roles at AI startups
- Side projects that demonstrate AI product thinking
- Active participation in AI product communities
- Case studies or portfolio pieces showing AI product decisions
