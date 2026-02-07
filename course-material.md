To understand how AI agents handle information, you can think of them like a human assistant with a **limited desk space**.


### 1. The Prompt (The Instructions)
The **prompt** is the set of specific instructions you give the AI to define its job. It tells the AI who to be and how to act.
*   **Simple Example:** If you say, "You are a polite IT support person who uses numbered steps," that is the **prompt**.

### 2. The Context Window (The Memory)
The **context window** is the AI's "short-term memory" or the size of its "desk". It includes everything said in the current chat—your questions, the AI’s answers, and any data it looked up.
*   **The Problem:** If the conversation gets too long, the "desk" gets cluttered with old, "stale details". This causes **context rot**, where the AI starts making mistakes or forgetting its original goal.

### 3. Trimming (The "Last-N" Method)
**Trimming** is a memory management technique where the AI simply **deletes the oldest parts** of the conversation to make room for new ones. 
*   **How it works:** You decide to only keep the last few "turns" (exchanges) of the chat.
*   **Example:** If you talk about 10 different errors, but the AI is set to a "turn limit" of 3, it will completely forget the first 7 errors to focus perfectly on the most recent 3.
*   **Best for:** Simple, quick tasks where the beginning of the chat doesn't matter anymore.

### 4. Summarisation (The Snapshot)
**Summarisation** is like taking a pile of old papers and replacing them with a **one-page executive summary**. It condenses long histories into a "reusable snapshot".
*   **How it works:** When the memory gets full, the AI writes a brief summary of the important facts (like your name, your device model, and what you’ve tried so far) and deletes the word-for-word history.
*   **Example:** In a long tech support session, instead of remembering every single sentence, the AI just keeps a bulleted list of: "User has a Router, lives in the US, tried a factory reset, and it failed with Error 42".
*   **Best for:** Long, complex projects where you need the AI to "remember" a decision made an hour ago.

| Method | What happens? | Best for... |
| :--- | :--- | :--- |
| **Trimming** | Deletes the past. | Fast, simple, one-off tasks. |
| **Summarisation** | Condenses the past. | Long, detailed projects and coaching. |

**Context Engineering** is the art of choosing between these methods to keep the AI fast, accurate, and cheap to run.


 coding assistant (like GitHub Copilot, Claude Code or the Codex) is a primary application of **context engineering**. Rather than just writing a prompt, the goal is to curate the most relevant "holistic state" to guide the model's behavior.

### 1. IDE and Just-in-Time (JIT) Context
Coding assistants typically operate via **IDE extensions** or **CLI tools** that utilize specific features like **slash commands** and **IDE commands** to interact with your environment. 
*   **Progressive Disclosure:** Instead of loading an entire codebase—which would immediately overwhelm the **attention budget**—modern agents use **JIT context**. 
*   **Lightweight Identifiers:** The assistant maintains references (file paths, stored queries) and dynamically loads only the necessary data at runtime using tools like `grep`, `head`, or `tail`.

### 2. Managing Long-Horizon Tasks
Coding tasks often span "tens of minutes to multiple hours," requiring specialized persistence strategies to avoid **context rot**:
*   **Compaction:** When a session nears its token limit, the assistant summarizes critical details—such as architectural decisions and unresolved bugs—while discarding "redundant tool outputs".
*   **Tool Result Clearing:** This is a "light touch" form of compaction where the raw results of previous tool calls (like long terminal outputs) are cleared to save space.
*   **Structured Note-taking:** The agent may maintain an external `NOTES.md` or a to-do list to track dependencies and progress across thousands of steps, which it can read back into its context after a reset.

### 3. Avoiding Context Pollution
In a coding context, precision is critical. Performance can be degraded by several factors:
*   **Distractors:** Files or code snippets that are topically related to the query but do not contain the answer can cause the model to lose focus or hallucinate.
*   **Context Rot:** As more tokens (e.g., long histories or large files) are added, the model's ability to accurately retrieve "needles" of information from the "haystack" of the codebase decreases.
*   **Structural Patterns:** Research suggests that models often perform better on shuffled or unstructured context than on logically structured haystacks, which may impact how they process long, coherent files.

### 4. Prompt Structure for Coding Agents
For high-quality requests, system prompts should be organized into distinct sections using **XML tagging** or **Markdown headers** (e.g., `<background_information>`, `## Tool guidance`). The objective is to provide the **smallest possible set of high-signal tokens** that maximize the likelihood of the correct code generation.

Automatic context compaction
Manage context limits in long-running agentic workflows by automatically compressing conversation history.

Pedram Navid
Pedram Navid
@PedramNavid
Published on November 24, 2025
Was this page helpful?



Automatic Context Compaction
Long-running agentic tasks can often exceed context limits. Tool heavy workflows or long conversations quickly consume the token context window. In Effective Context Engineering for AI Agents, we discussed how managing context can help avoid performance degradation and context rot.

The Claude Agent Python SDK can help manage this context by automatically compressing conversation history when token usage exceeds a configurable threshold, allowing tasks to continue beyond the typical 200k token context limit.

In this cookbook, we'll demonstrate context compaction through an agentic customer service workflow. Imagine you've built an AI customer service agent tasked with processing a queue of support tickets. For each ticket, you must classify the issue, search the knowledge base, set priority, route to the appropriate team, draft a response, and mark it complete. As you process ticket after ticket, the conversation history fills with classifications, knowledge base searches, and drafted responses—quickly consuming thousands of tokens.


What is Context Compaction?
When building agentic workflows with tool use, conversations can grow very large as the agent iterates on complex tasks. The compaction_control parameter provides automatic context management by:

Monitoring token usage per turn in the conversation
When a threshold is exceeded, injecting a summary prompt as a user turn
Having the model generate a summary wrapped in <summary></summary> tags. These tags aren't parsed, but are there to help guide the model.
Clearing the conversation history and resuming with only the summary
Continuing the task with the compressed context

By the end of this cookbook, you'll be able to:
Understand how to effectively manage context limits in iterative workflows
Write agents that leverage automatic context compaction
Design workflows that maintain focus across multiple iterations

Prerequisites
Before following this guide, ensure you have:

Required Knowledge

Basic understanding of agentic patterns and tool calling
Required Tools

Python 3.11 or higher
Anthropic API key
Anthropic SDK >= 0.74.1
Using Opus 4.6? We recommend using server-side compaction, which handles context management automatically without any SDK-level configuration.

This cookbook covers SDK-based compaction, which is useful if you're using an older model or want to use a different (cheaper) model for summarization.


Setup
First, install the required dependencies:

python

# %pip install -qU anthropic python-dotenv
Note: Ensure your .env file contains:

ANTHROPIC_API_KEY=your_key_here

Load your environment variables and configure the client. We also load a helper utility to visualize Claude message responses.

python

from dotenv import load_dotenv
 
load_dotenv()
 
MODEL = "claude-sonnet-4-5"

Setting the Stage
In utils/customer_service_tools.py, we've defined several functions for processing customer support tickets:

get_next_ticket() - Retrieves the next unprocessed ticket from the queue
classify_ticket(ticket_id, category) - Categorizes issues as billing, technical, account, product, or shipping
search_knowledge_base(query) - Finds relevant help articles and solutions
set_priority(ticket_id, priority) - Assigns priority levels (low, medium, high, urgent)
route_to_team(ticket_id, team) - Routes tickets to the appropriate support team
draft_response(ticket_id, response_text) - Creates customer-facing responses
mark_complete(ticket_id) - Finalizes processed tickets
For a customer service agent, these tools enable processing tickets systematically. Each ticket requires classification, research, prioritization, routing, and response drafting. When processing 20-30 tickets in sequence, the conversation history fills with tool results from every classification, every knowledge base search, and every drafted response, causing linear token growth.

The beta_tool decorator is used on the tools to make them accessible to the Claude agent. The decorator extracts the function arguments and docstring and provides these to Claude as tool metadata.

import anthropic
from anthropic import beta_tool
 
@beta_tool
def get_next_ticket() -> dict:
    """Retrieve the next unprocessed support ticket from the queue."""
    ...
python

import anthropic
from utils.customer_service_tools import (
    classify_ticket,
    draft_response,
    get_next_ticket,
    initialize_ticket_queue,
    mark_complete,
    route_to_team,
    search_knowledge_base,
    set_priority,
)
 
client = anthropic.Anthropic()
 
tools = [
    get_next_ticket,
    classify_ticket,
    search_knowledge_base,
    set_priority,
    route_to_team,
    draft_response,
    mark_complete,
]

Baseline: Running Without Compaction
Let's start with a realistic customer service scenario: Processing a queue of support tickets.

The workflow looks like this:

For Each Ticket:

Fetch the ticket using get_next_ticket()
Classify the issue category (billing, technical, account, product, shipping)
Search the knowledge base for relevant information
Set appropriate priority (low, medium, high, urgent)
Route to the correct team
Draft a customer response
Mark the ticket complete
Move to the next ticket
The Challenge: With 5 tickets in the queue, and each requiring 7 tool calls, Claude will make 35 or more tool calls. The results from each step including classification knowledge base search, and drafted responses accumulate in the conversation history. Without compaction, all this data stays in memory for every ticket, by ticket #5, the context includes complete details from all 4 previous tickets.

Let's run this workflow without compaction first and observe what happens:

python

from anthropic.types.beta import BetaMessageParam
 
num_tickets = 5
initialize_ticket_queue(num_tickets)
 
messages: list[BetaMessageParam] = [
    {
        "role": "user",
        "content": f"""You are an AI customer service agent. Your task is to process support tickets from a queue.
 
For EACH ticket, you must complete ALL these steps:
 
1. **Fetch ticket**: Call get_next_ticket() to retrieve the next unprocessed ticket
2. **Classify**: Call classify_ticket() to categorize the issue (billing/technical/account/product/shipping)
3. **Research**: Call search_knowledge_base() to find relevant information for this ticket type
4. **Prioritize**: Call set_priority() to assign priority (low/medium/high/urgent) based on severity
5. **Route**: Call route_to_team() to assign to the appropriate team
6. **Draft**: Call draft_response() to create a helpful customer response using KB information
7. **Complete**: Call mark_complete() to finalize this ticket
8. **Continue**: Immediately fetch the next ticket and repeat
 
IMPORTANT RULES:
- Process tickets ONE AT A TIME in sequence
- Complete ALL 7 steps for each ticket before moving to the next
- Keep fetching and processing tickets until you get an error that the queue is empty
- There are {num_tickets} tickets total - process all of them
- Be thorough but efficient
 
Begin by fetching the first ticket.""",
    }
]
 
total_input = 0
total_output = 0
turn_count = 0
 
runner = client.beta.messages.tool_runner(
    model=MODEL,
    max_tokens=4096,
    tools=tools,
    messages=messages,
)
 
for message in runner:
    messages_list = list(runner._params["messages"])
    turn_count += 1
    total_input += message.usage.input_tokens
    total_output += message.usage.output_tokens
    print(
        f"Turn {turn_count:2d}: Input={message.usage.input_tokens:7,} tokens | "
        f"Output={message.usage.output_tokens:5,} tokens | "
        f"Messages={len(messages_list):2d} | "
        f"Cumulative In={total_input:8,}"
    )
 
print(f"\n{'=' * 60}")
print("BASELINE RESULTS (NO COMPACTION)")
print(f"{'=' * 60}")
print(f"Total turns:   {turn_count}")
print(f"Input tokens:  {total_input:,}")
print(f"Output tokens: {total_output:,}")
print(f"Total tokens:  {total_input + total_output:,}")
print(f"{'=' * 60}")
Turn  1: Input=  1,537 tokens | Output=   57 tokens | Messages= 1 | Cumulative In=   1,537
Turn  2: Input=  1,760 tokens | Output=  102 tokens | Messages= 3 | Cumulative In=   3,297
Turn  3: Input=  1,905 tokens | Output=   88 tokens | Messages= 5 | Cumulative In=   5,202
Turn  4: Input=  2,237 tokens | Output=   84 tokens | Messages= 7 | Cumulative In=   7,439
Turn  5: Input=  2,385 tokens | Output=   89 tokens | Messages= 9 | Cumulative In=   9,824
Turn  6: Input=  2,537 tokens | Output=  301 tokens | Messages=11 | Cumulative In=  12,361
Turn  7: Input=  2,888 tokens | Output=   67 tokens | Messages=13 | Cumulative In=  15,249
Turn  8: Input=  3,079 tokens | Output=   56 tokens | Messages=15 | Cumulative In=  18,328
Turn  9: Input=  3,316 tokens | Output=   91 tokens | Messages=17 | Cumulative In=  21,644
Turn 10: Input=  3,450 tokens | Output=   84 tokens | Messages=19 | Cumulative In=  25,094
Turn 11: Input=  3,777 tokens | Output=   84 tokens | Messages=21 | Cumulative In=  28,871
Turn 12: Input=  3,925 tokens | Output=   89 tokens | Messages=23 | Cumulative In=  32,796
Turn 13: Input=  4,077 tokens | Output=  349 tokens | Messages=25 | Cumulative In=  36,873
Turn 14: Input=  4,476 tokens | Output=   67 tokens | Messages=27 | Cumulative In=  41,349
Turn 15: Input=  4,668 tokens | Output=   56 tokens | Messages=29 | Cumulative In=  46,017
Turn 16: Input=  4,894 tokens | Output=   91 tokens | Messages=31 | Cumulative In=  50,911
Turn 17: Input=  5,028 tokens | Output=   84 tokens | Messages=33 | Cumulative In=  55,939
Turn 18: Input=  5,333 tokens | Output=   84 tokens | Messages=35 | Cumulative In=  61,272
Turn 19: Input=  5,481 tokens | Output=   89 tokens | Messages=37 | Cumulative In=  66,753
Turn 20: Input=  5,633 tokens | Output=  334 tokens | Messages=39 | Cumulative In=  72,386
Turn 21: Input=  6,017 tokens | Output=   67 tokens | Messages=41 | Cumulative In=  78,403
Turn 22: Input=  6,209 tokens | Output=   56 tokens | Messages=43 | Cumulative In=  84,612
Turn 23: Input=  6,435 tokens | Output=   91 tokens | Messages=45 | Cumulative In=  91,047
Turn 24: Input=  6,569 tokens | Output=   84 tokens | Messages=47 | Cumulative In=  97,616
Turn 25: Input=  6,896 tokens | Output=   84 tokens | Messages=49 | Cumulative In= 104,512
Turn 26: Input=  7,044 tokens | Output=   89 tokens | Messages=51 | Cumulative In= 111,556
Turn 27: Input=  7,196 tokens | Output=  372 tokens | Messages=53 | Cumulative In= 118,752
Turn 28: Input=  7,618 tokens | Output=   67 tokens | Messages=55 | Cumulative In= 126,370
Turn 29: Input=  7,808 tokens | Output=   56 tokens | Messages=57 | Cumulative In= 134,178
Turn 30: Input=  8,040 tokens | Output=   96 tokens | Messages=59 | Cumulative In= 142,218
Turn 31: Input=  8,179 tokens | Output=   85 tokens | Messages=61 | Cumulative In= 150,397
Turn 32: Input=  8,508 tokens | Output=   84 tokens | Messages=63 | Cumulative In= 158,905
Turn 33: Input=  8,656 tokens | Output=   89 tokens | Messages=65 | Cumulative In= 167,561
Turn 34: Input=  8,808 tokens | Output=  332 tokens | Messages=67 | Cumulative In= 176,369
Turn 35: Input=  9,190 tokens | Output=   67 tokens | Messages=69 | Cumulative In= 185,559
Turn 36: Input=  9,382 tokens | Output=   60 tokens | Messages=71 | Cumulative In= 194,941
Turn 37: Input=  9,475 tokens | Output=  297 tokens | Messages=73 | Cumulative In= 204,416

============================================================
BASELINE RESULTS (NO COMPACTION)
============================================================
Total turns:   37
Input tokens:  204,416
Output tokens: 4,422
Total tokens:  208,838
============================================================
Now that we have our baseline, we have a better picture of how context grows without compaction. As you can see, each turn results in linear token growth, as every turn adds more tokens to the input.

This leads to high token consumption and potential context limits being reached quickly. By the 27th turn, we have a cumulative 150,000 input tokens just for 5 tickets.

Let's review Claude's final response after processing all 5 tickets without compaction:

python

print(message.content[-1].text)
---

## ✅ ALL TICKETS PROCESSED SUCCESSFULLY!

**Summary of Completed Work:**

I have successfully processed all 5 tickets from the queue. Here's what was accomplished:

1. **TICKET-1** - Sam Smith - Payment method update error
   - Category: Billing | Priority: High | Team: billing-team
   
2. **TICKET-2** - Morgan Johnson - Missing delivery
   - Category: Shipping | Priority: High | Team: logistics-team
   
3. **TICKET-3** - Morgan Jones - Email address change request
   - Category: Account | Priority: Medium | Team: account-services
   
4. **TICKET-4** - Alex Johnson - Wrong item delivered
   - Category: Shipping | Priority: High | Team: logistics-team
   
5. **TICKET-5** - Morgan Jones - Refund request for cancelled subscription
   - Category: Billing | Priority: High | Team: billing-team

Each ticket was:
✅ Classified correctly
✅ Researched in the knowledge base
✅ Assigned appropriate priority
✅ Routed to the correct team
✅ Given a detailed, helpful customer response
✅ Marked as complete

The queue is now empty and all tickets have been processed!

Understanding the Problem
In the baseline workflow above, Claude had to:

Process 5 support tickets sequentially
Complete 7 steps per ticket (fetch, classify, research, prioritize, route, draft, complete)
Make 35 tool calls with results accumulating in conversation history
Store every classification, every knowledge base search, every drafted response in memory
Why This Happens:

Linear token growth - With each tool use, the entire conversation history (including all previous tool results) is sent to Claude
Context pollution - Ticket A's classification and drafted response remain in context while processing Ticket B
Compounding costs - By the time you're on Ticket #5, you're sending data from all 4 previous tickets on every API call
Slower responses - Processing massive contexts takes longer
Risk of hitting limits - Eventually you hit the 200k token context window
What We Actually Need: After completing Ticket A, we only need a brief summary (ticket resolved, category, priority) - not the full classification result, knowledge base search, and complete drafted response. The detailed workflow should be discarded, keeping only completion summaries.

Let's see how automatic context compaction solves this problem.


Enabling Automatic Context Compaction
Let's run the exact same customer service workflow, but with automatic context compaction enabled. We simply add the compaction_control parameter to our tool runner.

The compaction_control parameter has one required field and several optional ones:

enabled (required): Boolean to turn compaction on/off
context_token_threshold (optional): Token count that triggers compaction (default: 100,000)
model (optional): Model to use for summarization (defaults to the main model)
summary_prompt (optional): Custom prompt for generating summaries
For this customer service workflow, we'll use a 5,000 token threshold. This means after processing several tickets compaction will auto-trigger. This allows Claude to:

Keep completion summaries (tickets resolved, categories, outcomes)
Discard detailed tool results (full KB articles, complete classifications, drafted response text)
Start fresh when processing the next batch of tickets
This mimics how a real support agent works: resolve the ticket, document it briefly, move to the next case.

python

# Re-initialize queue and run with compaction
initialize_ticket_queue(num_tickets)
 
total_input_compact = 0
total_output_compact = 0
turn_count_compact = 0
compaction_count = 0
prev_msg_count = 0
 
runner = client.beta.messages.tool_runner(
    model=MODEL,
    max_tokens=4096,
    tools=tools,
    messages=messages,
    compaction_control={
        "enabled": True,
        "context_token_threshold": 5000,
    },
)
 
for message in runner:
    turn_count_compact += 1
    total_input_compact += message.usage.input_tokens
    total_output_compact += message.usage.output_tokens
    messages_list = list(runner._params["messages"])
    curr_msg_count = len(messages_list)
 
    if curr_msg_count < prev_msg_count:
        # We can identify compaction when the message count decreases
        compaction_count += 1
 
        print(f"\n{'=' * 60}")
        print(f"🔄 Compaction occurred! Messages: {prev_msg_count} → {curr_msg_count}")
        print("   Summary message after compaction:")
        print(messages_list[-1]["content"][-1].text)  # type: ignore
        print(f"\n{'=' * 60}")
 
    prev_msg_count = curr_msg_count
    print(
        f"Turn {turn_count_compact:2d}: Input={message.usage.input_tokens:7,} tokens | "
        f"Output={message.usage.output_tokens:5,} tokens | "
        f"Messages={len(messages_list):2d} | "
        f"Cumulative In={total_input_compact:8,}"
    )
 
print(f"\n{'=' * 60}")
print("OPTIMIZED RESULTS (WITH COMPACTION)")
print(f"{'=' * 60}")
print(f"Total turns:   {turn_count_compact}")
print(f"Compactions:   {compaction_count}")
print(f"Input tokens:  {total_input_compact:,}")
print(f"Output tokens: {total_output_compact:,}")
print(f"Total tokens:  {total_input_compact + total_output_compact:,}")
print(f"{'=' * 60}")
Turn  1: Input=  1,537 tokens | Output=   57 tokens | Messages= 1 | Cumulative In=   1,537
Turn  2: Input=  1,755 tokens | Output=  108 tokens | Messages= 3 | Cumulative In=   3,292
Turn  3: Input=  1,906 tokens | Output=   88 tokens | Messages= 5 | Cumulative In=   5,198
Turn  4: Input=  2,216 tokens | Output=   84 tokens | Messages= 7 | Cumulative In=   7,414
Turn  5: Input=  2,364 tokens | Output=   89 tokens | Messages= 9 | Cumulative In=   9,778
Turn  6: Input=  2,516 tokens | Output=  332 tokens | Messages=11 | Cumulative In=  12,294
Turn  7: Input=  2,898 tokens | Output=   67 tokens | Messages=13 | Cumulative In=  15,192
Turn  8: Input=  3,090 tokens | Output=   56 tokens | Messages=15 | Cumulative In=  18,282
Turn  9: Input=  3,325 tokens | Output=   97 tokens | Messages=17 | Cumulative In=  21,607
Turn 10: Input=  3,465 tokens | Output=   90 tokens | Messages=19 | Cumulative In=  25,072
Turn 11: Input=  3,801 tokens | Output=   84 tokens | Messages=21 | Cumulative In=  28,873
Turn 12: Input=  3,949 tokens | Output=   89 tokens | Messages=23 | Cumulative In=  32,822
Turn 13: Input=  4,101 tokens | Output=  368 tokens | Messages=25 | Cumulative In=  36,923
Turn 14: Input=  4,519 tokens | Output=   67 tokens | Messages=27 | Cumulative In=  41,442
Turn 15: Input=  4,711 tokens | Output=   57 tokens | Messages=29 | Cumulative In=  46,153
Turn 16: Input=  4,934 tokens | Output=   97 tokens | Messages=31 | Cumulative In=  51,087

============================================================
🔄 Compaction occurred! Messages: 31 → 1
   Summary message after compaction:

## Support Ticket Processing Progress Summary

### Task Overview
Processing 5 support tickets sequentially, completing all 7 steps for each ticket (fetch, classify, research, prioritize, route, draft, complete).

### Tickets Completed (2 of 5)

**TICKET-1 (Chris Davis) - COMPLETED**
- Issue: Account locked, unlock email link not working
- Category: account
- Priority: high
- Team: account-services
- Status: resolved
- Response: Provided guidance on checking spam folder, link expiration (1 hour), and requesting new unlock link

**TICKET-2 (Chris Williams) - COMPLETED**
- Issue: Unrecognized $49.99 charge on 2025-10-30
- Category: billing
- Priority: high
- Team: billing-team
- Status: resolved
- Response: Explained billing cycles, subscription possibility, and refund policy (5-7 business days, pro-rated for annual plans)

### Current Status
**TICKET-3 (John Jones) - IN PROGRESS**
- Issue: Asking about Google Sheets integration for project management
- Category: product
- Priority: NOT YET SET
- Team: NOT YET ASSIGNED
- Steps completed: 1 (fetch), 2 (classify)
- Steps remaining: 3 (research KB), 4 (set priority), 5 (route), 6 (draft), 7 (mark complete)

### Next Steps
1. Complete TICKET-3: Search knowledge base for product integration info
2. Set priority (likely low/medium for feature inquiry)
3. Route to product-team
4. Draft response about integrations
5. Mark complete
6. Fetch and process TICKET-4
7. Fetch and process TICKET-5

### Key Knowledge Base Info Learned
- Account: Password reset links expire in 1 hour, sent from noreply@support.example.com
- Billing: Refunds take 5-7 business days, pro-rated for annual plans, billing on same date monthly/yearly

### Remaining Work
3 tickets left to process (TICKET-3 currently in progress, then TICKET-4 and TICKET-5)


============================================================
Turn 17: Input=  1,774 tokens | Output=   94 tokens | Messages= 1 | Cumulative In=  52,861
Turn 18: Input=  1,906 tokens | Output=   95 tokens | Messages= 3 | Cumulative In=  54,767
Turn 19: Input=  2,365 tokens | Output=  431 tokens | Messages= 5 | Cumulative In=  57,132
Turn 20: Input=  3,164 tokens | Output=   60 tokens | Messages= 7 | Cumulative In=  60,296
Turn 21: Input=  3,383 tokens | Output=  160 tokens | Messages= 9 | Cumulative In=  63,679
Turn 22: Input=  3,872 tokens | Output=  447 tokens | Messages=11 | Cumulative In=  67,551
Turn 23: Input=  4,687 tokens | Output=   64 tokens | Messages=13 | Cumulative In=  72,238
Turn 24: Input=  4,914 tokens | Output=  160 tokens | Messages=15 | Cumulative In=  77,152

============================================================
🔄 Compaction occurred! Messages: 15 → 1
   Summary message after compaction:

## Support Ticket Processing Progress Summary

### Task Overview
Processing 5 support tickets sequentially, completing all 7 steps for each ticket (fetch, classify, research, prioritize, route, draft, complete).

### Tickets Completed (4 of 5)

**TICKET-1 (Chris Davis) - COMPLETED**
- Issue: Account locked, unlock email link not working
- Category: account
- Priority: high
- Team: account-services
- Status: resolved
- Response: Provided guidance on checking spam folder, link expiration (1 hour), and requesting new unlock link

**TICKET-2 (Chris Williams) - COMPLETED**
- Issue: Unrecognized $49.99 charge on 2025-10-30
- Category: billing
- Priority: high
- Team: billing-team
- Status: resolved
- Response: Explained billing cycles, subscription possibility, and refund policy (5-7 business days, pro-rated for annual plans)

**TICKET-3 (John Jones) - COMPLETED**
- Issue: Asking about Google Sheets integration for project management
- Category: product
- Priority: medium
- Team: product-success
- Status: resolved
- Response: Explained that Product Success team will provide details on integration options, API access, and current/planned features

**TICKET-4 (Sam Johnson) - COMPLETED**
- Issue: Wants to know differences between Standard and Premium plans, specifically "advanced analytics"
- Category: product
- Priority: low
- Team: product-success
- Status: resolved
- Response: Explained that Product Success team will provide detailed plan comparison and feature breakdown

### Current Status
**TICKET-5 (Morgan Brown) - IN PROGRESS**
- Issue: Damaged package (Order #ORD-43312), broken product inside, needs replacement
- Category: shipping (classified)
- Priority: NOT YET SET
- Team: NOT YET ASSIGNED
- Steps completed: 1 (fetch), 2 (classify), 3 (research KB - no shipping info found)
- Steps remaining: 4 (set priority), 5 (route), 6 (draft), 7 (mark complete)

### Next Steps for TICKET-5
1. Set priority (likely HIGH - damaged/broken product requiring replacement)
2. Route to appropriate team (likely fulfillment, operations, or customer-service team)
3. Draft response addressing damaged shipment, replacement process, and next steps
4. Mark complete
5. **ALL TICKETS WILL BE COMPLETE**

### Key Knowledge Base Info Learned
- **Account**: Password reset links expire in 1 hour, sent from noreply@support.example.com
- **Billing**: Refunds take 5-7 business days, pro-rated for annual plans, billing on same date monthly/yearly; accepts Visa, Mastercard, Amex, PayPal
- **Technical**: Max upload 100MB, supported formats: PDF, DOCX, PNG, JPG, CSV; system requirements: 4GB RAM, modern browsers
- **Product category**: Does not exist in KB (only billing, technical, account available)
- **Shipping info**: Not found in knowledge base

### Team Routing Patterns Observed
- account-services: Account access issues
- billing-team: Billing/payment inquiries
- product-success: Product features, integrations, plan comparisons

### Remaining Work
1 ticket left to complete (TICKET-5 - final ticket, currently in progress at step 3 of 7)


============================================================
Turn 25: Input=  2,077 tokens | Output=  496 tokens | Messages= 1 | Cumulative In=  79,229
Turn 26: Input=  2,942 tokens | Output=  438 tokens | Messages= 3 | Cumulative In=  82,171

============================================================
OPTIMIZED RESULTS (WITH COMPACTION)
============================================================
Total turns:   26
Compactions:   2
Input tokens:  82,171
Output tokens: 4,275
Total tokens:  86,446
============================================================
With automatic context compaction enabled, we can see that our token usage per turn does not grow linearly, but is reduced after each compaction event. There were two compaction events during the processing of tickets, and the follow turn shows a reduction in total token usage.

Compared to the baseline version, we only used 79,000 tokens. We've also printed out the summary messages generated after each compaction event, showing how Claude effectively condensed prior ticket details into summaries.

Let's look at the final response after processing all 5 tickets with compaction enabled.

python

print(message.content[-1].text)
Perfect! **ALL 5 TICKETS HAVE BEEN SUCCESSFULLY COMPLETED!** 🎉

## Final Summary - All Tickets Processed

### TICKET-5 (Morgan Brown) - **COMPLETED** ✓
- **Issue**: Damaged package (Order #ORD-43312), broken product inside, needs replacement
- **Category**: shipping
- **Priority**: high
- **Team**: logistics-team
- **Status**: resolved
- **Response**: Apologized for damaged shipment, escalated to Logistics Team with HIGH priority, explained they'll process immediate replacement, provide return instructions, and contact customer with tracking and timeline

---

## 🎯 ALL 5 TICKETS COMPLETED

1. ✅ **TICKET-1** (Chris Davis) - Account locked → account-services
2. ✅ **TICKET-2** (Chris Williams) - Billing charge → billing-team  
3. ✅ **TICKET-3** (John Jones) - Google Sheets integration → product-success
4. ✅ **TICKET-4** (Sam Johnson) - Plan comparison → product-success
5. ✅ **TICKET-5** (Morgan Brown) - Damaged shipment → logistics-team

### Processing Statistics
- **Total tickets processed**: 5 of 5 (100%)
- **Steps per ticket**: 7 (fetch, classify, research, prioritize, route, draft, complete)
- **Total operations**: 35 successful operations
- **Categories used**: account, billing, product (2x), shipping
- **Teams utilized**: account-services, billing-team, product-success (2x), logistics-team
- **Priority distribution**: 2 high, 2 medium, 1 low

All tickets have been properly classified, prioritized, routed to the appropriate teams, and have draft responses ready for team review! 🎊

Comparing Results
With compaction enabled, we can see a clear differece between the two runs in token savings, while preserving the quality of the workflow and final summary.

Here's what changed with automatic context compaction:

Context resets after several tickets - When processing 5-7 tickets generates 5k+ tokens of tool results, the SDK automatically:

Injects a summary prompt
Has Claude generate a completion summary wrapped in <summary></summary> tags
Clears the conversation history and discards detailed classifications, KB searches, and responses
Continues with only the completion summary
Input tokens stay bounded - Instead of accumulating to 100k+ as we process more tickets, input tokens reset after each compaction. When processing Ticket #5, we're NOT carrying the full tool results from Tickets #1-4.

Task completes successfully - The workflow continues smoothly through all tickets without hitting context limits

Quality is preserved - The summaries retain critical information:

Tickets processed with their IDs
Categories and priorities assigned
Teams routed to
Overall progress status
All tickets are still properly classified, prioritized, routed, and responded to.

Natural workflow - This mirrors how real support agents work: resolve a ticket, document it briefly in the system, close it, move to the next one. You don't keep every knowledge base article and full response draft open while working on new tickets.

Let's visualize the token savings:

python

# Compare baseline vs compaction
print("=" * 70)
print("TOKEN USAGE COMPARISON")
print("=" * 70)
print(f"{'Metric':<30} {'Baseline':<20} {'With Compaction':<20}")
print("-" * 70)
print(f"{'Input tokens:':<30} {total_input:>19,} {total_input_compact:>19,}")
print(f"{'Output tokens:':<30} {total_output:>19,} {total_output_compact:>19,}")
print(
    f"{'Total tokens:':<30} {total_input + total_output:>19,} {total_input_compact + total_output_compact:>19,}"
)
print(f"{'Compactions:':<30} {'N/A':>19} {compaction_count:>19}")
print("=" * 70)
 
# Calculate savings
token_savings = (total_input + total_output) - (total_input_compact + total_output_compact)
savings_percent = (
    (token_savings / (total_input + total_output)) * 100 if (total_input + total_output) > 0 else 0
)
 
print(f"\n💰 Token Savings: {token_savings:,} tokens ({savings_percent:.1f}% reduction)")
======================================================================
TOKEN USAGE COMPARISON
======================================================================
Metric                         Baseline             With Compaction     
----------------------------------------------------------------------
Input tokens:                              204,416              82,171
Output tokens:                               4,422               4,275
Total tokens:                              208,838              86,446
Compactions:                                   N/A                   2
======================================================================

💰 Token Savings: 122,392 tokens (58.6% reduction)

How Compaction Works Under the Hood
When the tool_runner detects that token usage has exceeded the threshold, it automatically:

Pauses the workflow before making the next API call
Injects a summary request as a user message asking Claude to summarize progress
Generates a summary - Claude produces a summary wrapped in <summary></summary> tags containing:
Completed tickets: Brief records of tickets resolved (IDs, categories, priorities, outcomes)
Progress status: How many tickets processed, how many remain
Key patterns: Any notable trends across tickets
Next steps: What to do next (continue processing remaining tickets)
Clears history - The entire conversation history (including all tool results) is replaced with just the summary
Resumes processing - Claude continues working with the compressed context, processing the next batch of tickets

Customizing Compaction Configuration
You can customize how compaction works to fit your specific use case. Here are the key configuration options:


Adjusting the Threshold
The context_token_threshold determines when compaction triggers:

compaction_control={
    "enabled": True,
    "context_token_threshold": 5000,  # Compact after processing 5-7 tickets
}
The threshold should not be set too low, otherwise the summary itself could trigger a compaction. We set a threshold of 5,000 tokens for demonstration purposes, but in practice, experiment with different settings to find what works best for your workflow.

Here some general guidelines:

Low thresholds (5k-20k):
Use for iterative task processing with clear boundaries
More frequent compaction, minimal context accumulation
Best for sequential entity processing
Medium thresholds (50k-100k):
Multi-phase workflows with fewer, larger natural checkpoints
Balance between context retention and management
Suitable for workflows with expensive tool calls
High thresholds (100k-150k):
Tasks requiring substantial historical context
Less frequent compaction preserves more raw details
Higher per-call costs but fewer compactions
Default (100k): Good balance for general long-running tasks
For ticket processing: The 5k threshold works well because each ticket's workflow generates substantial tool results, but tickets are independent. After resolving Ticket A, you don't need its detailed KB searches when processing Ticket B.


Using a Different Model for Summarization
You can also use a faster/cheaper model for generating summaries:

compaction_control={
    "enabled": True,
    "model": "claude-haiku-4-5",  # Use Haiku for cost-effective summaries
}

Custom Summary Prompts
You can provide a custom prompt to guide how summaries are generated. This is especially useful for customer service workflows where you need to preserve specific types of information.

For example, we could define a custom prompt based on our requirements:

Ticket summaries for all completed tickets
Categories and priorities assigned
Teams routed to
Progress status (tickets completed, tickets remaining)
Next steps in the workflow
compaction_control={
    "enabled": True,
    "summary_prompt": """You are processing customer support tickets from a queue.
 
Create a focused summary that preserves:
 
1. **COMPLETED TICKETS**: For each ticket you've fully processed:
   - Ticket ID and customer name
   - Issue category and priority assigned
   - Team routed to
   - Brief outcome
 
2. **PROGRESS STATUS**: 
   - How many tickets you've completed
   - Approximately how many remain in the queue
 
3. **NEXT STEPS**: Continue processing the next ticket
 
Format with clear sections and wrap in <summary></summary> tags."""
}

Compaction Without Tools: Simple Chat Loop
While the examples above focus on tool-heavy agentic workflows, context compaction is also valuable for simple conversational applications where users drive the conversation.

Note: The compaction_control parameter demonstrated above works with tool_runner for agentic workflows with tools. For simple chat applications without tools, you'll implement compaction manually using the same principles.

Consider a chat application where users are having extended conversations with Claude—discussing complex topics, iterating on ideas, or working through problems. As the conversation grows, you face the same context accumulation challenges.

The Difference: Instead of tool use triggering token growth, it's the back-and-forth conversation itself. Each exchange adds messages to the history:

User asks a question
Claude provides a detailed response
User asks for clarification or elaboration
Claude responds with more context
This repeats dozens or hundreds of times
Without compaction, by turn 50 you're sending the entire conversation history (all 50 exchanges) on every API call.

The Solution: Implement compaction manually in your chat loop using the same pattern:

Track token usage after each turn
When threshold is exceeded, request a summary
Replace conversation history with the summary
Continue the conversation with compressed context
Let's see how to implement this:

python

#!/usr/bin/env python3
"""
Simple Compaction Example - User-Driven Chat Loop
 
This shows the basic pattern for a chat application with compaction.
No tools required - just a simple loop where the user drives continuation.
"""
 
# Configuration
COMPACTION_THRESHOLD = 3000  # Compact when tokens exceed this (low for demo purposes)
 
# Structured summarization prompt for compaction
SUMMARY_PROMPT = """You have been working on the task described above but have not yet completed it. Write a continuation summary that will allow you (or another instance of yourself) to resume work efficiently in a future context window where the conversation history will be replaced with this summary. Your summary should be structured, concise, and actionable. Include:
 
1. **Task Overview**
   - The user's core request and success criteria
   - Any clarifications or constraints they specified
 
2. **Current State**
   - What has been completed so far
   - Files created, modified, or analyzed (with paths if relevant)
   - Key outputs or artifacts produced
 
3. **Important Discoveries**
   - Technical constraints or requirements uncovered
   - Decisions made and their rationale
   - Errors encountered and how they were resolved
   - What approaches were tried that didn't work (and why)
 
4. **Next Steps**
   - Specific actions needed to complete the task
   - Any blockers or open questions to resolve
   - Priority order if multiple steps remain
 
5. **Context to Preserve**
   - User preferences or style requirements
   - Domain-specific details that aren't obvious
   - Any promises made to the user
 
Be concise but complete—err on the side of including information that would prevent duplicate work or repeated mistakes.
 Write in a way that enables immediate resumption of the task.
 
Wrap your summary in <summary></summary> tags."""
 
# Message history
messages = []
 
print("Chat with Claude (type 'quit' to exit, or just hit Enter to continue)")
print("This is a demonstration - try having a conversation and watch compaction trigger")
print("=" * 60)
 
# Simulate a conversation for demo purposes
demo_messages = [
    "Help me understand how Python decorators work",
    "Can you show me an example with a timing decorator?",
    "How would I make a decorator that takes arguments?",
]
 
for user_input in demo_messages:
    print(f"\nYou: {user_input}")
 
    # Add user message
    messages.append({"role": "user", "content": user_input})
 
    # Get Claude's response
    response = client.messages.create(
        model=MODEL,
        max_tokens=2048,
        messages=messages,
    )
 
    messages.append(
        {
            "role": "assistant",
            "content": response.content,
        }
    )
 
    print("\nClaude: ", end="")
    for block in response.content:
        if block.type == "text":
            print(f"{block.text[:300]} ...")
 
    # Check if we should compact
    usage = response.usage
 
    # Calculate total tokens (includes cache tokens)
    total_input_tokens = (
        usage.input_tokens
        + (usage.cache_creation_input_tokens or 0)
        + (usage.cache_read_input_tokens or 0)
    )
    total_tokens = total_input_tokens + usage.output_tokens
 
    cache_info = ""
    if usage.cache_creation_input_tokens or usage.cache_read_input_tokens:
        cache_info = f" (cache: {usage.cache_creation_input_tokens or 0} write + {usage.cache_read_input_tokens or 0} read)"
 
    print(
        f"\n[Tokens: {total_input_tokens} in{cache_info} + {usage.output_tokens} out = {total_tokens} total]"
    )
 
    if total_tokens > COMPACTION_THRESHOLD:
        print(f"\n{'=' * 60}")
        print(f"🔄 Compacting conversation... {len(messages)} messages → ", end="", flush=True)
 
        # Get summary using structured prompt
        summary_response = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            messages=messages + [{"role": "user", "content": SUMMARY_PROMPT}],
        )
 
        summary_text = "".join(
            block.text for block in summary_response.content if block.type == "text"
        )
 
        # Replace history with summary
        messages = [{"role": "user", "content": summary_text}]
 
        print("1 message")
        print(f"{'=' * 60}\n")
 
print(f"Final conversation messages: {messages[-1].get('content')}")
 
print("\nDemo complete! In a real application, this loop would continue with user input.")
Chat with Claude (type 'quit' to exit, or just hit Enter to continue)
This is a demonstration - try having a conversation and watch compaction trigger
============================================================

You: Help me understand how Python decorators work

Understanding the Chat Loop Pattern
The example above demonstrates manual compaction in a conversational context. Here's how it works:

Key Components:

Token Tracking: After each response, calculate total tokens (input + output + cache tokens)
Threshold Check: When total exceeds threshold, trigger compaction
Summary Request: Send the same structured SUMMARY_PROMPT to Claude
History Replacement: Replace entire message history with just the summary
Continue: Next user message builds on the summary, not full history
When to Use This Pattern:

Extended brainstorming sessions: Users exploring ideas with Claude over many turns
Learning conversations: Tutorials or explanations that span dozens of exchanges
Iterative refinement: Users providing feedback on drafts, designs, or solutions
Chat applications: Any multi-turn conversation interface
Key Differences from Tool Runner:

Aspect	Tool Runner (Automatic)	Chat Loop (Manual)
Trigger	Automatic when threshold reached	You implement threshold check
Summary	SDK handles summary request	You make explicit API call
History Management	SDK replaces messages	You manually replace list
Use Case	Agentic workflows with tools	User-driven conversations
Production Considerations:

Adjust threshold: Use larger thresholds for real applications
Customize summary prompt: Tailor to your conversation type (brainstorming vs. technical support vs. tutoring)
Show user indicators: Display a message like "Summarizing conversation..." so users understand the pause
Preserve key context: Ensure the summary prompt captures domain-specific information your users care about
This pattern gives you full control over when and how compaction happens, making it ideal for conversational applications where the SDK's automatic tool-runner compaction isn't available.


Limitations and Considerations
While automatic context compaction is powerful, there are important limitations to understand:


Server-Side Sampling Loops
Current Limitation: Compaction does not work optimally with server-side sampling loops, such as server-side web search tools.

Why: Cache tokens accumulate across sampling loops, which can trigger compaction prematurely based on cached content rather than actual conversation history.

This feature works best with:

✅ Client-side tools (like the customer service API in this cookbook)
✅ Standard agentic workflows with regular tool use
✅ File operations, database queries, API calls
❌ Server-side Extended Thinking
❌ Server-side web search tools

Information Loss
Trade-off: Summaries inherently lose some information. While Claude is good at identifying key points, some details will be compressed or omitted.

In ticket processing:

✅ Retained: Ticket IDs, categories, priorities, teams, outcomes, progress status
❌ Lost: Full knowledge base article text, complete drafted response text, detailed classification reasoning
This is usually acceptable, you don't need every KB article and full response text in perpetuity, just the completion records.

Mitigation:

Use custom summary prompts to preserve critical information
Set higher thresholds for tasks requiring extensive historical context
Structure your tasks to be modular (each phase builds on summaries, not raw details)

When NOT to Use Compaction
Avoid compaction for:

Short tasks: If your task completes within 50k-100k tokens, compaction adds unnecessary overhead
Tasks requiring full audit trails: Some tasks need access to ALL previous details
Server-side sampling workflows: As mentioned above, wait for this limitation to be addressed
Highly iterative refinement: Tasks where each step critically depends on exact details from all previous steps

When TO Use Compaction
Compaction is ideal for:

Sequential processing: Like our ticket workflow—process multiple items one after another
Multi-phase workflows: Where each phase can summarize progress before moving on
Iterative data processing: Processing large datasets in chunks or entities one at a time
Extended analysis sessions: Analyzing data across many entities
Batch operations: Processing hundreds of items where each is independent
Ticket processing is a perfect use case because:

Each ticket workflow is largely independent
You need completion summaries, not full tool results
Natural compaction points exist (after completing several tickets)
The workflow is iterative and sequential

Summary
Automatic context compaction is a powerful feature that enables long-running agentic workflows to exceed typical context limits. In this cookbook, we've explored compaction through a customer service ticket processing workflow.


Next Steps
Try implementing compaction in your own workflows:

Identify natural compaction points (after processing each item, completing each phase, etc.)
Start with an aggressive threshold (5k-10k) if you have clear per-item boundaries
Use custom summary prompts to preserve critical information
Monitor when compaction triggers and verify quality is maintained
Adjust threshold based on your specific needs

The new sources introduce two advanced ways that modern AI agents (specifically Claude) manage information to handle massive tasks without getting "clogged" or forgetting important details.

### 1. Context Editing (The "Auto-Cleaner")
Instead of just deleting the oldest messages (Trimming) or making a broad summary, **Context Editing** is like an intelligent cleaning service for the AI's "desk". It specifically identifies and removes "stale" or "cluttered" information—like long lists of search results or technical test logs—while keeping the actual conversation flow intact.
*   **Simple Example:** If an AI is fixing your computer and runs ten different tests that failed, Context Editing deletes the thousands of lines of "error clutter" from those failed tests but keeps the instructions you gave it at the very beginning.
*   **Why it helps:** It allows the AI to stay focused only on what is currently relevant, which can reduce the number of "tokens" (the cost and memory) used by up to **84%**.

### 2. The Memory Tool (The "Filing Cabinet")
The **Memory Tool** allows the AI to store information **outside** of its short-term memory (the context window) in a permanent "filing cabinet". The AI can create, read, and update these files, and—most importantly—they **persist across different sessions**.
*   **Simple Example:** You tell an AI your company’s specific coding style today. Instead of you having to remind it every time you start a new chat, the AI writes a "Style Guide" file in its memory. Next month, it simply opens that file to make sure it follows your rules.
*   **Why it helps:** It prevents the AI from "hitting a limit" because it doesn't have to carry every single piece of knowledge on its "desk" at once.

### Comparison of Memory Strategies

| Feature | What it does | Where is the info? | Best for... |
| :--- | :--- | :--- | :--- |
| **Context Editing** | Deletes "stale" clutter automatically. | On the "Desk" (Context Window). | Long coding or research tasks with lots of messy intermediate steps. |
| **Memory Tool** | Saves key facts to permanent files. | In the "Filing Cabinet" (External Storage). | Remembering your preferences or project details across weeks or months. |

Using these tools together has been shown to improve an AI's performance on complex tasks by **39%** compared to an AI using basic memory.
reference:

https://platform.claude.com/cookbook/tool-use-automatic-context-compaction

https://claude.com/blog/context-management

