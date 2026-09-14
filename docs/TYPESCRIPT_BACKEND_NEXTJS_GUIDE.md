# Complete Guide: Node.js, Express, TypeScript & Next.js for Beginners

Welcome. This guide explains JavaScript, TypeScript, Node.js, Express.js, and Next.js from scratch using simple, easy to read English.

---

## 1. The Big Picture: What Are All These Technologies?

When building modern web applications, developers use a combination of tools. Here is how they relate to each other:

- **JavaScript (JS)**: The core programming language of the web. It runs in browsers and on servers.
- **TypeScript (TS)**: JavaScript with mandatory type rules. It catches mistakes before you run your code.
- **Node.js**: A tool that lets you run JavaScript on your computer or server (outside the web browser).
- **Express.js**: A lightweight framework built on top of Node.js to create web APIs easily.
- **React.js**: A frontend UI library to build interactive user interfaces using reusable components.
- **Next.js**: A framework built on top of React that handles both frontend pages and server-side rendering automatically.

---

## 2. JavaScript vs TypeScript: Why Does TypeScript Exist?

### The JavaScript Problem
JavaScript is loosely typed. It does not check if variable types match until you actually run the code.

```javascript
// Plain JavaScript
function addPrices(price1, price2) {
  return price1 + price2;
}

// If someone accidentally passes strings instead of numbers:
addPrices("100", "50"); // Returns "10050" instead of 150!
```

### The TypeScript Solution
TypeScript adds explicit **Type Annotations**. It forces you to declare what kind of data every variable and function expects. If you make a mistake, your editor flags it instantly.

```typescript
// TypeScript
function addPrices(price1: number, price2: number): number {
  return price1 + price2;
}

// TypeScript gives an immediate compilation error:
// addPrices("100", "50"); -> Error: Argument of type 'string' is not assignable to parameter of type 'number'.
```

### Key TypeScript Concepts Used in Backend Code

#### A. Interfaces and Types
An `interface` defines the shape or structure of an object.

```typescript
// Defining the structure of a User object
interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Sales' | 'Warehouse' | 'Accounts';
}

// Creating a variable that MUST follow the User interface
const currentUser: User = {
  id: "u-101",
  name: "System Admin",
  email: "admin@erp.com",
  role: "Admin"
};
```

---

## 3. How Node.js and Express Backend Works

A backend server performs three primary jobs:
1. Receives incoming HTTP requests from users.
2. Runs security and validation checks.
3. Queries the database and returns JSON data.

```
[ Frontend Client ] ──(Sends HTTP Request)──► [ Express Server ]
                                                     │
                                             (Executes Middleware)
                                                     │
                                             (Queries Database)
                                                     │
[ Frontend Client ] ◄──(Sends JSON Response)─── [ Express Server ]
```

---

## 4. Understanding Express Middlewares

A **Middleware** is a helper function that runs between the incoming request and the final route response. Think of it like a security guard at an office building door.

### Middleware Flow:
1. Request arrives.
2. Middleware checks if user has valid token.
3. If valid -> calls `next()` to let request pass.
4. If invalid -> sends error response `401 Unauthorized` and stops execution.

```typescript
import { Request, Response, NextFunction } from 'express';

// Custom Middleware Example
function checkSecurityBadge(req: Request, res: Response, next: NextFunction) {
  const hasBadge = req.headers['x-badge'];

  if (!hasBadge) {
    return res.status(401).json({ message: "Access denied. No badge provided." });
  }

  next(); // Allow request to proceed to the next step
}
```

---

## 5. What is Next.js and How Does It Compare to React?

### Traditional React (Client-Side Rendering)
- Browser downloads an empty HTML file and a large JavaScript bundle.
- JavaScript executes in the user browser to build the page.
- Good for internal dashboards, but slower initial page load and poor SEO.

### Next.js (Full-Stack Framework)
- Runs on the server and generates complete HTML pages before sending them to the browser.
- Provides built-in **API Routes** (you can write backend endpoints directly inside Next.js without a separate Express server).
- Uses file-system routing (folder structure automatically determines web URLs).

```
Next.js Project Structure:
app/
 ├── page.tsx               -> Homepage ( URL: / )
 ├── customers/
 │    └── page.tsx          -> Customers Page ( URL: /customers )
 └── api/
      └── auth/
           └── route.ts     -> Backend API Endpoint ( URL: /api/auth )
```

---

## 6. Real Code Breakdown from OpsFlow Backend

### File: `server/src/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 1. Extending Express Request type to attach user details
export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

// 2. Token Verification Middleware
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <TOKEN>"

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  const secret = process.env.JWT_SECRET || 'fallback-secret';

  // Verify cryptographic signature
  jwt.verify(token, secret, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user; // Store user payload inside request
    next(); // Pass control to next handler
  });
};

// 3. Role Checking Middleware
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if user's role exists in allowed roles array
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Requires one of: ${roles.join(', ')}`,
      });
    }

    next();
  };
};
```

---

## 7. Summary Checklist for Interviews

1. **Why TypeScript?**: TS adds static type checking to JavaScript, preventing runtime crashes and improving code maintainability.
2. **What is Express?**: A Node.js framework used to handle HTTP routing and API requests.
3. **What is Middleware?**: A function that intercepts requests to perform tasks like logging, authentication, and validation before reaching the controller.
4. **What is Next.js?**: A React framework that offers server-side rendering, static site generation, and integrated backend API routes.
