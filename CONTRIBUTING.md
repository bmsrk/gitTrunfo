# Contributing to Git Trunfo

Thank you for your interest in contributing to Git Trunfo! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](../../issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Your environment (browser, OS, etc.)

### Suggesting Features

1. Check [Issues](../../issues) for existing feature requests
2. Create a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Possible implementation approach (optional)

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/bmsrk/gitTrunfo.git
   cd gitTrunfo
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation if needed

4. **Test your changes**
   ```bash
   npm run build
   npm run type-check
   npm run dev
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```
   
   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `chore:` - Maintenance tasks

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request**
   - Provide clear description of changes
   - Reference any related issues
   - Add screenshots for UI changes

## Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow existing naming conventions
- Use functional components with hooks
- Keep components focused and modular
- Add JSDoc comments for functions

### File Structure

```
├── components/        # React components
├── services/          # API and service modules
├── types.ts          # TypeScript type definitions
├── App.tsx           # Main application component
└── index.tsx         # Application entry point
```

### TypeScript

- Always define proper types
- Avoid `any` type when possible
- Use interfaces for object shapes
- Export types that may be reused

### React Best Practices

- Use memo() for expensive components
- Keep state minimal and local
- Use useCallback for event handlers
- Follow React hooks rules

### Testing

- Test on multiple browsers
- Test responsive behavior
- Test with different GitHub users
- Test offline mode fallback

## Questions?

Feel free to ask questions by:
- Opening an [issue](../../issues)
- Starting a [discussion](../../discussions)

Thank you for contributing! 🎉
