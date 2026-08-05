# Documentation

Engineering and product docs for **Decision Ledger**.

| Document | Audience | Description |
|----------|----------|-------------|
| [VISION.md](VISION.md) | Everyone | Why the product exists, who it is for, scope |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Contributors | Layers, domain model, extension runtime |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Contributors | Setup, branches, coding standards, PR path |
| [ADAPTERS.md](ADAPTERS.md) | Adapter authors | Multi-forge model, how to add a host |
| [decisions/](decisions/) | Contributors | Architecture Decision Records (ADRs) |

## Reading order

1. **VISION** — confirm problem and non-goals  
2. **ARCHITECTURE** — how pieces fit  
3. **DEVELOPMENT** — how to work in this repo  
4. **ADAPTERS** — when touching a forge integration  
5. **ADRs** — when a choice needs a permanent record  

## Doc standards

- Prefer short sections and tables over long prose.
- Link to ADRs for irreversible or cross-cutting choices; do not bury those only in chat history.
- When behavior changes, update the doc in the **same PR** as the code (or open a follow-up issue if docs lag).
- Speculative future work belongs under roadmap/non-goals, not as if it already shipped.
