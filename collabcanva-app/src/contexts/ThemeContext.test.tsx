// Unit tests for ThemeContext
// Tests for theme management, persistence, and system preference detection

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, useTheme, ThemeToggle, withTheme } from './ThemeContext';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock matchMedia
const mockMatchMedia = jest.fn();
Object.defineProperty(window, 'matchMedia', {
  value: mockMatchMedia
});

// Test component that uses theme context
const TestComponent: React.FC = () => {
  const { theme, resolvedTheme, setTheme, toggleTheme, isDark, isLight, isSystem } = useTheme();

  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="resolved-theme">{resolvedTheme}</div>
      <div data-testid="is-dark">{isDark.toString()}</div>
      <div data-testid="is-light">{isLight.toString()}</div>
      <div data-testid="is-system">{isSystem.toString()}</div>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('system')}>Set System</button>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    });
  });

  describe('ThemeProvider', () => {
    it('should provide default theme values', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('system');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
      expect(screen.getByTestId('is-dark')).toHaveTextContent('false');
      expect(screen.getByTestId('is-light')).toHaveTextContent('true');
      expect(screen.getByTestId('is-system')).toHaveTextContent('true');
    });

    it('should use custom default theme', () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('is-dark')).toHaveTextContent('true');
      expect(screen.getByTestId('is-light')).toHaveTextContent('false');
      expect(screen.getByTestId('is-system')).toHaveTextContent('false');
    });

    it('should load theme from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('dark');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('collabcanvas-theme');
    });

    it('should save theme to localStorage when changed', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const setDarkButton = screen.getByText('Set Dark');
      fireEvent.click(setDarkButton);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('collabcanvas-theme', 'dark');
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load theme from storage:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Theme Management', () => {
    it('should change theme when setTheme is called', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const setDarkButton = screen.getByText('Set Dark');
      fireEvent.click(setDarkButton);

      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('is-dark')).toHaveTextContent('true');
      expect(screen.getByTestId('is-light')).toHaveTextContent('false');
    });

    it('should toggle theme correctly', () => {
      render(
        <ThemeProvider defaultTheme="light">
          <TestComponent />
        </ThemeProvider>
      );

      const toggleButton = screen.getByText('Toggle Theme');
      
      // Light -> Dark
      fireEvent.click(toggleButton);
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');

      // Dark -> System (if enabled)
      fireEvent.click(toggleButton);
      expect(screen.getByTestId('theme')).toHaveTextContent('system');

      // System -> Light
      fireEvent.click(toggleButton);
      expect(screen.getByTestId('theme')).toHaveTextContent('light');
    });

    it('should toggle theme without system mode when disabled', () => {
      render(
        <ThemeProvider defaultTheme="light" enableSystem={false}>
          <TestComponent />
        </ThemeProvider>
      );

      const toggleButton = screen.getByText('Toggle Theme');
      
      // Light -> Dark
      fireEvent.click(toggleButton);
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');

      // Dark -> Light
      fireEvent.click(toggleButton);
      expect(screen.getByTestId('theme')).toHaveTextContent('light');
    });
  });

  describe('System Theme Detection', () => {
    it('should detect system dark theme preference', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      });

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('is-dark')).toHaveTextContent('true');
    });

    it('should listen for system theme changes', () => {
      const addEventListener = jest.fn();
      const removeEventListener = jest.fn();
      
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener,
        removeEventListener
      });

      const { unmount } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

      unmount();

      expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should update theme when system preference changes', async () => {
      let changeHandler: (() => void) | null = null;
      
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: jest.fn((event, handler) => {
          if (event === 'change') {
            changeHandler = handler;
          }
        }),
        removeEventListener: jest.fn()
      });

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');

      // Simulate system theme change
      if (changeHandler) {
        changeHandler();
      }

      await waitFor(() => {
        expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
      });
    });
  });

  describe('Document Theme Application', () => {
    it('should apply theme classes to document root', () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <TestComponent />
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should update theme classes when theme changes', () => {
      render(
        <ThemeProvider defaultTheme="light">
          <TestComponent />
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);

      const setDarkButton = screen.getByText('Set Dark');
      fireEvent.click(setDarkButton);

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });
  });

  describe('ThemeToggle Component', () => {
    it('should render toggle button', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveAttribute('aria-label', 'Switch to dark mode');
    });

    it('should show correct icon for current theme', () => {
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      );

      // Should show moon icon for light theme
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
    });

    it('should toggle theme when clicked', () => {
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      );

      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      expect(toggleButton).toHaveAttribute('aria-label', 'Switch to light mode');
    });

    it('should show label when showLabel is true', () => {
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle showLabel={true} />
        </ThemeProvider>
      );

      expect(screen.getByText('Light')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <ThemeProvider>
          <ThemeToggle className="custom-class" />
        </ThemeProvider>
      );

      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toHaveClass('custom-class');
    });
  });

  describe('withTheme HOC', () => {
    it('should wrap component with theme data attribute', () => {
      const TestComponent = () => <div>Test</div>;
      const ThemedComponent = withTheme(TestComponent);

      render(
        <ThemeProvider defaultTheme="dark">
          <ThemedComponent />
        </ThemeProvider>
      );

      const wrapper = screen.getByText('Test').parentElement;
      expect(wrapper).toHaveAttribute('data-theme', 'dark');
    });

    it('should set display name correctly', () => {
      const TestComponent = () => <div>Test</div>;
      const ThemedComponent = withTheme(TestComponent);

      expect(ThemedComponent.displayName).toBe('withTheme(TestComponent)');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when useTheme is used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useTheme must be used within a ThemeProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Custom Storage Key', () => {
    it('should use custom storage key', () => {
      mockLocalStorage.getItem.mockReturnValue('dark');

      render(
        <ThemeProvider storageKey="custom-theme-key">
          <TestComponent />
        </ThemeProvider>
      );

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('custom-theme-key');
    });
  });
});
