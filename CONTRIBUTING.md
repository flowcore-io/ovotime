# Contributing to OvoTime

Thank you for your interest in contributing to OvoTime! This project supports scientific research on Arctic and Great Skua egg prediction, and we welcome contributions from developers, researchers, and the scientific community.

## 🔬 Scientific Context

OvoTime implements peer-reviewed research from the Faroe Islands studying Arctic (*Stercorarius parasiticus*) and Great Skua (*Stercorarius skua*) populations. All scientific calculations are based on published research and should be validated carefully.

## 📋 Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Docker and Docker Compose
- Git for version control
- A Flowcore account (for event sourcing architecture)

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR-USERNAME/ovotime.git
   cd ovotime
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up environment**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development environment**
   ```bash
   # Start PostgreSQL
   yarn docker:up
   
   # Start development server
   yarn dev
   ```

5. **Run tests**
   ```bash
   yarn test
   ```

## 🛡️ Security Considerations

- **Never commit sensitive data** (API keys, passwords, personal data)
- **Use environment variables** for all configuration
- **Validate all inputs** especially measurement data
- **Report security vulnerabilities** privately (see SECURITY.md)

## 📝 How to Contribute

### Reporting Issues

1. **Search existing issues** to avoid duplicates
2. **Use the issue templates** (Bug Report or Feature Request)
3. **Provide detailed information** including:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details
   - Screenshots if applicable

### Scientific Contributions

For changes to scientific calculations or formulas:

1. **Reference source research** - include citations
2. **Validate calculations** - ensure mathematical accuracy
3. **Add comprehensive tests** - especially for edge cases
4. **Update documentation** - explain the scientific rationale

### Code Contributions

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. **Test thoroughly**
   ```bash
   yarn test
   yarn lint
   yarn build
   ```

4. **Commit with clear messages**
   ```bash
   git commit -m "feat: add Arctic Skua prediction validation"
   ```

5. **Push and create a PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## 🏗️ Development Guidelines

### Code Style

- **TypeScript** - Use strict typing
- **ESLint** - Follow configured rules
- **Prettier** - Auto-format code
- **Comments** - Document complex logic, especially scientific calculations

### Testing

- **Unit tests** - Test individual functions
- **Integration tests** - Test API endpoints
- **Scientific validation** - Test calculations against known values
- **Edge cases** - Test boundary conditions

### Commit Messages

Use conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Adding tests
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `chore:` - Maintenance tasks

## 🔄 Event Sourcing Architecture

OvoTime uses Flowcore for event sourcing:

- **API routes** publish events (no direct database writes)
- **Transformers** process events and update read models
- **Events** provide complete audit trail

When contributing:
1. Follow the existing event/transformer patterns
2. Test event processing locally
3. Ensure transformers handle edge cases
4. Validate event schemas

## 📊 Scientific Accuracy

For scientific contributions:

1. **Cite sources** - Reference peer-reviewed research
2. **Validate formulas** - Cross-check calculations
3. **Test with known data** - Use published datasets when possible
4. **Document assumptions** - Explain any simplifications or limitations

## 🔍 Review Process

All contributions go through code review:

1. **Automated checks** - CI/CD pipeline runs tests
2. **Peer review** - Code reviewed by maintainers
3. **Scientific review** - Calculations validated by domain experts
4. **Documentation** - Ensure changes are documented

## 📚 Resources

- [Scientific Paper: Seabird 32-84](docs/scientific-background.md)
- [Flowcore Documentation](https://docs.flowcore.io)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## 🤝 Community

- **Be respectful** - Follow the code of conduct
- **Be patient** - Reviews take time
- **Be helpful** - Assist other contributors
- **Be collaborative** - Work together on complex issues

## 📞 Getting Help

- **GitHub Issues** - For bugs and feature requests
- **Discussions** - For questions and ideas
- **Email** - For private security issues

Thank you for contributing to scientific research! 🥚🔬 