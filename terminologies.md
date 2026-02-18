\begin{table}[htp!]
\centering
\small
\begin{tabular}{|l|p{9.5cm}|}
\hline
\textbf{Term} & \textbf{Definition} \\
\hline
\multicolumn{2}{|l|}{\textit{Context Management}} \\
\hline
Context Window & The maximum number of tokens an LLM can process in a single request, including input and output. Ranges from 128K to 1M tokens as of early 2026. \\
\hline
Context Rot & Progressive degradation of model performance as input length increases, even on simple tasks~\cite{hong2025contextrot}. Tokalator warns at provider-specific rot thresholds. \\
\hline
Rot Threshold & The turn count or token count at which context rot begins to degrade output quality. Default: 20 turns. \\
\hline
Context Health & A tri-state indicator (\texttt{healthy}, \texttt{warning}, \texttt{critical}) reflecting the overall quality of the developer's context window based on budget utilization, secret exposure, and distractor count. \\
\hline
Distractors & Open files with low relevance scores ($R < 0.3$) that consume context budget without contributing to the current task. Analogous to noise in signal processing. \\
\hline
Compaction Point & The estimated turn number at which cumulative context will exceed the rot threshold, triggering a recommendation to summarize or restart the conversation. \\
\hline
Next Turn Preview & A projection of the total token count after the next conversational turn, helping developers decide whether to send a message or compact first. \\
\hline
\multicolumn{2}{|l|}{\textit{Token Economics}} \\
\hline
Budget Level & A tri-state classification of context utilization: \texttt{low} ($<50\%$), \texttt{medium} (50--80\%), \texttt{high} ($>80\%$). Displayed as a colored badge in the dashboard. \\
\hline
Budget Breakdown & The decomposition of total estimated tokens into five components: files, system prompt, instructions, conversation history, and output reservation. \\
\hline
Output Reservation & Tokens reserved for the model's response (default: 4,000). Not sent as input but must be subtracted from the available context window. \\
\hline
System Overhead & Hidden tokens injected by the AI assistant's framework (system prompts, tool definitions, internal formatting) that consume context budget invisibly. \\
\hline
Input Growth Rate & The rate at which per-turn input tokens increase across a conversation, driven by conversation history accumulation. \\
\hline
\multicolumn{2}{|l|}{\textit{Relevance \& Scoring}} \\
\hline
Relevance Score ($R$) & A value in $[0, 1]$ assigned to each open tab (Equation~2), computed from five weighted signals: language match, import relationship, path similarity, edit recency, and diagnostics. \\
\hline
Optimization & The process of closing low-relevance tabs ($R < 0.3$) to free up context budget and reduce attention dilution. Triggered via \texttt{/optimize} or the dashboard button. \\
\hline
Pinned Files & Files explicitly marked by the developer to always receive $R = 1.0$, overriding algorithmic scoring. Persisted across VS~Code sessions. \\
\hline
\multicolumn{2}{|l|}{\textit{Caching \& Cost}} \\
\hline
Blended Cost & The weighted average of cached and uncached per-token rates, reflecting the effective input cost when prompt caching is active: $c_{\text{blend}} = r \cdot c_r + (1 - r) \cdot c_{\text{in}}$, where $r$ is the cache hit ratio. \\
\hline
Cacheable Tokens & Tokens in the stable prefix (system prompt, instructions, pinned files) eligible for prompt caching across turns. \\
\hline
Volatile Tokens & Tokens that change between turns (conversation history, edited file content) and cannot benefit from prompt caching. \\
\hline
Cache Hit Ratio & The estimated fraction of cacheable tokens that will be served from cache on a given turn. Provider-dependent: Anthropic $\approx 0.85$, OpenAI $\approx 0.50$, Google $\approx 0.70$. \\
\hline
Break-Even Point ($n^*$) & The number of prompt reuses after which caching becomes cheaper than re-sending tokens uncached (Equation~4). \\
\hline
Session Projection & Extrapolation of per-turn costs to session (10/25/50 turns), daily (8 sessions), and monthly (22 working days) estimates. \\
\hline
\multicolumn{2}{|l|}{\textit{Security (planned for v3.1.5)}} \\
\hline
Secrets Guard & (Future) A real-time scanner that will detect exposed credentials (API keys, tokens, connection strings) in open files before they enter the AI assistant's context window. \\
\hline
Sensitive File & (Future) A file whose name matches known credential patterns (\texttt{.env}, \texttt{.pem}, \texttt{id\_rsa}, etc.) to be flagged regardless of content. \\
\hline
Severity Tiers & (Future) Classification of detected secrets: \texttt{critical} (cloud provider keys, private keys), \texttt{high} (API keys, database URLs), \texttt{warning} (generic patterns, internal IPs). \\
\hline
\end{tabular}
\caption{Glossary of key technical terms used in the Tokalator dashboard, chat interface, and optimization engine. These terms are also available in the online dictionary at \url{https://tokalator.wiki/dictionary}, which defines 41 terms across seven categories.}
\label{tab:glossary}
\end{table}


\begin{table}[htp!]
\centering
\small
\begin{tabular}{|r|l|p{5.5cm}|r|}
\hline
\textbf{\#} & \textbf{Date} & \textbf{Focus} & \textbf{Commits} \\
\hline
1 & Jan 31 & Project scaffold (Next.js~16, initial structure) & 1 \\
\hline
2 & Feb 7 & Web platform foundation: pricing lib, calculators, wiki, dictionary, catalog, homepage, responsive design & 14 \\
\hline
3 & Feb 8 & Extension v0.2.0--v0.2.6: core monitor, tokenizer service, chat participant (11 commands), dashboard webview, model profiles, relevance scorer; web: learn course, about page, marketplace publishing & 46 \\
\hline
4 & Feb 10 & Extension v0.2.7--v0.3.0: dashboard theme fixes, model profile updates, initial test suite (148~tests), UI polish, Marketplace sync & 9 \\
\hline
5 & Feb 11 & Extension v0.4.0--v3.1.1: pin/unpin/close dashboard controls, CSP event delegation, fmtTokens M formatting, dashboard tests, high-contrast theme, model sync fix, homepage sync, paper update & 4 \\
\hline
\multicolumn{3}{|l|}{\textbf{Total}} & \textbf{74} \\
\hline
\end{tabular}
\caption{AI-assisted development sessions. Each session used GitHub Copilot for inline completions and Claude for interactive pair-programming. Estimated total active development time: $\sim$60~hours across 5~days.}
\label{tab:sessions}
\end{table}