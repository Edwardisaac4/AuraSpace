/**
 * NavBar.tsx — Top navigation bar component.
 *
 * Displays the AuraSpace brand logo, navigation links, and
 * authentication controls (Login / Log Out) that adapt based
 * on the current auth state pulled from React Router's outlet context.
 */

import { Box } from "lucide-react";
import Button from "./ui/Button";
import { useOutletContext } from "react-router";

/**
 * The main navigation bar rendered at the top of the home page.
 *
 * Features:
 *  - Brand logo + name on the left.
 *  - Navigation links (Product, Pricing, Community, Enterprise).
 *  - Auth-aware action area on the right:
 *    - Signed in:  Shows a welcome greeting + "Log Out" button.
 *    - Signed out: Shows a "Login" button + "Get Started" CTA link.
 */
const NavBar = () => {
  /**
   * Handles the Login / Log Out button click.
   * If the user is currently signed in, attempts sign-out;
   * otherwise, opens the Puter sign-in flow.
   */
  const handleAuthClick = async () => {
    if (isSignedIn) {
      try {
        await signOut();
      } catch (error) {
        console.error(`Puter Sign Out Failed : ${error}`);

      }
      return;
      }

    try {
      await signIn();
    } catch (error) {
      console.error(`Puter Sign In Failed : ${error}`);
    }
   };

  // Pull authentication state and actions from the root outlet context
  const {isSignedIn, userName, userId, signIn, signOut, refreshAuth } = useOutletContext<AuthContext>();

  return (
      <header className="navbar">
        <nav className="inner">
          {/* ── Left: Brand + Navigation Links ── */}
          <div className="left">
            <div className="brand">
              <Box className="logo" />
              <span className="name">AuraSpace</span>
            </div>

            <ul className="links">
              <a href="#">Product</a>
              <a href="#">Pricing</a>
              <a href="#">Community</a>
              <a href="#">Enterprise</a>
            </ul>
          </div>

          {/* ── Right: Auth-aware action buttons ── */}
          <div className="actions">
            {isSignedIn ? (
              <>
                {/* Personalised greeting for authenticated users */}
                <span className="greeting">
                  {userName ? `Welcome back ${userName}` : "Welcome back" }
                </span>

                <Button onClick={handleAuthClick} size="sm">
                  Log Out
                </Button>
              </>
            ): (
                <>
                  <Button onClick={handleAuthClick} variant = "ghost" size="sm">
                    Login
                  </Button>

                  {/* Scroll-to anchor pointing to the upload section */}
                  <a href="#upload" className="cta">Get Started</a>
                </>
            )}
          </div>

        </nav>
      </header>
  );
};

export default NavBar