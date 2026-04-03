# PromptShield Roadmap

## Phase 1: MVP (Current) ✅ in progress

**Goal:** Functional CLI + Python API with core features

- [x] Project structure & documentation
- [ ] API key detection (all major providers)
- [ ] PII redaction (SSN, email, phone, etc.)
- [ ] Token compression (markdown, whitespace)
- [ ] CLI with `scan`, `redact`, `compress`, `process` commands
- [ ] Python API exports
- [ ] Basic tests (detector, redactor, compressor)
- [ ] README + installation guide
- [ ] PyPI release (promptshield 0.1.0)

**Timeline:** 2-3 weeks

**Owner:** Tài (@newnol)

---

## Phase 2: Production-Ready (Q2 2026)

**Goal:** Web UI + integrations + advanced compression

### Features
- [ ] **Web UI** (SvelteKit)
  - Drag-drop file upload
  - Real-time preview
  - Before/after token comparison
  - Pattern customization UI

- [ ] **REST API Server**
  - `/api/scan` endpoint
  - `/api/redact` endpoint
  - `/api/compress` endpoint
  - OpenAPI/Swagger docs

- [ ] **Browser Extension** (Chrome/Firefox)
  - Right-click context menu
  - Scan + redact before pasting into LLM chats
  - Settings sync

- [ ] **Advanced Compression**
  - LLM-based rewriting (optional)
  - Semantic similarity checking
  - Custom compression rules

- [ ] **MCP (Model Context Protocol)**
  - Claude/ChatGPT integration
  - Use PromptShield as a tool inside models

- [ ] **Integrations**
  - GitHub Actions workflow
  - Pre-commit hook template
  - Git integration

### Tests
- [ ] 80%+ code coverage
- [ ] Integration tests
- [ ] Performance benchmarks

---

## Phase 3: Enterprise (Q3-Q4 2026)

**Goal:** Team collaboration, audit logging, enterprise features

### Features
- [ ] **Cloud Version** (optional, self-hosted)
  - User authentication
  - Team workspaces
  - Audit logging
  - Webhook integrations

- [ ] **Advanced Analytics**
  - Redaction trends
  - Most common leaked secrets
  - Compliance reporting

- [ ] **Compliance**
  - SOC 2 audit
  - GDPR compliance mode
  - Audit log export

- [ ] **Performance**
  - GPU-accelerated detection (optional)
  - Batch processing optimization
  - Caching layer

- [ ] **Detection Improvements**
  - ML-based pattern learning
  - Custom model training
  - Community patterns registry

---

## Stretch Goals (TBD)

- [ ] IDE plugins (VSCode, JetBrains)
- [ ] Docker container with API
- [ ] Kubernetes operator
- [ ] Data lineage tracking
- [ ] Automated secret rotation integration
- [ ] Threat intelligence feeds

---

## Known Limitations & TODOs

### Phase 1 (MVP)
- [ ] No advanced regex support for custom patterns (Phase 2)
- [ ] No LLM-based compression (compress via patterns only)
- [ ] Limited false-positive handling (add `--review` mode in Phase 2)
- [ ] No batch file processing via CLI (Phase 2)
- [ ] No configuration UI (Phase 2)

### Phase 2
- [ ] Web UI performance with large files (>100MB)
- [ ] MCP compatibility varies by model (test required)
- [ ] Extension only Chrome/Firefox (Safari Phase 3)

### Phase 3+
- [ ] Cloud version security hardening required
- [ ] Multi-tenancy complexity
- [ ] Compliance certifications timeline

---

## Contributing

Want to help? See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Issue triage
- Feature requests
- Code contribution process
- Testing requirements

**Active Areas:**
1. API key detection patterns (always welcome!)
2. PII regex improvements
3. Compression algorithm refinements
4. Documentation & examples
5. Test coverage

---

## Success Metrics

- **Phase 1**: 200+ stars on GitHub, 50+ downloads
- **Phase 2**: 1K+ downloads/month, active community
- **Phase 3**: Enterprise adoption, SOC 2 certified

---

## Support

- Issues: [GitHub Issues](https://github.com/newnol/promptshield/issues)
- Discussions: [GitHub Discussions](https://github.com/newnol/promptshield/discussions)
- Email: hello@promptshield.dev (Phase 2)

---

_Last updated: April 2026 | Next review: Q1 2026_
