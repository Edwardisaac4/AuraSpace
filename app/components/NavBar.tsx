import { Box } from "lucide-react";
import Button from "./ui/Button";
import { useOutletContext } from "react-router";

const NavBar = () => {
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
  const {isSignedIn, userName, userId, signIn, signOut, refreshAuth } = useOutletContext<AuthContext>();
  return (
      <header className="navbar">
        <nav className="inner">
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

          <div className="actions">
            {isSignedIn ? (
              <>
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

                  <a href="#upload" className="cta">Get Started</a>
                </>
            )}
          </div>

        </nav>
      </header>
  );
};

export default NavBar