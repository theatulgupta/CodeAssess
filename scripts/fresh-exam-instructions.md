# Fresh Exam Instructions

## Problem
When you clear the database using `npm run clear-db`, students may still have saved exam state (timer, code) in their browser's localStorage. This allows them to continue from where they left off instead of starting fresh.

## Solutions

### Option 1: Ask Students to Use Incognito/Private Mode
- **Chrome**: Ctrl+Shift+N (Windows) or Cmd+Shift+N (Mac)
- **Firefox**: Ctrl+Shift+P (Windows) or Cmd+Shift+P (Mac)
- **Safari**: Cmd+Shift+N (Mac)
- **Edge**: Ctrl+Shift+N (Windows)

### Option 2: Fresh Start URL Parameter
Students can access: `http://localhost:3000/?fresh=true`
This will automatically clear their saved exam state.

### Option 3: Manual Browser Data Clearing
Ask students to:
1. Press F12 to open Developer Tools
2. Go to Application/Storage tab
3. Clear localStorage for the exam site
4. Refresh the page

## Recommended Approach
For completely fresh exams, instruct students to:
1. Use incognito/private browsing mode, OR
2. Access the exam with `?fresh=true` parameter

## Technical Details
- Database clearing only removes submitted results from SQLite
- Browser localStorage persists exam state (timer, code, tab switches)
- The application now automatically clears old/invalid localStorage data
- Fresh start functionality prevents localStorage restoration