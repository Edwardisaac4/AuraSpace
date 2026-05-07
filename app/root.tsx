/**
 * root.tsx — Application root component and global layout.
 *
 * This file defines:
 *  - `Layout`         – The HTML shell (head, body, fonts, scripts).
 *  - `App`            – The root React component that manages authentication
 *                       state and passes it to all child routes via outlet context.
 *  - `ErrorBoundary`  – A catch-all error UI for unhandled route errors.
 *
 * Authentication is handled by reading the current Puter user on mount
 * and exposing `signIn`, `signOut`, and `refreshAuth` functions to all
 * child routes through React Router's `useOutletContext()`.
 */

import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { useEffect, useState } from "react"; 

import type { Route } from "./+types/root";
import "./app.css";
import { getCurrentUser, signIn as puterSignIn, signOut as puterSignOut } from "../lib/puter.action";

/**
 * Injects external font stylesheets (Google Fonts – Inter) into the
 * document `<head>`. React Router calls this function automatically
 * and merges the returned links into the page.
 */
export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

/**
 * The outermost HTML shell rendered on every page.
 * Contains the `<html>`, `<head>`, and `<body>` tags plus
 * React Router's scroll restoration and script injection.
 *
 * @param children - The route-specific content rendered inside `<body>`.
 */
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

/** Default (unauthenticated) auth state used before the first auth check completes. */
const DEFAULT_AUTH_STATE: AuthState = {
  isSignedIn: false,
  userName: null,
  userId: null,
}

/**
 * Root application component.
 *
 * Responsibilities:
 *  - Holds the global `authState` in React state.
 *  - On mount, calls `refreshAuth()` to check if a user is already signed in.
 *  - Passes the auth state + action functions (`signIn`, `signOut`, `refreshAuth`)
 *    to child routes via React Router's `<Outlet context={…} />`.
 */
export default function App() {
  const [authState, setAuthState] = useState<AuthState>(DEFAULT_AUTH_STATE);

  /**
   * Fetches the current Puter user and updates the auth state accordingly.
   * Called on mount and after every sign-in / sign-out action.
   */
  const refreshAuth = async () => {
    try {
      const user = await getCurrentUser();
      setAuthState({
        isSignedIn: !!user,
        userName: user ? user.username : null,
        userId: user ? user.uuid : null,
      });
    } catch {
      setAuthState(DEFAULT_AUTH_STATE);
    }
  }

  // Check authentication status once when the app first loads
  useEffect(() => {
    refreshAuth();
  }, [])
  
  /**
   * Opens the Puter sign-in dialog, then refreshes the auth state
   * so the UI immediately reflects the new session.
   */
  const signIn = async () => {
    await puterSignIn();
    return await refreshAuth();
  }

  /**
   * Signs the user out of Puter, then refreshes the auth state
   * so protected UI elements are hidden.
   */
  const signOut = async () => {
    await puterSignOut();
    return await refreshAuth();
  }

  return (
    <main className="min-h-screen bg-background text-foreground relative-z-10">
      {/* Pass auth state + actions to all child routes via outlet context */}
      <Outlet
        context={{...authState, signIn, signOut, refreshAuth}}
      />
    </main>

  );
}

/**
 * Global error boundary that catches unhandled errors thrown by any route.
 *
 * Behaviour:
 *  - For route error responses (e.g. 404), displays the status code + message.
 *  - For unexpected exceptions in development mode, displays the error
 *    message and stack trace for debugging.
 *
 * @param error - The caught error object, provided by React Router.
 */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    // Known HTTP error (e.g. 404 Not Found)
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    // Unexpected JS error — show details only in development
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
