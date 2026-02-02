# NextSteps

**Status**: ✅ COMPLETE  
**Branch**: `feat/refresh-and-domains`  
**Completed**: February 2, 2026

This milestone delivered Dynamic Content Support and Per-Domain Toast Control for v1.2.0. All phases (implementation, testing, and documentation) are complete.

**See [CHANGELOG.md](CHANGELOG.md) for full release notes.**

---

## Milestone Summary

### Features Delivered
1. **Dynamic Content Loading Support**: MutationObserver-based automatic detection of names in dynamically loaded content (infinite scroll)
2. **Per-Domain Toast Control**: Domain-specific toggle to suppress toast notifications while maintaining full functionality

### Implementation Phases
- **Phase 1**: Per-Domain Toast Control implementation + UI polish
- **Phase 2**: MutationObserver infrastructure with 2s debounce and bubble flash fixes
- **Phase 3**: Testing (smoke test updates) and documentation (README, CHANGELOG, backlog)

### Key Decisions
- Removed manual refresh button in favor of automatic rescans (cleaner UI, Product Owner approved)
- 2-second debounce prevents lag on genealogy-heavy passages
- `preserveBubble` parameter prevents UI flashing during programmatic resets

---