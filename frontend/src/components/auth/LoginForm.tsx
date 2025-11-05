import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Eye, EyeOff, GraduationCap, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function LoginForm() {
  const { login, register, isLoading, error } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    department: '',
    year: '',
    section: ''
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateRegistrationForm = () => {
    const errors: Record<string, string> = {};
    if (!registerData.fullName.trim()) errors.fullName = 'Full name is required';
    if (!registerData.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(registerData.email)) errors.email = 'Please enter a valid email';
    if (!registerData.password) errors.password = 'Password is required';
    else if (registerData.password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (!registerData.confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (registerData.password !== registerData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    if (!registerData.role) errors.role = 'Please select a role';
    if (!registerData.department.trim()) errors.department = 'Department is required';
    
    // Validate student-specific fields
    if (registerData.role === 'student') {
      if (!registerData.year) errors.year = 'Year is required';
      if (!registerData.section.trim()) errors.section = 'Section is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    if (!loginData.email || !loginData.password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      const success = await login(loginData.email, loginData.password);
      if (success) {
        toast.success('Welcome back!');
      } else {
        toast.error('Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error('An error occurred during login');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    
    if (!validateRegistrationForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    // Remove confirmPassword and map fullName to name for backend
    const { confirmPassword, fullName, year, section, ...rest } = registerData;
    
    // Validate student fields are present when role is student
    if (registerData.role === 'student' && (!year || !section)) {
      toast.error('Year and section are required for student registration');
      return;
    }
    
    const registrationPayload = {
      name: fullName,
      ...rest,
      // Only include year and section if role is student
      ...(registerData.role === 'student' ? { year, section } : {})
    };
    
    console.log('Attempting registration with:', registrationPayload);
    
    try {
      const success = await register(registrationPayload);
      
      if (success) {
        toast.success('Account created successfully!');
        setActiveTab('login');
        setRegisterData({ 
          fullName: '', 
          email: '', 
          password: '', 
          confirmPassword: '', 
          role: '', 
          department: '',
          year: '',
          section: ''
        });
        setShowPassword(false);
        setShowConfirmPassword(false);
      } else {
        console.error('Registration returned false');
        toast.error(error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      toast.error('An error occurred during registration');
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setValidationErrors({});
    setLoginData({ email: '', password: '' });
    setRegisterData({ fullName: '', email: '', password: '', confirmPassword: '', role: '', department: '', year: '', section: '' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-4 shadow-lg">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">SchedEase</h1>
          <p className="text-gray-600 text-lg">Academic Scheduling System</p>
        </div>

        <Card className="shadow-2xl border-0 bg-white rounded-2xl">
          <CardHeader className="space-y-1 pb-6 pt-8">
            <CardTitle className="text-3xl font-bold text-center text-gray-900">Welcome</CardTitle>
            <CardDescription className="text-center text-gray-600 text-base">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl h-12">
                <TabsTrigger 
                  value="login"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold text-base h-10"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold text-base h-10"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-5 mt-6">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-semibold text-gray-900">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      className="h-12 px-4 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-semibold text-gray-900">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                        className="h-12 px-4 pr-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={registerData.fullName}
                      onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                      className={validationErrors.fullName ? 'border-red-500' : ''}
                    />
                    {validationErrors.fullName && (
                      <p className="text-sm text-red-500">{validationErrors.fullName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="Enter your email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      className={validationErrors.email ? 'border-red-500' : ''}
                    />
                    {validationErrors.email && (
                      <p className="text-sm text-red-500">{validationErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        className={validationErrors.password ? 'border-red-500 pr-10' : 'pr-10'}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {validationErrors.password && (
                      <p className="text-sm text-red-500">{validationErrors.password}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="register-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        className={validationErrors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {validationErrors.confirmPassword && (
                      <p className="text-sm text-red-500">{validationErrors.confirmPassword}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-role">Role</Label>
                    <Select
                      value={registerData.role}
                      onValueChange={(value) => setRegisterData({ ...registerData, role: value })}
                    >
                      <SelectTrigger className={validationErrors.role ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg">
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="instructor">Instructor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    {validationErrors.role && (
                      <p className="text-sm text-red-500">{validationErrors.role}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-department">Department</Label>
                    <Input
                      id="register-department"
                      type="text"
                      placeholder="Enter your department"
                      value={registerData.department}
                      onChange={(e) => setRegisterData({ ...registerData, department: e.target.value })}
                      className={validationErrors.department ? 'border-red-500' : ''}
                    />
                    {validationErrors.department && (
                      <p className="text-sm text-red-500">{validationErrors.department}</p>
                    )}
                  </div>

                  {/* Student-specific fields */}
                  {registerData.role === 'student' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="register-year">Year</Label>
                        <Select
                          value={registerData.year}
                          onValueChange={(value) => setRegisterData({ ...registerData, year: value })}
                        >
                          <SelectTrigger className={validationErrors.year ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select your year" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg">
                            <SelectItem value="1">First Year</SelectItem>
                            <SelectItem value="2">Second Year</SelectItem>
                            <SelectItem value="3">Third Year</SelectItem>
                            <SelectItem value="4">Fourth Year</SelectItem>
                          </SelectContent>
                        </Select>
                        {validationErrors.year && (
                          <p className="text-sm text-red-500">{validationErrors.year}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-section">Section</Label>
                        <Input
                          id="register-section"
                          type="text"
                          placeholder="Enter your section"
                          value={registerData.section}
                          onChange={(e) => setRegisterData({ ...registerData, section: e.target.value })}
                          className={validationErrors.section ? 'border-red-500' : ''}
                        />
                        {validationErrors.section && (
                          <p className="text-sm text-red-500">{validationErrors.section}</p>
                        )}
                      </div>
                    </>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Sign Up'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600 font-medium">Academic Year 2024-2025</p>
        </div>
      </div>
    </div>
  );
}