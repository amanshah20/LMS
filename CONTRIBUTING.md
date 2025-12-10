# Contributing to LMS Project

Thank you for your interest in contributing to the LMS (Learning Management System) project! This document provides guidelines for contributing.

## 🤝 How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Your environment (OS, Node version, browser)

### Suggesting Features

We welcome feature suggestions! Please:
- Check if the feature has already been requested
- Provide a clear description of the feature
- Explain why it would be useful
- Include mockups or examples if possible

### Pull Requests

1. **Fork the Repository**
   ```bash
   git clone https://github.com/yourusername/lms-project.git
   cd lms-project
   ```

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make Your Changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation if needed
   - Add tests for new features

4. **Test Your Changes**
   ```bash
   # Backend tests
   cd backend
   npm test
   
   # Frontend tests
   cd frontend
   npm test
   ```

5. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   # or
   git commit -m "fix: resolve issue with..."
   ```

   **Commit Message Format:**
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `chore:` - Maintenance tasks

6. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template
   - Wait for review

## 📝 Code Style Guidelines

### Backend (Node.js/Express)

```javascript
// Use async/await instead of callbacks
const getData = async (req, res) => {
  try {
    const data = await Model.findAll();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Always include error handling
// Use descriptive variable names
// Add comments for complex logic
```

### Frontend (React)

```javascript
// Use functional components with hooks
const MyComponent = () => {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Side effects here
  }, [dependencies]);
  
  return (
    <div>
      {/* JSX here */}
    </div>
  );
};

// Use meaningful component and variable names
// Keep components small and focused
// Extract reusable logic into custom hooks
```

### General Guidelines

- **Indentation**: 2 spaces
- **Semicolons**: Use them
- **Quotes**: Single quotes for JS, double quotes for JSX
- **Line Length**: Max 100 characters
- **Comments**: Use JSDoc style for functions

```javascript
/**
 * Fetches user data from database
 * @param {number} userId - The user's ID
 * @returns {Promise<Object>} User object
 */
async function fetchUser(userId) {
  // Implementation
}
```

## 🧪 Testing Guidelines

- Write tests for all new features
- Ensure all tests pass before submitting PR
- Aim for >80% code coverage
- Test edge cases and error scenarios

## 📋 PR Checklist

Before submitting your PR, ensure:

- [ ] Code follows the style guidelines
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] No console.log statements left in code
- [ ] Commit messages follow the format
- [ ] Branch is up to date with main
- [ ] PR description clearly explains changes

## 🔍 Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged
4. Your contribution will be acknowledged!

## 💡 Development Setup

See the main [README.md](README.md) for setup instructions.

## 🐛 Debugging Tips

- Use `console.log` with emoji markers for debugging:
  ```javascript
  console.log('✅ Success:', data);
  console.log('❌ Error:', error);
  console.log('🔍 Debug:', variable);
  ```

- Check browser console for frontend errors
- Check terminal for backend errors
- Use debugger statements for complex issues

## 📞 Questions?

- Open an issue for questions
- Join our community discussions
- Email: support@yourlms.com

## 🙏 Thank You!

Every contribution, no matter how small, helps make this project better!

## 📜 Code of Conduct

Be respectful and inclusive. We welcome contributors from all backgrounds.

---

Happy coding! 🚀
