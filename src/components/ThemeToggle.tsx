'use client';

import { useTheme } from '@/lib/theme-context';
import Button from './ui/Button';

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    if (theme === 'system') {
      return '💻';
    }
    return resolvedTheme === 'dark' ? '🌙' : '☀️';
  };

  const getLabel = () => {
    if (theme === 'system') {
      return 'System theme';
    }
    return resolvedTheme === 'dark' ? 'Dark mode' : 'Light mode';
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycleTheme}
      aria-label={`Current theme: ${getLabel()}. Click to change.`}
      title={getLabel()}
    >
      <span aria-hidden="true">{getIcon()}</span>
    </Button>
  );
}
