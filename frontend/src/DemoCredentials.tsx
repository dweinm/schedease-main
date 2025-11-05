import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui//button';
import { Badge } from './components/ui/badge';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';

interface DemoAccount {
  role: string;
  email: string;
  password: string;
  name: string;
  features: string[];
}

const demoAccounts: DemoAccount[] = [
  {
    role: 'admin',
    email: 'admin@university.edu',
    password: 'password',
    name: 'Dr. Sarah Johnson',
    features: [
      'Full system control',
      'User management',
      'Course & room management',
      'Schedule generation',
      'Analytics dashboard'
    ]
  },
  {
    role: 'instructor',
    email: 'instructor@university.edu',
    password: 'password',
    name: 'Prof. Michael Chen',
    features: [
      'View personal schedule',
      'Set availability',
      'Submit schedule requests',
      'Course assignments',
      'Student roster access'
    ]
  },
  {
    role: 'student',
    email: 'student@university.edu',
    password: 'password',
    name: 'Alex Smith',
    features: [
      'View class schedule',
      'Course registration',
      'Academic calendar',
      'Room locations',
      'Profile management'
    ]
  }
];

interface DemoCredentialsProps {
  onLoginAs?: (email: string, password: string) => void;
}

export function DemoCredentials({ onLoginAs }: DemoCredentialsProps) {
  const [showPasswords, setShowPasswords] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'instructor':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'student':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-blue-200 bg-blue-50/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Demo Accounts</CardTitle>
          <CardDescription className="text-base">
            Try SchedEase with these pre-configured accounts to explore all features
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        {demoAccounts.map((account) => (
          <Card key={account.role} className="transition-all hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge className={`${getRoleColor(account.role)} capitalize`}>
                  {account.role}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="h-8 w-8 p-0"
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <CardTitle className="text-lg">{account.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Email</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-gray-100 px-2 py-1 text-sm">
                    {account.email}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(account.email, `${account.role}-email`)}
                    className="h-8 w-8 p-0"
                  >
                    {copiedField === `${account.role}-email` ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Password</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-gray-100 px-2 py-1 text-sm">
                    {showPasswords ? account.password : '••••••••'}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(account.password, `${account.role}-password`)}
                    className="h-8 w-8 p-0"
                  >
                    {copiedField === `${account.role}-password` ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Key Features</label>
                <ul className="space-y-1 text-xs text-gray-600">
                  {account.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-gray-400"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Login Button */}
              {onLoginAs && (
                <Button
                  onClick={() => onLoginAs(account.email, account.password)}
                  className="w-full"
                  variant={account.role === 'admin' ? 'default' : 'outline'}
                >
                  Login as {account.role}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="text-center text-sm text-amber-800">
            <p className="font-medium">🔧 Development Mode</p>
            <p>These accounts are for demonstration purposes only.</p>
            <p>In production, users would register through secure authentication.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}