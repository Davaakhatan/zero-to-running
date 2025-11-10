# TypeScript Error Prevention Setup

This document outlines the TypeScript configuration and checks in place to prevent errors before they reach production.

## Type Checking Commands

### Frontend Only
```bash
pnpm type-check
```
Runs TypeScript type checking on the frontend codebase.

### Backend Only
```bash
cd backend && pnpm type-check
```
Runs TypeScript type checking on the backend codebase.

### Both Frontend and Backend
```bash
pnpm type-check:all
```
Runs type checking on both frontend and backend in sequence.

### Full Check (Recommended Before Commits)
```bash
pnpm check
```
Runs all type checks. This is automatically run before builds.

## Automatic Type Checking

### Pre-Build Check
The `build` script automatically runs type checking before building:
```bash
pnpm build  # Runs type-check first, then builds
```

### Watch Mode
For development, you can run type checking in watch mode:
```bash
pnpm type-check:watch
```

## TypeScript Configuration

### Frontend (`tsconfig.json`)
- **Target**: ES6
- **Module**: ESNext
- **Strict Mode**: Enabled
- **Excludes**: `node_modules`, `backend` (to avoid conflicts)

### Backend (`backend/tsconfig.json`)
- **Target**: ES2022
- **Module**: ESNext
- **Strict Mode**: Enabled
- **Supports**: Top-level await (required for Fastify setup)

## VS Code Integration

The project includes VS Code settings (`.vscode/settings.json`) that:
- Use the workspace TypeScript version
- Enable ESLint auto-fix on save
- Exclude build artifacts from search

## Common Issues and Fixes

### Issue: Top-level await errors in backend
**Solution**: Backend uses its own `tsconfig.json` with `module: "ESNext"` and `target: "ES2022"`. Make sure to run type checks from the backend directory or use `pnpm type-check:all`.

### Issue: Type errors from backend when checking frontend
**Solution**: Frontend `tsconfig.json` excludes the `backend` directory to prevent conflicts.

### Issue: Import errors
**Solution**: All imports should use relative paths or the `@/*` alias configured in `tsconfig.json`.

## Best Practices

1. **Always run `pnpm check` before committing** to catch type errors early
2. **Fix type errors immediately** - don't let them accumulate
3. **Use TypeScript strict mode** - it's enabled for both frontend and backend
4. **Check types in watch mode** during development for instant feedback

## CI/CD Integration

For CI/CD pipelines, add:
```yaml
- run: pnpm check
```
This ensures type safety before deployment.

