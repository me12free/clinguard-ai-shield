# AI Coding Guidelines
This document provides guidelines for AI assistants (like GitHub Copilot, Windsurf, etc.) to follow when generating or suggesting code for the ClinGuard project.
## General Guidelines
1. **Security First**: Always prioritize security, especially when handling PHI.
2. **Readability**: Write clear, self-documenting code.
3. **Modularity**: Keep functions and components small and focused.
4. **Testing**: Include or suggest tests for new code.
5. **Documentation**: Add clear comments for complex logic.
## Code Style
### PHP/Laravel
- Follow PSR-12 standards
- Use strict typing
- Use type hints and return types
- Follow Laravel naming conventions
- Use dependency injection
### JavaScript/React
- Follow Airbnb JavaScript Style Guide
- Use functional components with hooks
- Use TypeScript for type safety
- Keep components small and reusable
### Python
- Follow PEP 8
- Use type hints
- Write docstrings for public functions/classes
- Use virtual environments
## Security Guidelines
1. **Input Validation**
   - Always validate and sanitize all user inputs
   - Use Laravel's built-in validation for backend
   - Implement client-side validation for better UX
2. **Authentication & Authorization**
   - Use Laravel's built-in authentication
   - Implement proper role-based access control
   - Never store plain text passwords
3. **Data Protection**
   - Encrypt sensitive data
   - Use prepared statements for database queries
   - Implement proper CSRF protection
4. **Error Handling**
   - Never expose sensitive information in error messages
   - Log errors appropriately
   - Implement proper exception handling
## Code Generation Guidelines
1. **Function/Method Generation**
   - Keep functions under 20 lines
   - Single responsibility principle
   - Include parameter and return type hints
   - Add docblock comments
2. **Test Generation**
   - Include test cases for edge cases
   - Follow AAA pattern (Arrange, Act, Assert)
   - Include both positive and negative test cases
3. **Documentation**
   - Document public APIs
   - Include examples where helpful
   - Document assumptions and limitations
## Example Patterns
### Good Example (PHP)
```php
/**
 * Create a new user with the given data.
 *
 * @param array $userData
 * @return User
 * @throws \Illuminate\Validation\ValidationException
 */
public function createUser(array $userData): User
{
    $validated = Validator::make($userData, [
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email',
        'password' => 'required|min:8|confirmed',
    ])->validate();
    return User::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'password' => Hash::make($validated['password']),
    ]);
}
```
Good Example (React)
```tsx
interface UserProfileProps {
  user: {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'user' | 'guest';
  };
  onUpdate: (userData: Partial<User>) => Promise<void>;
}
const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: user.name, email: user.email });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdate(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };
  // Rest of the component...
};
```
